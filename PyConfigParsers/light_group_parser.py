from color_lib import change_brightness

config = {
    "minTime": 5,
}

class LightGroup():
    def __init__(self, id) -> None:
        self.id = id
        self.commands = []
        self.brightness = 0
        
        self.current_color = '00;00;00'
        self.brightness = 100

    def hex_to_colonhex(self, hex_code):
        hex_code = hex_code.lstrip('#')
        return ';'.join(hex_code[i:i+2] for i in (0, 2, 4))

    def handle_fade(self, time, start_power, end_power, duration):
        if duration < 5: raise ValueError(f"Error at {time}: Fade duration is less than {config['minTime']}ms")
        sp = start_power * 10
        ep = end_power * 10
        self.commands.append((time, f"setColor;{self.hex_to_colonhex(change_brightness(self.current_color, start_power / self.brightness))}"))
        last_brightness = sp
        for i in range(5, duration, 40):
            if time+i < 0: continue
            new_brightness = round(sp + ((ep-sp) / duration) * i)
            if new_brightness == last_brightness: continue
            last_brightness = new_brightness
            self.commands.append((time+i, f"setColor;{self.hex_to_colonhex(change_brightness(self.current_color, new_brightness / self.brightness))}"))
        self.commands.append((round(time+duration), f"setColor;{self.hex_to_colonhex(change_brightness(self.current_color, ep / self.brightness))        }"))
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
            new_color = self.current_color if arg else '00;00;00'
            self.brightness = 100 * arg
            if new_color != self.current_color:
                self.commands.append((time, f"setColor;{ new_color }"))

        elif cmd[0] == "b":
            arg = int(cmd[1])
            if arg < 0 or arg > 10: raise ValueError(f"Error at {time}: Brightness must be between 0 and 10")
            if time < 0: return
            new_brightness = arg * 10
            new_color = change_brightness(self.current_color.replace(';', ''), new_brightness / self.brightness  )
            self.commands.append((time, f"setColor;{self.hex_to_colonhex(new_color)}"))
            self.brightness = new_brightness

        elif cmd[0] == "f":
            _, start_power, end_power, duration = cmd.split(";")
            self.handle_fade(time, int(start_power), int(end_power), round(float(duration) * 1000))

        elif cmd[0] == "#":
            r, g, b = int(cmd[1:3], 16), int(cmd[3:5], 16), int(cmd[5:7], 16)
            brightness = None
            if len(cmd) == 8: brightness = int(cmd[7])
            if len(cmd) == 9: brightness = int(cmd[7:9])
            if r < 0 or r > 255 or g < 0 or g > 255 or b < 0 or b > 255: raise ValueError(f"Error at {time}: Invalid color")

            if brightness != None: self.brightness = brightness * 10 
            
            hex = cmd[1:7]
            self.current_color = self.hex_to_colonhex(change_brightness(hex, 10 / brightness if brightness else 1))
            self.commands.append((time, f"setColor;{self.hex_to_colonhex(hex)}"))
            
        else:
            raise ValueError("Invalid command type")
        
    def get_length(self):
        if not len(self.commands): return 0
        return int(self.commands[-1][0])

    def export_commands(self):
        return [{cmd[0]: cmd[1]} for cmd in self.commands]
