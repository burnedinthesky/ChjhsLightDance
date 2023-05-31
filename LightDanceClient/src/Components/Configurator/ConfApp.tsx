import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import BoardAccordion from "./BoardAccordion";
import LightGroupConfigs from "./LightGroupConfig";
import ShowConfigurator from "./ShowConfigurator";

import { useBoardStore } from "../../Stores/Boards";
import { showNotification } from "@mantine/notifications";
import { randomId } from "@mantine/hooks";
import ShowDisplay from "../Show";

import { v4 as uuidv4 } from "uuid";

const ConfApp = () => {
    const [lANIp, setLANIp] = useState<string>("Loading");
    const [focusedBoard, setFocusedBoard] = useState<string | null>(null);

    const [startShowID, setStartShowID] = useState<string | null>(null);

    const { boards, loadFromLocalStorage } = useBoardStore((state) => ({
        boards: state.boards,
        addBoard: state.addBoard,
        loadFromLocalStorage: state.loadFromLocalStorage,
    }));

    useEffect(() => {
        invoke("get_lan_ip")
            .then((ret) => {
                setLANIp(ret as string);
            })
            .catch((err) => {
                showNotification({
                    title: "Error",
                    message: "Failed to get computer LAN IP, reload the app to try again.",
                    color: "red",
                    autoClose: false,
                });
            });

        loadFromLocalStorage().catch(() => {
            showNotification({
                title: "Error",
                message: "Failed to load boards from local storage, reload the app to try again.",
                color: "red",
                autoClose: false,
            });
        });
    }, []);

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
                        <BoardAccordion focused={focusedBoard} setFocused={setFocusedBoard} />
                    </div>
                    <h2 className="text-xl">Performance Configuration</h2>
                    <div className="w-full bg-zinc-50 border border-zinc-400 rounded-lg flex px-7 items-center">
                        <ShowConfigurator
                            startShow={() => {
                                setStartShowID(uuidv4());
                            }}
                        />
                    </div>
                </div>

                <div className="w-1/2 flex-grow flex flex-col gap-4">
                    <h2 className="text-xl">Lighting Group Configurations</h2>
                    <div className="w-full">
                        <LightGroupConfigs key={focusedBoard} selectedBoard={focusedBoard} />
                    </div>
                </div>
            </div>
            {startShowID && <ShowDisplay key={startShowID} showId={startShowID} setShowId={setStartShowID} />}
        </div>
    );
};

export default ConfApp;
