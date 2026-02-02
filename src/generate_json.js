import fs from "fs/promises";
import path from "path";
import {getProjects} from "./modrinth_interactions.js";
import * as config from "./config/index.js";
import {logm} from "./logger.js";

/**
 * @typedef {import('./config/types.js').ModpackInfo} ModpackInfo
 * @typedef {import('./config/types.js').Options} Options
 * @typedef {import('./config/types.js').InitOptions} InitOptions
 * @typedef {import('./config/types.js').Lockfile} Lockfile
 */

/**
 * Create a JSON object from the modpack information and dependencies
 */
function createModpackJson(modpackInfo, dependencies) {
    return {
        ...modpackInfo,
        dependencies: dependencies,
    };
}

/**
 * Write modpack.json to disk
 */
async function writeJson(jsonObject, outputPath) {
    const content = JSON.stringify(jsonObject, null, 2);
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
export default async function generateJson(modpackInfo, lockfile, workingDir, options = {}) {
    logm.quietFromOptions(options);

    // Validate modpack info
    for (const field of config.MODPACK_INFO_REQUIRED_FIELDS) {
        if (!modpackInfo[field]) {
            throw new Error(`Modpack info is missing required field: ${field}`);
        }
    }

    const projectIds = {};
    const packDependencies = {};
    for (const category of config.DEPENDENCY_CATEGORIES) {
        projectIds[category] = new Set();
        packDependencies[category] = [];
    }

    // Collect project IDs from lockfile
    if (lockfile)
        if (lockfile.dependencies) {
            for (const [category, entries] of Object.entries(lockfile.dependencies)) {
                for (const entry of entries) {
                    if (entry.version && entry.version.project_id) {
                        projectIds[category].add(entry.version.project_id);
                    } else {
                        packDependencies[category].push(entry.path);
                    }
                }
            }
            const allProjectIds = new Set();
            for (const category of config.DEPENDENCY_CATEGORIES) {
                for (const projectId of projectIds[category]) {
                    allProjectIds.add(projectId);
                }
            }

            // Fetch projects from Modrinth
            const projects = await getProjects(Array.from(allProjectIds));
            const projectsMap = {};
            for (const project of projects) {
                projectsMap[project.id] = project.slug;
            }

            // Add projects to dependencies by category
            for (const category of config.DEPENDENCY_CATEGORIES) {
                for (const projectId of projectIds[category]) {
                    const projectSlug = projectsMap[projectId];
                    if (projectSlug) {
                        packDependencies[category].push(projectSlug);
                    }
                }
            }
        }

    // Create modpack JSON object
    const jsonObject = createModpackJson(modpackInfo, packDependencies);

    // Write modpack JSON object to disk
    if (options.dryRun) {
        logm.debug(config.dryRunText(config.MODPACK_JSON_NAME, path.join(workingDir, config.MODPACK_JSON_NAME)));
    } else {
        await writeJson(jsonObject, workingDir);
    }

    return jsonObject;
}
