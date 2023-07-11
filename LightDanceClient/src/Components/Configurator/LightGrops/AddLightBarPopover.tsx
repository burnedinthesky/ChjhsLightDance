import { ActionIcon, Popover, Select } from "@mantine/core";
import { PlusIcon, XIcon, CheckIcon } from "@heroicons/react/outline";
import { BoardPins } from "../../../lib/hardwardInfo";

import { useBoardStore } from "../../../Stores/Boards";
import { LightingGroupData } from "../../../types/Boards";

interface AddLightBarPopoverProps {
    config: LightingGroupData;
    selectedBoard: string | null;
    selectedAddPin: Record<string, string | null>;
    setSelectedAddPin: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
    openAddPins: string[];
    setOpenAddPins: React.Dispatch<React.SetStateAction<string[]>>;
}

const AddLightBarPopover = ({
    config,
    selectedBoard,
    selectedAddPin,
    setSelectedAddPin,
    openAddPins,
    setOpenAddPins,
}: AddLightBarPopoverProps) => {
    const { boardLG } = useBoardStore((state) => ({
        boardLG: selectedBoard ? state.boards.find((brd) => brd.id === selectedBoard)?.lightGroups ?? null : null,
    }));

    return (
        <Popover
            width={280}
            position="bottom"
            withArrow
            shadow="md"
            opened={openAddPins.includes(config.id)}
            onClose={() => {
                setSelectedAddPin((cur) => ({ ...cur, [config.id]: null }));
                setOpenAddPins((cur) => cur.filter((id) => id !== config.id));
            }}
        >
            <Popover.Target>
                <ActionIcon
                    onClick={() => {
                        setOpenAddPins((cur) => [...cur, config.id]);
                    }}
                >
                    <PlusIcon className="w-5 text-blue-600" />
                </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
                <div className="flex gap-2 items-center">
                    <Select
                        className="flex-grow"
                        value={selectedAddPin[config.id]}
                        onChange={(val) => {
                            setSelectedAddPin((cur) => ({ ...cur, [config.id]: val }));
                        }}
                        data={BoardPins.filter(
                            (val) => !boardLG!.flatMap((val) => val.elConfig ?? []).includes(val)
                        ).map((pin) => ({
                            value: pin,
                            label: pin,
                        }))}
                        searchable
                        dropdownPosition="bottom"
                        maxDropdownHeight={210}
                    />
                    <ActionIcon
                        disabled={selectedAddPin[config.id] === null}
                        onClick={() => {
                            if (!selectedAddPin[config.id]) return;
                            console.log(selectedAddPin[config.id]);
                            // setELLGConfig(config.id, [...(config.elConfig ?? []), selectedAddPin[config.id]!]);
                            setOpenAddPins((cur) => cur.filter((id) => id !== config.id));
                        }}
                    >
                        <CheckIcon
                            className={`w-5 ${selectedAddPin[config.id] === null ? "text-gray-400" : "text-blue-600"}`}
                        />
                    </ActionIcon>
                    <ActionIcon
                        disabled={selectedAddPin[config.id] === null}
                        onClick={() => {
                            setOpenAddPins((cur) => cur.filter((id) => id !== config.id));
                        }}
                    >
                        <XIcon
                            className={`w-5 ${selectedAddPin[config.id] === null ? "text-gray-400" : "text-blue-600"}`}
                        />
                    </ActionIcon>
                </div>
            </Popover.Dropdown>
        </Popover>
    );
};

export default AddLightBarPopover;
