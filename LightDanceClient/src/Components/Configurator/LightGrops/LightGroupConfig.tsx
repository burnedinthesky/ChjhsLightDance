import { useEffect, useState } from "react";

import { ScrollArea } from "@mantine/core";
import { PlusIcon } from "@heroicons/react/outline";
import LightGroupCard from "./LightGroupCard";

import { useBoardStore } from "../../../Stores/Boards";
import LEDStripCard from "./LEDStripCard";

interface LightGroupConfigProps {
    selectedBoardID: string | null;
}

const LightGroupConfig = ({ selectedBoardID }: LightGroupConfigProps) => {
    const { selectedBoard, createStrip, createLG } = useBoardStore((state) => ({
        selectedBoard: selectedBoardID ? state.boards.find((brd) => brd.id === selectedBoardID) ?? null : null,
        createStrip: state.createLEDStrip,
        createLG: state.createLG,
    }));

    if (!selectedBoard)
        return (
            <div className="w-full py-4 bg-zinc-50 border border-zinc-400 rounded-lg flex justify-center items-center">
                <p className="font-jbmono">No board selected</p>
            </div>
        );

    return (
        <ScrollArea h={window.innerHeight - 215}>
            <p className="mt-4 mb-2 text-lg">LED Strips</p>
            <div className="w-full h-full flex flex-col gap-2">
                {selectedBoard.ledStrips.map((config, i) => (
                    <LEDStripCard key={config.id} config={config} selectedBoard={selectedBoardID} />
                ))}
                <div className="w-full flex items-center justify-around gap-4">
                    <button
                        className="w-full bg-zinc-50 border font-jbmono text-zinc-800 border-zinc-400 rounded-lg flex gap-4 px-7  h-12 items-center"
                        onClick={() => {
                            createStrip(selectedBoardID!);
                        }}
                    >
                        <PlusIcon className="w-5" />
                        <p>Add WS2812 LED Strip</p>
                    </button>
                </div>
            </div>
            <p className="mt-4 mb-2 text-lg">Light Groups</p>
            <div className="w-full h-full flex flex-col gap-2">
                {selectedBoard.lightGroups.map((config) => (
                    <LightGroupCard key={config.id} config={config} selectedBoard={selectedBoardID} />
                ))}

                <div className="w-full flex items-center justify-around gap-4">
                    <button
                        className="w-full bg-zinc-50 border font-jbmono text-zinc-800 border-zinc-400 rounded-lg flex gap-4 px-7  h-12 items-center"
                        onClick={() => {
                            createLG(selectedBoardID!, "ws");
                        }}
                    >
                        <PlusIcon className="w-5" />
                        <p className="">Add LightGroup</p>
                    </button>
                </div>
            </div>
        </ScrollArea>
    );
};

export default LightGroupConfig;
