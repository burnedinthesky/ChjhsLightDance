import { readTextFile, BaseDirectory, writeTextFile } from "@tauri-apps/api/fs";

import { z } from "zod";
import { BoardData, LEDStripData, LightingGroupData } from "../types/Boards";
import { sendWSMessage } from "./wsPortal";
import { invoke } from "@tauri-apps/api/tauri";
import { UIFragment } from "../types/Frags";

type ShowFlash = Record<
    string,
    {
        type: "rpi";
        boardNumber: number;
        lsConfig: LEDStripData[];
        lgConfig: LightingGroupData[];
        lightConfig: Record<string, Record<string, string>[]>;
    }
>;

const LightConfig = z.object({
    uuid: z.string(),
    payload: z.record(z.string(), z.array(z.record(z.string(), z.string()))),
});

export async function CompileDance(frags: UIFragment[], start_from?: number) {
    const parsedDance = (await invoke("compile_final_dance", {
        excels: JSON.stringify(
            frags.map((f) => {
                if (f.empty) return `empty;${f.fragment.length * 1000}`;
                return `${f.fragment.filePath}`;
            })
        ),
        startfrom: start_from ? start_from * 1000 : 0,
    })) as string;

    const [stdOut, stdErr] = parsedDance.split(";;;");
    console.log(stdOut, stdErr);
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
        // if (board.status !== "connected") return;
        const boardId = board.id;
        const lightGroups = board.lightGroups.map((lg) => `B${board.assignedNum}W${lg.assignedNum}`);

        const lightConfig: Record<string, Record<string, string>[]> = {};
        lightGroups.forEach((lg) => {
            lightConfig[lg] = compiledDance.payload[lg];
        });

        compiledShowData[boardId] = {
            type: "rpi",
            boardNumber: board.assignedNum,
            lsConfig: board.ledStrips,
            lgConfig: board.lightGroups,
            lightConfig,
        };
    });

    sendWSMessage("flash", JSON.stringify(compiledShowData));
}
