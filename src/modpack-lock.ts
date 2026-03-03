import {generateLockfile} from "./generate_lockfile.js";
import {generateReadmeFiles} from "./generate_readme.js";
import {generateGitignoreRules} from "./generate_gitignore.js";
import generateJson from "./generate_json.js";
import generateLicense from "./generate_license.js";
import {logm} from "./logger.js";
import {promptUserForInfo} from "./modpack_info.js";
import {getModpackInfo, getLockfile} from "./directory_scanning.js";
import type {Jsonfile, Options, InitOptions, Lockfile} from "./types/index.js";

/**
 * @license MIT
 * @author nickesc
 * @module modpack-lock
 */

/**
 * Generate the modpack files (lockfile, JSON, and optionally license, gitignore, and readme)
 * @param {Jsonfile} modpackInfo - The modpack information
 * @param {string} workingDir - The directory to generate the files in
 * @param {Options | InitOptions } options - The options object
 * @returns {Promise<Lockfile>} The lockfile object
 */
async function generateModpackFiles(
    modpackInfo: Jsonfile,
    workingDir: string,
    options: Options | InitOptions = {},
): Promise<Lockfile> {
    logm.quietFromOptions(options);

    const lockfile: Lockfile = await generateLockfile(workingDir, options);

    await generateJson(modpackInfo, lockfile, workingDir, options);

    if (options.licenseFile || options.gitignore || options.readme) {
        logm.header("Generating Optional Files");
    }

    // Generate license if requested
    if (options.licenseFile) {
        await generateLicense(modpackInfo, workingDir, options);
    }

    // Generate gitignore if requested
    if (options.gitignore) {
        await generateGitignoreRules(lockfile, workingDir, options);
    }

    // Generate README files if requested
    if (options.readme) {
        await generateReadmeFiles(lockfile, workingDir, options);
    }

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
