export const DEFAULT_MODPACK_VERSION = '1.0.0';

export const DEFAULT_MODPACK_LICENSE = 'MIT';

export const DEFAULT_PROJECT_URL = (id) => {
    return `https://modrinth.com/modpack/${id}`;
};
export const DEFAULT_SOURCE_URL = (id, author) => {
    return `https://github.com/${author}/${id}`;
};

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
    { title: '1.21.x', value: '1.21.x'},
    { title: '1.20.x', value: '1.20.x'},
    { title: '1.19.x', value: '1.19.x'},
    { title: '1.18.x', value: '1.18.x'},
    { title: '1.17.x', value: '1.17.x'},
    { title: '1.16.x', value: '1.16.x'},
    { title: '1.15.x', value: '1.15.x'},
    { title: '1.14.x', value: '1.14.x'},
    { title: '1.13.x', value: '1.13.x'},
    { title: '1.12.x', value: '1.12.x'},
    { title: '1.11.x', value: '1.11.x'},
    { title: '1.10.x', value: '1.10.x'},
    { title: '1.9.x', value: '1.9.x'},
    { title: '1.8.x', value: '1.8.x'},
    { title: '1.7.x', value: '1.7.x'},
    { title: '1.6.x', value: '1.6.x'},
    { title: '1.5.x', value: '1.5.x'},
    { title: '1.4.x', value: '1.4.x'},
    { title: '1.3.x', value: '1.3.x'},
    { title: '1.2.x', value: '1.2.x'},
    { title: '1.1.x', value: '1.1.x'},
    { title: '1.0.x', value: '1.0.x'},
    { title: 'snapshot', value: 'snapshot'},
    { title: 'beta', value: 'beta'},
    { title: 'alpha', value: 'alpha'},
];
