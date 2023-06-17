import { useState } from "react";
import { Accordion, ActionIcon, Button, Modal, Popover, ScrollArea, TextInput } from "@mantine/core";
import { PencilAltIcon, TrashIcon } from "@heroicons/react/outline";
import { useBoardStore } from "../../Stores/Boards";
import { sendWSMessage } from "../../lib/wsPortal";
import { BoardStatus } from "../../types/Boards";

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

function Capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

interface BoardAccordionProps {
    focused: string | null;
    setFocused: (id: string | null) => void;
}

const BoardAccordion = ({ focused, setFocused }: BoardAccordionProps) => {
    const { boards, renameBoard, deleteBoard } = useBoardStore((state) => ({
        boards: state.boards,
        renameBoard: state.renameBoard,
        deleteBoard: state.deleteBoard,
    }));

    const [renameBoardTarget, setRenameBoardTarget] = useState<string | null>(null);
    const [newBoardName, setNewBoardName] = useState<string>("");

    return (
        <>
            <ScrollArea h={window.innerHeight - 564}>
                <div className="flex items-center">
                    <Accordion
                        className="w-full"
                        classNames={{ item: "w-full font-jbmono" }}
                        radius="md"
                        value={focused}
                        onChange={setFocused}
                    >
                        {boards.length === 0 && (
                            <div
                                style={{ height: window.innerHeight - 564 }}
                                className="w-full flex justify-center items-center"
                            >
                                <p className="text-gray-800 font-jbmono">No boards connected</p>
                            </div>
                        )}
                        {boards.map((board) => (
                            <Accordion.Item key={board.id} value={board.id}>
                                <Accordion.Control>
                                    <div className="w-full flex justify-between items-center">
                                        <div className="flex items-center">
                                            <h3 className="font-jbmono mr-2">{board.name}</h3>
                                            <ActionIcon
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setNewBoardName("");
                                                    setRenameBoardTarget(board.id);
                                                }}
                                            >
                                                <PencilAltIcon className="w-4 text-blue-800" />
                                            </ActionIcon>
                                            <Popover
                                                classNames={{
                                                    dropdown: "w-20",
                                                }}
                                            >
                                                <Popover.Target>
                                                    <ActionIcon
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        <TrashIcon className="w-4 text-blue-800" />
                                                    </ActionIcon>
                                                </Popover.Target>
                                                <Popover.Dropdown>
                                                    <div className="w-56">
                                                        <p className="font-jbmono text-sm">
                                                            Are you sure you want to delete this board?
                                                        </p>
                                                        <div className="w-full justify-end flex mt-4">
                                                            <Button
                                                                className="font-jbmono font-normal bg-red-500 hover:bg-red-600 transition-colors duration-100"
                                                                size="xs"
                                                                onClick={() => {
                                                                    deleteBoard(board.id);
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Popover.Dropdown>
                                            </Popover>
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
                                        {board.status !== "disconnected" && (
                                            <>
                                                <p>IP: {board.ip}</p>
                                                <div className="flex items-center flex-wrap">
                                                    <p>Calibration: {Capitalize(board.calibrationStat)}</p>
                                                    {board.calibrationStat !== "calibrating" && (
                                                        <ActionIcon
                                                            className="w-auto justify-start p-0"
                                                            onClick={() => {
                                                                sendWSMessage("calibrate", board.id);
                                                            }}
                                                        >
                                                            <p className="underline underline-offset-2 text-left font-jbmono text-black ml-2">
                                                                {board.calibrationStat === "calibrated"
                                                                    ? "Recalibrate"
                                                                    : "Calibrate"}
                                                            </p>
                                                        </ActionIcon>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </Accordion.Panel>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </div>
            </ScrollArea>

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
