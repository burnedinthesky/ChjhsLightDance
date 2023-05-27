import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import BoardAccordion from "./BoardAccordion";
import LightGroupConfigs from "./LightGroupConfig";
import ShowConfigurator from "./ShowConfigurator";
import { BoardData, LightingGroupData } from "../../types/Boards";

const ConfApp = () => {
    const [lANIp, setLANIp] = useState<string>("Loading");
    const [focusedBoard, setFocusedBoard] = useState<string | null>(null);

    const [boards, setBoards] = useState<BoardData[]>([
        {
            id: "000000000000",
            name: "why",
            status: "connected",
            ip: "192.168.0.1",
            assisgnedId: "B1G1",
            lightGroups: [],
        },
    ]);

    useEffect(() => {
        const newBoards: BoardData[] = [];
        for (let i = 0; i < 20; i++) {
            newBoards.push({
                id: `${i}`,
                name: "why",
                status: "connected",
                ip: "192.168.0.1",
                assisgnedId: `B1G${i + 1}`,
                lightGroups: [],
            });
        }
        setBoards(newBoards);
    }, []);

    useEffect(() => {
        invoke("get_lan_ip").then((ret) => {
            setLANIp(ret as string);
        });
    }, []);

    useEffect(() => {
        console.log(focusedBoard);
    }, [focusedBoard]);

    return (
        <div className="h-screen w-full py-10 px-12 font-jbmono">
            <h1 className="font-medium text-3xl">Chingshin Light Dance Configurator</h1>
            <div className="mt-6 w-full flex gap-14 h-full">
                <div className="w-1/2 flex-grow flex flex-col gap-4">
                    <h2 className="text-xl">Board Configuration</h2>
                    <div className="w-full bg-zinc-50 border border-zinc-400 rounded-lg flex px-7 h-12 items-center">
                        <div>Server IP: {lANIp}</div>
                    </div>
                    <div className="w-full bg-zinc-50 border border-zinc-400 rounded-lg px-2">
                        <BoardAccordion
                            focused={focusedBoard}
                            setFocused={setFocusedBoard}
                            boards={boards}
                            setBoards={setBoards}
                        />
                    </div>
                    <h2 className="text-xl">Performance Configuration</h2>
                    <div className="w-full bg-zinc-50 border border-zinc-400 rounded-lg flex px-7 items-center">
                        <ShowConfigurator />
                    </div>
                </div>

                <div className="w-1/2 flex-grow flex flex-col gap-4">
                    <h2 className="text-xl">Lighting Group Configurations</h2>
                    <div className="w-full">
                        <LightGroupConfigs
                            key={focusedBoard}
                            selectedBoard={focusedBoard}
                            configs={
                                focusedBoard
                                    ? (boards.find((val) => val.id === focusedBoard)
                                          ?.lightGroups as LightingGroupData[])
                                    : null
                            }
                            setConfigs={(getConfigs) => {
                                if (!focusedBoard) throw new Error("Focused Board is null");
                                console.log("Thingy called");
                                setBoards((cur) => {
                                    const newBoards = [...cur];
                                    const boardIndex = newBoards.findIndex((val) => val.id === focusedBoard);
                                    return newBoards.map((brd) =>
                                        brd.id === focusedBoard
                                            ? {
                                                  ...brd,
                                                  lightGroups: getConfigs(cur[boardIndex].lightGroups),
                                              }
                                            : brd
                                    );
                                });
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfApp;
