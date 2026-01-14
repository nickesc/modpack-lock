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

export const ARR_LICENSE_TEXT =
    "Copyright (c) [year] [fullname]\n" +
    "\n" +
    "All rights reserved.\n";
