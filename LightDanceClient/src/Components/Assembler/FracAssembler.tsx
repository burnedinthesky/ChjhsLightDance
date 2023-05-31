import { Button, Modal, NumberInput, ScrollArea } from "@mantine/core";
import AsmFragBar from "./AsmFragBar";

import { PlusCircleIcon } from "@heroicons/react/solid";
import { useFragmentStore } from "../../Stores/Fragments";
import { useState } from "react";
import { PlusIcon } from "@heroicons/react/outline";

interface FracAssemblerProps {
    selectedFrag: string | null;
}

const FracAssembler = ({ selectedFrag }: FracAssemblerProps) => {
    const { createEmptyFragment, fragmentsByOrder, addFragmentOrder, getMaxFragOrder } = useFragmentStore((state) => ({
        createEmptyFragment: state.createEmptyFragment,
        fragmentsByOrder: state.getFragmentByOrder(),
        addFragmentOrder: state.addFragmentOrder,
        getMaxFragOrder: state.getMaxFragOrder,
    }));

    const [addEmptyFragModal, setAddEmptyFragModal] = useState<number | null>(null);
    const [newEmptyFragMin, setNewEmptyFragMin] = useState<number | "">(0);
    const [newEmptyFragSec, setNewEmptyFragSec] = useState<number | "">(0);

    return (
        <div className="w-full">
            <div className="w-full rounded-md bg-zinc-50 border border-slate-400 overflow-y-hidden">
                <ScrollArea h={window.innerHeight - 255}>
                    <div className="w-full flex flex-col">
                        <div className="px-6 py-2 flex items-center text-sm">
                            <p className="w-[69px]">Order</p>
                            <p>Name</p>
                            <div className="flex-grow" />
                            <p className="w-20 text-center">Duration</p>
                            <p className="w-[88px] text-center">Prv Len</p>
                            <p className="w-[40px] text-end px-2.5">X</p>
                        </div>
                        {fragmentsByOrder.map((frag, i) => (
                            <>
                                <button
                                    className={`w-full h-0.5 bg-slate-300 relative group cursor-pointer ${
                                        selectedFrag ? "hover:bg-blue-500" : "hover:bg-green-500"
                                    }`}
                                    onClick={() => {
                                        console.log("Cool thing");
                                        if (!selectedFrag) setAddEmptyFragModal(i);
                                        else addFragmentOrder(selectedFrag, i);
                                    }}
                                >
                                    <PlusCircleIcon
                                        className={`absolute w-6 -top-3 left-1/2 -translate-x-3 opacity-0 group-hover:opacity-100 ${
                                            selectedFrag ? "text-blue-600 " : "text-green-600"
                                        }`}
                                    />
                                </button>
                                <AsmFragBar
                                    key={frag.fragment.id}
                                    frag={frag}
                                    index={i}
                                    prevLength={fragmentsByOrder
                                        .flatMap((frag) => frag.fragment)
                                        .slice(0, i)
                                        .reduce((prev, cur) => prev + cur.length, 0)}
                                />
                            </>
                        ))}
                        <button
                            className={`w-full h-0.5 bg-slate-300 relative group cursor-pointer ${
                                selectedFrag ? "hover:bg-blue-500" : "hover:bg-green-500"
                            }`}
                            onClick={() => {
                                console.log("Cool thing");
                                if (!selectedFrag) setAddEmptyFragModal(getMaxFragOrder() + 1);
                                else {
                                    console.log("Inna here");
                                    addFragmentOrder(selectedFrag, getMaxFragOrder() + 1);
                                }
                            }}
                        >
                            <PlusCircleIcon
                                className={`absolute w-6 -top-3 left-1/2 -translate-x-3 opacity-0 group-hover:opacity-100 ${
                                    selectedFrag ? "text-blue-600 " : "text-green-600"
                                }`}
                            />
                        </button>
                    </div>
                </ScrollArea>
            </div>
            <Modal
                centered
                opened={addEmptyFragModal !== null}
                onClose={() => setAddEmptyFragModal(null)}
                title="Create new empty fragment"
            >
                <div className="flex  gap-3">
                    <NumberInput
                        className="w-1/2"
                        label="Minutes"
                        value={newEmptyFragMin}
                        onChange={setNewEmptyFragMin}
                        min={0}
                        max={10}
                    />
                    <NumberInput
                        className="w-1/2"
                        label="Seconds"
                        value={newEmptyFragSec}
                        onChange={setNewEmptyFragSec}
                        min={0}
                        max={10}
                    />
                </div>
                <div className="w-full flex justify-end mt-3">
                    <Button
                        className="font-jbmono font-normal bg-blue-500 hover:bg-blue-600 transition-colors duration-100"
                        size="xs"
                        disabled={
                            newEmptyFragMin === "" ||
                            newEmptyFragSec === "" ||
                            (newEmptyFragMin === 0 && newEmptyFragSec === 0)
                        }
                        leftIcon={<PlusIcon className="w-4" />}
                        onClick={() => {
                            createEmptyFragment((newEmptyFragMin as number) * 60 + (newEmptyFragSec as number), [
                                addEmptyFragModal!,
                            ]);
                            setAddEmptyFragModal(null);
                            setNewEmptyFragMin(0);
                            setNewEmptyFragSec(0);
                        }}
                    >
                        Add Empty Fragment
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default FracAssembler;
