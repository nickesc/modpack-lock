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
export default async function generateJson(modpackInfo, dependencies, path) {
    // Validate modpack info
    for (const field of MODPACK_INFO_REQUIRED_FIELDS) {
        if (!modpackInfo[field]) {
            throw new Error(`Modpack info is missing required field: ${field}`);
        }
    }

    // Generate lockfile
    const lockfile = await generateLockfile({ path: path });

    // Collect unique project IDs from lockfile
    const projectIds = {
        mods: new Set(),
        resourcepacks: new Set(),
        shaderpacks: new Set(),
        datapacks: new Set(),
    };

    const unknownProjects = {
        mods: [],
        resourcepacks: [],
        shaderpacks: [],
        datapacks: [],
    };

    for (const [category, entries] of Object.entries(lockfile.dependencies)) {
        for (const entry of entries) {
            if (entry.version && entry.version.project_id) {
                projectIds[category].add(entry.version.project_id);
            } else {
                unknownProjects[category].push(entry);
            }
        }
    }

    // Fetch projects and users in parallel
    console.log(`Fetching data for ${projectIds.size} project(s)...`);

    const [mods, resourcepacks, shaderpacks, datapacks] = await Promise.all([
        getProjects(Array.from(projectIds['mods'])),
        getProjects(Array.from(projectIds['resourcepacks'])),
        getProjects(Array.from(projectIds['shaderpacks'])),
        getProjects(Array.from(projectIds['datapacks'])),
    ]);

    const packDependencies = {
        mods: mods.map(mod => mod.slug),
        resourcepacks: resourcepacks.map(resourcepack => resourcepack.slug),
        shaderpacks: shaderpacks.map(shaderpack => shaderpack.slug),
        datapacks: datapacks.map(datapack => datapack.slug),
    };

    // Add unknown projects to dependencies
    for (const category of ['mods', 'resourcepacks', 'shaderpacks', 'datapacks']) {
        packDependencies[category].push(...unknownProjects[category].map(item => item.path));
    }

    // Create modpack JSON object
    const jsonObject = createModpackJson(packDependencies);

    // Write modpack JSON object to disk
    await writeJson(jsonObject, path);
}



