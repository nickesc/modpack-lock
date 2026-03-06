import type {DependencyCategory} from "./index.js";

/**
 * A directory that contains modpack content (e.g. mods, resourcepacks, datapacks, shaderpacks)
 * @property name - The name of the directory
 * @property path - The path to the directory
 */
export type ContentDirectory = {
    name: DependencyCategory;
    path: string;
};

/**
 * A binary content file in the modpack -- a file tracked by the modpack lockfile
 * @property path - The path to the file
 * @property fullPath - The full path to the file
 * @property hash - The hash of the file
 * @property category - The content category of the file (e.g. mods, resourcepacks, datapacks, shaderpacks)
 */
export type ContentFile = {
    path: string;
    fullPath: string;
    hash: string;
    category: DependencyCategory;
};
