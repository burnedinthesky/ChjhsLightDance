import board
import os

from dotenv import load_dotenv
load_dotenv()

dev_mode = os.getenv("DEV_MODE")

if dev_mode:
    class PixelStrip():
        def __init__(self, *args) -> None: pass
        def begin(self): pass
else:
    from rpi_ws281x import PixelStrip

ws_led_freq = 800000

class LightGroup:
    def __init__(self, strip, pixel_pairs) -> None:
        self.strip = strip
        self.pixel_pairs = pixel_pairs

    def set_color(self, color):
        for pair in self.pixel_pairs:
            for i in range(pair[0], pair[1] + 1):
                self.strip.setPixelColor(i, color)
            

class LEDStrip:
    def __init__(self, led_count, gpio_pin, dma_channel) -> None:
        self.led_count = led_count
        self.strip = PixelStrip(led_count, gpio_pin, ws_led_freq, dma_channel, False, 255)

    def init_ws(self):
        self.strip.begin()

    def set_pixel_color(self, start_pixel, end_pixel, color):
        for i in range(start_pixel, end_pixel + 1):
            self.strip.setPixelColor(i, color)
       

def initialize_led_strips(config, led_strips, board_num):
    for strip in config:
        id = f"B{board_num}L{strip['assignedNum']}"
        led_strips[id] = LEDStrip(
            strip['led_count'],
            strip['wsConfig']['pin'],
            strip['wsConfig']['dma']
        )

def initialize_lighting_groups(config, lighting_groups, board_num):
    for group in config:
        id = f"B{board_num}W{group['assignedNum']}"
        lighting_groups[id]  = LightGroup(
            group['wsConfig']['strip_id'], 
            group['wsConfig']['pixel_pairs'], 
        )
        

def reset_lighting_groups(lighting_groups):
    for group in lighting_groups:
        lighting_groups[group].set_power(0)