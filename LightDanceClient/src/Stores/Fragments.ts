import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { Fragment, FragmentFolder, UIFragment } from "../types/Frags";
import {
    copyFile,
    removeFile,
    exists,
    createDir,
    readTextFile,
    writeTextFile,
    BaseDirectory,
} from "@tauri-apps/api/fs";
import { appDataDir, join } from "@tauri-apps/api/path";

import { notifications, showNotification } from "@mantine/notifications";
import { invoke } from "@tauri-apps/api/tauri";

export const useFragmentStore = create<{
    fragments: UIFragment[];
    folders: FragmentFolder[];

    loadFromLocalStorage(): Promise<void>;
    saveToLocalStorage(): void;

    createFragment(fragName: string, fragPath: string, folder: string, order?: number[]): Promise<void>;
    createEmptyFragment(duration: number, order: number[]): void;
    deleteFragment(fragID: string): void;

    addFragmentOrder(fragID: string, order: number): void;
    swapFragmentOrder(order1: number, order2: number): void;
    removeFragmentOrder(fragmentID: string, orders?: number[]): void;
    renameFragment(fragmentID: string, newName: string): void;
    compressFragmentOrder(): void;

    getFragmentByFolder(): Record<string, Fragment[]>;
    getFragmentByOrder(): UIFragment[];
    getMaxFragOrder(): number;

    createFragFolder(folderName: string): void;
    renameFragFolder(folderName: string, newName: string): void;
    deleteFragFolder(folderName: string): void;
}>((set, get) => ({
    fragments: [],
    folders: [],
    async loadFromLocalStorage() {
        if (!(await exists("fragments.json", { dir: BaseDirectory.AppData })))
            await writeTextFile("fragments.json", JSON.stringify({ fragments: [], folders: [] }), {
                dir: BaseDirectory.AppData,
            });

        const localData = await JSON.parse(await readTextFile("fragments.json", { dir: BaseDirectory.AppData }));
        const loadedFolders: FragmentFolder[] = (localData.folders as FragmentFolder[]).map((fol) => ({
            id: fol.id,
            name: fol.name,
        }));
        set((state) => ({
            ...state,
            folders: loadedFolders,
        }));
        const loadedFragments: UIFragment[] = (localData.fragments as UIFragment[]).map((frag) => ({
            ...frag,
            folder:
                frag.folder !== null
                    ? (() => {
                          const ret = get().folders.find((fol) => fol.id === (frag.folder as FragmentFolder).id);
                          if (!ret) throw new Error("Folder not found");
                          return ret;
                      })()
                    : null,
        }));
        set((state) => ({
            ...state,
            fragments: loadedFragments,
        }));
    },
    saveToLocalStorage() {
        const data = {
            fragments: get().fragments,
            folders: get().folders,
            uuid: uuidv4(),
        };

        writeTextFile("fragments.json", JSON.stringify(data), { dir: BaseDirectory.AppData }).catch((err) => {
            console.log(err);
            notifications.show({
                title: "Error",
                message: "Auto-save failed, will try again next edit",
                color: "red",
            });
        });
    },
    async createFragment(fragName: string, fragPath: string, folder: string, order?: number[]) {
        if (!get().folders.find((f) => f.name === folder)) throw new Error("Folder not found");
        const fragmentId = uuidv4();
        let fragmentPath = "";

        (async () => {
            if (!(await exists("frag_excels/", { dir: BaseDirectory.AppData }))) {
                await createDir("frag_excels", { dir: BaseDirectory.AppData, recursive: true });
            }
            await copyFile(fragPath, await join("frag_excels", `frag-${fragmentId}.xlsx`), {
                dir: BaseDirectory.AppData,
            });
            return await join(await appDataDir(), "frag_excels", `frag-${fragmentId}.xlsx`);
        })()
            .then((path: string) => {
                fragmentPath = path;
            })
            .catch((err) => {
                throw new Error(err);
            });

        const returnedLength = await invoke("get_fragment_length", {
            fragpath: fragmentPath,
        });
        const [stdout, stderr] = (returnedLength as string).split(";;;");
        if (stderr.length) throw new Error(stderr);

        const fragLength = parseInt(stdout) / 1000;
        const newFragment: UIFragment = {
            fragment: {
                id: fragmentId,
                name: fragName,
                filePath: fragmentPath,
                length: fragLength,
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
        get().saveToLocalStorage();
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
        get().saveToLocalStorage();
    },
    deleteFragment(fragID: string) {
        const frag = get().fragments.find((f) => f.fragment.id === fragID);
        if (!frag) throw new Error("Fragment not found");
        if (frag.empty)
            set((state) => ({
                ...state,
                fragments: state.fragments.filter((frag) => frag.fragment.id !== fragID),
            }));
        else
            (async () => {
                await removeFile(`frag_excels/frag-${fragID}.xlsx`, {
                    dir: BaseDirectory.AppData,
                });
            })().then(() => {
                set((state) => ({
                    ...state,
                    fragments: state.fragments.filter((frag) => frag.fragment.id !== fragID),
                }));
            });
        get().compressFragmentOrder();
        get().saveToLocalStorage();
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
        get().saveToLocalStorage();
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
        get().saveToLocalStorage();
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
        get().saveToLocalStorage();
    },
    renameFragment(fragmentID: string, newName: string) {
        set((state) => ({
            ...state,
            fragments: state.fragments.map((frag) =>
                frag.fragment.id === fragmentID ? { ...frag, fragment: { ...frag.fragment, name: newName } } : frag
            ),
        }));
        get().saveToLocalStorage();
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
        // console.log(get().loadFromLocalStorage());

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
        get().saveToLocalStorage();
    },
    renameFragFolder(folderName: string, newName: string) {
        const folder = get().folders.find((fol) => fol.name === folderName);
        if (!folder) throw new Error("Folder not found");
        set((state) => ({
            ...state,
            folders: state.folders.map((fol) => (fol.id === folder.id ? { ...fol, name: newName } : fol)),
        }));
        get().saveToLocalStorage();
    },
    deleteFragFolder(folderName: string) {
        const folder = get().folders.find((fol) => fol.name === folderName);
        if (!folder) throw new Error("Folder not found");
        get().fragments.forEach((frag) => {
            if (frag.folder?.id !== folder.id) return;
            get().deleteFragment(frag.fragment.id);
        });
        set((state) => ({
            ...state,
            fragments: state.fragments.filter((frag) => frag.folder?.id !== folder.id),
            folders: state.folders.filter((fol) => fol.id !== folder.id),
        }));
        get().saveToLocalStorage();
    },
}));
