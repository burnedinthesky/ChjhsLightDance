import board
import os

from dotenv import load_dotenv
load_dotenv()

dev_mode = os.getenv("DEV_MODE")

if dev_mode:
    class Channel():
        duty_cycle = 0
    class PCA():
        frequency = 1000
        channels = [Channel() for i in range(16)]
    class PixelStrip():
        def __init__(self, *args) -> None: pass
        def begin(self): pass

    pca = PCA()
else:
    import busio
    import adafruit_pca9685
    from rpi_ws281x import PixelStrip

    i2c = busio.I2C(board.SCL, board.SDA)

    pca = adafruit_pca9685.PCA9685(i2c)

pca.frequency = 1000
ws_led_freq = 800000

class LightBar:
    def __init__(self, hw_channel, given_id):
        self.channel = pca.channels[hw_channel]
        self.id = given_id
        self.powered = False

    def get_state(self):
        return self.powered

    def set_power(self, power):
        # print(f"Setting power of light bar {self.id} to {power}")
        self.channel.duty_cycle = 1024 * power
        self.powered = power

    def set_brightness(self, level):
        if level < 0 or level > 100:
            raise ValueError("Power opacity must be between levels 0 to 100")
        # print(f"Setting brightness of light bar {self.id} to {level}")
        self.channel.duty_cycle = 307 + int(230 * (level / 100))
        
class LightingGroup:
    def __init__(self, hardware_ids):
        self.type = "el"
        self.light_bars = [LightBar(int(hw_id), i) for i, hw_id in enumerate(hardware_ids)]

    def set_power(self, state):
        for bar in self.light_bars:
            bar.set_power(state)

    def set_brightness(self, level):
        for bar in self.light_bars:
            bar.set_brightness(level)

class LEDStrip:
    def __init__(self, led_count, gpio_pin, dma_channel) -> None:
        self.type = "ws"
        self.led_count = led_count
        self.strip = PixelStrip(led_count, gpio_pin, ws_led_freq, dma_channel, False, 0)

    def init_ws(self):
        self.strip.begin()

    def set_power(self, state):
        if state:
            self.strip.setBrightness(255)
        else:
            self.strip.setBrightness(0)
    
    def set_brightness(self, level):
        if level < 0 or level > 100:
            raise ValueError("Power opacity must be between levels 0 to 100")
        self.strip.setBrightness(int(255 * (level / 100)))

    def set_color(self, color, brightness=None):
        for i in range(self.led_count):
            self.strip.setPixelColor(i, color)
        if brightness != None: self.set_brightness(brightness)

def initialize_lighting_groups(config, lighting_groups, board_num):
    for group in config:
        id = f"B{board_num}{'W' if group['type'] == 'ws' else 'G'}{group['assignedNum']}"
        if group['type'] == 'el':
            lighting_groups[id] = LightingGroup(group['elConfig'])
        elif group['type'] == 'ws':
            lighting_groups[id]  = LEDStrip(
                group['wsConfig']['led_count'], 
                group['wsConfig']['pin'], 
                group['wsConfig']['dma']
            )
        else:
            raise ValueError(f"Invalid lighting group type {group['type']}")

def reset_lighting_groups(lighting_groups):
    for group in lighting_groups:
        lighting_groups[group].set_power(0)