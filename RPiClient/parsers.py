import collections
from lightGroups import initialize_led_strips, initialize_lighting_groups
import os

from dotenv import load_dotenv
load_dotenv()

dev_mode = os.getenv("DEV_MODE")

if dev_mode:
    class Color():
        def __init__(self, *args) -> None: pass
else: 
    from rpi_ws281x import Color

def parse_command(target_lg, command):    
    tokens = command.split(';')
    command_type = tokens[0]
    params = tokens[1:]
    
    if command_type == 'setColor':
        color = Color(int(params[0], 16), int(params[1], 16), int(params[2],16))
        return lambda: target_lg.set_color(color)
    else:
        raise ValueError('Invalid command type')
        
def parse_hardware_config(config, led_strips, lighting_groups):
    initialize_led_strips(config['lsConfig'], led_strips, config['boardNumber'])
    initialize_lighting_groups(config['lgConfig'], lighting_groups, config['boardNumber'])
    
def parse_light_config(config, lighting_groups):
    temp_command = []
    for groupId in config:
        for event in config[groupId]:
            time, command = float(list(event.keys())[0]), list(event.values())[0]
            temp_command.append((time, parse_command(lighting_groups[groupId], command)))
    temp_command.sort(key=lambda x: x[0]) 
    temp_command.reverse()

    cmdQueue = collections.deque(temp_command)

    return cmdQueue