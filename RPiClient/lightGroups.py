import os

from dotenv import load_dotenv
load_dotenv()

dev_mode = os.getenv("DEV_MODE")

if dev_mode:
    class PixelStrip():
        def __init__(self, *args) -> None: pass
        def begin(self): pass
else:
    from rpi_ws281x import PixelStrip, Color

ws_led_freq = 800000

class LightGroup:
    def __init__(self, strip, pixel_pairs) -> None:
        self.strip = strip
        self.pixel_pairs = pixel_pairs

    def set_color(self, r, g, b):
        for pair in self.pixel_pairs:
            self.strip.set_pixel_color(pair[0], pair[1], Color(r, g, b))
            

class LEDStrip:
    def __init__(self, led_count, gpio_pin, dma_channel) -> None:
        self.led_count = led_count
        self.phy_strip = PixelStrip(led_count, gpio_pin, ws_led_freq, dma_channel, False, 255)

    def init_ws(self):
        self.phy_strip.begin()

    def set_pixel_color(self, start_pixel, end_pixel, color):
        for i in range(start_pixel, end_pixel + 1):
            self.phy_strip.setPixelColor(i, color)
        self.phy_strip.show()
       

def initialize_led_strips(config, led_strips, board_num):
    for strip in config:
        id = f"B{board_num}S{strip['assignedNum']}"
        led_strips[id] = LEDStrip(
            strip['led_count'],
            strip['pin'],
            strip['dma']
        )

def initialize_lighting_groups(config, led_strips, lighting_groups, board_num):
    for group in config:
        id = f"B{board_num}W{group['assignedNum']}"
        lighting_groups[id] = LightGroup(
            led_strips[group['wsConfig']['ledStrip']], 
            group['wsConfig']['ledPixels'], 
        )
        

def reset_lighting_groups(lighting_groups):
    for group in lighting_groups:
        lighting_groups[group].set_power(0)