import { useState } from "react";
import { ActionIcon, Button, Chip, Modal, TextInput } from "@mantine/core";
import { PencilAltIcon, TrashIcon } from "@heroicons/react/outline";
import AddLightBarPopover from "./AddLightBarPopover";
import { useBoardStore } from "../../Stores/Boards";
import { LightingGroupData } from "../../types/Boards";

interface LightGroupCardProps {
    config: LightingGroupData;
    selectedBoard: string | null;
    selLights: { id: string; lights: string[] } | null;
    setSelLights: React.Dispatch<React.SetStateAction<{ id: string; lights: string[] } | null>>;
    selectedAddPin: Record<string, string | null>;
    setSelectedAddPin: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
    openAddPins: string[];
    setOpenAddPins: React.Dispatch<React.SetStateAction<string[]>>;
}

const LightGroupCard = ({
    config,
    selectedBoard,
    selLights,
    setSelLights,
    selectedAddPin,
    setSelectedAddPin,
    openAddPins,
    setOpenAddPins,
}: LightGroupCardProps) => {
    const { boardLG, selBoardNum, setLGBars, renameLG, deleteLG } = useBoardStore((state) => ({
        boardLG: selectedBoard ? state.boards.find((brd) => brd.id === selectedBoard)?.lightGroups ?? null : null,
        selBoardNum: state.boards.find((brd) => brd.id === selectedBoard)!.assignedNum,
        setLGBars: state.setLGBars,
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
            <p className="mt-2 mb-1">ID: {`B${selBoardNum}G${config.assignedNum}`}</p>
            <div className="flex items-center">
                <p>Lights:</p>
                <div className="ml-2 flex-grow flex gap-2 flex-wrap">
                    {config.lights.map((light, i) => (
                        <Chip
                            key={i}
                            color="red"
                            classNames={{ label: "font-jbmono" }}
                            disabled={selLights ? selLights.id !== config.id : false}
                            checked={selLights ? selLights.id === config.id && selLights.lights.includes(light) : false}
                            onChange={() => {
                                if (!selLights) {
                                    setSelLights({ id: config.id, lights: [light] });
                                    return;
                                }
                                if (selLights.id !== config.id) return;
                                if (selLights.lights.includes(light)) {
                                    setSelLights((cur) => {
                                        if (!cur) return null;
                                        return cur.lights.length > 1
                                            ? { id: cur.id, lights: cur.lights.filter((l) => l !== light) }
                                            : null;
                                    });
                                    return;
                                }
                                setSelLights({
                                    id: selLights.id,
                                    lights: [...selLights.lights, light],
                                });
                            }}
                            size="sm"
                        >
                            {light}
                        </Chip>
                    ))}

                    {selLights && config.id === selLights.id ? (
                        <ActionIcon
                            onClick={() => {
                                setLGBars(
                                    selLights.id,
                                    (
                                        boardLG!.find((val) => val.id === selLights.id) as LightingGroupData
                                    ).lights.filter((val) => !selLights.lights.includes(val))
                                );
                                setSelLights(null);
                            }}
                        >
                            <TrashIcon className="w-5 text-red-600" />
                        </ActionIcon>
                    ) : (
                        <AddLightBarPopover
                            config={config}
                            openAddPins={openAddPins}
                            selectedAddPin={selectedAddPin}
                            selectedBoard={selectedBoard}
                            setOpenAddPins={setOpenAddPins}
                            setSelectedAddPin={setSelectedAddPin}
                        />
                    )}
                </div>
            </div>
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
