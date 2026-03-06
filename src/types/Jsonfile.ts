import type {DependencyCategory, ModpackInfo} from "./index.js";

/**
 * The modpack.json file's shape; contains the modpack information and dependencies
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
