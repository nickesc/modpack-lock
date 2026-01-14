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

/** All-Rights-Reserved license text */
export const ARR_LICENSE_TEXT =
    "Copyright (c) [year] [fullname]\n" +
    "\n" +
    "All rights reserved.\n";

/** All-Rights-Reserved license option */
export const ALL_RIGHTS_RESERVED_LICENSE = { title: 'All-Rights-Reserved', value: 'all-rights-reserved' };

/** Other option */
export const OTHER_OPTION = { title: 'Other', value: 'other' };

/** Fallback licenses */
export const FALLBACK_LICENSES = [
    { title: 'MIT', value: 'mit' },
    { title: 'Apache-2.0', value: 'apache-2.0' },
    { title: 'GPL-3.0', value: 'gpl-3.0' },
    { title: 'CC0-1.0', value: 'cc0-1.0' }
];

/** Fallback modloaders */
export const FALLBACK_MODLOADERS = [
    { title: 'fabric', value: 'fabric' },
    { title: 'forge', value: 'forge' },
    { title: 'neoforge', value: 'neoforge' },
    { title: 'paper', value: 'paper' },
    { title: 'purpur', value: 'purpur' },
    { title: 'quilt', value: 'quilt' },
    { title: 'sponge', value: 'sponge' },
    { title: 'spigot', value: 'spigot' },
    { title: 'vanilla', value: 'vanilla' }
];

/** Fallback target Minecraft versions */
export const FALLBACK_TARGET_MINECRAFT_VERSIONS = [
    { title: '1.21.x'},
    { title: '1.20.x'},
    { title: '1.19.x'},
    { title: '1.18.x'},
    { title: '1.17.x'},
    { title: '1.16.x'},
    { title: '1.15.x'},
    { title: '1.14.x'},
    { title: '1.13.x'},
    { title: '1.12.x'},
    { title: '1.11.x'},
    { title: '1.10.x'},
    { title: '1.9.x'},
    { title: '1.8.x'},
    { title: '1.7.x'},
    { title: '1.6.x'},
    { title: '1.5.x'},
    { title: '1.4.x'},
    { title: '1.3.x'},
    { title: '1.2.x'},
    { title: '1.1.x'},
    { title: '1.0.x'}
];
