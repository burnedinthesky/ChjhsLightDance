import { HashtagIcon, PlusIcon } from "@heroicons/react/outline";
import { ActionIcon, Button, Modal, TextInput } from "@mantine/core";
import { useState } from "react";
import { useBoardStore } from "../../Stores/Boards";
import { sendWSMessage } from "../../lib/wsPortal";
import ConfigBoardNumModal from "./ConfigBoardNumModal";

const maxAddrRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

const CreateBoard = () => {
    const { boards } = useBoardStore((state) => ({ boards: state.boards }));
    const [boardName, setBoardName] = useState<string>("");
    const [boardAddr, setBoardAddr] = useState<string>("");

    const [openAddBoardModal, setOpenAddBoardModal] = useState<boolean>(false);
    const [openConfNumModal, setOpenConfNumModal] = useState<boolean>(false);

    const { addBoard } = useBoardStore((state) => ({
        addBoard: state.addBoard,
    }));

    return (
        <>
            <div className="w-full flex items-center gap-3">
                <ActionIcon
                    className="flex-grow h-auto"
                    onClick={() => {
                        setOpenAddBoardModal(true);
                        setBoardName("");
                        setBoardAddr("");
                    }}
                >
                    <div className="w-full bg-zinc-50 border font-jbmono text-zinc-800 border-zinc-400 rounded-lg flex gap-3 px-5 h-12 items-center">
                        <PlusIcon className="w-5" /> <p>Add Board</p>
                    </div>
                </ActionIcon>

                {boards.length > 0 && (
                    <ActionIcon
                        className="w-1/2 h-auto flex-shrink-0"
                        onClick={() => {
                            setOpenConfNumModal(true);
                        }}
                    >
                        <div className="w-full bg-zinc-50 border font-jbmono text-zinc-800 border-zinc-400 rounded-lg flex gap-3 px-5 h-12 items-center">
                            <HashtagIcon className="w-5" /> <p>Configure Assigned Num</p>
                        </div>
                    </ActionIcon>
                )}
            </div>
            <Modal
                opened={openAddBoardModal}
                onClose={() => [setOpenAddBoardModal(false)]}
                centered
                title="Allow New Board Connection"
            >
                <div className="flex flex-col gap-2">
                    <TextInput
                        label="Board Name"
                        value={boardName}
                        onChange={(e) => setBoardName(e.currentTarget.value)}
                    />
                    <TextInput
                        label="Board Mac Address"
                        value={boardAddr}
                        onChange={(e) => setBoardAddr(e.currentTarget.value)}
                    />
                </div>
                <div className="mt-4 w-full flex justify-end gap-2">
                    <Button
                        className="font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                        size="xs"
                        disabled={
                            boardName === "" ||
                            boards.some((brd) => brd.name === boardName) ||
                            !maxAddrRegex.test(boardAddr) ||
                            boards.some((brd) => brd.id === boardAddr.replaceAll(":", ""))
                        }
                        leftIcon={<PlusIcon className="w-4" />}
                        onClick={() => {
                            addBoard(boardAddr, null, boardName);
                            setOpenAddBoardModal(false);
                            sendWSMessage("refresh", "rpi");
                        }}
                    >
                        Add Board
                    </Button>
                </div>
            </Modal>
            <ConfigBoardNumModal open={openConfNumModal} setOpen={setOpenConfNumModal} />
        </>
    );
};

export default CreateBoard;
