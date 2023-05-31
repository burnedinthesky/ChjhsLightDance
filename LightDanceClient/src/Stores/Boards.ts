import { create } from "zustand";

import { copyFile, removeFile, exists, readTextFile, writeTextFile, BaseDirectory } from "@tauri-apps/api/fs";
import { appDataDir, join } from "@tauri-apps/api/path";

import { v4 as uuidv4 } from "uuid";

import { notifications, showNotification } from "@mantine/notifications";
import { BoardData, BoardDataZod, BoardStatus } from "../types/Boards";
import { z } from "zod";

export const useBoardStore = create<{
    boards: BoardData[];

    loadFromLocalStorage(): Promise<void>;
    saveToLocalStorage(): void;

    addBoard(mac_addr: string, ip: string, name?: string): void;
    linkConnectedBoard(boardId: string, ip: string): void;
    setBoardStatus(boardId: string, status: BoardStatus): void;
    renameBoard(boardId: string, newName: string): void;
    deleteBoard(boardId: string): void;
    compressAssignedNums(): void;

    createLG(boardId: string, name?: string): void;
    setLGBars(LGId: string, lightBars: string[]): void;
    renameLG(LGId: string, newName: string): void;
    deleteLG(boardId: string, LGId: string): void;
}>((set, get) => ({
    boards: [],

    async loadFromLocalStorage() {
        if (!(await exists("board_configs.json", { dir: BaseDirectory.AppData })))
            await writeTextFile("board_configs.json", JSON.stringify([]), {
                dir: BaseDirectory.AppData,
            });

        const localData = await JSON.parse(await readTextFile("board_configs.json", { dir: BaseDirectory.AppData }));
        const result = z.array(BoardDataZod).safeParse(localData);
        if (!result.success) {
            await writeTextFile("board_configs.json", JSON.stringify([]), {
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
            boards: result.data.map((board) => ({
                ...board,
                status: "disconnected",
            })),
        }));
    },
    saveToLocalStorage() {
        writeTextFile("board_configs.json", JSON.stringify(get().boards), { dir: BaseDirectory.AppData }).catch(
            (err) => {
                console.log(err);
                notifications.show({
                    title: "Error",
                    message: "Auto-save failed, will try again next edit",
                    color: "red",
                });
            }
        );
        console.log("Writing to local!");
    },

    addBoard(mac_addr: string, ip: string, name?: string) {
        const newBoard: BoardData = {
            id: mac_addr,
            name: name ?? `Board ${get().boards.length}`,
            status: "connected",
            ip: ip,
            assignedNum: get().boards.length,
            lightGroups: [],
        };

        set((state) => ({
            boards: [...state.boards, newBoard],
        }));

        get().compressAssignedNums();
        get().saveToLocalStorage();
    },

    linkConnectedBoard(boardId, ip) {
        set((state) => ({
            boards: state.boards.map((board) =>
                board.id === boardId ? { ...board, ip: ip, status: "connected" } : board
            ),
        }));
    },

    setBoardStatus(boardId, status) {
        set((state) => ({
            boards: state.boards.map((board) => (board.id === boardId ? { ...board, status: status } : board)),
        }));
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

    compressAssignedNums() {
        set((state) => ({
            boards: state.boards.map((board, i) => ({
                ...board,
                assignedNum: i,
                lightGroups: board.lightGroups.map((lg, i) => ({
                    ...lg,
                    assignedNum: i,
                })),
            })),
        }));
    },

    createLG(boardId, name) {
        set((state) => ({
            ...state,
            boards: state.boards.map((board) =>
                board.id === boardId
                    ? {
                          ...board,
                          lightGroups: [
                              ...board.lightGroups,
                              {
                                  id: uuidv4(),
                                  name: name ? name : `Group ${board.lightGroups.length}`,
                                  assignedNum: board.lightGroups.length,
                                  lights: [],
                              },
                          ],
                      }
                    : board
            ),
        }));
        get().saveToLocalStorage();
    },

    setLGBars(LGId, lightBars) {
        set((state) => ({
            ...state,
            boards: state.boards.map((board) => ({
                ...board,
                lightGroups: board.lightGroups.map((lg) => (lg.id === LGId ? { ...lg, lights: lightBars } : lg)),
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
        get().saveToLocalStorage();
    },
}));
