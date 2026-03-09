import pkg from "../../package.json" with {type: "json"};
import * as constants from "./constants.js";

/** User-Agent header for Modrinth API requests */
export const PACKAGE_USER_AGENT: string = `${constants.AUTHOR_USERNAME}/${pkg.name}/${pkg.version}`;

/** Modrinth API base URL */
export const MODRINTH_API_BASE: string = "https://api.modrinth.com/v2";

/** Default timeout for Modrinth API requests */
export const MODRINTH_API_TIMEOUT: number = 1000;

/** Modrinth version files endpoint */
export const MODRINTH_VERSION_FILES_ENDPOINT: string = `${MODRINTH_API_BASE}/version_files`;

/** Modrinth projects endpoint */
export const MODRINTH_PROJECTS_ENDPOINT: string = `${MODRINTH_API_BASE}/projects`;

/** Modrinth users endpoint */
export const MODRINTH_USERS_ENDPOINT: string = `${MODRINTH_API_BASE}/users`;

/** Modrinth Minecraft versions endpoint */
export const MODRINTH_MINECRAFT_VERSIONS_ENDPOINT: string = `${MODRINTH_API_BASE}/tag/game_version`;

/** Modrinth Modloaders endpoint */
export const MODRINTH_MODLOADERS_ENDPOINT: string = `${MODRINTH_API_BASE}/tag/loader`;

/** Batch size for Modrinth API requests */
export const BATCH_SIZE: number = 100;

/** GitHub API base URL */
export const GITHUB_API_BASE: string = "https://api.github.com";

/** GitHub licenses endpoint */
export const GITHUB_LICENSES_ENDPOINT: string = `${GITHUB_API_BASE}/licenses`;

/** GitHub featured licenses endpoint */
export const GITHUB_FEATURED_LICENSES_ENDPOINT: string = `${GITHUB_LICENSES_ENDPOINT}?featured=true`;

/** GitHub license endpoint */
export const GITHUB_LICENSE_ENDPOINT: (license: string) => string = (license) =>
    `${GITHUB_API_BASE}/licenses/${license}`;

/** GitHub Accept request header */
export const GITHUB_ACCEPT_HEADER: string = "application/vnd.github+json";
