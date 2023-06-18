import asyncio
import websockets
import json
import socket
import os

import subprocess
from queue import Queue
from websockets.exceptions import ConnectionClosed
from dotenv import load_dotenv

from parsers import parse_hardware_config, parse_light_config

load_dotenv()

client_token = os.getenv("CLIENT_TOKEN")

print(client_token)

messageQueue = Queue(0)

wlan0_output = subprocess.check_output(["ifconfig"], text=True)
search_result = [line for line in wlan0_output.split('\n') if 'ether' in line]
if not search_result: raise SystemError("Unable to find mac address for wlan0")
mac_addr = search_result[0].split()[1]
mac_addr = mac_addr.replace(":", "").upper()

print(f"Mac Address: {mac_addr}")

host_name = socket.gethostname()
local_ip_addr = socket.gethostbyname(host_name)


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


async def receive_messages(websocket, show, lighting_groups, connection_closed):
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
                queue_message("recieve", "calibrate")
                await asyncio.sleep(1)
                show.run_calibrate_time()
                await close_connection(connection_closed)
                # if cal_res != "error": queue_message("reply", f"calibrate;complete;{json.dumps(cal_res)}")
            elif msgType == "flash":
                queue_message("recieve", "flash")
                payload = eval(response["payload"])
                parse_hardware_config(payload, lighting_groups)
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

async def websocket_client(uri, show, lighting_groups):
    reconnect_delay = 1
    while True:
        print("Connecting")
        try:
            async with websockets.connect(uri) as websocket:
                print("Connected")
                while not messageQueue.empty(): messageQueue.get()
                queue_message("initialize", f"{client_token};{mac_addr};{local_ip_addr}")
                if show.calibrated: queue_message("reply", "calibrate;complete")
                reconnect_delay = 1
                connection_closed = asyncio.Event()

                await asyncio.gather(
                    receive_messages(websocket, show, lighting_groups, connection_closed),
                    send_messages(websocket, connection_closed)
                )
        except ConnectionClosed: pass
        except Exception as e:
            print(f"An error occurred while connecting: {e}")
            print(f"Reconnecting in {reconnect_delay} seconds")

        await asyncio.sleep(reconnect_delay)
        reconnect_delay *= 2