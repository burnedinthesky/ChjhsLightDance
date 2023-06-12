from queue import Queue
from lightGroups import initialize_lighting_groups

def parse_command(target_lg, command):    
    tokens = command.split(';')
    command_type = tokens[0]
    params = tokens[1:]
    
    match command_type:
        case 'setPower':
            return lambda: target_lg.set_power(int(params[0]))
        case 'setOpacity':
            return lambda: target_lg.set_opacity(int(params[0]))
        case _:
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
    for group in config:
        for event in config['group']:
            time, command = float(event.keys()[0]), event.values()[0]
            temp_command.append((time, parse_command(lighting_groups[group], command)))
    temp_command.sort()

    cmdQueue = Queue(len(temp_command))
    for command in temp_command:
        cmdQueue.put(command)

    return cmdQueue