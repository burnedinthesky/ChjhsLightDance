import { ActionIcon } from "@mantine/core";
import { ChipIcon, CogIcon, LinkIcon } from "@heroicons/react/outline";
import { useState } from "react";
import ConfDrawer from "../Config/ConfDrawer";
import { useWSConvStore } from "../../Stores/WSConnection";

interface SidebarProps {
    setAppMode: (value: "asm" | "conf") => void;
}

const Sidebar = ({ setAppMode }: SidebarProps) => {
    const { wsConnected } = useWSConvStore((state) => ({
        wsConnected: state.connected,
    }));

    const [confDrawerOpen, setConfDrawerOpen] = useState<boolean>(false);

    return (
        <>
            <div className="h-screen w-16 fixed top-0 left-0 py-10 flex flex-col gap-7 justify-between items-center border-r border-r-slate-400 ">
                <div className="flex flex-col gap-7 items-center">
                    <h2 className="text-blue-800 font-bold text-xl font-jbmono">CS</h2>
                    <ActionIcon
                        size={28}
                        onClick={() => {
                            setAppMode("asm");
                        }}
                    >
                        <LinkIcon className="w-7 text-blue-700" />
                    </ActionIcon>
                    <ActionIcon
                        size={28}
                        onClick={() => {
                            setAppMode("conf");
                        }}
                    >
                        <ChipIcon className="w-7 text-blue-700" />
                    </ActionIcon>
                </div>
                <ActionIcon
                    size={28}
                    onClick={() => {
                        setConfDrawerOpen(!confDrawerOpen);
                    }}
                >
                    <CogIcon className="w-7 text-blue-700" />
                </ActionIcon>
            </div>
            <ConfDrawer opened={confDrawerOpen && wsConnected} setOpened={setConfDrawerOpen} />
        </>
    );
};

export default Sidebar;
