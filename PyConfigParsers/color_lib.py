import numpy as np 

def hex_to_rgb(hex_code):
    hex_code = hex_code.lstrip('#')
    return tuple(int(hex_code[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb):
    return '#{:02x}{:02x}{:02x}'.format(*rgb)

def change_brightness(hex_code, brightness):
    rgb = hex_to_rgb(hex_code)
    r, g, b = rgb

    # Adjust brightness
    r = max(0, min(255, round(r * brightness)))
    g = max(0, min(255, round(g * brightness)))
    b = max(0, min(255, round(b * brightness)))

    updated_rgb = (r, g, b)
    updated_hex = rgb_to_hex(updated_rgb)

    return updated_hex


def calculate_gradient(hex1, hex2, n):
    rgb1 = hex_to_rgb(hex1)
    rgb2 = hex_to_rgb(hex2)

    r_diff = (rgb2[0] - rgb1[0]) / (n - 1)
    g_diff = (rgb2[1] - rgb1[1]) / (n - 1)
    b_diff = (rgb2[2] - rgb1[2]) / (n - 1)

    gradient_colors = []
    for i in range(n):
        r = round(rgb1[0] + r_diff * i)
        g = round(rgb1[1] + g_diff * i)
        b = round(rgb1[2] + b_diff * i)
        gradient_colors.append(rgb_to_hex((r, g, b)))

    return gradient_colors




if __name__ == "__main__":
    hex1 = '#FF0000'  
    hex2 = '#0000FF'  
    n = 20

    gradient_colors = calculate_gradient(hex1, hex2, n)
    for color in gradient_colors:
        print(color) 


    #brightness code 
    hex_code = '#FF0000'  # Red

    for light in np.arange(0.0, 1.0, 0.1): #
        updated_hex = change_brightness(hex_code, light)
        print(updated_hex)