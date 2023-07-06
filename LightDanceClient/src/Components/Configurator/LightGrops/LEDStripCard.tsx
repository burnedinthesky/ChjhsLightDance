import { useState } from "react";
import { ActionIcon, Button, Modal, TextInput } from "@mantine/core";
import { PencilAltIcon, TrashIcon } from "@heroicons/react/outline";
import { useBoardStore } from "../../../Stores/Boards";
import { LEDStripData } from "../../../types/Boards";
import LEDStripConfCard from "./Cards/LEDStrip";

interface LEDStripCard {
    config: LEDStripData;
    selectedBoard: string | null;
}

const LEDStripCard = ({ config, selectedBoard }: LEDStripCard) => {
    const { boardStrips, renameLEDStrip, deleteLEDStrip } = useBoardStore((state) => ({
        boardStrips: selectedBoard ? state.boards.find((brd) => brd.id === selectedBoard)?.ledStrips ?? null : null,
        renameLEDStrip: state.renameLEDStrip,
        deleteLEDStrip: state.deleteLEDStrip,
    }));

    const [newGroupName, setNewGroupName] = useState<string | null>(null);

    if (!boardStrips) return null;

    return (
        <div key={config.id} className="w-full bg-zinc-50 border border-zinc-400 rounded-lg py-4 px-7">
            <div className="flex items-center gap-2">
                <h3 className="font-bold">{config.name}</h3>
                <ActionIcon
                    onClick={(e) => {
                        e.stopPropagation();
                        setNewGroupName("");
                    }}
                >
                    <PencilAltIcon className="w-4 text-blue-800" />
                </ActionIcon>
                <ActionIcon
                    onClick={(e) => {
                        e.stopPropagation();
                        deleteLEDStrip(config.id);
                    }}
                >
                    <TrashIcon className="w-4 text-blue-800" />
                </ActionIcon>
            </div>

            <LEDStripConfCard config={config} selectedBoard={selectedBoard} />

            <Modal
                opened={newGroupName !== null}
                onClose={() => {
                    setNewGroupName(null);
                }}
                title="Rename LED Strip"
                centered
            >
                <TextInput
                    label="New Board Name"
                    placeholder="Custom Name"
                    value={newGroupName ?? ""}
                    onChange={(e) => setNewGroupName(e.currentTarget.value)}
                />
                <div className="w-full mt-4 flex justify-end ">
                    <Button
                        className="font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                        size="xs"
                        disabled={newGroupName! === "" || boardStrips!.some((strip) => strip.name === newGroupName!)}
                        onClick={() => {
                            renameLEDStrip(config.id, newGroupName!);
                            setNewGroupName(null);
                        }}
                    >
                        Rename
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default LEDStripCard;
