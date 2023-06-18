import collections
from lightGroups import initialize_lighting_groups

def parse_command(target_lg, command):    
    tokens = command.split(';')
    command_type = tokens[0]
    params = tokens[1:]
    
    if command_type == "setPower":
        return lambda: target_lg.set_power(int(params[0]))
    elif command_type == 'setBrightness':
        return lambda: target_lg.set_brightness(int(params[0]))
    else:
        raise ValueError('Invalid command type')
        
def parse_hardware_config(config, lighting_groups):
    boardNum = config['boardNumber']
    configs = [{
        "id": f"B{boardNum}G{conf['assignedNum']}",
        "pins": conf['lights']
    } for conf in config['lgConfig']]
    initialize_lighting_groups(configs, lighting_groups)
    
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