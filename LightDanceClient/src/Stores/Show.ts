import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { useBoardStore } from "./Boards";
import { showNotification } from "@mantine/notifications";

const { setBoardStatus } = useBoardStore.getState();

export const useShowStore = create<{
    showId: string | null;
    audioDelay: number;
    boardState: { id: string; name: string; ready: "pending" | "online" | "done" }[];
    showState: "initializing" | "running" | "complete";

    setAudioDelay(delay: number): void;

    startShow(): void;
    endShow(type: "startFailed" | "complete" | "terminated", boards?: string[]): void;
    resetShow(): void;

    setBoardState(boardId: string, boardState: "pending" | "online" | "done"): void;
    initializeShow(boards: { id: string; name: string }[]): void;
    completeShow(): void;
}>((set, get) => ({
    boardState: [],
    audioDelay: 0,
    showState: "initializing",
    showId: null,

    setAudioDelay(delay) {
        set((state) => ({
            ...state,
            audioDelay: delay,
        }));
    },

    startShow() {
        get().resetShow();
        set((state) => ({ ...state, showId: uuidv4(), showState: "initializing" }));
    },
    endShow(type, boards) {
        if (type == "terminated")
            showNotification({
                message: "Show terminated by user",
                color: "red",
            });
        else if (type == "startFailed") {
            if (boards) {
                showNotification({
                    title: "Show start aborted",
                    message: `Board${boards.length == 1 ? "" : "s"} ${boards.join(", ")} not ready!`,
                    color: "red",
                    autoClose: false,
                });
            } else
                showNotification({
                    title: "Show start aborted",
                    message: `Failed to start show due to pending confirm boards!`,
                    color: "red",
                    autoClose: false,
                });
        }
        set((state) => ({ ...state, showId: null, showState: "initializing" }));
        get().resetShow();
    },
    resetShow() {
        set((state) => ({ ...state, boardState: [], showState: "initializing" }));
    },

    setBoardState(boardId, boardState) {
        set((state) => ({
            ...state,
            boardState: state.boardState.map((board) => ({
                ...board,
                ready: board.id === boardId ? boardState : board.ready,
            })),
        }));
    },
    initializeShow(boards) {
        set((state) => ({
            ...state,
            boardState: boards.map((board) => ({ ...board, ready: "pending" })),
        }));

        boards.forEach((board) => setBoardStatus(board.id, "inshow"));
        set((state) => ({ ...state, showState: "running" }));
    },
    completeShow() {
        get().boardState.forEach((board) => setBoardStatus(board.id, "connected"));
        set((state) => ({ ...state, showState: "complete" }));
    },
}));
