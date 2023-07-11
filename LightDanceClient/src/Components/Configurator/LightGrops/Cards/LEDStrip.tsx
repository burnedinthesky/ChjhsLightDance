import { NumberInput, Select } from "@mantine/core";
import { useBoardStore } from "../../../../Stores/Boards";
import { LEDStripData, LightingGroupData } from "../../../../types/Boards";
import { DMAChannels, GPIOPins } from "../../../../lib/hardwardInfo";

interface LEDStripConfCard {
    config: LEDStripData;
    selectedBoard: string | null;
}

const LEDStripConfCard = ({ config, selectedBoard }: LEDStripConfCard) => {
    const { board, setLEDStripConfig } = useBoardStore((state) => ({
        board: selectedBoard ? state.boards.find((brd) => brd.id === selectedBoard) : null,
        setLEDStripConfig: state.setLEDStripConfig,
    }));

    if (!board) return null;

    return (
        <div>
            <p className="mt-2 mb-2">ID: {`B${board.assignedNum}S${config.assignedNum}`}</p>
            <div className="grid grid-cols-2 gap-y-2 items-center">
                <div className="flex gap-4 items-center">
                    <p>DMA Channel:</p>
                    <Select
                        size="sm"
                        className="w-40"
                        data={DMAChannels}
                        value={config.dma}
                        onChange={(v) => {
                            setLEDStripConfig(config.id, { dma: v });
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
                        value={config.pin}
                        onChange={(v) => {
                            setLEDStripConfig(config.id, { pin: v });
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
                        value={config.led_count ?? ""}
                        onChange={(v) => setLEDStripConfig(config.id, { led_count: v === "" ? null : v })}
                        min={1}
                    />
                </div>
            </div>
        </div>
    );
};

export default LEDStripConfCard;
