import time
import asyncio
import subprocess
import os
import collections
from dotenv import load_dotenv
load_dotenv()

from enum import Enum

from lightGroups import reset_lighting_groups
from wsHandler import websocket_client, queue_message

server_ip = os.getenv("SERVER_IP")
server_port = os.getenv("SERVER_PORT")

print("Waiting for WiFi")

while True:
    output = subprocess.check_output(['ifconfig', 'wlan0'], text=True)
    if f"inet {'.'.join(server_ip.split('.')[:2])}" in output: break
    time.sleep(3)
    

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

    def set_show_lights(self, lightQueue):
        global commands
        commands = lightQueue

    def run_calibrate_time(self):
        global board_status
        board_status = BoardStatus.PROCESSING
        try:
            retry_count = 0
            while True:
                if retry_count > 20: raise SystemError("Failed to detect ethernet connection")
                print(f"Waiting for ethernet connection, retry count {retry_count}")
                output = subprocess.check_output(['ip', 'link', 'show', "eth0"], text=True)
                if "state UP" in output: break
                retry_count += 1
                time.sleep(1)
            print("Connection detected, waiting for RPi to switch to ethernet")
            subprocess.run(['sudo', 'rfkill', 'block', 'wifi'])
            retry_count = 0
            while True:
                if retry_count > 20: raise SystemError("Failed to connect via ethernet")
                print(f"Waiting to establish ethernet network connection, retry count {retry_count}")
                output = subprocess.check_output(['ifconfig', 'eth0'], text=True)
                if "inet 192.192" in output: break
                retry_count += 1
                time.sleep(3)
            print("Running calibration")
            subprocess.run(["sudo", "ntpdate", server_ip])
            self.calibrated = True
            board_status = BoardStatus.IDLE
            print("Calibration complete, waiting for ethernet to be unplugged")
            retry_count = 0
            while True:
                if retry_count > 20: raise SystemError("Failed to unplug ethernet connection")
                print(f"Waiting for ethernet connection to be unplugged, retry count {retry_count}")
                output = subprocess.check_output(['ip', 'link', 'show', "eth0"], text=True)
                if "state DOWN" in output: break
                retry_count += 1
                time.sleep(1)
            print("Ethernet disconnected, waiting for RPi to switch to WiFi")
            subprocess.run(['sudo', 'rfkill', 'unblock', 'wifi'])
            retry_count = 0
            while True:
                if retry_count > 20: raise SystemError("Failed to establish WiFi connection")
                print(f"Waiting for WiFi connection, retry count {retry_count}")
                output = subprocess.check_output(['ifconfig', 'wlan0'], text=True)
                if "inet 192.192" in output: break
                retry_count += 1
                time.sleep(3)
            print("Wifi connected, restarting connection")
        except Exception as e:
            board_status = BoardStatus.IDLE
            print(f"Calibration failed with error: {e}")
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
        if time_past_start > 0 and len(commands) == 0:
            board_status = BoardStatus.IDLE
            reset_lighting_groups(lighting_groups)
            queue_message("recieve", "showComplete")
            print("Queue depleted!")
            return
        while len(commands) and commands[-1][0] < time_past_start:
            # print(f"executing command at {time_past_start}")
            _, command = commands.pop()
            command()

lighting_groups = {}
led_strips = {}
commands = collections.deque()

board_status:BoardStatus = BoardStatus.IDLE

show = Show()

latest_command = len(commands)

async def ws_main():
    uri = f"ws://{server_ip}:{server_port}/"
    await websocket_client(uri, show, led_strips, lighting_groups)

async def show_loop():
    global board_status, latest_command
    while True:
        if latest_command != len(commands):
            latest_command = len(commands)
            print(f"Commands Updated: {latest_command}")
        if board_status == BoardStatus.PLAYING:
            show.show_step()  
        await asyncio.sleep(0.001)

async def show_asyncs():
    await asyncio.gather(ws_main(), show_loop())

if __name__ == "__main__":
    asyncio.run(show_asyncs())