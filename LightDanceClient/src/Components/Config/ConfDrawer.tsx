import { Button, Drawer, NumberInput } from "@mantine/core";
import { useWSConvStore } from "../../Stores/WSConnection";
import { invoke } from "@tauri-apps/api/tauri";
import { appDataDir, join } from "@tauri-apps/api/path";
import { showNotification } from "@mantine/notifications";
import { useMetaDataStore } from "../../Stores/MetaData";

interface ConfDrawerProps {
    opened: boolean;
    setOpened: (value: boolean) => void;
}

const ConfDrawer = ({ opened, setOpened }: ConfDrawerProps) => {
    const { logs } = useWSConvStore((state) => ({
        logs: state.logs,
    }));

    const { startShowFrom, setStartShowFrom } = useMetaDataStore((state) => ({
        startShowFrom: state.startShowFrom,
        setStartShowFrom: state.setStartShowFrom,
    }));

    return (
        <Drawer
            opened={opened}
            onClose={() => {
                setOpened(false);
            }}
            size="lg"
        >
            <div className="px-4 font-jbmono">
                <h2 className=" text-xl">Websocket Logs</h2>
                <div className="mt-4 rounded border border-slate-300 bg-zinc-200 p-4 flex flex-col gap-2 h-[60vh] overflow-y-auto overflow-x-clip">
                    {logs.map((log, i) => (
                        <p key={i} className="text-sm break-words">
                            {log}
                        </p>
                    ))}
                </div>
                <h2 className="mt-6 text-xl">Debug Actions</h2>
                <div className="mt-4 flex flex-col gap-4">
                    <div className="w-full flex justify-between items-center">
                        <p>Open App Data Folder</p>
                        <Button
                            className="w-20 font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                            size="sm"
                            onClick={async () => {
                                invoke("open_file_browser", {
                                    path: await appDataDir(),
                                }).catch((err) =>
                                    showNotification({
                                        title: "Error",
                                        message: err,
                                        color: "red",
                                    })
                                );
                            }}
                        >
                            Open
                        </Button>
                    </div>
                    <div className="w-full flex justify-between items-center">
                        <p>Start Dance From Second</p>
                        <NumberInput
                            className="w-20"
                            value={startShowFrom}
                            onChange={(e) => {
                                setStartShowFrom(typeof e === "string" ? 0 : e);
                            }}
                            min={0}
                        />
                    </div>
                </div>
            </div>
        </Drawer>
    );
};

export default ConfDrawer;
