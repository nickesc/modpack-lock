import fs from "fs/promises";
import path from "path";
import {getProjects} from "./modrinth_interactions.js";
import * as config from "./config/index.js";
import {logm} from "./logger.js";
import type {ModpackInfo, Lockfile, Jsonfile, Options, InitOptions, DependencyCategory} from "./types/index.js";

/**
 * Create a JSON object from the modpack information and dependencies
 */
function createModpackJson(
    modpackInfo: ModpackInfo, //
    dependencies: Record<DependencyCategory, string[]>,
): Jsonfile {
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
 * @param {ModpackInfo} modpackInfo - The modpack information
 * @param {Lockfile} lockfile - The lockfile
 * @param {string} workingDir - The path to write the JSON object to
 * @param {Options | InitOptions} options - The options object
 * @returns {Promise<Lockfile>} The JSON file's object
 */
export default async function generateJson(
    modpackInfo: ModpackInfo,
    lockfile: Lockfile,
    workingDir: string,
    options: Options | InitOptions = {},
): Promise<Jsonfile> {
    logm.quietFromOptions(options);

    // Validate modpack info
    for (const field of config.MODPACK_INFO_REQUIRED_FIELDS) {
        if (!modpackInfo[field as keyof ModpackInfo]) {
            throw new Error(`Modpack info is missing required field: ${field}`);
        }
    }

    //TODO: consider changing these to partial records and only initializing the categories that are present in the lockfile
    const projectIds: Record<DependencyCategory, Set<string>> = {
        mods: new Set(),
        resourcepacks: new Set(),
        datapacks: new Set(),
        shaderpacks: new Set(),
    };
    const packDependencies: Record<DependencyCategory, string[]> = {
        mods: [],
        resourcepacks: [],
        datapacks: [],
        shaderpacks: [],
    };

    // Collect project IDs from lockfile
    if (lockfile)
        if (lockfile.dependencies) {
            for (const category of config.DEPENDENCY_CATEGORIES) {
                if (lockfile.dependencies[category]) {
                    // TODO: consider initializing the categories with an empty array/set here
                    for (const entry of lockfile.dependencies[category]) {
                        if (entry.version && entry.version.project_id) {
                            projectIds[category].add(entry.version.project_id);
                        } else {
                            packDependencies[category].push(entry.path);
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

            // Add projects to dependencies by category
            for (const category of config.DEPENDENCY_CATEGORIES) {
                for (const projectId of projectIds[category]) {
                    const projectSlug: string | undefined = projectsMap[projectId];
                    if (projectSlug) {
                        packDependencies[category].push(projectSlug);
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
