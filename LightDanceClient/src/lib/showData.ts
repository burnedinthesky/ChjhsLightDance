import { readTextFile, BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";

import { z } from "zod";
import { BoardData } from "../types/Boards";
import { sendWSMessage } from "./wsPortal";

type ShowFlash = Record<
    string,
    {
        type: "rpi";
        boardNumber: number;
        lgConfig: {
            id: string;
            name: string;
            assignedNum: number;
            lights: string[];
        }[];
        lightConfig: Record<string, Record<string, string>[]>;
    }
>;

const LightConfig = z.object({
    uuid: z.string(),
    payload: z.record(z.string(), z.array(z.record(z.string(), z.string()))),
});

export async function CompileDance() {
    const data: z.infer<typeof LightConfig> = {
        uuid: JSON.parse(await readTextFile("fragments.json", { dir: BaseDirectory.AppData })).uuid,
        payload: { B0G0: [] },
    };
    await writeTextFile("compiled_dance.json", JSON.stringify(data), {
        dir: BaseDirectory.AppData,
    });
}

export async function FlashShowData(hwConf: BoardData[]) {
    const compiledDanceRaw = await readTextFile("compiled_dance.json", { dir: BaseDirectory.AppData });
    const compiledDanceObj = JSON.parse(compiledDanceRaw);
    console.log(compiledDanceObj);

    const compiledDance = LightConfig.parse(compiledDanceObj);

    const compiledShowData: ShowFlash = {};

    hwConf.forEach((board) => {
        if (board.status !== "connected") return;
        const boardId = board.id;
        const lightGroups = board.lightGroups.map((lg) => `B${board.assignedNum}G${lg.assignedNum}`);

        const lightConfig: Record<string, Record<string, string>[]> = {};
        lightGroups.forEach((lg) => {
            lightConfig[lg] = compiledDance.payload[lg];
        });

        compiledShowData[boardId] = {
            type: "rpi",
            boardNumber: board.assignedNum,
            lgConfig: board.lightGroups,
            lightConfig,
        };
    });

    sendWSMessage("flash", JSON.stringify(compiledShowData));

    await new Promise((resolve) => setTimeout(resolve, 1000));
}
