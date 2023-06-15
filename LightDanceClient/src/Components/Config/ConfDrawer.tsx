import { Drawer } from "@mantine/core";
import { useWSConvStore } from "../../Stores/WSConnection";

interface ConfDrawerProps {
    opened: boolean;
    setOpened: (value: boolean) => void;
}

const ConfDrawer = ({ opened, setOpened }: ConfDrawerProps) => {
    const { logs } = useWSConvStore((state) => ({
        logs: state.logs,
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
                <h2 className=" text-2xl">Websocket Logs</h2>
                <div className="mt-4 rounded border border-slate-300 bg-zinc-200 p-4 flex flex-col gap-2 h-[60vh] overflow-y-auto overflow-x-clip">
                    {logs.map((log, i) => (
                        <p key={i} className="text-sm break-words">
                            {log}
                        </p>
                    ))}
                </div>
            </div>
        </Drawer>
    );
};

export default ConfDrawer;
