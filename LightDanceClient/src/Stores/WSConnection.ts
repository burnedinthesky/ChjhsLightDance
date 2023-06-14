import { create } from "zustand";

export const useWSConvStore = create<{
    connected: boolean;
    preConLogs: string[];
    logs: string[];
    refreshedBoard: boolean;

    setConnected: (connected: boolean) => void;

    setRefreshedBoard(refreshed: boolean): void;
    logMessage: (source: "snd" | "rec", msg: string) => void;
    logPreConMessage: (msg: string) => void;
    clearLogs: (message?: string) => void;
    clearPreConLogs: () => void;
}>((set) => ({
    connected: false,
    logs: [],
    preConLogs: [],
    refreshedBoard: false,
    setConnected(connected) {
        set((state) => ({
            ...state,
            preConLogs: connected ? [] : state.preConLogs,
            connected,
        }));
    },

    setRefreshedBoard(refreshed) {
        set((state) => ({
            ...state,
            refreshedBoard: refreshed,
        }));
    },
    logMessage: (source, msg) => {
        const now = new Date();
        const intlOptions: Intl.DateTimeFormatOptions = {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        };
        const formattedDate = new Intl.DateTimeFormat("en-US", intlOptions).format(now).replace(",", "");
        set((state) => ({
            ...state,
            logs: [...state.logs, `[${formattedDate}] ${source}: ${msg}`],
        }));
    },
    logPreConMessage: (msg) => {
        const now = new Date();
        set((state) => ({
            ...state,
            preConLogs: [...state.preConLogs, msg],
        }));
    },
    clearLogs(message) {
        const now = new Date();
        const intlOptions: Intl.DateTimeFormatOptions = {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        };
        const formattedDate = new Intl.DateTimeFormat("en-US", intlOptions).format(now).replace(",", "");
        set((state) => ({
            ...state,
            logs: [`[${formattedDate}]: Logs cleared ${message ?? ""}`],
        }));
    },
    clearPreConLogs() {
        set((state) => ({
            ...state,
            preConLogs: ["Attempting to connect"],
        }));
    },
}));
