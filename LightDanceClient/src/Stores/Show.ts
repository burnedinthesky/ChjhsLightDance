import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { sendWSMessage } from "../lib/wsPortal";
import { useBoardStore } from "./Boards";
import { showNotification } from "@mantine/notifications";

const { setBoardStatus } = useBoardStore.getState();

export const useShowStore = create<{
    showId: string | null;
    boardState: { id: string; name: string; ready: "pending" | "online" | "done" }[];
    showState: "initializing" | "running" | "complete";

    startShow(): void;
    endShow(type: "startFailed" | "complete" | "terminated", boards?: string[]): void;
    resetShow(): void;

    setBoardState(boardId: string, boardState: "pending" | "online" | "done"): void;
    initializeShow(boards: { id: string; name: string }[], startTime: number): void;
    completeShow(): void;
}>((set, get) => ({
    boardState: [],
    showState: "initializing",
    showId: null,

    startShow() {
        get().resetShow();
        set((state) => ({ ...state, showId: uuidv4(), showState: "initializing" }));
    },
    endShow(type, boards) {
        sendWSMessage("showStop", "");
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
    initializeShow(boards, startTime) {
        set((state) => ({
            ...state,
            boardState: boards.map((board) => ({ ...board, ready: "pending" })),
        }));
        sendWSMessage("showStart", startTime.toString());
        boards.forEach((board) => setBoardStatus(board.id, "inshow"));
        set((state) => ({ ...state, showState: "running" }));
    },
    completeShow() {
        get().boardState.forEach((board) => setBoardStatus(board.id, "connected"));
        set((state) => ({ ...state, showState: "complete" }));
    },
}));
