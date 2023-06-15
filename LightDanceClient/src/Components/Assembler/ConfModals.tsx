import { Button, Modal, Radio, TextInput } from "@mantine/core";
import { useFragmentStore } from "../../Stores/Fragments";
import { open } from "@tauri-apps/api/dialog";
import { FolderAddIcon, PlusIcon } from "@heroicons/react/outline";
import { useState } from "react";
import { showNotification } from "@mantine/notifications";

interface RenameFolderModalProps {
    renameModalTarget: string | null;
    setRenameModalTarget: React.Dispatch<React.SetStateAction<string | null>>;
    name: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
}

const RenameFolderModal = ({ renameModalTarget, setRenameModalTarget, name, setName }: RenameFolderModalProps) => {
    const { fragFolders, renameFragFolder } = useFragmentStore((state) => ({
        fragFolders: state.folders,
        renameFragFolder: state.renameFragFolder,
    }));

    return (
        <Modal
            opened={renameModalTarget !== null}
            onClose={() => {
                setRenameModalTarget(null);
            }}
            centered
            title="Rename folder"
        >
            <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                label="Folder Name"
                placeholder="Custom Name"
            />
            <div className="w-full mt-4 flex justify-end">
                <Button
                    className="font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                    size="xs"
                    disabled={name === "" || fragFolders.some((folder) => folder.name === name)}
                    onClick={() => {
                        renameFragFolder(renameModalTarget!, name);
                        setRenameModalTarget(null);
                    }}
                >
                    Rename
                </Button>
            </div>
        </Modal>
    );
};

interface RenameFragModalProps {
    renameModalTarget: string | null;
    setRenameModalTarget: React.Dispatch<React.SetStateAction<string | null>>;
    name: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
}

const RenameFragModal = ({ renameModalTarget, setRenameModalTarget, name, setName }: RenameFragModalProps) => {
    const { fragments, renameFragment } = useFragmentStore((state) => ({
        fragments: state.fragments,
        renameFragment: state.renameFragment,
    }));

    return (
        <Modal
            opened={renameModalTarget !== null}
            onClose={() => {
                setRenameModalTarget(null);
            }}
            centered
            title="Rename folder"
        >
            <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                label="Fragment Name"
                placeholder="Custom Name"
            />
            <div className="w-full mt-4 flex justify-end">
                <Button
                    className="font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                    size="xs"
                    disabled={name === "" || fragments.some((frag) => frag.fragment.name === name)}
                    onClick={() => {
                        renameFragment(renameModalTarget!, name);
                        setRenameModalTarget(null);
                    }}
                >
                    Rename
                </Button>
            </div>
        </Modal>
    );
};

interface AddFragModalProps {
    addFolderModal: boolean;
    setAddFolderModal: React.Dispatch<React.SetStateAction<boolean>>;
    newFolderName: string;
    setNewFolderName: React.Dispatch<React.SetStateAction<string>>;
}

const AddFolderModal = ({ addFolderModal, setAddFolderModal, newFolderName, setNewFolderName }: AddFragModalProps) => {
    const { fragFolders, createFragFolder } = useFragmentStore((state) => ({
        fragFolders: state.folders,
        createFragFolder: state.createFragFolder,
    }));

    return (
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
    );
};

interface AddFragmentModalProps {
    addFragmentModal: boolean;
    setAddFragmentModal: React.Dispatch<React.SetStateAction<boolean>>;
    newFragmentData: {
        name: string;
        folder: string;
        file: string;
    };
    setNewFragmentData: React.Dispatch<
        React.SetStateAction<{
            name: string;
            folder: string;
            file: string;
        }>
    >;
}

const AddFragmentModal = ({
    addFragmentModal,
    setAddFragmentModal,
    newFragmentData,
    setNewFragmentData,
}: AddFragmentModalProps) => {
    const { fragByFolder, createFragment } = useFragmentStore((state) => ({
        fragByFolder: state.getFragmentByFolder(),
        createFragment: state.createFragment,
    }));

    const [creatingFrag, setCreatingFrag] = useState<boolean>(false);

    return (
        <Modal
            opened={addFragmentModal}
            onClose={() => {
                if (creatingFrag)
                    return showNotification({
                        title: "Fragment creation in progress",
                        message: "Please wait for the fragment to be created",
                    });
                setAddFragmentModal(false);
            }}
            centered
            title="Add Fragment"
        >
            <TextInput
                value={newFragmentData.name}
                onChange={(e) =>
                    setNewFragmentData((prev) => ({
                        ...prev,
                        name: e.target.value,
                    }))
                }
                label="Fragment Name"
                placeholder="Custom Name"
            />
            <div className="w-full mt-2">
                <p className="text-sm font-medium">Select File</p>
                <Button
                    variant="light"
                    color="gray"
                    className={`w-full rounded-lg border border-slate-300 font-normal ${
                        newFragmentData.file ? "text-blue-600" : ""
                    }`}
                    onClick={async () => {
                        const filePath = (await open({
                            multiple: false,
                            filters: [{ name: "Excel file", extensions: ["xlsx"] }],
                        })) as string | undefined;
                        if (!filePath) return;
                        setNewFragmentData((prev) => ({ ...prev, file: filePath }));
                    }}
                >
                    {newFragmentData.file
                        ? (() => {
                              let splitPath = newFragmentData.file.split("\\");
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
                        <div key={folKey} className="w-full py-1">
                            <Radio
                                label={folKey}
                                checked={newFragmentData.folder === folKey}
                                onChange={(e) => {
                                    if (!e.currentTarget.checked) return;
                                    setNewFragmentData((prev) => ({ ...prev, folder: folKey }));
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
                        newFragmentData.folder === "" ||
                        newFragmentData.name === "" ||
                        (() => {
                            const specifiedFolder = Object.keys(fragByFolder).find(
                                (val) => val === newFragmentData.folder
                            );
                            if (!specifiedFolder) return true;
                            return fragByFolder[newFragmentData.folder].some(
                                (val) => val.name === newFragmentData.folder
                            );
                        })()
                    }
                    loading={creatingFrag}
                    leftIcon={<PlusIcon className="w-4" />}
                    onClick={() => {
                        setCreatingFrag(true);
                        createFragment(newFragmentData.name, newFragmentData.file, newFragmentData.folder, [])
                            .then(() => {
                                setNewFragmentData({
                                    file: "",
                                    folder: "",
                                    name: "",
                                });
                                setCreatingFrag(false);
                                setAddFragmentModal(false);
                            })
                            .catch((e) => {
                                showNotification({
                                    title: "Fragment creation failed",
                                    message: `${e}`,
                                    color: "red",
                                    autoClose: 10000,
                                });
                                setNewFragmentData({
                                    file: "",
                                    folder: "",
                                    name: "",
                                });
                                setCreatingFrag(false);
                                setAddFragmentModal(false);
                            });
                    }}
                >
                    Add Fragment
                </Button>
            </div>
        </Modal>
    );
};

export { AddFolderModal, AddFragmentModal, RenameFolderModal, RenameFragModal };
