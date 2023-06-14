import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import BoardAccordion from "./BoardAccordion";
import LightGroupConfigs from "./LightGroupConfig";
import ShowConfigurator from "./ShowConfigurator";

import { useBoardStore } from "../../Stores/Boards";
import { showNotification } from "@mantine/notifications";

import ShowDisplay from "../Show";

import { v4 as uuidv4 } from "uuid";
import { LoadingOverlay } from "@mantine/core";
import { useWSConvStore } from "../../Stores/WSConnection";
import { sendWSMessage } from "../../lib/wsPortal";

interface ConfAppProps {
    appMode: string;
}

const ConfApp = ({ appMode }: ConfAppProps) => {
    const [lANIp, setLANIp] = useState<string>("Loading");
    const [focusedBoard, setFocusedBoard] = useState<string | null>(null);

    const [startShowID, setStartShowID] = useState<string | null>(null);

    const { loadFromLocalStorage } = useBoardStore((state) => ({
        loadFromLocalStorage: state.loadFromLocalStorage,
    }));

    const { refreshedBoard, setRefreshedBoard } = useWSConvStore((state) => ({
        refreshedBoard: state.refreshedBoard,
        setRefreshedBoard: state.setRefreshedBoard,
    }));

    useEffect(() => {
        if (appMode !== "conf") return;

        setRefreshedBoard(false);
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

        loadFromLocalStorage()
            .then(() => {
                sendWSMessage("refresh", "rpi");
            })
            .catch(() => {
                showNotification({
                    title: "Error",
                    message: "Failed to load boards from local storage, reload the app to try again.",
                    color: "red",
                    autoClose: false,
                });
            });
    }, [appMode]);

    return (
        <div className="h-screen w-full py-10 px-12 font-jbmono">
            <h1 className="font-medium text-3xl">Chingshin Light Dance Configurator</h1>
            <div className="mt-6 w-full flex gap-14 h-full">
                <div className="w-1/2 flex-grow flex flex-col gap-4">
                    <h2 className="text-xl">Board Configuration</h2>
                    <div className="w-full bg-zinc-50 border border-zinc-400 rounded-lg flex px-7 h-12 items-center">
                        <div>Server IP: {lANIp}</div>
                    </div>
                    <div className="relative w-full bg-zinc-50 border border-zinc-400 rounded-lg px-2">
                        <LoadingOverlay visible={!refreshedBoard} loaderProps={{ size: "sm" }} />
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
