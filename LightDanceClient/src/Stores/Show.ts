import { create } from "zustand";
import { sendWSMessage } from "../lib/wsPortal";
import { useBoardStore } from "./Boards";

const { setBoardStatus } = useBoardStore.getState();

export const useShowStore = create<{
    boardState: { id: string; name: string; ready: "pending" | "online" | "done" }[];
    showState: "initializing" | "running" | "complete";
    setBoardState(boardId: string, boardState: "pending" | "online" | "done"): void;
    resetShow(): void;
    initializeShow(boards: { id: string; name: string }[], startTime: number): void;
    completeShow(): void;
}>((set, get) => ({
    boardState: [],
    showState: "initializing",
    setBoardState(boardId, boardState) {
        set((state) => ({
            ...state,
            boardState: state.boardState.map((board) => ({
                ...board,
                ready: board.id === boardId ? boardState : board.ready,
            })),
        }));
    },
    resetShow() {
        set((state) => ({ ...state, boardState: [], showState: "initializing" }));
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
