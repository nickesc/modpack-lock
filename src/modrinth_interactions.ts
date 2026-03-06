import * as config from "./config/index.js";
import {logm} from "./logger.js";
import type {Choice} from "prompts";
import type {
    ContentVersion,
    ProjectResponseItem,
    MinecraftVersionResponseItem,
    ModloaderResponseItem,
    UserResponseItem,
} from "./types/index.js";

/**
 * Split an array into chunks of specified size
 */
function chunkArray(array: any[], size: number) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

/**
 * Fetch version information for multiple file hashes from the Modrinth API
 * @param hashes - An array of hashes to fetch version information for
 * @returns An object with the version information for each hash
 */
export async function getVersionsFromHashes(hashes: string[]): Promise<Record<string, ContentVersion>> {
    if (hashes.length === 0) {
        return {};
    }

    try {
        const response = await fetch(config.MODRINTH_VERSION_FILES_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": config.PACKAGE_USER_AGENT,
            },
            body: JSON.stringify({
                hashes: hashes,
                algorithm: "sha1",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Modrinth API error (${response.status}): ${errorText}`);
        }

        return (await response.json()) as Record<string, ContentVersion>;
    } catch (error: unknown) {
        if (error instanceof Error) {
            logm.error(`Error fetching version information from hashes: ${error.message}`);
            throw error;
        } else {
            throw new Error(`Unknown error fetching version information from hashes`);
        }
    }
}

/**
 * Fetch multiple projects by their IDs from the Modrinth API
 * @param projectIds - An array of project IDs to fetch
 * @returns An array of project objects
 */
export async function getProjects(projectIds: string[]): Promise<ProjectResponseItem[]> {
    if (projectIds.length === 0) {
        return [];
    }

    const chunks: string[][] = chunkArray(projectIds, config.BATCH_SIZE);
    const results: ProjectResponseItem[] = [];

    for (const chunk of chunks) {
        try {
            const url = `${config.MODRINTH_PROJECTS_ENDPOINT}?ids=${encodeURIComponent(JSON.stringify(chunk))}`;
            const response = await fetch(url, {
                headers: {
                    "User-Agent": config.PACKAGE_USER_AGENT,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Modrinth API error (${response.status}): ${errorText}`);
            }

            const data = (await response.json()) as ProjectResponseItem[];
            results.push(...data);
        } catch (error: any) {
            if (error instanceof Error) {
                logm.error(`Error fetching projects: ${error.message}`);
                throw error;
            } else {
                throw new Error(`Unknown error fetching projects`);
            }
        }
    }

    return results;
}

/**
 * Fetch multiple users by their IDs from the Modrinth API
 * @param userIds - An array of user IDs to fetch
 * @returns An array of user information objects
 */
export async function getUsers(userIds: string[]): Promise<UserResponseItem[]> {
    if (userIds.length === 0) {
        return [];
    }

    const chunks: string[][] = chunkArray(userIds, config.BATCH_SIZE);
    const results: UserResponseItem[] = [];

    for (const chunk of chunks) {
        try {
            const url = `${config.MODRINTH_USERS_ENDPOINT}?ids=${encodeURIComponent(JSON.stringify(chunk))}`;
            const response = await fetch(url, {
                headers: {
                    "User-Agent": config.PACKAGE_USER_AGENT,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Modrinth API error (${response.status}): ${errorText}`);
            }

            const data = (await response.json()) as UserResponseItem[];
            results.push(...data);
        } catch (error: any) {
            if (error instanceof Error) {
                logm.error(`Error fetching users: ${error.message}`);
                throw error;
            } else {
                throw new Error(`Unknown error fetching users`);
            }
        }
    }

    return results;
}

/**
 * Fetch Minecraft versions from the Modrinth API
 * @returns An array of Minecraft versions for use with a prompt
 */
export async function getMinecraftVersions(): Promise<Choice[]> {
    try {
        const url = config.MODRINTH_MINECRAFT_VERSIONS_ENDPOINT;
        const response = await fetch(url, {
            headers: {
                "User-Agent": config.PACKAGE_USER_AGENT,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Modrinth API error (${response.status}): ${errorText}`);
        }

        const json = (await response.json()) as MinecraftVersionResponseItem[];
        if (json) {
            //sort by version type (in the order of the MINECRAFT_VERSION_TYPES array)
            json.sort((a, b) => {
                return (
                    config.MINECRAFT_VERSION_TYPE_ORDER.indexOf(a.version_type) -
                    config.MINECRAFT_VERSION_TYPE_ORDER.indexOf(b.version_type)
                );
            });
            return json.map((version) => ({
                title: version.version,
                value: version.version,
            })) as Choice[];
        } else {
            throw new Error("Could not fetch Minecraft versions");
        }
    } catch {
        logm.warn(`Could not fetch Minecraft versions. Using fallbacks.`);
        return config.FALLBACK_TARGET_MINECRAFT_VERSIONS;
    }
}

/**
 * Fetch modloaders from the Modrinth API
 * @returns An array of modloaders for use with a prompt
 */
export async function getModloaders(): Promise<Choice[]> {
    try {
        const url = config.MODRINTH_MODLOADERS_ENDPOINT;
        const response = await fetch(url, {
            headers: {
                "User-Agent": config.PACKAGE_USER_AGENT,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Modrinth API error (${response.status}): ${errorText}`);
        }

        const json = (await response.json()) as ModloaderResponseItem[];
        if (json) {
            return json.map((loader) => ({
                title: loader.name,
                value: loader.name,
            }));
        } else {
            throw new Error("Could not fetch Modloaders");
        }
    } catch {
        logm.warn(`Could not fetch Modloaders. Using fallbacks.`);
        return config.FALLBACK_MODLOADERS;
    }
}
