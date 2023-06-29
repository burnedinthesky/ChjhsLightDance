import { create } from "zustand";

import { copyFile, removeFile, exists, readTextFile, writeTextFile, BaseDirectory } from "@tauri-apps/api/fs";

import { v4 as uuidv4 } from "uuid";

import { notifications, showNotification } from "@mantine/notifications";
import { BoardData, BoardDataZod, BoardStatus } from "../types/Boards";
import { z } from "zod";

import { cloneDeep } from "lodash";

export const useBoardStore = create<{
    boards: BoardData[];
    audioFile: string | null;
    editSinceLastFlash: boolean;

    loadFromLocalStorage(): Promise<void>;
    saveToLocalStorage(): void;

    setEditSinceLastFlash(edit: boolean): void;
    resetEditSinceLastFlash(): void;

    addBoard(mac_addr: string, ip: string | null, name?: string): void;
    linkConnectedBoard(boardId: string, ip: string): void;
    setBoardStatus(boardId: string, status: BoardStatus): void;
    renameBoard(boardId: string, newName: string): void;
    deleteBoard(boardId: string): void;
    setBoardCalibrate(boardId: string, status: "none" | "calibrating" | "calibrated"): void;
    setBoardOrder(newOrder: Record<string, number>): void;
    compressAssignedNums(): void;

    createLG(boardId: string, type: "ws" | "el", name?: string): void;
    setELLGConfig(LGId: string, lightBars: string[]): void;
    setWSLGConfig(LGId: string, config: { dma?: string | null; pin?: string | null; led_count?: number | null }): void;
    renameLG(LGId: string, newName: string): void;
    deleteLG(boardId: string, LGId: string): void;

    setAudio(filename: string): Promise<void>;
    deleteAudio(): Promise<void>;
}>((set, get) => ({
    boards: [],
    audioFile: null,
    editSinceLastFlash: false,
    localStorageLoadedInSession: false,

    async loadFromLocalStorage() {
        if (!(await exists("board_configs.json", { dir: BaseDirectory.AppData })))
            await writeTextFile("board_configs.json", JSON.stringify({ boards: [], audio: null }), {
                dir: BaseDirectory.AppData,
            });

        const localData = await JSON.parse(await readTextFile("board_configs.json", { dir: BaseDirectory.AppData }));

        const result = z.object({ boards: z.array(BoardDataZod), audio: z.string().nullable() }).safeParse(localData);
        if (!result.success) {
            await writeTextFile("board_configs.json", JSON.stringify({ boards: [], audio: null }), {
                dir: BaseDirectory.AppData,
            });
            showNotification({
                title: "Error",
                message: "Failed to load local config, resetting",
                color: "red",
            });
            return;
        }

        set((state) => ({
            ...state,
            boards: result.data.boards.map((board) => ({
                ...board,
                status: "disconnected",
                calibrated: false,
            })),
            audioFile: result.data.audio,
            editSinceLastFlash: true,
        }));
    },
    saveToLocalStorage() {
        writeTextFile("board_configs.json", JSON.stringify({ boards: get().boards, audio: get().audioFile }), {
            dir: BaseDirectory.AppData,
        }).catch((err) => {
            console.log(err);
            notifications.show({
                title: "Error",
                message: "Auto-save failed, will try again next edit",
                color: "red",
            });
        });
        console.log("Writing to local!");
    },

    resetEditSinceLastFlash() {
        set((state) => ({
            ...state,
            editSinceLastFlash: false,
        }));
    },

    setEditSinceLastFlash(edit) {
        set((state) => ({
            ...state,
            editSinceLastFlash: edit,
        }));
    },

    addBoard(mac_addr: string, ip: string | null, name?: string) {
        const newBoard: BoardData = {
            id: mac_addr.replaceAll(":", ""),
            name: name ?? `Board ${get().boards.length + 1}`,
            status: "disconnected",
            ip: ip ?? null,
            assignedNum: get().boards.length + 1,
            lightGroups: [],
            calibrationStat: "none",
        };

        set((state) => ({
            boards: [...state.boards, newBoard],
        }));

        get().compressAssignedNums();
        get().saveToLocalStorage();
    },

    linkConnectedBoard(boardId, ip) {
        console.log("called");
        console.log(get().boards.find((board) => board.id === boardId));
        set((state) => ({
            boards: state.boards.map((board) =>
                board.id === boardId ? { ...board, ip: ip, status: "connected", calibrationStat: "none" } : board
            ),
        }));
    },

    setBoardStatus(boardId, status) {
        set((state) => ({
            boards: state.boards.map((board) => (board.id === boardId ? { ...board, status: status } : board)),
        }));
    },

    setBoardOrder(updatedOrder) {
        if (get().boards.some((brd) => !Object.keys(updatedOrder).includes(brd.id)))
            throw new Error("Missing board ids");
        set((state) => ({
            boards: state.boards.map((brd) => ({
                ...brd,
                assignedNum: updatedOrder[brd.id],
            })),
        }));
        console.log(get().boards);
        get().compressAssignedNums();
        get().saveToLocalStorage();
    },

    renameBoard(boardId, newName) {
        set((state) => ({
            boards: state.boards.map((board) => (board.id === boardId ? { ...board, name: newName } : board)),
        }));

        get().saveToLocalStorage();
    },

    deleteBoard(boardId) {
        set((state) => ({
            boards: state.boards.filter((board) => board.id !== boardId),
        }));

        get().compressAssignedNums();
        get().saveToLocalStorage();
    },

    setBoardCalibrate(boardId, status) {
        set((state) => ({
            boards: state.boards.map((board) => (board.id === boardId ? { ...board, calibrationStat: status } : board)),
        }));
    },

    compressAssignedNums() {
        set((state) => ({
            boards: state.boards
                .sort((a, b) => a.assignedNum - b.assignedNum)
                .map((board, i) => {
                    const lightGroups = cloneDeep(board.lightGroups);
                    let ELLG = lightGroups.filter((lg) => lg.type === "el");
                    let WSLG = lightGroups.filter((lg) => lg.type === "ws");
                    ELLG = ELLG.map((lg, i) => ({
                        ...lg,
                        assignedNum: i + 1,
                    }));
                    WSLG = WSLG.map((lg, i) => ({
                        ...lg,
                        assignedNum: i + 1,
                    }));
                    return {
                        ...board,
                        assignedNum: i + 1,
                        lightGroups: board.lightGroups.map((lg) =>
                            lg.type === "el" ? ELLG.find((l) => l.id === lg.id)! : WSLG.find((l) => l.id === lg.id)!
                        ),
                    };
                }),
        }));
    },

    createLG(boardId, type, name) {
        const newBoards = cloneDeep(get().boards);
        const board = newBoards.find((board) => board.id === boardId);
        if (!board) throw new Error("Board not found");

        board.lightGroups.push({
            id: uuidv4(),
            type: type,
            name: name ? name : `Group ${board.lightGroups.length + 1}`,
            assignedNum:
                type === "el"
                    ? board.lightGroups.filter((lg) => lg.type === "el").length + 1
                    : board.lightGroups.filter((lg) => lg.type === "ws").length + 1,
            elConfig: type === "el" ? [] : null,
            wsConfig: type === "ws" ? { dma: null, led_count: null, pin: null } : null,
        });

        set((state) => ({
            ...state,
            boards: newBoards,
        }));
        get().saveToLocalStorage();
    },

    setELLGConfig(LGId, lightBars) {
        set((state) => ({
            ...state,
            boards: state.boards.map((board) => ({
                ...board,
                lightGroups: board.lightGroups.map((lg) => (lg.id === LGId ? { ...lg, lights: lightBars } : lg)),
            })),
        }));
        get().saveToLocalStorage();
    },

    setWSLGConfig(LGId, config) {
        set((state) => ({
            ...state,
            boards: state.boards.map((board) => ({
                ...board,
                lightGroups: board.lightGroups.map((lg) =>
                    lg.id === LGId
                        ? {
                              ...lg,
                              wsConfig: lg.wsConfig
                                  ? {
                                        dma: config.dma !== undefined ? config.dma : lg.wsConfig.dma,
                                        pin: config.pin !== undefined ? config.pin : lg.wsConfig.pin,
                                        led_count:
                                            config.led_count !== undefined ? config.led_count : lg.wsConfig.led_count,
                                    }
                                  : null,
                          }
                        : lg
                ),
            })),
        }));
        get().saveToLocalStorage();
    },

    renameLG(LGId, newName) {
        set((state) => ({
            ...state,
            boards: state.boards.map((board) => ({
                ...board,
                lightGroups: board.lightGroups.map((lg) => (lg.id === LGId ? { ...lg, name: newName } : lg)),
            })),
        }));
        get().saveToLocalStorage();
    },

    deleteLG(boardId, LGId) {
        set((state) => ({
            ...state,
            boards: state.boards.map((board) =>
                board.id === boardId
                    ? {
                          ...board,
                          lightGroups: board.lightGroups.filter((lg) => lg.id !== LGId),
                      }
                    : board
            ),
        }));
        get().compressAssignedNums();
        get().saveToLocalStorage();
    },

    async setAudio(filePath) {
        get().deleteAudio();

        let splitPath = filePath.split("\\");
        splitPath = [...splitPath.slice(0, splitPath.length - 1), ...splitPath[splitPath.length - 1].split("/")];
        const audioFileName = splitPath[splitPath.length - 1].replaceAll(" ", "_");

        await copyFile(filePath, `${audioFileName}`, { dir: BaseDirectory.AppData });

        set((state) => ({
            ...state,
            audioFile: audioFileName,
        }));
        get().saveToLocalStorage();
    },

    async deleteAudio() {
        if (get().audioFile && (await exists(get().audioFile!, { dir: BaseDirectory.AppData })))
            await removeFile(get().audioFile!, { dir: BaseDirectory.AppData });
        set((state) => ({
            ...state,
            audioFile: null,
        }));
        get().saveToLocalStorage();
    },
}));
