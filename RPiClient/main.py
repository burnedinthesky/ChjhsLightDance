import json
import time
import asyncio
import websockets

from queue import Queue
from enum import Enum

from lightGroups import reset_lighting_groups
from wsHandler import websocket_client, queue_message


class BoardStatus(Enum):
    IDLE = 0
    PROCESSING = 1
    PLAYING = 2

class Show:
    start_time = 0

    def set_start_time(self, time):
        self.start_time = time
        queue_message("recieve", "showStart")
    
    def terminate_show(self):
        global board_status
        reset_lighting_groups(lighting_groups)
        self.start_time = 0
        board_status = BoardStatus.IDLE
        queue_message("recieve", "terminate")

    def show_loop(self):
        global board_status
        if not commands:
            board_status = BoardStatus.IDLE
            reset_lighting_groups()
            return
        current_time = time.time() * 1000
        time_past_start = current_time - self.start_time
        while not commands.empty() and commands[0][0] < time_past_start:
            _, command = commands.get()
            command()


lighting_groups = {}
commands = Queue(0)

board_status:BoardStatus = BoardStatus.IDLE

show = Show()

async def ws_main():
    uri = "ws://localhost:45510/"
    await websocket_client(uri, show, lighting_groups)

if __name__ == "__main__":
    asyncio.run(ws_main())
    while True:
        if board_status == BoardStatus.PLAYING:
            show.show_loop()  
        time.sleep(0.001)