import type {DependencyCategory} from "./index.js";

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
