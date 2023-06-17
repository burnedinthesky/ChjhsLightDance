import time
import asyncio
import subprocess
import os
import json
from dotenv import load_dotenv
load_dotenv()

from queue import Queue
from enum import Enum

from lightGroups import reset_lighting_groups
from wsHandler import websocket_client, queue_message

server_ip = os.getenv("SERVER_IP")
server_port = os.getenv("SERVER_PORT")

class BoardStatus(Enum):
    IDLE = 0
    PROCESSING = 1
    PLAYING = 2

class Show:
    start_time = 0
    calibrated = False

    def set_show_start(self, time):
        if not self.calibrated: raise SystemError("Trying to start show without board being calibrated")
        print(f"Setting start time to {time}")
        global board_status
        self.start_time = time
        board_status = BoardStatus.PLAYING
        queue_message("recieve", "showStart")

    def run_calibrate_time(self):
        global board_status
        board_status = BoardStatus.PROCESSING
        try:
            subprocess.run(["sudo", "sntp", server_ip])
            ntpq_out = subprocess.check_output(["sudo", "ntpq", "-p"], text=True)
            server_entries = [line for line in ntpq_out.split("\n") if server_ip in line]
            if not server_entries: raise SystemError("Unable to find server entry in ntpq output")
            entries = [line.split() for line in server_entries]
            entries = [entry for entry in entries if len(entry)]
            entries = [entry[-4:-1] for entry in entries]
            self.calibrated = True
            board_status = BoardStatus.IDLE
            return json.dumps(entries)
        except Exception as e:
            board_status = BoardStatus.IDLE
            queue_message("throw", f"calibrate;{e}")
            return "error"

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
    uri = f"ws://{server_ip}:{server_port}/"
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
    