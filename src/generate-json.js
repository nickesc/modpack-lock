import fs from 'fs/promises';
import path from 'path';

const MODPACK_JSON_NAME = 'modpack.json';
const MODPACK_INFO_REQUIRED_FIELDS = [
    "name",
    "version",
    "id",
    "author",
    "modloader",
    "targetMinecraftVersion"
];

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

    // Create modpack JSON object
    const jsonObject = createModpackJson(modpackInfo, dependencies);

    // Write modpack JSON object to disk
    await writeJson(jsonObject, path);
}



