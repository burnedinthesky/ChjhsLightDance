import { useEffect, useState } from "react";

import { ScrollArea } from "@mantine/core";
import { PlusIcon } from "@heroicons/react/outline";
import LightGroupCard from "./LightGroupCard";

import { useBoardStore } from "../../Stores/Boards";

interface LightGroupConfigProps {
    selectedBoard: string | null;
}

const LightGroupConfig = ({ selectedBoard }: LightGroupConfigProps) => {
    const [selLights, setSelLights] = useState<{ id: string; lights: string[] } | null>(null);

    const [selectedAddPin, setSelectedAddPin] = useState<Record<string, string | null>>({});
    const [openAddPins, setOpenAddPins] = useState<string[]>([]);

    const { boardLG, createLG } = useBoardStore((state) => ({
        boardLG: selectedBoard ? state.boards.find((brd) => brd.id === selectedBoard)?.lightGroups ?? null : null,
        createLG: state.createLG,
        setLGBars: state.setLGBars,
        deleteLG: state.deleteLG,
    }));

    useEffect(() => {
        if (!boardLG) return;
        boardLG.forEach((config) => {
            if (!selectedAddPin[config.id]) {
                setSelectedAddPin((cur) => ({ ...cur, [config.id]: null }));
            }
        });
    }, [boardLG]);

    if (!boardLG)
        return (
            <div className="w-full py-4 bg-zinc-50 border border-zinc-400 rounded-lg flex justify-center items-center">
                <p className="font-jbmono">No board selected</p>
            </div>
        );

    return (
        <ScrollArea h={window.innerHeight - 215}>
            <div className="w-full h-full flex flex-col gap-2">
                {boardLG.map((config) => (
                    <LightGroupCard
                        key={config.id}
                        config={config}
                        selectedBoard={selectedBoard}
                        selLights={selLights}
                        setSelLights={setSelLights}
                        openAddPins={openAddPins}
                        setOpenAddPins={setOpenAddPins}
                        selectedAddPin={selectedAddPin}
                        setSelectedAddPin={setSelectedAddPin}
                    />
                ))}

                <button
                    className="w-full bg-zinc-50 border font-jbmono text-zinc-800 border-zinc-400 rounded-lg flex gap-4 px-7  h-12 items-center"
                    onClick={() => {
                        createLG(selectedBoard!);
                    }}
                >
                    <PlusIcon className="w-5" />
                    <p className="">Add LightGroup</p>
                </button>
            </div>
        </ScrollArea>
    );
};

export default LightGroupConfig;
