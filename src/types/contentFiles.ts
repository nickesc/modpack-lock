import type {DependencyCategory} from "./Lockfile.js";

export type ContentDirectory = {
    name: DependencyCategory;
    path: string;
};

export type ContentFile = {
    path: string;
    fullPath: string;
    hash: string;
    category: DependencyCategory;
};
