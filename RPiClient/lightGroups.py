import board

dev_mode = False

if dev_mode:
    class Channel():
        duty_cycle = 0
    class PCA():
        channels = [Channel() for i in range(16)]

    pca = PCA()
else:
    import busio
    import adafruit_pca9685

    i2c = busio.I2C(board.SCL, board.SDA)

    pca = adafruit_pca9685.PCA9685(i2c)
    pca.frequency = 1000


class LightBar:
    def __init__(self, hw_channel, given_id):
        self.channel = pca.channels[hw_channel]
        self.id = given_id
        self.powered = False

    def get_state(self):
        return self.powered

    def set_power(self, power):
        print(f"Setting power of light bar {self.id} to {power}")
        self.channel.duty_cycle = 1024 * power
        self.powered = power

    def set_brightness(self, level):
        if level < 0 or level > 100:
            raise ValueError("Power opacity must be between levels 0 to 100")
        print(f"Setting brightness of light bar {self.id} to {level}")
        self.channel.duty_cycle = 307 + int(230 * (level / 100))
        
class LightingGroup:
    def __init__(self, hardware_ids):
        self.light_bars = [LightBar(int(hw_id), i) for i, hw_id in enumerate(hardware_ids)]

    def set_power(self, state):
        for bar in self.light_bars:
            bar.set_power(state)

    def set_brightness(self, level):
        for bar in self.light_bars:
            bar.set_brightness(level)

def initialize_lighting_groups(config, lighting_groups):
    for group in config:
        lighting_groups[group['id']] = LightingGroup(group['pins'])

def reset_lighting_groups(lighting_groups):
    lighting_groups.clear()