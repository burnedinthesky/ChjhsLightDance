import { useEffect, useState } from "react";
import { Accordion, ActionIcon, Button, Modal, ScrollArea, TextInput } from "@mantine/core";
import { BoardData, BoardStatus } from "../../types/Boards";
import { useBoardStore } from "../../Stores/Boards";
import { PencilAltIcon } from "@heroicons/react/outline";
import { set } from "zod";

const ParseStatusToString = (status: BoardStatus) => {
    switch (status) {
        case "connected":
            return "Connected";
        case "processing":
            return "Processing data";
        case "disconnected":
            return "Disconnected";
        case "inshow":
            return "In show";
        default:
            return "Unknown";
    }
};

const ParseStatusToColor = (status: BoardStatus) => {
    switch (status) {
        case "disconnected":
            return "bg-gray-300";
        case "connected":
            return "bg-green-300";
        case "processing":
            return "bg-yellow-300";
        case "inshow":
            return "bg-blue-300";
        default:
            return "bg-red-300";
    }
};

interface BoardAccordionProps {
    focused: string | null;
    setFocused: (id: string | null) => void;
}

const BoardAccordion = ({ focused, setFocused }: BoardAccordionProps) => {
    const { boards, renameBoard } = useBoardStore((state) => ({
        boards: state.boards,
        renameBoard: state.renameBoard,
    }));

    const [renameBoardTarget, setRenameBoardTarget] = useState<string | null>(null);
    const [newBoardName, setNewBoardName] = useState<string>("");

    return (
        <>
            <ScrollArea.Autosize mah={window.innerHeight - 500}>
                <div className="flex items-center">
                    <Accordion
                        className="w-full"
                        classNames={{ item: "w-full font-jbmono" }}
                        radius="md"
                        value={focused}
                        onChange={setFocused}
                    >
                        {boards.map((board) => (
                            <Accordion.Item key={board.id} value={board.id}>
                                <Accordion.Control>
                                    <div className="w-full flex justify-between items-center">
                                        <div className="flex gap-2 items-center">
                                            <h3 className="font-jbmono">{board.name}</h3>
                                            <ActionIcon
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNewBoardName("");
                                                    setRenameBoardTarget(board.id);
                                                }}
                                            >
                                                <PencilAltIcon className="w-4 text-blue-800" />
                                            </ActionIcon>
                                        </div>
                                        <div
                                            className={`w-5 h-5 rounded-full transition-colors duration-500 ${ParseStatusToColor(
                                                board.status
                                            )}`}
                                        />
                                    </div>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <div className="grid grid-cols-2 gap-y-1 font-jbmono px-1">
                                        <p>Status: {ParseStatusToString(board.status)}</p>
                                        <p>Assigned Num: {board.assignedNum}</p>
                                        <p>Mac Address: {board.id}</p>
                                        <p>Lighting Groups: {board.lightGroups.length}</p>
                                        <p>IP: {board.ip}</p>
                                    </div>
                                </Accordion.Panel>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </div>
            </ScrollArea.Autosize>
            <Modal
                opened={renameBoardTarget !== null}
                onClose={() => {
                    setRenameBoardTarget(null);
                }}
                title="Rename Board"
                centered
            >
                <TextInput
                    label="New Board Name"
                    placeholder="Custom Name"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.currentTarget.value)}
                />
                <div className="w-full mt-4 flex justify-end ">
                    <Button
                        className="font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                        size="xs"
                        disabled={newBoardName === "" || boards.some((board) => board.name === newBoardName)}
                        onClick={() => {
                            renameBoard(renameBoardTarget!, newBoardName!);
                            setNewBoardName("");
                            setRenameBoardTarget(null);
                        }}
                    >
                        Rename
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default BoardAccordion;
