import { ActionIcon, NumberInput, Select } from "@mantine/core";
import { useBoardStore } from "../../../../Stores/Boards";
import { LightingGroupData } from "../../../../types/Boards";
import { DMAChannels, GPIOPins } from "../../../../lib/hardwardInfo";
import { PlusIcon, XIcon } from "@heroicons/react/outline";

interface WSConfigProps {
    config: LightingGroupData;
    selectedBoard: string | null;
}

const WSConfig = ({ config, selectedBoard }: WSConfigProps) => {
    const { board, setWSLGConfig } = useBoardStore((state) => ({
        board: selectedBoard ? state.boards.find((brd) => brd.id === selectedBoard) : null,
        setWSLGConfig: state.setWSLGConfig,
    }));

    if (!board || config.wsConfig === null) return null;

    return (
        <div>
            <p className="mt-2 mb-2">ID: {`B${board.assignedNum}W${config.assignedNum}`}</p>
            <div className="flex flex-col gap-2">
                <div className="flex gap-4 items-center">
                    <p>LED Strip</p>
                    <Select
                        size="sm"
                        className="w-40"
                        data={board.ledStrips.map((strip) => strip.id)}
                        value={config.wsConfig.ledStrip}
                        onChange={(v) => {
                            setWSLGConfig(config.id, { stripId: v });
                        }}
                        searchable
                        dropdownPosition="bottom"
                        maxDropdownHeight={210}
                    />
                </div>
                <div className="flex flex-col gap-4 mt-2">
                    {config.wsConfig.ledPixels.map((pair, i) => (
                        <div key={i} className="flex gap-3 items-center justify-between">
                            <p>Start ID:</p>
                            <NumberInput
                                size="sm"
                                value={pair[0]}
                                onChange={(val) => {
                                    setWSLGConfig(config.id, {
                                        pixelPairs: config.wsConfig.ledPixels.map((pair, j) =>
                                            j === i ? [val === "" ? 0 : val, pair[1]] : pair
                                        ),
                                    });
                                }}
                            />
                            <p>End ID:</p>
                            <NumberInput
                                size="sm"
                                value={pair[1]}
                                onChange={(val) => {
                                    setWSLGConfig(config.id, {
                                        pixelPairs: config.wsConfig.ledPixels.map((pair, j) =>
                                            j === i ? [pair[0], val === "" ? 0 : val] : pair
                                        ),
                                    });
                                }}
                            />
                            <ActionIcon
                                onClick={() => {
                                    setWSLGConfig(config.id, {
                                        pixelPairs: config.wsConfig.ledPixels.filter((_, j) => j !== i),
                                    });
                                }}
                            >
                                <XIcon className="w-5 text-blue-700" />
                            </ActionIcon>
                        </div>
                    ))}
                    <button
                        className="flex gap-2 items-center"
                        onClick={() => {
                            setWSLGConfig(config.id, {
                                pixelPairs: [...config.wsConfig.ledPixels, [0, 0]],
                            });
                        }}
                    >
                        <ActionIcon size={"sm"}>
                            <PlusIcon className="w-5 text-blue-700" />
                        </ActionIcon>
                        <p className="font-jbmono text-blue-700">Add Pair </p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WSConfig;
