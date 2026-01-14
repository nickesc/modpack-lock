/** Modrinth API base URL */
export const MODRINTH_API_BASE = 'https://api.modrinth.com/v2';

/** Modrinth version files endpoint */
export const MODRINTH_VERSION_FILES_ENDPOINT = `${MODRINTH_API_BASE}/version_files`;

/** Modrinth projects endpoint */
export const MODRINTH_PROJECTS_ENDPOINT = `${MODRINTH_API_BASE}/projects`;

/** Modrinth users endpoint */
export const MODRINTH_USERS_ENDPOINT = `${MODRINTH_API_BASE}/users`;

/** Modrinth Minecraft versions endpoint */
export const MODRINTH_MINECRAFT_VERSIONS_ENDPOINT = `${MODRINTH_API_BASE}/tag/game_version`;

/** Modrinth Modloaders endpoint */
export const MODRINTH_MODLOADERS_ENDPOINT = `${MODRINTH_API_BASE}/tag/loader`;

/** Batch size for Modrinth API requests */
export const BATCH_SIZE = 100;

/** GitHub API base URL */
export const GITHUB_API_BASE = 'https://api.github.com';

/** GitHub licenses endpoint */
export const GITHUB_LICENSES_ENDPOINT = `${GITHUB_API_BASE}/licenses`;

/** GitHub featured licenses endpoint */
export const GITHUB_FEATURED_LICENSES_ENDPOINT = `${GITHUB_LICENSES_ENDPOINT}?featured=true`;

/** GitHub license endpoint */
export const GITHUB_LICENSE_ENDPOINT = (license) => `${GITHUB_API_BASE}/licenses/${license}`;
