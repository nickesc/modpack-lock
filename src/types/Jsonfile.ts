import type {LockfileDependencyCategory} from "./Lockfile.js";

export type Jsonfile = {
    name: string;
    version: string;
    id: string;
    description: string;
    author: string;
    projectUrl: string;
    sourceUrl: string;
    license: string;
    modloader: string;
    targetModloaderVersion: string;
    targetMinecraftVersion: string;
    dependencies: Record<LockfileDependencyCategory, string[]>;
    scripts?: {
        [key: string]: string;
    };
    [key: string]: unknown;
};
