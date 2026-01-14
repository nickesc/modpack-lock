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

export const ALL_RIGHTS_RESERVED_LICENSE = { title: 'All-Rights-Reserved', value: 'all-rights-reserved' };
export const OTHER_OPTION = { title: 'Other', value: 'other' };

export const FALLBACK_LICENSES = [
    { title: 'MIT', value: 'mit' },
    { title: 'Apache-2.0', value: 'apache-2.0' },
    { title: 'GPL-3.0', value: 'gpl-3.0' },
    { title: 'CC0-1.0', value: 'cc0-1.0' }
]

export const FALLBACK_MODLOADERS = [
    { title: 'fabric', value: 'fabric' },
    { title: 'forge', value: 'forge' },
    { title: 'quilt', value: 'quilt' },
    { title: 'neoforge', value: 'neoforge' },
    { title: 'sponge', value: 'sponge' },
    { title: 'paper', value: 'paper' }
]
