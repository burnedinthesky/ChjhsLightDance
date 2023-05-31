import { useEffect, useState } from "react";
import { Button, Popover } from "@mantine/core";
import { open } from "@tauri-apps/api/dialog";

import { exists, readTextFile, writeTextFile, BaseDirectory } from "@tauri-apps/api/fs";

import { appDataDir, join } from "@tauri-apps/api/path";
import { useBoardStore } from "../../Stores/Boards";

interface ShowConfiguratorProps {
    startShow: () => void;
}

const ShowConfigurator = ({ startShow }: ShowConfiguratorProps) => {
    const [showConfigState, setShowConfigState] = useState<"Up to date" | "Outdated" | "Not compiled" | null>(null);
    const { audioFile, setAudioFile, deleteAudioFile, editSinceLastFlash, resetEditSinceLastFlash } = useBoardStore(
        (state) => ({
            audioFile: state.audioFile,
            setAudioFile: state.setAudio,
            deleteAudioFile: state.deleteAudio,
            editSinceLastFlash: state.editSinceLastFlash,
            resetEditSinceLastFlash: state.resetEditSinceLastFlash,
        })
    );

    useEffect(() => {
        (async () => {
            if (!(await exists(await join(await appDataDir(), "compiled_dance.json")))) {
                setShowConfigState("Not compiled");
                return;
            }
            const compiledDance = JSON.parse(await readTextFile("compiled_dance.json", { dir: BaseDirectory.AppData }));
            const sourceDance = JSON.parse(await readTextFile("fragments.json", { dir: BaseDirectory.AppData }));
            if (compiledDance.uuid !== sourceDance.uuid) setShowConfigState("Outdated");
            else setShowConfigState("Up to date");
        })();
    }, []);

    return (
        <div className="w-full py-2">
            <div className="flex justify-between items-center font-jbmono my-3">
                <p>Lighting Configuration: {showConfigState ? showConfigState : "Loading"}</p>
                {showConfigState !== "Up to date" && (
                    <Button
                        className="font-jbmono bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                        size="xs"
                        onClick={async () => {
                            const data = {
                                uuid: JSON.parse(await readTextFile("fragments.json", { dir: BaseDirectory.AppData }))
                                    .uuid,
                            };
                            await writeTextFile("compiled_dance.json", JSON.stringify(data), {
                                dir: BaseDirectory.AppData,
                            });
                            setShowConfigState("Up to date");
                        }}
                    >
                        Compile
                    </Button>
                )}
            </div>
            <div className="flex justify-between items-center font-jbmono my-3">
                <p>Audio: {audioFile ? audioFile : "Not selected"}</p>
                <div className="flex items-center gap-4">
                    {audioFile && (
                        <Button
                            className="font-jbmono bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                            size="xs"
                            onClick={async () => {
                                deleteAudioFile();
                            }}
                        >
                            Remove
                        </Button>
                    )}

                    <Button
                        className="font-jbmono bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                        size="xs"
                        onClick={async () => {
                            const filePath = (await open({
                                multiple: false,
                                filters: [{ name: "Audio", extensions: ["mp3"] }],
                            })) as string;

                            if (!filePath) return;

                            setAudioFile(filePath);
                        }}
                    >
                        Select
                    </Button>
                </div>
            </div>
            <hr className="w-full border border-slate-400" />
            <div className="flex justify-between items-center font-jbmono my-3">
                <p>Actions</p>
                <div className="flex gap-4 items-center">
                    <Button
                        className="w-[73px] font-jbmono bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                        size="xs"
                        onClick={() => {
                            resetEditSinceLastFlash();
                        }}
                    >
                        Flash
                    </Button>
                    <Popover
                        width={300}
                        position="bottom"
                        withArrow
                        shadow="md"
                        classNames={{ dropdown: "font-jbmono text-sm" }}
                    >
                        <Popover.Target>
                            <Button
                                className="w-[73px] font-jbmono bg-emerald-500 hover:bg-emerald-600 transition-colors duration-100"
                                size="xs"
                                disabled={!audioFile || editSinceLastFlash}
                            >
                                Start
                            </Button>
                        </Popover.Target>
                        <Popover.Dropdown>
                            <p>Are you sure you want to start the performance?</p>
                            {showConfigState !== "Up to date" && (
                                <p className="mt-3 text-red-500">
                                    Warning: The latest dance lighting has not been compiled
                                </p>
                            )}
                            <div className="mt-3 w-full flex justify-end">
                                <Button
                                    className="w-[73px] font-jbmono bg-emerald-500 hover:bg-emerald-600 transition-colors duration-100"
                                    size="xs"
                                    onClick={startShow}
                                >
                                    Start
                                </Button>
                            </div>
                        </Popover.Dropdown>
                    </Popover>
                </div>
            </div>
        </div>
    );
};

export default ShowConfigurator;
