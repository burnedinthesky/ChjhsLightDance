import board
import busio
import adafruit_pca9685

i2c = busio.I2C(board.SCL, board.SDA)

pca = adafruit_pca9685.PCA9685(i2c)
pca.frequency = 1000

input_prompt = "Enter command on/off followed by ;[number] to specify pin: "

u_in = input(input_prompt)

while u_in != "exit":
    if ";" in u_in:
        try:
            cmd, pins = u_in.split(";")
            print(cmd)
            pins = [int(pin) for pin in pins.split(",")]
        except Exception as e:
            print(f"Error: {e}")
            u_in = input(input_prompt)
            continue
    else: 
        cmd = u_in
        pins = [i for i in range(16)]

    if cmd == "on":
        print(f"Turning pins {','.join([str(pin) for pin in pins])} on")
        for pin in pins:
            pca.channels[pin].duty_cycle = 0xffff
    elif cmd == "off":
        print(f"Turning pins {','.join([str(pin) for pin in pins])} off")
        for pin in pins:
            pca.channels[pin].duty_cycle = 0xffff
    else:
        print("Unknown command")
    u_in = input(input_prompt)