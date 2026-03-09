import pkg from "../../package.json" with {type: "json"};
import type {DependencyCategory, MinecraftVersionType, ModpackInfo} from "../types/index.js";

/** Author username */
export const AUTHOR_USERNAME: string = "nickesc";

/** Lockfile format version -- increment on changes to the format */
export const LOCKFILE_VERSION: string = "1.0.1";

/** Required fields for the modpack information */
export const MODPACK_INFO_REQUIRED_FIELDS: (keyof ModpackInfo)[] = [
    "name", //
    "version",
    "id",
    "author",
    "modloader",
    "targetMinecraftVersion",
];

export const MODPACK_INFO_FIELDS: (keyof ModpackInfo)[] = [
    ...MODPACK_INFO_REQUIRED_FIELDS, //
    "projectUrl",
    "sourceUrl",
    "license",
    "targetModloaderVersion",
];

/** Dependency categories, corresponds to folders in Minecraft profile */
export const DEPENDENCY_CATEGORIES: DependencyCategory[] = [
    "mods", //
    "resourcepacks",
    "shaderpacks",
    "datapacks",
];

/** Minecraft version types */
export const MINECRAFT_VERSION_TYPE_ORDER: MinecraftVersionType[] = [
    "release", //
    "alpha",
    "beta",
    "snapshot",
];

const gitignoreMarker: (mode: string) => string = (mode) => `# ${pkg.name}:${mode}`;

/** Gitignore section start marker */
export const GITIGNORE_START_MARKER: string = gitignoreMarker("start");

/** Gitignore section end marker */
export const GITIGNORE_END_MARKER: string = gitignoreMarker("end");
