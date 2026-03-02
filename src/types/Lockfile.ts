import type {VersionResponseItem} from "./index.js";

/**
 * Contains information about the modpack dependencies and their versions.
 * @property version - The version of the modpack
 * @property generated - The date and time the lockfile was generated
 * @property total - The total number of files in the modpack
 * @property counts - The counts object
 * @property counts.mods - The mods count
 * @property counts.resourcepacks - The resourcepacks count
 * @property counts.datapacks - The datapacks count
 * @property counts.shaderpacks - The shaderpacks count
 * @property dependencies - The dependencies object
 * @property dependencies.mods - The mods array
 * @property dependencies.resourcepacks - The resourcepacks array
 * @property dependencies.datapacks - The datapacks array
 * @property dependencies.shaderpacks - The shaderpacks array
 */
export type Lockfile = {
    version: string;
    generated: string;
    total: number;
    counts: {
        mods?: number;
        resourcepacks?: number;
        datapacks?: number;
        shaderpacks?: number;
    };
    dependencies: {
        mods?: LockfileDependencyEntry[];
        resourcepacks?: LockfileDependencyEntry[];
        datapacks?: LockfileDependencyEntry[];
        shaderpacks?: LockfileDependencyEntry[];
    };
};

export type LockfileDependencyCategory = keyof Lockfile["dependencies"];

export type LockfileDependencyEntry = {
    path: string;
    version: VersionResponseItem | null;
};
