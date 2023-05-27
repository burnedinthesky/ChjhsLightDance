import { Accordion, ActionIcon, Button, Modal, Radio, ScrollArea, TextInput } from "@mantine/core";
import { useState } from "react";
import { FragmentFolder } from "../../types/Frags";
import { ChevronDownIcon, FolderAddIcon, FolderOpenIcon, PlusIcon, PuzzleIcon, XIcon } from "@heroicons/react/outline";
import { invoke } from "@tauri-apps/api";
import { open } from "@tauri-apps/api/dialog";

const FracBrowser = () => {
    const [fragments, setFragments] = useState<FragmentFolder[]>([
        {
            name: "Test",
            fragments: [
                {
                    name: "Test",
                    filePath: "/",
                    length: 6,
                },
            ],
        },
    ]);

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
                        {fragments.map((fragFol, i) => (
                            <Accordion.Item key={i} value={i.toString()}>
                                <Accordion.Control>
                                    <div className="w-full flex justify-between items-center ">
                                        <h3 className="font-jbmono">{fragFol.name}</h3>
                                    </div>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <div className="flex flex-col w-full ">
                                        {fragFol.fragments.map((frag, j) => (
                                            <div
                                                key={`${i}-${j}`}
                                                className="w-full bg-slate-200 font-jbmono px-9 py-3 flex items-center justify-between"
                                            >
                                                <p className="text">{frag.name}</p>
                                                <div className="flex items-center gap-2">
                                                    <ActionIcon onClick={() => {}}>
                                                        <FolderOpenIcon className="w-6 text-blue-700" />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        onClick={() => {
                                                            // Remove current fragment
                                                            setFragments((cur) =>
                                                                cur.map((fol, k) =>
                                                                    k === i
                                                                        ? {
                                                                              ...fol,
                                                                              fragments: fol.fragments.filter(
                                                                                  (_, l) => l !== j
                                                                              ),
                                                                          }
                                                                        : fol
                                                                )
                                                            );
                                                        }}
                                                    >
                                                        <XIcon className="w-6 text-blue-700" />
                                                    </ActionIcon>
                                                </div>
                                            </div>
                                        ))}
                                        {fragFol.fragments.length === 0 && (
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
                        {fragments.map((fol) => (
                            <div className="w-full py-1">
                                <Radio
                                    label={fol.name}
                                    checked={newFragmentFolder === fol.name}
                                    onChange={(e) => {
                                        if (!e.currentTarget.checked) return;
                                        setNewFragmentFolder(fol.name);
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
                            fragments === undefined ||
                            newFragmentFolder === "" ||
                            newFragmentName === "" ||
                            (() => {
                                const specifiedFolder = fragments.find((val) => val.name === newFragmentFolder);
                                if (!specifiedFolder) return true;
                                return specifiedFolder.fragments.some((val) => val.name === newFragmentName);
                            })()
                        }
                        leftIcon={<PlusIcon className="w-4" />}
                        onClick={() => {
                            setFragments((cur) =>
                                cur.map((fol) =>
                                    fol.name === newFragmentFolder
                                        ? {
                                              ...fol,
                                              fragments: [
                                                  ...fol.fragments,
                                                  { name: newFragmentName, filePath: newFragmentFile, length: 1 },
                                              ],
                                          }
                                        : fol
                                )
                            );
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
                        disabled={newFolderName === "" || fragments.some((frag) => frag.name === newFolderName)}
                        leftIcon={<FolderAddIcon className="w-4" />}
                        onClick={() => {
                            setAddFolderModal(false);
                            setFragments((cur) => [
                                ...cur,
                                {
                                    name: newFolderName,
                                    fragments: [],
                                },
                            ]);
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
