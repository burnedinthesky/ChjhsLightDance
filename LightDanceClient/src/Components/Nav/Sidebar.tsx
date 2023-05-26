import { ActionIcon } from "@mantine/core";
import { CogIcon, LinkIcon } from "@heroicons/react/outline";

interface SidebarProps {
    setAppMode: (value: "asm" | "conf") => void;
}

const Sidebar = ({ setAppMode }: SidebarProps) => {
    return (
        <div className="h-screen w-16 fixed top-0 left-0 py-10 flex flex-col gap-7 items-center border-r border-r-slate-400">
            <h2 className="text-blue-800 font-bold text-xl font-jbmono">CH</h2>
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
                <CogIcon className="w-7 text-blue-700" />
            </ActionIcon>
        </div>
    );
};

export default Sidebar;
