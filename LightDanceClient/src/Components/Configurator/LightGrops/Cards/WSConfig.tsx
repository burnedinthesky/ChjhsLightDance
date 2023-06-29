import { NumberInput, Select } from "@mantine/core";
import { useBoardStore } from "../../../../Stores/Boards";
import { LightingGroupData } from "../../../../types/Boards";
import { DMAChannels, GPIOPins } from "../../../../lib/hardwardInfo";

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
            <div className="grid grid-cols-2 gap-y-2 items-center">
                <div className="flex gap-4 items-center">
                    <p>DMA Channel:</p>
                    <Select
                        size="sm"
                        className="w-40"
                        data={DMAChannels}
                        value={config.wsConfig.dma}
                        onChange={(v) => {
                            setWSLGConfig(config.id, { dma: v });
                        }}
                        searchable
                        dropdownPosition="bottom"
                        maxDropdownHeight={210}
                    />
                </div>
                <div className="flex gap-4 items-center">
                    <p>GPIO Pin:</p>
                    <Select
                        size="sm"
                        className="w-40"
                        data={GPIOPins}
                        value={config.wsConfig.pin}
                        onChange={(v) => {
                            setWSLGConfig(config.id, { pin: v });
                        }}
                        searchable
                        dropdownPosition="bottom"
                        maxDropdownHeight={210}
                    />
                </div>
                <div className="flex gap-4 items-center">
                    <p>LED Count</p>
                    <NumberInput
                        size="sm"
                        className="w-40"
                        value={config.wsConfig.led_count ?? ""}
                        onChange={(v) => setWSLGConfig(config.id, { led_count: v === "" ? null : v })}
                    />
                </div>
            </div>
        </div>
    );
};

export default WSConfig;
