import pandas as pd
from argparse import ArgumentParser
from val_lg_parser import LightGroup

parser = ArgumentParser()
parser.add_argument("file_loc")
args = parser.parse_args()

file_path = args.file_loc
excel = pd.read_excel(file_path)

light_groups: dict[str, LightGroup] = {}

max_end_time = 0
annotated_end_time = list(next(excel.iterrows())[1].keys())[-1]*1000

errors = []

for row_num, row in enumerate(excel.iterrows()):
    data = row[1]
    row_id = data.values[0]
    if pd.isna(row_id): continue
    light_groups[row_id] = LightGroup(row_id)
    for i, time_mark in enumerate(data.keys()):
        if i < 2 or pd.isna(data[time_mark]): continue
        try:
            time = float(time_mark) * 1000
        except ValueError:
            if f"Error at {time_mark}: Invalid time" not in errors:
                errors.append(f"Error at {time_mark}: Invalid time")
            time = float(list(data.keys())[i-1]) * 1000 + 5
        try:
            light_groups[row_id].add_command(time, data[time_mark])
        except Exception as e:
            errors.append(f"Error at time {time_mark} col {i+1}; Command: {data[time_mark]}; Error: {str(e)}")
    max_end_time = max(light_groups[row_id].get_length(), max_end_time)

file_path = str(file_path)
file_path.replace(".xlsx", "")

if len(errors) > 0:
    print("Errors:")
    print("\n".join(errors))
    with open(f"{file_path} errors.txt", "w") as f:
        f.write("\n".join(errors))

