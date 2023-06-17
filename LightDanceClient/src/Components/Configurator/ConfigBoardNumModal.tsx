import { Button, Modal, NumberInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useBoardStore } from "../../Stores/Boards";
import { PlusIcon } from "@heroicons/react/outline";
import { showNotification } from "@mantine/notifications";

interface ConfigBoardNumModalProps {
    open: boolean;
    setOpen: (open: boolean) => void;
}

const ConfigBoardNumModal = ({ open, setOpen }: ConfigBoardNumModalProps) => {
    const [boards, setBoards] = useState<{ id: string; name: string; num: number }[]>([]);
    const { storeBoards, setBoardOrder } = useBoardStore((state) => ({
        storeBoards: state.boards,
        setBoardOrder: state.setBoardOrder,
    }));

    useEffect(() => {
        setBoards([]);
    }, [open]);

    useEffect(() => {
        storeBoards.forEach((brd) => {
            if (boards.find((localBrd) => localBrd.id == brd.id)) return;
            setBoards((cur) => [
                ...cur,
                {
                    id: brd.id,
                    name: brd.name,
                    num: brd.assignedNum,
                },
            ]);
        });
    }, [boards]);

    return (
        <Modal
            opened={open}
            onClose={() => {
                setOpen(false);
            }}
            centered
            title="Configure Board Assigned Numbers"
        >
            <p className="mb-4 text-sm">
                Numbers will automatically be reduced if a gap greater than one is found (e.g., [1,2,4,6] will become
                [1,2,3,4])
            </p>
            <div className="flex flex-col gap-2">
                {boards.map((brd) => (
                    <div key={brd.id} className="flex gap-2">
                        <p className="w-1/2">{brd.name}</p>
                        <NumberInput
                            value={brd.num}
                            onChange={(e) => {
                                setBoards((cur) => {
                                    const value = typeof e === "string" ? 0 : e;
                                    return cur.map((board) => ({
                                        ...board,
                                        num: board.id === brd.id ? value : board.num,
                                    }));
                                });
                            }}
                            error={
                                brd.num <= 0 ||
                                boards.reduce((acc, iterBoard) => acc + (iterBoard.num === brd.num ? 1 : 0), 0) > 1
                            }
                        />
                    </div>
                ))}
            </div>
            <div className="flex mt-4 w-full justify-end">
                <Button
                    className="font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                    size="xs"
                    onClick={() => {
                        const idNumPair: Record<string, number> = {};
                        boards.forEach((brd) => {
                            idNumPair[brd.id] = brd.num;
                        });
                        try {
                            setBoardOrder(idNumPair);
                            console.log("Success");
                        } catch (e) {
                            const error: string = e instanceof Error ? e.message : (e as string);
                            showNotification({
                                title: "Error While Updating Order",
                                message: error,
                                color: "red",
                            });
                        }

                        setOpen(false);
                    }}
                    disabled={boards.some(
                        (brd) =>
                            brd.num <= 0 ||
                            boards.reduce((acc, iterBoard) => acc + (iterBoard.num === brd.num ? 1 : 0), 0) > 1
                    )}
                >
                    Apply
                </Button>
            </div>
        </Modal>
    );
};

export default ConfigBoardNumModal;
