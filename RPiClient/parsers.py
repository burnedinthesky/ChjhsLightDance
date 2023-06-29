import collections
from lightGroups import initialize_lighting_groups

dev_mode = True

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
        color = Color(int(params[0:2], 16), int(params[2:4], 16), int(params[4:6],16))
        brightness = int(params) if len(params) == 8 else None
        return lambda: target_lg.set_color(color, brightness)
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