export type Fragment = {
    id: string;
    name: string;
    filePath: string;
    length: number;
};

export type FragmentFolder = {
    id: string;
    name: string;
};

export type UIFragment = {
    fragment: Fragment;
    folder: FragmentFolder | null;
    order: number | null;
    empty: boolean;
};
