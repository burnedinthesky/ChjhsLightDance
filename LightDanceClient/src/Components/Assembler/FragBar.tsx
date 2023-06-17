import { useState } from "react";

import { ActionIcon, Radio } from "@mantine/core";
import { FolderOpenIcon, PencilAltIcon, RefreshIcon, XIcon } from "@heroicons/react/outline";
import { RenameFragModal } from "./ConfModals";

import { useFragmentStore } from "../../Stores/Fragments";
import { invoke } from "@tauri-apps/api/tauri";
import { appDataDir, join } from "@tauri-apps/api/path";
import { showNotification } from "@mantine/notifications";

import { Fragment } from "../../types/Frags";

interface FragBarProps {
    frag: Fragment;
    selectedFrag: string | null;
    setSelectedFrag: React.Dispatch<React.SetStateAction<string | null>>;
}

const FragBar = ({ frag, selectedFrag, setSelectedFrag }: FragBarProps) => {
    const { deleteFragment, reindexFragment } = useFragmentStore((state) => ({
        deleteFragment: state.deleteFragment,
        reindexFragment: state.reindexFragment,
    }));

    const [renameModalTarget, setRenameModalTarget] = useState<string | null>(null);
    const [renameModalName, setRenameModalName] = useState<string>("");
    const [reindexingFrag, setReindexingFrag] = useState<boolean>(false);

    return (
        <div className="w-full bg-slate-200 font-jbmono px-9 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Radio
                    checked={selectedFrag ? selectedFrag === frag.id : false}
                    onClick={(e) => {
                        if (!selectedFrag || selectedFrag !== frag.id) {
                            console.log(frag.id);
                            console.log(frag.name);
                            setSelectedFrag(frag.id);
                        } else setSelectedFrag(null);
                    }}
                />
                <p className="text">{frag.name}</p>
                <ActionIcon
                    onClick={(e) => {
                        e.stopPropagation();
                        setRenameModalName("");
                        setRenameModalTarget(frag.id);
                    }}
                >
                    <PencilAltIcon className="w-4 text-blue-700" />
                </ActionIcon>
            </div>
            <div className="flex items-center gap-2">
                <ActionIcon
                    disabled={reindexingFrag}
                    onClick={() => {
                        setReindexingFrag(true);
                        reindexFragment(frag.id)
                            .catch((err) =>
                                showNotification({
                                    title: "Error while reindexing fragments",
                                    message: `${err}`,
                                    color: "red",
                                })
                            )
                            .finally(() => setReindexingFrag(false));
                    }}
                >
                    <RefreshIcon className={`w-6 text-blue-700 ${reindexingFrag ? "animate-spin" : ""}`} />
                </ActionIcon>
                <ActionIcon
                    onClick={async () => {
                        invoke("open_file_browser", {
                            path: await join(await appDataDir(), "frag_excels"),
                        }).catch((err) =>
                            showNotification({ title: "Error while opening file browser", message: err, color: "red" })
                        );
                        showNotification({
                            title: "File Browser Opened",
                            message: `Look for file frag-${frag.id}.xlsx in the opened file browser.`,
                            autoClose: false,
                        });
                    }}
                >
                    <FolderOpenIcon className="w-6 text-blue-700" />
                </ActionIcon>
                <ActionIcon
                    onClick={async () => {
                        await deleteFragment(frag.id).catch((err) =>
                            showNotification({
                                title: "Error while deleting fragment",
                                message: err,
                                color: "red",
                            })
                        );
                    }}
                >
                    <XIcon className="w-6 text-blue-700" />
                </ActionIcon>
            </div>
            <RenameFragModal
                name={renameModalName}
                setName={setRenameModalName}
                renameModalTarget={renameModalTarget}
                setRenameModalTarget={setRenameModalTarget}
            />
        </div>
    );
};

export default FragBar;
