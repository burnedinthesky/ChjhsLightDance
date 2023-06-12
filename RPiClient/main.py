import json
import time
import asyncio
import websockets

from queue import Queue
from enum import Enum

from lightGroups import initialize_lighting_groups, reset_lighting_groups
from wsHandler import websocket_client, queue_message
from parsers import parse_light_config

class ServerOffset:
    def __init__(self):
        self.initialized = False
        self.local_reference = -10000000
        self.server_reference = -10000000
        self.time_offset = -10000000

class BoardStatus(Enum):
    IDLE = 0
    PROCESSING = 1
    PLAYING = 2

lighting_groups = {}
commands = Queue(0)

server_offset = ServerOffset()
board_status:BoardStatus = BoardStatus.IDLE

show_start_time = 0

def set_show_start_time(time):
    if not server_offset.initialized:
        return queue_message("throw", "Server Offset Not Initialized")
    global show_start_time
    show_start_time = time
    queue_message("recieve", "showStart")

def terminate_show():
    global board_status, show_start_time
    reset_lighting_groups(lighting_groups)
    show_start_time = 0
    board_status = BoardStatus.IDLE
    queue_message("recieve", "terminate")

def show_loop():
    global board_status
    if not commands:
        board_status = BoardStatus.IDLE
        return
    current_time = time.time() * 1000
    time_past_start = current_time - show_start_time
    while not commands.empty() and commands[0][0] < time_past_start:
        _, command = commands.get()
        command()

async def ws_main():
    uri = "ws://localhost:45510/"
    await websocket_client(uri, set_show_start_time, terminate_show)

if __name__ == "__main__":
    asyncio.run(ws_main())
    while True:
        if board_status == BoardStatus.PLAYING:
            show_loop()  
        time.sleep(0.001)