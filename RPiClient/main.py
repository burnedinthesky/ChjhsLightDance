import time
import asyncio

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

    def set_show_start(self, time):
        print(f"Setting start time to {time}")
        global board_status
        self.start_time = time
        board_status = BoardStatus.PLAYING
        queue_message("recieve", "showStart")
    
    def terminate_show(self):
        print(f"Terminating show")
        global board_status
        reset_lighting_groups(lighting_groups)
        self.start_time = 0
        board_status = BoardStatus.IDLE
        queue_message("recieve", "showTerminate")

    def show_step(self):
        global board_status, lighting_groups
        current_time = time.time() * 1000
        time_past_start = current_time - self.start_time
        if time_past_start > 0 and commands.empty():
            board_status = BoardStatus.IDLE
            reset_lighting_groups(lighting_groups)
            queue_message("recieve", "showComplete")
            print("Done!")
            return
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

async def show_loop():
    global board_status
    while True:
        if board_status == BoardStatus.PLAYING:
            show.show_step()  
        await asyncio.sleep(0.001)

async def show_asyncs():
    await asyncio.gather(ws_main(), show_loop())

if __name__ == "__main__":
    asyncio.run(show_asyncs())
    