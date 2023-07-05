import asyncio
import websockets
import json
import socket
import os

import subprocess
from queue import Queue
from websockets.exceptions import ConnectionClosed
from dotenv import load_dotenv

from enum import Enum
from parsers import parse_hardware_config, parse_light_config

load_dotenv()

client_token = os.getenv("CLIENT_TOKEN")
messageQueue = Queue(0)

wlan0_output = subprocess.check_output(["ifconfig"], text=True)
search_result = [line for line in wlan0_output.split('\n') if 'ether' in line]
if not search_result: raise SystemError("Unable to find mac address for wlan0")
mac_addr = search_result[0].split()[1]
mac_addr = mac_addr.replace(":", "").upper()

print(f"Mac Address: {mac_addr}")

host_name = socket.gethostname()
local_ip_addr = socket.gethostbyname(host_name)

class CAL_STAGE(Enum):
    IDLE = 0
    IN_PROCESS = 1
    COMPLETE = 2

calibration_stage = CAL_STAGE.IDLE

def queue_message(type: str, message: str):
    messageQueue.put(json.dumps({
        "source": "rpi",
        "type": type,
        "payload": message
    }))

def throw_ws_error(message: str):
    queue_message("throw", message)


async def close_connection(connection_closed):
    connection_closed.set()


async def receive_messages(websocket, show, led_strips, lighting_groups, connection_closed):
    while not connection_closed.is_set():
        try:
            rawResponse = await websocket.recv()
            response = json.loads(rawResponse)
            msgType = response["type"]
            msgPayload = response["payload"]

            print(f"Recieved message: {msgType} {msgPayload}")

            if msgType == "notify":
                data = msgPayload.split(";")
                if data[0] == "show":
                    if data[1] == "start": show.set_show_start(int(data[2]))
                    elif data[1] == "stop": show.terminate_show()
                    else: throw_ws_error("Invalid show command")
                elif data[0] == "manager":
                    if data[1] == "connected": queue_message("recieve", "managerConnected")
                    elif data[1] == "disconnected": show.terminate_show()
                    else: throw_ws_error("Invalid manager status")
                else: throw_ws_error("Invalid notify type")
            elif msgType == "calibrate":
                global calibration_stage
                if calibration_stage != CAL_STAGE.IN_PROCESS: queue_message("recieve", "calibrate")
                if show.calibration_stage == None: 
                    calibration_stage = CAL_STAGE.IN_PROCESS
                    await websocket.send(json.dumps({
                        "source": "rpi",
                        "type": "notify",
                        "payload": "calibrate;ethernet;plug"
                    }))
                    show.run_calibrate_time()
                    queue_message("notify", f"calibrate;stageComplete;1")
                    await close_connection(connection_closed)
                elif show.calibration_stage == 1: 
                    avg_delay = show.run_calibrate_time()
                    queue_message("reply", f"calibrate;delay;{avg_delay}")
                elif show.calibration_stage == 2:
                    print(msgPayload)
                    show.run_calibrate_time(msgPayload)
                    await websocket.send(json.dumps({
                        "source": "rpi",
                        "type": "notify",
                        "payload": "calibrate;ethernet;unplug"
                    }))
                    show.run_calibrate_time()
                    calibration_stage = CAL_STAGE.COMPLETE
                    await close_connection(connection_closed)
            elif msgType == "flash":
                queue_message("recieve", "flash")
                payload = eval(response["payload"])
                parse_hardware_config(payload, led_strips, lighting_groups)
                show.set_show_lights(
                    parse_light_config(payload["lightConfig"], lighting_groups)
                )
                queue_message("reply", "flash")
            elif msgType == "throw":
                print(f"Recieved throw: {msgPayload}")
                queue_message("throw", msgPayload)
            else: 
                throw_ws_error("Invalid message type")
                    
        except ConnectionClosed:
            print("Connection closed")
            await close_connection(connection_closed)
            break
        except Exception as e:
            queue_message("throw", f"An error occurred while receiving: {e}")
            

async def send_messages(websocket, connection_closed):
    while not connection_closed.is_set():
        try:
            if not messageQueue.empty():
                await websocket.send(messageQueue.get())
        except ConnectionClosed:
            print("Connection closed")
            await close_connection(connection_closed)
            break
        except Exception as e:
            queue_message("throw", f"An error occurred while sending: {e}")
        await asyncio.sleep(0.001)

async def websocket_client(uri, show, led_strips, lighting_groups):
    reconnect_delay = 1
    while True:
        print("Connecting")
        try:
            async with websockets.connect(uri) as websocket:
                global calibration_stage
                print("Connected")
                await websocket.send(json.dumps({
                    "source": "rpi",
                    "type": "initialize",
                    "payload": f"{client_token};{mac_addr};{local_ip_addr}"
                }))
                while not messageQueue.empty(): 
                    await websocket.send(messageQueue.get())
                if calibration_stage == CAL_STAGE.COMPLETE: 
                    queue_message("reply", "calibrate;complete")
                    calibration_stage = CAL_STAGE.IDLE
                reconnect_delay = 1
                connection_closed = asyncio.Event()

                await asyncio.gather(
                    receive_messages(websocket, show, led_strips, lighting_groups, connection_closed),
                    send_messages(websocket, connection_closed)
                )
        except ConnectionClosed: pass
        except Exception as e:
            print(f"An error occurred while connecting: {e}")
            print(f"Reconnecting in {reconnect_delay} seconds")

        await asyncio.sleep(reconnect_delay)
        if reconnect_delay < 16: reconnect_delay *= 2
        