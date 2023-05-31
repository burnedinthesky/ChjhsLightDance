import { useEffect, useState } from "react";

import { Accordion, ActionIcon, Button, Modal, ScrollArea } from "@mantine/core";
import { ChevronDownIcon, FolderAddIcon, PencilAltIcon, PuzzleIcon, TrashIcon } from "@heroicons/react/outline";
import FragBar from "./FragBar";

import { useFragmentStore } from "../../Stores/Fragments";
import { AddFolderModal, AddFragmentModal, RenameFolderModal } from "./ConfModals";

interface FracBrowserProps {
    selectedFrag: string | null;
    setSelectedFrag: React.Dispatch<React.SetStateAction<string | null>>;
}

const FracBrowser = ({ selectedFrag, setSelectedFrag }: FracBrowserProps) => {
    const { loadFromLocalStorage, fragByFolder, fragFolders, deleteFragFolder } = useFragmentStore((state) => ({
        fragByFolder: state.getFragmentByFolder(),
        fragFolders: state.folders,
        deleteFragFolder: state.deleteFragFolder,
        loadFromLocalStorage: state.loadFromLocalStorage,
    }));

    const [addFolderModal, setAddFolderModal] = useState<boolean>(false);
    const [newFolderName, setNewFolderName] = useState<string>("");

    const [addFragmentModal, setAddFragmentModal] = useState<boolean>(false);
    const [newFragmentData, setNewFragmentData] = useState<{
        name: string;
        folder: string;
        file: string;
    }>({ name: "", folder: "", file: "" });

    const [deleteFolderModal, setDeleteFolderModal] = useState<string | null>(null);

    const [renameModalTarget, setRenameModalTarget] = useState<string | null>(null);
    const [renameModalName, setRenameModalName] = useState<string>("");

    useEffect(() => {
        loadFromLocalStorage();
    }, []);

    return (
        <div className="w-full">
            <div className="w-full rounded-md bg-zinc-50 border border-slate-400 py-1">
                <ScrollArea h={window.innerHeight - 255}>
                    <Accordion
                        className="w-full"
                        classNames={{
                            item: "w-full border-b border-b-slate-400 font-jbmono",
                            control: "px-9 py-0 border-b border-b-slate-300 gap-0",
                            content: "p-0 border-y border-y-slate-300",
                            chevron: "mr-[1px] ml-0",
                        }}
                        radius="md"
                        chevron={<ChevronDownIcon className="w-5" />}
                    >
                        {Object.keys(fragByFolder).map((folKey, i) => (
                            <Accordion.Item key={i} value={i.toString()}>
                                <Accordion.Control>
                                    <div className="w-full flex justify-between items-center">
                                        <div className="flex gap-2 items-center">
                                            <h3 className="font-jbmono">{folKey}</h3>
                                            <ActionIcon
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setRenameModalName("");
                                                    setRenameModalTarget(folKey);
                                                }}
                                            >
                                                <PencilAltIcon className="w-4 text-blue-700" />
                                            </ActionIcon>
                                        </div>
                                        <ActionIcon
                                            className="mr-2.5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteFolderModal(folKey);
                                            }}
                                        >
                                            <TrashIcon className="w-6 text-blue-600" />
                                        </ActionIcon>
                                    </div>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <div className="flex flex-col w-full ">
                                        {fragByFolder[folKey].map((frag, j) => (
                                            <FragBar
                                                key={`${i}-${j}`}
                                                frag={frag}
                                                selectedFrag={selectedFrag}
                                                setSelectedFrag={setSelectedFrag}
                                            />
                                        ))}
                                        {fragByFolder[folKey].length === 0 && (
                                            <div className="w-full bg-slate-200 font-jbmono px-9 py-3 flex items-center justify-between">
                                                <p>No fragments are currently in this folder</p>
                                            </div>
                                        )}
                                    </div>
                                </Accordion.Panel>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </ScrollArea>
            </div>
            <div className="w-full mt-4 flex gap-2">
                <Button
                    className="font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                    size="xs"
                    leftIcon={<FolderAddIcon className="w-4" />}
                    onClick={() => {
                        setAddFolderModal(true);
                    }}
                >
                    Add Folder
                </Button>
                <Button
                    className="font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                    size="xs"
                    disabled={Object.keys(fragFolders).length === 0}
                    leftIcon={<PuzzleIcon className="w-4" />}
                    onClick={() => {
                        setAddFragmentModal(true);
                        setNewFragmentData({
                            name: "",
                            folder: "",
                            file: "",
                        });
                    }}
                >
                    Add Fragment
                </Button>
            </div>

            <AddFolderModal
                addFolderModal={addFolderModal}
                newFolderName={newFolderName}
                setAddFolderModal={setAddFolderModal}
                setNewFolderName={setNewFolderName}
            />

            <AddFragmentModal
                addFragmentModal={addFragmentModal}
                setAddFragmentModal={setAddFragmentModal}
                newFragmentData={newFragmentData}
                setNewFragmentData={setNewFragmentData}
            />

            <RenameFolderModal
                name={renameModalName}
                setName={setRenameModalName}
                renameModalTarget={renameModalTarget}
                setRenameModalTarget={setRenameModalTarget}
            />

            <Modal
                opened={deleteFolderModal !== null}
                onClose={() => {
                    setDeleteFolderModal(null);
                }}
                title="Delete Folder"
                centered
            >
                <p className="text-sm">
                    Are you sure you want to delete "{deleteFolderModal}"? This will delete all fragments in it!
                </p>
                <div className="mt-4 w-full flex justify-end gap-2 items-center">
                    <Button
                        className="font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                        size="xs"
                        onClick={() => setDeleteFolderModal(null)}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="font-jbmono font-normal bg-red-500 hover:bg-red-600 transition-colors duration-100"
                        size="xs"
                        onClick={() => {
                            deleteFragFolder(deleteFolderModal!);
                            setDeleteFolderModal(null);
                        }}
                    >
                        Delete
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default FracBrowser;
