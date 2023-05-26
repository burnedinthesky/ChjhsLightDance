import { Accordion } from "@mantine/core";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";
import { BoardData } from "../../types/Boards";

const ConfApp = () => {
    const [lANIp, setLANIp] = useState<string>("Loading");

    useEffect(() => {
        invoke("get_lan_ip").then((ret) => {
            setLANIp(ret as string);
        });
    }, []);

    const boards: BoardData[] = [
        { id: "000000000000", name: "why", status: "connected" },
        { id: "000000000010", name: "why", status: "connected" },
    ];

    return (
        <div className="h-screen w-full py-10 px-12 font-jbmono">
            <h1 className="font-medium text-3xl">Chingshin Light Dance Configurator</h1>
            <div className="mt-6 w-full flex gap-14">
                <div className="w-1/2 flex-grow flex flex-col gap-4">
                    <h2 className="text-xl">Board Configuration</h2>
                    <div className="w-full bg-zinc-50 border border-zinc-400 rounded-lg flex px-7 h-12 items-center">
                        <div>Server IP: {lANIp}</div>
                    </div>
                    <div className="w-full bg-zinc-50 border border-zinc-400 rounded-lg flex px-2  items-center">
                        <Accordion className="w-full" classNames={{ item: "w-full font-jbmono" }} radius="md">
                            {boards.map((board) => (
                                <Accordion.Item key={board.id} value={board.id}>
                                    <Accordion.Control>
                                        <h3 className="w-full font-jbmono">{board.name}</h3>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        Colors, fonts, shadows and many other parts are customizable to fit your design
                                        needs
                                    </Accordion.Panel>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                    </div>
                </div>
                <div className="w-1/2 flex-grow">He</div>
            </div>
        </div>
    );
};

export default ConfApp;
