import { useState } from "react";
import { Button } from "@mantine/core";
import { open } from "@tauri-apps/api/dialog";

const ShowConfigurator = () => {
    const [showConfig, setShowConfig] = useState<string | null>(null);
    const [audioFile, setAudioFile] = useState<string | null>(null);

    return (
        <div className="w-full h-40 py-2">
            <div className="flex justify-between items-center font-jbmono my-3">
                <p>Lighting Configuration: {showConfig ? showConfig : "Not selected"}</p>
                <Button
                    className="font-jbmono bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                    size="xs"
                    onClick={async () => {
                        const filePath = (await open({
                            multiple: false,
                            filters: [{ name: "Json file", extensions: ["json"] }],
                        })) as string;

                        if (!filePath) return;
                        let splitPath = filePath.split("\\");
                        splitPath = [
                            ...splitPath.slice(0, splitPath.length - 1),
                            ...splitPath[splitPath.length - 1].split("/"),
                        ];
                        setShowConfig(splitPath[splitPath.length - 1]);
                    }}
                >
                    Select
                </Button>
            </div>
            <div className="flex justify-between items-center font-jbmono my-3">
                <p>Audio: {audioFile ? audioFile : "Not selected"}</p>
                <Button
                    className="font-jbmono bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                    size="xs"
                    onClick={async () => {
                        const filePath = (await open({
                            multiple: false,
                            filters: [{ name: "Audio", extensions: ["mp3", "wav"] }],
                        })) as string;

                        if (!filePath) return;
                        let splitPath = filePath.split("\\");
                        splitPath = [
                            ...splitPath.slice(0, splitPath.length - 1),
                            ...splitPath[splitPath.length - 1].split("/"),
                        ];
                        setAudioFile(splitPath[splitPath.length - 1]);
                    }}
                >
                    Select
                </Button>
            </div>
            <hr className="w-full border border-slate-400" />
            <div className="flex justify-between items-center font-jbmono my-3">
                <p>Actions</p>
                <div className="flex gap-4 items-center">
                    <Button
                        className="w-[73px] font-jbmono bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                        size="xs"
                    >
                        Flash
                    </Button>
                    <Button
                        className="w-[73px] font-jbmono bg-emerald-500 hover:bg-emerald-600 transition-colors duration-100"
                        size="xs"
                    >
                        Start
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ShowConfigurator;
