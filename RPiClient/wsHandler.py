import asyncio
import websockets
import json
from queue import Queue
from websockets.exceptions import ConnectionClosed
from uuid import getnode as get_mac

from parsers import parse_hardware_config, parse_light_config


messageQueue = Queue(0)
if not get_mac() == get_mac(): raise Exception("Unable to detect MAC address")
mac_addr = "%012X" % get_mac()

def queue_message(type: str, message: str):
    messageQueue.put(json.dumps({
        "source": "rpi",
        "type": type,
        "payload": message
    }))


def generate_error_message(message: str):
    return json.dumps({
        "source": "rpi",
        "type": "throw",
        "payload": message
    })

async def receive_messages(websocket, set_show_start_time, terminate_show):
    while True:
        try:
            rawResponse = await websocket.recv()
            response = json.loads(rawResponse)

            print(response)
            
            match response["type"]:
                case "notify":
                    data = response["payload"].split(";")
                    match data[0]:
                        case "calibrate":
                            offset = float(data[1])
                            break
                        case "show":
                            if data[1] == "start": set_show_start_time(float(data[2]))
                            elif data[1] == "terminate": terminate_show()
                                
                case "flash":
                    queue_message("recieve", "flash")
                    parse_hardware_config(response["lgConfig"])
                    parse_light_config(response["lightConfig"])
                    queue_message("reply", "flash")

                case _:
                    await websocket.send(generate_error_message("Invalid message type"))
                    
        except ConnectionClosed:
            print("Connection closed")
            break
        except Exception as e:
            print(f"An error occurred while receiving: {e}")

async def send_messages(websocket):
    while True:
        try:
            if not messageQueue.empty():
                await websocket.send(messageQueue.get())
        except ConnectionClosed:
            print("Connection closed")
            break
        except Exception as e:
            print(f"An error occurred while sending: {e}")
        await asyncio.sleep(0.001)

async def websocket_client(uri, set_show_start_time, terminate_show):
    reconnect_delay = 1
    while True:
        try:
            async with websockets.connect(uri) as websocket:
                reconnect_delay = 1
                while not messageQueue.empty(): messageQueue.get()
                queue_message("initialize", f"pWFJ+anLDAgMqcuhQEaIHx1U9wMc8Zfge6JCpY6RkVk=;{mac_addr}")
                await asyncio.gather(
                    receive_messages(websocket, set_show_start_time, terminate_show),
                    send_messages(websocket)
                )
        except ConnectionClosed:
            break

        except Exception as e:
            print(f"An error occurred: {e}")
    
        await asyncio.sleep(1)
        reconnect_delay *= 2