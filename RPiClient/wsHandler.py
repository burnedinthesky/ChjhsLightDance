import asyncio
import websockets
import json
import socket

from queue import Queue
from websockets.exceptions import ConnectionClosed
from uuid import getnode as get_mac

from parsers import parse_hardware_config, parse_light_config

messageQueue = Queue(0)

if not get_mac() == get_mac(): raise Exception("Unable to detect MAC address")
mac_addr = "%012X" % get_mac()
host_name = socket.gethostname()
local_ip_addr = socket.gethostbyname(host_name)


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

async def close_connection(connection_closed):
    connection_closed.set()


async def receive_messages(websocket, show, lighting_groups, connection_closed):
    while not connection_closed.is_set():
        try:
            rawResponse = await websocket.recv()
            response = json.loads(rawResponse)

            msgType = response["type"]
            msgPayload = response["payload"]

            if msgType == "notify":
                data = msgPayload.split(";")
                if data[0] == "show":
                    if data[1] == "start": show.set_start_time(float(data[2]))
                    elif data[1] == "terminate": show.terminate_show()
                    else: await websocket.send(generate_error_message("Invalid show command"))
                else: await websocket.send(generate_error_message("Invalid notify type"))
            elif msgType == "flash":
                queue_message("recieve", "flash")
                payload = response["payload"]
                parse_hardware_config(payload, lighting_groups)
                parse_light_config(payload["lightConfig"], lighting_groups)
                queue_message("reply", "flash")
            else: 
                await websocket.send(generate_error_message("Invalid message type"))
                    
        except ConnectionClosed:
            print("Connection closed")
            await close_connection(connection_closed)
            break
        except Exception as e:
            print(e)
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
                queue_message("initialize", f"pWFJ+anLDAgMqcuhQEaIHx1U9wMc8Zfge6JCpY6RkVk=;{mac_addr};{local_ip_addr}")

                reconnect_delay = 1
                connection_closed = asyncio.Event()

                await asyncio.gather(
                    receive_messages(websocket, show, lighting_groups, connection_closed),
                    send_messages(websocket, connection_closed)
                )
        except ConnectionClosed: pass
        except Exception as e:
            print(f"An error occurred while connecting: {e}")

        await asyncio.sleep(reconnect_delay)
        reconnect_delay *= 2