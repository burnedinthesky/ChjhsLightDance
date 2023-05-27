export type Fragment = {
    name: string;
    filePath: string;
    length: number;
};

export type FragmentFolder = {
    name: string;
    fragments: Fragment[];
};
