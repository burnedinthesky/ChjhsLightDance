import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { Fragment, FragmentFolder, UIFragment } from "../types/Frags";

export const useFragmentStore = create<{
    fragments: UIFragment[];
    folders: FragmentFolder[];
    createFragment(fragName: string, fragPath: string, folder: string, order: number | null): void;
    createEmptyFragment(duration: number, order: number): void;
    deleteFragment(fragID: string): void;
    setFragmentOrder(fragID: string, order: number): void;
    swapFragmentOrder(order1: number, order2: number): void;
    getFragmentByFolder(): Record<string, Fragment[]>;
    getFragmentByOrder(): UIFragment[];
    createFragFolder(folderName: string): void;
    getMaxFragOrder(): number;
}>((set, get) => ({
    fragments: [],
    folders: [],
    createFragment(fragName: string, fragPath: string, folder: string, order: number | null) {
        if (!get().folders.find((f) => f.name === folder)) throw new Error("Folder not found");
        const newFragment: UIFragment = {
            fragment: {
                id: uuidv4(),
                name: fragName,
                filePath: fragPath,
                length: 0,
            },
            folder: get().folders.find((f) => f.name === folder) as FragmentFolder,
            order: null,
            empty: false,
        };
        set((state) => ({
            ...state,
            fragments: [...state.fragments, newFragment],
        }));
        console.log(get().fragments);
        if (order !== null) {
            get().setFragmentOrder(newFragment.fragment.id, order);
        }
    },
    createEmptyFragment(duration: number, order: number) {
        const newEmptyFragment: UIFragment = {
            fragment: {
                id: `empty-${uuidv4()}`,
                name: "Empty",
                filePath: "",
                length: duration,
            },
            folder: null,
            empty: true,
            order: null,
        };
        set((state) => ({
            ...state,
            fragments: [...state.fragments, newEmptyFragment],
        }));
        get().setFragmentOrder(newEmptyFragment.fragment.id, order);
    },
    deleteFragment(fragID: string) {
        set((state) => ({
            ...state,
            fragments: state.fragments.filter((frag) => frag.fragment.id !== fragID),
        }));
    },
    setFragmentOrder(fragID: string, order: number) {
        set((state) => {
            console.log(fragID);
            console.log(state.fragments.find((frag) => frag.fragment.id === fragID));
            console.log(order);
            let newFrag = [...state.fragments];
            newFrag = newFrag.map((frag) => ({
                ...frag,

                order:
                    frag.fragment.id === fragID
                        ? order
                        : frag.order && frag.order >= order
                        ? frag.order + 1
                        : frag.order,
            }));
            console.log(newFrag);
            let largestOrder = 0;
            newFrag.map((frag) => ({
                ...frag,
                order: frag.order !== null ? largestOrder++ : null,
            }));
            console.log(newFrag);
            return {
                ...state,
                fragments: newFrag,
            };
        });
    },
    swapFragmentOrder(order1: number, order2: number) {
        set((state) => {
            const newFrag = [...state.fragments];
            const frag1 = newFrag.find((frag) => frag.order === order1);
            const frag2 = newFrag.find((frag) => frag.order === order2);
            if (!frag1 || !frag2) throw new Error("Fragment not found");

            const frag1Order = frag1.order;
            frag1.order = frag2.order;
            frag2.order = frag1Order;

            return {
                ...state,
                fragments: newFrag,
            };
        });
    },
    removeFragmentOrder(fragID: string) {
        set((state) => {
            const newFrag = [...state.fragments];
            newFrag.map((frag) => ({
                ...frag,
                order: frag.fragment.id === fragID ? null : frag.order,
            }));
            let largestOrder = 0;
            newFrag.map((frag, i) => ({
                ...frag,
                order: frag.order !== null ? largestOrder++ : null,
            }));
            return {
                ...state,
                fragments: newFrag,
            };
        });
    },
    getFragmentByFolder() {
        const folders: Record<string, Fragment[]> = {};
        get().folders.forEach((fol) => (folders[fol.name] = []));
        get().fragments.forEach((frag) => {
            if (frag.folder === null) return;
            folders[frag.folder.name].push(frag.fragment);
        });
        return folders;
    },
    getFragmentByOrder() {
        return get()
            .fragments.filter((frag) => frag.order !== null)
            .sort((a, b) => (a.order as number) - (b.order as number));
    },
    getMaxFragOrder() {
        return get().fragments.reduce((acc, curr) => (curr.order && curr.order > acc ? curr.order : acc), -1);
    },
    createFragFolder(folderName: string) {
        set((state) => ({
            ...state,
            folders: [
                ...state.folders,
                {
                    id: uuidv4(),
                    name: folderName,
                },
            ],
        }));
    },
}));
