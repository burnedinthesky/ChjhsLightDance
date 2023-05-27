export type BoardStatus = "connected" | "processing";

export type LightingGroupData = {
    id: string;
    givenName: string;
    lights: string[];
};

export type BoardData = {
    id: string;
    name: string;
    status: BoardStatus;
    ip: string;
    assisgnedId: string;
    lightGroups: LightingGroupData[];
};
