import os

from dotenv import load_dotenv
load_dotenv()

emulate_board = eval(os.getenv("EMULATE_HARDWARE"))

if emulate_board:
    print("Board Emulation Enabled")
    class PixelStrip():
        def __init__(self, *args) -> None: print("Initialized emulated pixelstrip")
        def begin(self): pass
        def setBrightness(self, num): pass 
        def setPixelColor(self, i, color): pass
        def show(self): pass
    class Color():
        def __init__(self, r, g, b) -> None:
            pass
else:
    from rpi_ws281x import PixelStrip, Color

ws_led_freq = 800000

class LightGroup:
    def __init__(self, strip, pixel_pairs) -> None:
        self.strip = strip
        self.pixel_pairs = pixel_pairs

    def set_color(self, r, g, b):
        color = Color(r, g, b)
        for pair in self.pixel_pairs:
            for i in range(pair[0], pair[1]+1):
                self.strip.setPixelColor(i, color)
        self.strip.show()

def initialize_led_strips(config, led_strips, board_num):
    for strip in config:
        id = f"B{board_num}S{strip['assignedNum']}"
        led_strips[id] = PixelStrip(int(strip['led_count']), int(strip['pin']), ws_led_freq, int(strip['dma']), False, 255)

def initialize_lighting_groups(config, led_strips, lighting_groups, board_num):
    for group in config:
        id = f"B{board_num}W{group['assignedNum']}"
        lighting_groups[id] = LightGroup(
            led_strips[group['wsConfig']['ledStrip']],
            group['wsConfig']['ledPixels'], 
        )
        
def reset_lighting_groups(lighting_groups):
    for group in lighting_groups:
        lighting_groups[group].set_color(0, 0, 0)

if __name__ == "__main__":
    import time

    def hex_to_rgb(hex_code):
        hex_code = hex_code.lstrip('#')
        return tuple(int(hex_code[i:i+2], 16) for i in (0, 2, 4))

    def change_brightness(hex_code, brightness):
        r, g, b = hex_to_rgb(hex_code)

        r = max(0, min(255, round(r * brightness)))
        g = max(0, min(255, round(g * brightness)))
        b = max(0, min(255, round(b * brightness)))

        return (r,g,b)
    
    led_strips = {}
    light_groups = {}
    strips_conf = [{
        "assignedNum": 1,
        "led_count": 5,
        "pin": 18,
        "dma": 5
    }]
    groups_conf = [{
        "assignedNum": 1,
        "wsConfig": {
            "ledStrip": "B1S1",
            "ledPixels": [[0, 5]]
        }
    }]
    initialize_led_strips(strips_conf, led_strips, 1)
    initialize_lighting_groups(groups_conf, led_strips, light_groups, 1)

    led_strips['B1S1'].begin()

    for i in range(128): 
        print(i)
        r, g, b = change_brightness("#FFFFFF", i / 128)
        light_groups['B1W1'].set_color(r,g,b)
        time.sleep(0.01)

    for i in range(128): 
        print(127-i)
        r, g, b = change_brightness("#FFFFFF", (127 - i) / 128)
        light_groups['B1W1'].set_color(r,g,b)
        time.sleep(0.01)
