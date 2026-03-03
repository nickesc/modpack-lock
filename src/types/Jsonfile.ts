import type {DependencyCategory} from "./Lockfile.js";
import type {ModpackInfo} from "./index.js";

export type Jsonfile = ModpackInfo & {
    dependencies: Record<DependencyCategory, string[]>;
    scripts?: {
        [key: string]: string;
    };
    [key: string]: unknown;
};
