import type {DependencyCategory, ModpackInfo} from "./index.js";

/**
 * The `modpack.json` file shape
 * @property dependencies - The dependencies of the modpack
 * @property scripts - The scripts of the modpack
 * @property [key: string] - Any other properties of the modpack
 */
export type Jsonfile = ModpackInfo & {
    dependencies?: Record<DependencyCategory, string[]>;
    scripts?: {
        [key: string]: string;
    };
    [key: string]: unknown;
};
