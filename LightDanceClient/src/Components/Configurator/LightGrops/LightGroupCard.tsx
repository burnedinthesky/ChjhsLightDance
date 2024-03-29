import { useState } from "react";
import { ActionIcon, Button, Modal, TextInput } from "@mantine/core";
import { PencilAltIcon, TrashIcon } from "@heroicons/react/outline";
import { useBoardStore } from "../../../Stores/Boards";
import { LightingGroupData } from "../../../types/Boards";
import WSConfig from "./Cards/LGConfig";

interface LightGroupCardProps {
    config: LightingGroupData;
    selectedBoard: string | null;
}

const LightGroupCard = ({ config, selectedBoard }: LightGroupCardProps) => {
    const { boardLG, renameLG, deleteLG } = useBoardStore((state) => ({
        boardLG: selectedBoard ? state.boards.find((brd) => brd.id === selectedBoard)?.lightGroups ?? null : null,
        selBoardNum: state.boards.find((brd) => brd.id === selectedBoard)!.assignedNum,
        renameLG: state.renameLG,
        deleteLG: state.deleteLG,
    }));

    const [newGroupName, setNewGroupName] = useState<string | null>(null);

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
                        deleteLG(selectedBoard!, config.id);
                    }}
                >
                    <TrashIcon className="w-4 text-blue-800" />
                </ActionIcon>
            </div>

            {config.type === "ws" && <WSConfig config={config} selectedBoard={selectedBoard} />}

            <Modal
                opened={newGroupName !== null}
                onClose={() => {
                    setNewGroupName(null);
                }}
                title="Rename Light Group"
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
                        disabled={newGroupName! === "" || boardLG!.some((lg) => lg.name === newGroupName!)}
                        onClick={() => {
                            renameLG(config.id, newGroupName!);
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

export default LightGroupCard;
