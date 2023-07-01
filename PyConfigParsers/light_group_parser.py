config = {
    "minTime": 5,
}

class LightGroup():
    def __init__(self, id) -> None:
        self.id = id
        self.commands = []
        self.brightness = 0

        self.add_command(0, "t0")

    def handle_fade(self, time, start_power, end_power, duration):
        if duration < 5: raise ValueError(f"Error at {time}: Fade duration is less than {config['minTime']}ms")
        sp = start_power * 10
        ep = end_power * 10
        self.commands.append((time, f"setBrightness;{sp}"))
        last_brightness = sp
        for i in range(5, duration, 40):
            if time+i < 0: continue
            new_brightness = round(sp + ((ep-sp) / duration) * i)
            if new_brightness == last_brightness: continue
            last_brightness = new_brightness
            self.commands.append((time+i, f"setBrightness;{new_brightness}"))
        self.commands.append((round(time+duration), f"setBrightness;{ep}"))
        self.brightness = ep
        
    def add_command(self, time, command):
        if not len(self.commands): pass
        elif time < self.commands[-1][0]:
            raise ValueError(f"Error at {time}: Time is less than previous command")
        elif abs(time-self.commands[-1][0]) < 5:
            time += 5 - abs(time-self.commands[-1][0])

        cmd = command
        if cmd[0] == "t":
            if cmd[1] != "0" and cmd[1] != "1": raise ValueError(f"Error at {time}: Invalid power state")
            arg = int(cmd[1])
            if self.brightness == arg * 10 or time<0: return
            self.brightness = arg * 10
            self.commands.append((time, f"setPower;{cmd[1]}"))
        elif cmd[0] == "b":
            arg = int(cmd[1])
            if arg < 0 or arg > 10: raise ValueError(f"Error at {time}: Brightness must be between 0 and 10")
            if self.brightness == arg or time<0: return
            self.brightness = arg
            self.commands.append((time, f"setBrightness;{arg*10}"))
        elif cmd[0] == "f":
            _, start_power, end_power, duration = cmd.split(";")
            self.handle_fade(time, int(start_power), int(end_power), round(float(duration) * 1000))
        elif cmd[0] == "#":
            r, g, b = int(cmd[1:3], 16), int(cmd[3:5], 16), int(cmd[5:7], 16)
            brightness = None
            if len(cmd) == 8: brightness = int(cmd[7])
            if len(cmd) == 9: brightness = int(cmd[7:9])
            if r < 0 or r > 255 or g < 0 or g > 255 or b < 0 or b > 255: raise ValueError(f"Error at {time}: Invalid color")
            self.commands.append((time, f"setColor;{hex(r)[2:]};{hex(g)[2:]};{hex(b)[2:]}" + (f";{brightness}" if brightness else "")))
        else:
            raise ValueError("Invalid command type")
        
    def get_length(self):
        return int(self.commands[-1][0])

    def export_commands(self):
        return [{cmd[0]: cmd[1]} for cmd in self.commands]
