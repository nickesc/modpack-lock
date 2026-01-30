import fs from "fs/promises";
import path from "path";
import {getLicenseText} from "./github_interactions.js";
import * as config from "./config/index.js";

/**
 * @typedef {import('./config/types.js').ModpackInfo} ModpackInfo
 * @typedef {import('./config/types.js').Options} Options
 * @typedef {import('./config/types.js').InitOptions} InitOptions
 */

async function writeLicense(licenseText, outputPath) {
    await fs.writeFile(path.join(outputPath, config.MODPACK_LICENSE_NAME), licenseText, "utf-8");
    console.log(`${config.MODPACK_LICENSE_NAME} written to: ${path.join(outputPath, config.MODPACK_LICENSE_NAME)}`);
}

/**
 * Write a license to a file
 * @param {ModpackInfo} modpackInfo - The modpack information
 * @param {string} outputPath - The path to write the license to
 * @param {InitOptions} options - The initialization options object
 * @param {string} licenseTextOverride - The license text to override the default license text with
 * @returns {Promise<string> | null} The license text or null if the license text could not be generated
 */
export default async function generateLicense(modpackInfo, outputPath, options = {}, licenseTextOverride = null) {
    try {
        const spdxId = modpackInfo.license;
        console.log(`Generating license for: ${spdxId}`);

        let licenseText = licenseTextOverride || (await getLicenseText(spdxId));
        licenseText = licenseText.replace("[year]", new Date().getFullYear());
        licenseText = licenseText.replace("{{year}}", new Date().getFullYear());
        licenseText = licenseText.replace("[fullname]", modpackInfo.author);
        licenseText = licenseText.replace("{{fullname}}", modpackInfo.author);
        licenseText = licenseText.replace("[organization]", modpackInfo.author);
        licenseText = licenseText.replace("{{organization}}", modpackInfo.author);
        licenseText = licenseText.replace("[project]", modpackInfo.name);
        licenseText = licenseText.replace("{{project}}", modpackInfo.name);

        if (options.dryRun) {
            console.log(
                config.dryRunText(config.MODPACK_LICENSE_NAME, path.join(outputPath, config.MODPACK_LICENSE_NAME)),
            );
        } else {
            await writeLicense(licenseText, outputPath);
        }
        return licenseText;
    } catch (error) {
        console.warn(`Warning: unable to generate license for: ${modpackInfo.license}`);
        return null;
    }
}
