import { ArrowDownIcon, ArrowUpIcon, XIcon } from "@heroicons/react/outline";
import { ActionIcon } from "@mantine/core";
import { Fragment, UIFragment } from "../../types/Frags";
import { useFragmentStore } from "../../Stores/Fragments";

interface AsmFragBarProps {
    frag: UIFragment;
    index: number;
    prevLength: number;
}

function formatSeconds(seconds: number) {
    const date = new Date(seconds * 1000);
    const formatter = new Intl.DateTimeFormat("en-US", {
        minute: "2-digit",
        second: "2-digit",
    });
    return formatter.format(date);
}

const AsmFragBar = ({ frag, index, prevLength }: AsmFragBarProps) => {
    const { getMaxFragOrder, swapFragOrder, removeFragOrder } = useFragmentStore((state) => ({
        getMaxFragOrder: state.getMaxFragOrder,
        swapFragOrder: state.swapFragmentOrder,
        removeFragOrder: state.removeFragmentOrder,
    }));

    return (
        <div
            className={`w-full font-jbmono px-6 py-3 flex items-center justify-between ${
                frag.empty ? "bg-green-50" : "bg-slate-100"
            }`}
        >
            <div className="w-full flex gap-1 items-center">
                <ActionIcon
                    onClick={() => {
                        if (index == 0) return;
                        swapFragOrder(index, index - 1);
                    }}
                >
                    <ArrowUpIcon className="w-5 text-blue-700" />
                </ActionIcon>
                <ActionIcon
                    onClick={() => {
                        if (index >= getMaxFragOrder()) return;
                        swapFragOrder(index, index + 1);
                    }}
                >
                    <ArrowDownIcon className="w-5 text-blue-700" />
                </ActionIcon>
                <p className="ml-1 ">{frag.fragment.name}</p>
            </div>
            <div className="flex items-center gap-2">
                <p className="w-16 text-slate-800">{formatSeconds(frag.fragment.length)}</p>
                <p className="w-16 text-slate-800">{formatSeconds(prevLength)}</p>
                <p></p>
                <ActionIcon
                    onClick={async () => {
                        await removeFragOrder(frag.fragment.id, [index]);
                    }}
                >
                    <XIcon className="w-6 text-blue-700" />
                </ActionIcon>
            </div>
        </div>
    );
};

export default AsmFragBar;
