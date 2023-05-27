import { useEffect, useState } from "react";
import { Accordion, ScrollArea } from "@mantine/core";
import { BoardData, BoardStatus } from "../../types/Boards";

const ParseStatusToString = (status: BoardStatus) => {
    switch (status) {
        case "connected":
            return "Connected";
        case "processing":
            return "Processing data";
        default:
            return "Unknown";
    }
};

const ParseStatusToColor = (status: BoardStatus) => {
    switch (status) {
        case "connected":
            return "bg-green-300";
        case "processing":
            return "bg-yellow-300";
        default:
            return "bg-gray-300";
    }
};

interface BoardAccordionProps {
    focused: string | null;
    setFocused: (id: string | null) => void;
    boards: BoardData[];
    setBoards: (boards: BoardData[]) => void;
}

const BoardAccordion = ({ focused, setFocused, boards, setBoards }: BoardAccordionProps) => {
    return (
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
                                    <h3 className="font-jbmono">{board.name}</h3>
                                    <div className={`w-5 h-5 rounded-full ${ParseStatusToColor(board.status)}`} />
                                </div>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <div className="grid grid-cols-2 gap-y-1 font-jbmono px-1">
                                    <p>Status: {ParseStatusToString(board.status)}</p>
                                    <p>Assigned ID: {board.assisgnedId}</p>
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
    );
};

export default BoardAccordion;
