import { ActionIcon, Chip } from "@mantine/core";
import { LightingGroupData } from "../../../../types/Boards";
import { useBoardStore } from "../../../../Stores/Boards";
import AddLightBarPopover from "../AddLightBarPopover";
import { TrashIcon } from "@heroicons/react/outline";

interface ELConfigProps {
    config: LightingGroupData;
    selectedBoard: string | null;
    selELLights: { id: string; lights: string[] } | null;
    setSelELLights: React.Dispatch<React.SetStateAction<{ id: string; lights: string[] } | null>>;
    selectedAddPin: Record<string, string | null>;
    setSelectedAddPin: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
    openAddPins: string[];
    setOpenAddPins: React.Dispatch<React.SetStateAction<string[]>>;
}

const ELConfig = ({
    config,
    selectedBoard,
    selELLights,
    setSelELLights,
    selectedAddPin,
    setSelectedAddPin,
    openAddPins,
    setOpenAddPins,
}: ELConfigProps) => {
    const { boardLG, selBoardNum, setELLGConfig } = useBoardStore((state) => ({
        boardLG: selectedBoard ? state.boards.find((brd) => brd.id === selectedBoard)?.lightGroups ?? null : null,
        selBoardNum: state.boards.find((brd) => brd.id === selectedBoard)!.assignedNum,
        setELLGConfig: state.setELLGConfig,
    }));

    if (config.elConfig === null) return null;

    return (
        <div>
            <p className="mt-2 mb-1">ID: {`B${selBoardNum}G${config.assignedNum}`}</p>
            <div className="flex items-center">
                <p>Lights:</p>
                <div className="ml-2 flex-grow flex gap-2 flex-wrap">
                    {config.elConfig.map((light, i) => (
                        <Chip
                            key={i}
                            color="red"
                            classNames={{ label: "font-jbmono" }}
                            disabled={selELLights ? selELLights.id !== config.id : false}
                            checked={
                                selELLights ? selELLights.id === config.id && selELLights.lights.includes(light) : false
                            }
                            onChange={() => {
                                if (!selELLights) {
                                    setSelELLights({ id: config.id, lights: [light] });
                                    return;
                                }
                                if (selELLights.id !== config.id) return;
                                if (selELLights.lights.includes(light)) {
                                    setSelELLights((cur) => {
                                        if (!cur) return null;
                                        return cur.lights.length > 1
                                            ? { id: cur.id, lights: cur.lights.filter((l) => l !== light) }
                                            : null;
                                    });
                                    return;
                                }
                                setSelELLights({
                                    id: selELLights.id,
                                    lights: [...selELLights.lights, light],
                                });
                            }}
                            size="sm"
                        >
                            {light}
                        </Chip>
                    ))}
                    {selELLights && config.id === selELLights.id ? (
                        <ActionIcon
                            onClick={() => {
                                setELLGConfig(
                                    selELLights.id,
                                    (
                                        (boardLG!.find((val) => val.id === selELLights.id) as LightingGroupData)
                                            .elConfig ?? []
                                    ).filter((val) => !selELLights.lights.includes(val))
                                );
                                setSelELLights(null);
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
        </div>
    );
};

export default ELConfig;
