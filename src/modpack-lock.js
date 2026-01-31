import {generateLockfile} from "./generate_lockfile.js";
import {generateReadmeFiles} from "./generate_readme.js";
import {generateGitignoreRules} from "./generate_gitignore.js";
import generateJson from "./generate_json.js";
import generateLicense from "./generate_license.js";
import {promptUserForInfo} from "./modpack_info.js";
import {getModpackInfo, getLockfile} from "./directory_scanning.js";

/**
 * @typedef {import('./config/types.js').ModpackInfo} ModpackInfo
 * @typedef {import('./config/types.js').Options} Options
 * @typedef {import('./config/types.js').InitOptions} InitOptions
 * @typedef {import('./config/types.js').Lockfile} Lockfile
 */

/**
 * @license MIT
 * @author nickesc
 * @module modpack-lock
 */

/**
 * Generate the modpack files (lockfile, JSON, and optionally license, gitignore, and readme)
 * @param {ModpackInfo} modpackInfo - The modpack information
 * @param {string} directory - The directory to generate the files in
 * @param {Options | InitOptions } options - The options object
 * @returns {Promise<Lockfile>} The lockfile object
 */
async function generateModpackFiles(modpackInfo, directory, options = {}) {
    const lockfile = await generateLockfile(directory, options);

    // Generate license if requested
    if (options.licenseFile) {
        await generateLicense(modpackInfo, directory, options);
    }

    // Generate gitignore if requested
    if (options.gitignore) {
        await generateGitignoreRules(lockfile, directory, options);
    }

    // Generate README files if requested
    if (options.readme) {
        await generateReadmeFiles(lockfile, directory, options);
    }

    await generateJson(modpackInfo, lockfile, directory, options);
    return lockfile;
}

export {
    generateModpackFiles,
    generateJson,
    generateLockfile,
    generateGitignoreRules,
    generateReadmeFiles,
    generateLicense,
    getModpackInfo,
    getLockfile,
    promptUserForInfo,
};
