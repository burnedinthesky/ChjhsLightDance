import { useEffect, useRef, useState } from "react";
import Sidebar from "./Components/Nav/Sidebar";
import AsmApp from "./Components/Assembler/AsmApp";
import ConfApp from "./Components/Configurator/ConfApp";

import { connectWebSocket } from "./lib/wsPortal";
import { useWSConvStore } from "./Stores/WSConnection";
import { Button, Modal } from "@mantine/core";

connectWebSocket();

function App() {
    const [appMode, setAppMode] = useState<"asm" | "conf">("asm");
    const {
        connected: wsConnected,
        preConLogs,
        clearPreConLogs,
    } = useWSConvStore((state) => ({
        connected: state.connected,
        preConLogs: state.preConLogs,
        clearPreConLogs: state.clearPreConLogs,
    }));

    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const logContainer = logContainerRef.current;
        if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }, [preConLogs]);

    return (
        <div className="fixed inset-0 flex bg-zinc-100">
            <div className="w-16 h-screen">
                <Sidebar setAppMode={setAppMode} />
            </div>
            <div className="h-screen flex-grow">{appMode === "asm" ? <AsmApp /> : <ConfApp appMode={appMode} />}</div>
            <Modal opened={!wsConnected} onClose={() => {}} withCloseButton={false} centered size={"lg"}>
                <div className="font-jbmono">
                    <h1 className="text-lg">Chingshin Light Dance Manager: WebSocket Connecting</h1>
                    <p className="mt-4">Pre Connection Logs</p>
                    <div
                        ref={logContainerRef}
                        className="mt-2 rounded border border-slate-300 bg-zinc-200 p-4 flex flex-col gap-2 max-h-[60vh] overflow-y-auto"
                    >
                        {preConLogs.map((log, i) => (
                            <p key={i} className="text-sm">
                                {log}
                            </p>
                        ))}
                    </div>
                    <div className="mt-4 w-full flex justify-end">
                        <Button
                            className="font-jbmono bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                            size="xs"
                            onClick={clearPreConLogs}
                        >
                            Clear Logs
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default App;
