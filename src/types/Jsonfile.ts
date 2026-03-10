import type {DependencyCategory, ModpackInfo} from "./index.js";

/**
 * A map of content names (Modrinth slugs or file paths) to version strings.
 * Non-Modrinth content uses `"*"` to indicate an unversioned/local file.
 */
export type DependencyMap = Record<string, string>;

/**
 * Legacy dependency format: a flat array of name strings without version info.
 * Accepted on read for backward compatibility; normalised to {@link DependencyMap}
 * via {@link normalizeDependencies} at runtime.
 */
export type LegacyDependencyList = string[];

/**
 * The modpack.json file's shape; contains the modpack information and dependencies
 * @property dependencies - The dependencies of the modpack
 * @property scripts - The scripts of the modpack
 * @property [key: string] - Any other properties of the modpack
 */
export type Jsonfile = Partial<ModpackInfo> & {
    dependencies?: Partial<Record<DependencyCategory, DependencyMap | LegacyDependencyList>>;
    scripts?: {
        [key: string]: string;
    };
    [key: string]: unknown;
};
