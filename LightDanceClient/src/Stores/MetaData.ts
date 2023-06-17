import { create } from "zustand";

export const useMetaDataStore = create<{
    startShowFrom: number;
    setStartShowFrom: (startFrom: number) => void;
}>((set) => ({
    startShowFrom: 0,
    setStartShowFrom(startFrom) {
        set((state) => ({
            ...state,
            startShowFrom: startFrom,
        }));
    },
}));
