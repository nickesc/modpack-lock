import fs from 'fs/promises';
import path from 'path';
import generateLockfile from './generate-lockfile.js';
import { getProjects } from './modrinth_interactions.js';

const MODPACK_JSON_NAME = 'modpack.json';
const MODPACK_INFO_REQUIRED_FIELDS = [
    "name",
    "version",
    "id",
    "author",
    "modloader",
    "targetMinecraftVersion"
];
const DEPENDENCY_CATEGORIES = ['mods', 'resourcepacks', 'shaderpacks', 'datapacks'];

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
    await fs.writeFile(path.join(outputPath, MODPACK_JSON_NAME), content, 'utf-8');
    console.log(`modpack.json written to: ${path.join(outputPath, MODPACK_JSON_NAME)}`);
}

/**
 * Generate a modpack.json file
 * @param {Object} modpackInfo - The modpack information
 * @param {Object} dependencies - The dependencies
 * @param {string} path - The path to write the JSON object to
 */
export default async function generateJson(modpackInfo, lockfile, path) {
    // Validate modpack info
    for (const field of MODPACK_INFO_REQUIRED_FIELDS) {
        if (!modpackInfo[field]) {
            throw new Error(`Modpack info is missing required field: ${field}`);
        }
    }

    const projectIds = {
        mods: new Set(),
        resourcepacks: new Set(),
        shaderpacks: new Set(),
        datapacks: new Set(),
    };
    const packDependencies = {
        mods: [],
        resourcepacks: [],
        shaderpacks: [],
        datapacks: [],
    };

    // Collect project IDs from lockfile
    for (const [category, entries] of Object.entries(lockfile.dependencies)) {
        for (const entry of entries) {
            if (entry.version && entry.version.project_id) {
                projectIds[category].add(entry.version.project_id);
                //allProjectIds.add(entry.version.project_id);
            } else {
                packDependencies[category].push(entry.path);
            }
        }
    }

    const allProjectIds = new Set([...projectIds.mods, ...projectIds.resourcepacks, ...projectIds.shaderpacks, ...projectIds.datapacks]);

    // Fetch projects from Modrinth
    const projects = await getProjects(Array.from(allProjectIds));
    const projectsMap = {};
    for (const project of projects) {
        projectsMap[project.id] = project.slug;
    }

    // Add projects to dependencies by category
    for (const category of ['mods', 'resourcepacks', 'shaderpacks', 'datapacks']){
        for (const projectId of projectIds[category]) {
            packDependencies[category].push(projectsMap[projectId]);
        }
        //packDependencies[category].push(...packDependencies[category].map(item => item.path));
    }

    // Create modpack JSON object
    const jsonObject = createModpackJson(modpackInfo, packDependencies);

    // Write modpack JSON object to disk
    await writeJson(jsonObject, path);
}



