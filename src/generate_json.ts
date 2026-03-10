import fs from "fs/promises";
import path from "path";
import {getProjects} from "./modrinth_interactions.js";
import * as config from "./config/index.js";
import {logm} from "./logger.js";
import type {Lockfile, Jsonfile, Options, InitOptions, DependencyCategory, DependencyMap} from "./types/index.js";

/**
 * Normalize dependencies from the legacy array-of-strings format to the
 * current versioned-object format. Passes through objects unchanged.
 * @param dependencies - The raw dependencies object from modpack.json
 * @returns Normalized dependencies with {@link DependencyMap} entries per category
 */
export function normalizeDependencies(
    dependencies: Jsonfile["dependencies"] | null,
): Partial<Record<DependencyCategory, DependencyMap>> {
    if (!dependencies || typeof dependencies !== "object") return {};

    const normalized: Partial<Record<DependencyCategory, DependencyMap>> = {};
    for (const [key, entries] of Object.entries(dependencies)) {
        const category = key as DependencyCategory;
        if (Array.isArray(entries)) {
            const map: DependencyMap = {};
            for (const entry of entries) {
                map[entry] = "*";
            }
            normalized[category] = map;
        } else if (typeof entries === "object" && entries !== null) {
            normalized[category] = entries as DependencyMap;
        } else {
            normalized[category] = {};
        }
    }
    return normalized;
}

/**
 * Create a JSON object from the modpack information and dependencies
 */
function createModpackJson(modpackInfo: Jsonfile, dependencies: Record<DependencyCategory, DependencyMap>): Jsonfile {
    return {
        ...modpackInfo,
        dependencies: dependencies,
    };
}

/**
 * Write modpack.json to disk
 */
async function writeJson(jsonObject: Jsonfile, outputPath: string): Promise<void> {
    const content: string = JSON.stringify(jsonObject, null, 2);
    await fs.writeFile(path.join(outputPath, config.MODPACK_JSON_NAME), content, "utf-8");
    logm.generated(config.MODPACK_JSON_NAME, path.join(outputPath, config.MODPACK_JSON_NAME));
}

/**
 * Generate a modpack.json file
 * @param modpackInfo - The modpack information
 * @param lockfile - The lockfile
 * @param workingDir - The path to write the JSON object to
 * @param options - The options object
 * @returns The JSON file's object
 */
export async function generateJson(
    modpackInfo: Jsonfile,
    lockfile: Lockfile,
    workingDir: string,
    options: Options | InitOptions = {},
): Promise<Jsonfile> {
    logm.quietFromOptions(options);

    // Validate modpack info
    const missingFields: string[] = [];
    for (const field of config.MODPACK_INFO_REQUIRED_FIELDS) {
        if (!modpackInfo[field]) {
            missingFields.push(field);
        }
    }

    if (missingFields.length > 0) {
        throw new Error(`Modpack info is missing required fields: ${missingFields.join(", ")}`);
    }

    //TODO: consider changing these to partial records and only initializing the categories that are present in the lockfile
    const projectIds: Record<DependencyCategory, Set<string>> = {
        mods: new Set(),
        resourcepacks: new Set(),
        datapacks: new Set(),
        shaderpacks: new Set(),
    };
    const versionNumbers: Record<string, string> = {};
    const packDependencies: Record<DependencyCategory, DependencyMap> = {
        mods: {},
        resourcepacks: {},
        datapacks: {},
        shaderpacks: {},
    };

    // Collect project IDs and version numbers from lockfile
    if (lockfile)
        if (lockfile.dependencies) {
            for (const category of config.DEPENDENCY_CATEGORIES) {
                if (lockfile.dependencies[category]) {
                    // TODO: consider initializing the categories with an empty object/set here
                    for (const entry of lockfile.dependencies[category]) {
                        if (entry.version && entry.version.project_id) {
                            projectIds[category].add(entry.version.project_id);
                            versionNumbers[entry.version.project_id] = entry.version.version_number || "*";
                        } else {
                            packDependencies[category][entry.path] = "*";
                        }
                    }
                }
            }
            const allProjectIds: Set<string> = new Set();
            for (const category of config.DEPENDENCY_CATEGORIES) {
                for (const projectId of projectIds[category]) {
                    allProjectIds.add(projectId);
                }
            }

            // Fetch projects from Modrinth
            const projects = await getProjects(Array.from(allProjectIds));
            const projectsMap: Record<string, string> = {};
            for (const project of projects) {
                if (project.id || project.slug) {
                    projectsMap[project.id] = project.slug || project.id;
                }
            }

            // Add projects to dependencies by category with their version numbers
            for (const category of config.DEPENDENCY_CATEGORIES) {
                for (const projectId of projectIds[category]) {
                    const projectSlug: string | undefined = projectsMap[projectId];
                    if (projectSlug) {
                        packDependencies[category][projectSlug] = versionNumbers[projectId] || "*";
                    }
                }
            }
        }

    // Create modpack JSON object
    const jsonObject: Jsonfile = createModpackJson(modpackInfo, packDependencies);

    // Write modpack JSON object to disk
    if (options.dryRun) {
        logm.debug(config.dryRunText(config.MODPACK_JSON_NAME, path.join(workingDir, config.MODPACK_JSON_NAME)));
    } else {
        await writeJson(jsonObject, workingDir);
    }

    return jsonObject;
}
