export type ContentDirectory = {
    name: string;
    path: string;
};

export type ContentFile = {
    path: string;
    fullPath: string;
    hash: string;
    category: string;
};
