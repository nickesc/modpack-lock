import pkg from '../../package.json' with { type: 'json' };

/** Lockfile format version -- increment on changes to the format */
export const LOCKFILE_VERSION = "1.0.1";

/** Required fields for the modpack information */
export const MODPACK_INFO_REQUIRED_FIELDS = [
    "name",
    "version",
    "id",
    "author",
    "modloader",
    "targetMinecraftVersion"
];

/** Dependency categories, corresponds to folders in Minecraft profile */
export const DEPENDENCY_CATEGORIES = [
    "mods",
    "resourcepacks",
    "shaderpacks",
    "datapacks"
];

/** Minecraft version types */
export const MINECRAFT_VERSION_TYPES = ["release", "alpha", "beta", "snapshot"];

const gitignoreMarker = (mode) =>  `# ${pkg.name}:${mode}`;

/** Gitignore section start marker */
export const GITIGNORE_START_MARKER = gitignoreMarker('start');

/** Gitignore section end marker */
export const GITIGNORE_END_MARKER = gitignoreMarker('end');
