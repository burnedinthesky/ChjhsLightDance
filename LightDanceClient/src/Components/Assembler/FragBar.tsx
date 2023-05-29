import { ActionIcon, Radio } from "@mantine/core";
import { FolderOpenIcon, XIcon } from "@heroicons/react/outline";
import { useFragmentStore } from "../../Stores/Fragments";
import { Fragment } from "../../types/Frags";

interface FragBarProps {
    frag: Fragment;
    selectedFrag: string | null;
    setSelectedFrag: React.Dispatch<React.SetStateAction<string | null>>;
}

const FragBar = ({ frag, selectedFrag, setSelectedFrag }: FragBarProps) => {
    const deleteFragment = useFragmentStore((state) => state.deleteFragment);

    return (
        <div className="w-full bg-slate-200 font-jbmono px-9 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Radio
                    checked={selectedFrag ? selectedFrag === frag.id : false}
                    onClick={(e) => {
                        if (!selectedFrag || selectedFrag !== frag.id) {
                            console.log(frag.id);
                            console.log(frag.name);
                            setSelectedFrag(frag.id);
                        } else setSelectedFrag(null);
                    }}
                />
                <p className="text">{frag.name}</p>
            </div>
            <div className="flex items-center gap-2">
                <ActionIcon onClick={() => {}}>
                    <FolderOpenIcon className="w-6 text-blue-700" />
                </ActionIcon>
                <ActionIcon
                    onClick={() => {
                        deleteFragment(frag.id);
                    }}
                >
                    <XIcon className="w-6 text-blue-700" />
                </ActionIcon>
            </div>
        </div>
    );
};

export default FragBar;
