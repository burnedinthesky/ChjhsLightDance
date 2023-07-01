import collections
from lightGroups import initialize_lighting_groups
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
    
    if command_type == "setPower":
        return lambda: target_lg.set_power(int(params[0]))
    elif command_type == 'setBrightness':
        return lambda: target_lg.set_brightness(int(params[0]))
    elif command_type == 'setColor':
        if target_lg.type != "ws": 
            raise ValueError(f'Invalid command type for lighting group with type {target_lg.type}')
        color = Color(int(params[0], 16), int(params[1], 16), int(params[2],16))
        brightness = int(params[3]) if len(params) == 4 else None
        return lambda: target_lg.set_color(color, brightness)
    elif command_type == "initWS":
        if target_lg.type != "ws": 
            raise ValueError(f'Invalid command type for lighting group with type {target_lg.type}')
        return lambda: target_lg.init_ws()
    else:
        raise ValueError('Invalid command type')
        
def parse_hardware_config(config, lighting_groups):
    print(config)
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