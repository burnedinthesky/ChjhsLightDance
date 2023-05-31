import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { Fragment, FragmentFolder, UIFragment } from "../types/Frags";

export const useFragmentStore = create<{
    fragments: UIFragment[];
    folders: FragmentFolder[];
    createFragment(fragName: string, fragPath: string, folder: string, order?: number[]): void;
    createEmptyFragment(duration: number, order: number[]): void;
    deleteFragment(fragID: string): void;

    addFragmentOrder(fragID: string, order: number): void;
    swapFragmentOrder(order1: number, order2: number): void;
    removeFragmentOrder(fragmentID: string, orders?: number[]): void;
    compressFragmentOrder(): void;

    getFragmentByFolder(): Record<string, Fragment[]>;
    getFragmentByOrder(): UIFragment[];
    getMaxFragOrder(): number;

    createFragFolder(folderName: string): void;
    deleteFragFolder(folderName: string): void;
}>((set, get) => ({
    fragments: [],
    folders: [],
    createFragment(fragName: string, fragPath: string, folder: string, order?: number[]) {
        if (!get().folders.find((f) => f.name === folder)) throw new Error("Folder not found");
        const newFragment: UIFragment = {
            fragment: {
                id: uuidv4(),
                name: fragName,
                filePath: fragPath,
                length: 0,
            },
            folder: get().folders.find((f) => f.name === folder) as FragmentFolder,
            order: [],
            empty: false,
        };
        set((state) => ({
            ...state,
            fragments: [...state.fragments, newFragment],
        }));
        if (!order) return;
        order.forEach((o) => get().addFragmentOrder(newFragment.fragment.id, o));
    },
    createEmptyFragment(duration: number, order: number[]) {
        const newEmptyFragment: UIFragment = {
            fragment: {
                id: `empty-${uuidv4()}`,
                name: "Empty",
                filePath: "",
                length: duration,
            },
            folder: null,
            empty: true,
            order: [],
        };
        set((state) => ({
            ...state,
            fragments: [...state.fragments, newEmptyFragment],
        }));

        order.forEach((o) => get().addFragmentOrder(newEmptyFragment.fragment.id, o));
    },
    deleteFragment(fragID: string) {
        set((state) => ({
            ...state,
            fragments: state.fragments.filter((frag) => frag.fragment.id !== fragID),
        }));
        get().compressFragmentOrder();
    },

    addFragmentOrder(fragID: string, order: number) {
        set((state) => ({
            ...state,
            fragments: state.fragments.map((frag) =>
                frag.fragment.id === fragID
                    ? { ...frag, order: [...frag.order, order] }
                    : frag.order.some((o) => o >= order)
                    ? {
                          ...frag,
                          order: frag.order.map((o) => (o >= order ? o + 1 : o)),
                      }
                    : frag
            ),
        }));
        get().compressFragmentOrder();
    },
    swapFragmentOrder(order1: number, order2: number) {
        set((state) => {
            const newFrag = [...state.fragments];
            const frag1 = newFrag.find((frag) => frag.order.includes(order1));
            const frag2 = newFrag.find((frag) => frag.order.includes(order2));
            if (!frag1 || !frag2) throw new Error("Fragment not found");

            if (frag1.fragment.id !== frag2.fragment.id) {
                frag1.order = frag1.order.map((o) => (o === order1 ? order2 : o));
                frag2.order = frag2.order.map((o) => (o === order2 ? order1 : o));
            }

            return {
                ...state,
                fragments: newFrag,
            };
        });
    },
    removeFragmentOrder(fragID: string, orders?: number[]) {
        if (get().fragments.find((frag) => frag.fragment.id === fragID)?.empty) {
            get().deleteFragment(fragID);
            return;
        }
        set((state) => ({
            ...state,
            fragments: state.fragments.map((frag) => ({
                ...frag,
                order:
                    frag.fragment.id === fragID
                        ? orders
                            ? frag.order.filter((o) => !orders.includes(o))
                            : []
                        : frag.order,
            })),
        }));
        get().compressFragmentOrder();
    },
    compressFragmentOrder() {
        set((state) => {
            let orderNums: number[] = state.fragments.flatMap((frag) => frag.order).sort((a, b) => a - b);
            let mappedOrder: Record<number, number> = {};
            orderNums.forEach((num, i) => (mappedOrder[num] = i));
            return {
                ...state,
                fragments: state.fragments.map((frag) => ({
                    ...frag,
                    order: frag.order.map((o) => mappedOrder[o]),
                })),
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
        console.log(get().fragments);
        const ret: { o: number; frag: UIFragment }[] = [];
        get().fragments.forEach((frag) => {
            frag.order.forEach((order) => {
                ret.push({ o: order, frag });
            });
        });
        return ret.sort((a, b) => a.o - b.o).map((o) => o.frag);
    },
    getMaxFragOrder() {
        return get().fragments.reduce(
            (acc, curr) =>
                curr.order.reduce((acc, curr) => (curr > acc ? curr : acc), -1) > acc
                    ? curr.order.reduce((acc, curr) => (curr > acc ? curr : acc), -1)
                    : acc,
            -1
        );
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
    deleteFragFolder(folderName: string) {
        const folder = get().folders.find((fol) => fol.name === folderName);
        if (!folder) throw new Error("Folder not found");
        set((state) => ({
            ...state,
            fragments: state.fragments.filter((frag) => frag.folder?.id !== folder.id),
            folders: state.folders.filter((fol) => fol.id !== folder.id),
        }));
    },
}));
