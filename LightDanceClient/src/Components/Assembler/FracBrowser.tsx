import { useState } from "react";

import { Accordion, Button, Modal, Radio, ScrollArea, TextInput } from "@mantine/core";
import { FolderAddIcon, PlusIcon, PuzzleIcon } from "@heroicons/react/outline";
import FragBar from "./FragBar";

import { open } from "@tauri-apps/api/dialog";

import { useFragmentStore } from "../../Stores/Fragments";

interface FracBrowserProps {
    selectedFrag: string | null;
    setSelectedFrag: React.Dispatch<React.SetStateAction<string | null>>;
}

const FracBrowser = ({ selectedFrag, setSelectedFrag }: FracBrowserProps) => {
    const { fragByFolder, createFragment, fragFolders, createFragFolder } = useFragmentStore((state) => ({
        fragByFolder: state.getFragmentByFolder(),
        createFragment: state.createFragment,
        fragFolders: state.folders,
        createFragFolder: state.createFragFolder,
    }));

    const [addFolderModal, setAddFolderModal] = useState<boolean>(false);
    const [newFolderName, setNewFolderName] = useState<string>("");

    const [addFragmentModal, setAddFragmentModal] = useState<boolean>(false);
    const [newFragmentName, setNewFragmentName] = useState<string>("");
    const [newFragmentFolder, setNewFragmentFolder] = useState<string>("");
    const [newFragmentFile, setNewFragmentFile] = useState<string>("");

    return (
        <div className="w-full">
            <div className="w-full rounded-md bg-zinc-50 border border-slate-400 py-1">
                <ScrollArea h={window.innerHeight - 255}>
                    <Accordion
                        className="w-full"
                        classNames={{
                            item: "w-full border-b border-b-slate-400 font-jbmono",
                            control: "px-9 py-0 border-b border-b-slate-300",
                            content: "p-0 border-y border-y-slate-300",
                        }}
                        radius="md"
                    >
                        {Object.keys(fragByFolder).map((folKey, i) => (
                            <Accordion.Item key={i} value={i.toString()}>
                                <Accordion.Control>
                                    <div className="w-full flex justify-between items-center ">
                                        <h3 className="font-jbmono">{folKey}</h3>
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
                    leftIcon={<PuzzleIcon className="w-4" />}
                    onClick={() => {
                        setAddFragmentModal(true);
                        setNewFragmentFolder("");
                        setNewFragmentFile("");
                        setNewFragmentName("");
                    }}
                >
                    Add Fragment
                </Button>
            </div>
            <Modal
                opened={addFragmentModal}
                onClose={() => {
                    setAddFragmentModal(false);
                }}
                centered
                title="Add Fragment"
            >
                <TextInput
                    value={newFragmentName}
                    onChange={(e) => setNewFragmentName(e.target.value)}
                    label="Fragment Name"
                    placeholder="Custom Name"
                />
                <div className="w-full mt-2">
                    <p className="text-sm font-medium">Select File</p>
                    <Button
                        variant="light"
                        color="gray"
                        className={`w-full rounded-lg border border-slate-300 font-normal ${
                            newFragmentFile ? "text-blue-600" : ""
                        }`}
                        onClick={async () => {
                            const filePath = (await open({
                                multiple: false,
                                filters: [{ name: "Excel file", extensions: ["xlsx"] }],
                            })) as string | undefined;
                            if (!filePath) return;
                            console.log(filePath);
                            setNewFragmentFile(filePath);
                        }}
                    >
                        {newFragmentFile
                            ? (() => {
                                  let splitPath = newFragmentFile.split("\\");
                                  splitPath = [
                                      ...splitPath.slice(0, splitPath.length - 1),
                                      ...splitPath[splitPath.length - 1].split("/"),
                                  ];
                                  return splitPath[splitPath.length - 1];
                              })()
                            : "Select File"}
                    </Button>
                </div>
                <div className="w-full mt-2">
                    <p className="text-sm font-medium">Select Folder</p>
                    <div className="w-full flex flex-col p-4 rounded-lg border border-slate-300 ">
                        {Object.keys(fragByFolder).map((folKey) => (
                            <div className="w-full py-1">
                                <Radio
                                    label={folKey}
                                    checked={newFragmentFolder === folKey}
                                    onChange={(e) => {
                                        if (!e.currentTarget.checked) return;
                                        setNewFragmentFolder(folKey);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-full mt-4 flex justify-end">
                    <Button
                        className="font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                        size="xs"
                        disabled={
                            newFragmentFolder === "" ||
                            newFragmentName === "" ||
                            (() => {
                                const specifiedFolder = Object.keys(fragByFolder).find(
                                    (val) => val === newFragmentFolder
                                );
                                if (!specifiedFolder) return true;
                                return fragByFolder[newFragmentFolder].some((val) => val.name === newFragmentName);
                            })()
                        }
                        leftIcon={<PlusIcon className="w-4" />}
                        onClick={() => {
                            createFragment(newFragmentName, newFragmentFile, newFragmentFolder, null);
                            setNewFragmentFolder("");
                            setNewFragmentFile("");
                            setNewFragmentName("");
                            setAddFragmentModal(false);
                        }}
                    >
                        Add Fragment
                    </Button>
                </div>
            </Modal>
            <Modal
                opened={addFolderModal}
                onClose={() => {
                    setAddFolderModal(false);
                }}
                centered
                title="Add Folder"
            >
                <TextInput
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    label="Folder Name"
                    placeholder="Custom Name"
                />
                <div className="w-full mt-4 flex justify-end">
                    <Button
                        className="font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                        size="xs"
                        disabled={newFolderName === "" || fragFolders.some((frag) => frag.name === newFolderName)}
                        leftIcon={<FolderAddIcon className="w-4" />}
                        onClick={() => {
                            setAddFolderModal(false);
                            createFragFolder(newFolderName);
                            setNewFolderName("");
                        }}
                    >
                        Add Folder
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default FracBrowser;
