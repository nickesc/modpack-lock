import type {ContentVersion} from "./index.js";

/**
 * Lockfile shape; contains detailed information about the modpack dependencies and their versions.
 * @property version - The version of the lockfile
 * @property generated - The date and time the lockfile was generated
 * @property total - The total number of files in the modpack
 * @property counts - An object containing the number of files in each category
 * @property counts.mods - The number of mods in the modpack
 * @property counts.resourcepacks - The number of resourcepacks in the modpack
 * @property counts.datapacks - The number of datapacks in the modpack
 * @property counts.shaderpacks - The number of shaderpacks in the modpack
 * @property dependencies - An object containing all dependency version information
 * @property dependencies.mods - An array with version information for each mod
 * @property dependencies.resourcepacks - An array with version information for each resourcepack
 * @property dependencies.datapacks - An array with version information for each datapack
 * @property dependencies.shaderpacks - An array with version information for each shaderpack
 */
export type Lockfile = {
    version: string;
    generated: string;
    total: number;
    counts: Partial<Record<DependencyCategory, number>>;
    dependencies: {
        mods?: LockfileDependency[];
        resourcepacks?: LockfileDependency[];
        datapacks?: LockfileDependency[];
        shaderpacks?: LockfileDependency[];
    };
};

/**
 * The categories of dependencies in the lockfile
 * @property mods - The mods folder
 * @property resourcepacks - The resourcepacks folder
 * @property datapacks - The datapacks folder
 * @property shaderpacks - The shaderpacks folder
 */
export type DependencyCategory = keyof Lockfile["dependencies"];

/**
 * The shape of a dependency in the lockfile
 * @property path - The path to the dependency file in the modpack directory
 * @property version - The version of the dependency, or null if the dependency is not found on Modrinth
 */
export type LockfileDependency = {
    path: string;
    version: ContentVersion | null;
};
