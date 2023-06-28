import json
import pandas as pd
from argparse import ArgumentParser
from light_group_parser import LightGroup

parser = ArgumentParser()
parser.add_argument("file_locs")
parser.add_argument("config_file")
parser.add_argument("start_from", type=int)
parser.add_argument("--dev", action="store_true")
args = parser.parse_args()

with open(args.config_file) as f:
    config = json.load(f)

light_groups: dict[str, LightGroup] = {}

for board in config['boards']:
    for group in board['lightGroups']:
        group_id = f"B{board['assignedNum']}G{group['assignedNum']}"
        light_groups[group_id] = LightGroup(group_id)

accm_time = -args.start_from
frags = json.loads(args.file_locs)

for frag in frags:
    if frag[:5] == "empty":
        accm_time += int(frag[6:])
        continue

    excel = pd.read_excel(frag)
    
    max_end_time = 0
    annotated_end_time = list(next(excel.iterrows())[1].keys())[-1]*1000
    for row in excel.iterrows():
        data = row[1]
        row_id = data.values[0]
        if pd.isna(row_id): continue
        if row_id not in light_groups.keys(): raise ValueError(f"Invalid light group ID: {row_id}")
        for i, time_mark in enumerate(data.keys()):
            if i < 2 or pd.isna(data[time_mark]): continue
            cmd_time = round(accm_time + float(time_mark) * 1000)
            light_groups[row_id].add_command(cmd_time, data[time_mark])
        max_end_time = max(light_groups[row_id].get_length(), max_end_time)
    accm_time = max(max_end_time, accm_time + annotated_end_time)

final_output = {}
for key in light_groups.keys():
    final_output[key] = light_groups[key].export_commands()

if args.dev:
    print("\n".join([str(x) for x in final_output['B1G1']]))
    with open('output.json', 'w') as f:
        f.write(json.dumps(final_output))
else:
    print(json.dumps(final_output))