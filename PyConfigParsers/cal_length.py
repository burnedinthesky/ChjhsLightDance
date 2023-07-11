import pandas as pd
from argparse import ArgumentParser
from light_group_parser import LightGroup

parser = ArgumentParser()
parser.add_argument("file_loc")
args = parser.parse_args()

excel = pd.read_excel(args.file_loc)

light_groups: dict[str, LightGroup] = {}

max_end_time = 0
annotated_end_time = list(next(excel.iterrows())[1].keys())[-1]*1000

for row in excel.iterrows():
    data = row[1]
    row_id = data.values[0]
    strip_id = data.values[1]
    if pd.isna(row_id): continue
    light_groups[row_id] = LightGroup(row_id)
    for i, time_mark in enumerate(data.keys()):
        if i <= 2 or pd.isna(data[time_mark]): continue
        time = float(time_mark) * 1000
        light_groups[row_id].add_command(time, data[time_mark])
    max_end_time = max(light_groups[row_id].get_length(), max_end_time)

print(max(max_end_time, annotated_end_time))