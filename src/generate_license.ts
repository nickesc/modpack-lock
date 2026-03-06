import fs from "fs/promises";
import path from "path";
import {getLicenseText} from "./github_interactions.js";
import * as config from "./config/index.js";
import {logm} from "./logger.js";
import type {Jsonfile, Options, InitOptions} from "./types/index.js";

async function writeLicense(licenseText: string, outputPath: string) {
    await fs.writeFile(path.join(outputPath, config.MODPACK_LICENSE_NAME), licenseText, "utf-8");
    logm.generated(config.MODPACK_LICENSE_NAME, path.join(outputPath, config.MODPACK_LICENSE_NAME));
}

/**
 * Generate a license file
 * @param modpackInfo - The modpack information
 * @param workingDir - The path to write the license to
 * @param options - The options object
 * @param licenseTextOverride - Text to override the license's default content
 * @returns The license text or null if the license text could not be generated
 */
export default async function generateLicense(
    modpackInfo: Jsonfile,
    workingDir: string,
    options: Options | InitOptions = {},
    licenseTextOverride?: string,
): Promise<string | null> {
    logm.quietFromOptions(options);

    try {
        const spdxId = modpackInfo.license;

        let licenseText = licenseTextOverride || (await getLicenseText(spdxId));
        if (!licenseText) {
            throw new Error(`License text could not be generated for: ${spdxId}`);
        }

        licenseText = licenseText.replace("[year]", String(new Date().getFullYear()));
        licenseText = licenseText.replace("{{year}}", String(new Date().getFullYear()));
        licenseText = licenseText.replace("[fullname]", modpackInfo.author);
        licenseText = licenseText.replace("{{fullname}}", modpackInfo.author);
        licenseText = licenseText.replace("[organization]", modpackInfo.author);
        licenseText = licenseText.replace("{{organization}}", modpackInfo.author);
        licenseText = licenseText.replace("[project]", modpackInfo.name);
        licenseText = licenseText.replace("{{project}}", modpackInfo.name);

        if (options.dryRun) {
            logm.debug(
                config.dryRunText(config.MODPACK_LICENSE_NAME, path.join(workingDir, config.MODPACK_LICENSE_NAME)),
            );
        } else {
            await writeLicense(licenseText, workingDir);
        }
        return licenseText;
    } catch {
        logm.warn(`Unable to generate license for: ${modpackInfo.license}`);
        return null;
    }
}
