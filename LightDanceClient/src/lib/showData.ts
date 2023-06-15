import { readTextFile, BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";

import { z } from "zod";
import { BoardData } from "../types/Boards";
import { sendWSMessage } from "./wsPortal";
import { invoke } from "@tauri-apps/api/tauri";
import { UIFragment } from "../types/Frags";

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
    payload: z.record(z.string(), z.array(z.record(z.number(), z.string()))),
});

export async function CompileDance(frags: UIFragment[]) {
    const parsedDance = (await invoke("compile_final_dance", {
        excels: JSON.stringify(frags.map((f) => f.fragment.filePath)),
        startfrom: 0,
    })) as string;

    const [stdOut, stdErr] = parsedDance.split(";;;");
    if (stdErr) throw new Error(stdErr);
    const parsedDanceObj = JSON.parse(stdOut);
    const data: z.infer<typeof LightConfig> = {
        uuid: JSON.parse(await readTextFile("fragments.json", { dir: BaseDirectory.AppData })).uuid,
        payload: parsedDanceObj,
    };

    LightConfig.parse(data);

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
}
