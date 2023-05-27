import { ActionIcon, Chip, Popover, ScrollArea, Select } from "@mantine/core";
import { LightingGroupData } from "../../types/Boards";
import { useEffect, useState } from "react";
import { CheckIcon, PlusIcon, TrashIcon, XIcon } from "@heroicons/react/outline";

interface LightGroupConfigProps {
    selectedBoard: string | null;
    configs: LightingGroupData[] | null;
    setConfigs: (f: (cur: LightingGroupData[]) => LightingGroupData[]) => void;
}

const LightGroupConfig = ({ selectedBoard, configs, setConfigs }: LightGroupConfigProps) => {
    const BoardPins: string[] = Array.from(Array(32).keys()).map((i) => `0x${i.toString(16).padStart(2, "0")}`);

    const [selLights, setSelLights] = useState<{ id: string; lights: string[] } | null>(null);

    const [selectedAddPin, setSelectedAddPin] = useState<Record<string, string | null>>({});
    const [openAddPins, setOpenAddPins] = useState<string[]>([]);

    useEffect(() => {
        if (!configs) return;
        configs.forEach((config) => {
            if (!selectedAddPin[config.id]) {
                setSelectedAddPin((cur) => ({ ...cur, [config.id]: null }));
            }
        });
    }, [configs]);

    const deleteConfigLights = () => {
        if (!selLights) return;
        setConfigs((cur) => {
            if (!cur) return [];
            return cur.map((config) => {
                if (config.id !== selLights.id) return config;
                return {
                    ...config,
                    lights: config.lights.filter((light) => !selLights.lights.includes(light)),
                };
            });
        });
        setSelLights(null);
    };

    if (!configs)
        return (
            <div className="w-full py-4 bg-zinc-50 border border-zinc-400 rounded-lg flex justify-center items-center">
                <p className="font-jbmono">No board selected</p>
            </div>
        );

    return (
        <ScrollArea h={window.innerHeight - 215}>
            <div className="w-full h-full flex flex-col gap-2">
                {configs.map((config) => (
                    <div key={config.id} className="w-full bg-zinc-50 border border-zinc-400 rounded-lg py-4 px-7">
                        <div>
                            <h3 className="font-bold">{config.givenName}</h3>
                        </div>
                        <p className="mt-2 mb-1">ID: {config.id}</p>
                        <div className="flex items-center">
                            <p>Lights:</p>
                            <div className="ml-2 flex-grow flex gap-2 flex-wrap">
                                {config.lights.map((light) => (
                                    <Chip
                                        color="red"
                                        classNames={{ label: "font-jbmono" }}
                                        disabled={selLights ? selLights.id !== config.id : false}
                                        checked={
                                            selLights
                                                ? selLights.id === config.id && selLights.lights.includes(light)
                                                : false
                                        }
                                        onChange={() => {
                                            if (!selLights) {
                                                setSelLights({ id: config.id, lights: [light] });
                                                return;
                                            }
                                            if (selLights.id !== config.id) return;
                                            if (selLights.lights.includes(light)) {
                                                setSelLights((cur) => {
                                                    if (!cur) return null;
                                                    if (cur?.lights.length > 1) {
                                                        return {
                                                            id: cur.id,
                                                            lights: cur.lights.filter((l) => l !== light),
                                                        };
                                                    } else return null;
                                                });
                                            } else {
                                                setSelLights({
                                                    id: selLights.id,
                                                    lights: [...selLights.lights, light],
                                                });
                                            }
                                        }}
                                        size="sm"
                                    >
                                        {light}
                                    </Chip>
                                ))}

                                {selLights && config.id === selLights.id ? (
                                    <ActionIcon
                                        onClick={() => {
                                            if (selLights) deleteConfigLights();
                                        }}
                                    >
                                        <TrashIcon className="w-5 text-red-600" />
                                    </ActionIcon>
                                ) : (
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
                                                        (val) => !configs.flatMap((val) => val.lights).includes(val)
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
                                                        setConfigs((cur) => {
                                                            if (!cur) return [];
                                                            return cur.map((conf) => {
                                                                if (conf.id !== config.id) return conf;
                                                                return {
                                                                    ...conf,
                                                                    lights: [
                                                                        ...conf.lights,
                                                                        selectedAddPin[config.id]!,
                                                                    ],
                                                                };
                                                            });
                                                        });
                                                        setOpenAddPins((cur) => cur.filter((id) => id !== config.id));
                                                    }}
                                                >
                                                    <CheckIcon
                                                        className={`w-5 ${
                                                            selectedAddPin[config.id] === null
                                                                ? "text-gray-400"
                                                                : "text-blue-600"
                                                        }`}
                                                    />
                                                </ActionIcon>
                                                <ActionIcon
                                                    disabled={selectedAddPin[config.id] === null}
                                                    onClick={() => {
                                                        setOpenAddPins((cur) => cur.filter((id) => id !== config.id));
                                                    }}
                                                >
                                                    <XIcon
                                                        className={`w-5 ${
                                                            selectedAddPin[config.id] === null
                                                                ? "text-gray-400"
                                                                : "text-blue-600"
                                                        }`}
                                                    />
                                                </ActionIcon>
                                            </div>
                                        </Popover.Dropdown>
                                    </Popover>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                <button
                    className="w-full bg-zinc-50 border border-zinc-400 rounded-lg py-3 px-7 flex items-center gap-2"
                    onClick={() => {
                        setConfigs((cur) => {
                            console.log("yo");
                            console.log(cur);
                            const newConfig = {
                                id: `b${selectedBoard}g${cur ? cur.length + 1 : 0}`,
                                givenName: `Group ${cur ? cur.length + 1 : 0}`,
                                lights: [],
                            };
                            return cur ? [...cur, newConfig] : [newConfig];
                        });
                    }}
                >
                    <PlusIcon className="w-4" />
                    <p className="text-sm">Add LightGroup</p>
                </button>
            </div>
        </ScrollArea>
    );
};

export default LightGroupConfig;
