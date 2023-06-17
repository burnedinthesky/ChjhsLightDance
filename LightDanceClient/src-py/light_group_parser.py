config = {
    "minTime": 5,
}

class LightGroup():
    def __init__(self, id) -> None:
        self.id = id
        self.commands = []
        self.power = False
        self.brightness = 0

    def handle_fade(self, time, start_power, end_power, duration):
        if duration < 5: raise ValueError(f"Error at {time}: Fade duration is less than {config['minTime']}ms")
        sp = start_power * 10
        ep = end_power * 10
        self.commands.append((time, f"setBrightness;{sp}"))
        last_brightness = sp
        for i in range(5, duration, 5):
            if time+i < 0: continue
            new_brightness = round(sp + ((ep-sp) / duration) * i)
            if new_brightness == last_brightness: continue
            last_brightness = new_brightness
            self.commands.append((time+i, f"setBrightness;{new_brightness}"))
        self.commands.append((time+duration, f"setBrightness;{ep}"))
        self.brightness = ep
        
    def add_command(self, time, command):
        if len(self.commands) and time-self.commands[-1][0] < 5:
            raise ValueError(f"Error at {time}: Time between commands is less than {config['minTime']}ms")
        cmd = command
        if cmd[0] == "t":
            if cmd[1] != "0" and cmd[1] != "1": raise ValueError(f"Error at {time}: Invalid power state")
            arg = int(cmd[1])
            if self.power == arg or time<0: return
            self.power = arg
            self.commands.append((time, f"setPower;{cmd[1]}"))
        elif cmd[0] == "b":
            arg = int(cmd[1])
            if arg < 0 or arg > 10: raise ValueError(f"Error at {time}: Brightness must be between 0 and 10")
            if self.brightness == arg or time<0: return
            self.brightness = arg
            self.commands.append((time, f"setBrightness;{arg*10}"))
        elif cmd[0] == "f":
            _, start_power, end_power, duration = cmd.split(";")
            self.handle_fade(time, int(start_power), int(end_power), int(duration) * 1000)
        else:
            raise ValueError("Invalid command type")
        if self.brightness == 0: self.power = False
        
    def get_length(self):
        return int(self.commands[-1][0])

    def export_commands(self):
        return [{cmd[0]: cmd[1]} for cmd in self.commands]
