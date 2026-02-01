import fs from "fs/promises";
import path from "path";
import {getVersionsFromHashes} from "./modrinth_interactions.js";
import {getScanDirectories, scanDirectory} from "./directory_scanning.js";
import * as config from "./config/index.js";
import {logm, styleText} from "./logger.js";

/**
 * @typedef {import('./config/types.js').Options} Options
 * @typedef {import('./config/types.js').InitOptions} InitOptions
 * @typedef {import('./config/types.js').Lockfile} Lockfile
 */

/**
 * Create empty lockfile structure
 */
function createEmptyLockfile() {
    return {
        version: config.LOCKFILE_VERSION,
        generated: new Date().toISOString(),
        total: 0,
        counts: {},
        dependencies: {},
    };
}

/**
 * Create lockfile structure from file info and version data
 */
function createLockfile(fileEntries, versionData) {
    const lockfile = createEmptyLockfile();

    // Organize by category
    for (const fileInfo of fileEntries) {
        const version = versionData[fileInfo.hash];

        lockfile.dependencies[fileInfo.category] ||= [];

        const entry = {
            path: fileInfo.path,
            version: version || null,
        };

        if (!version) {
            logm.warn(`File ${fileInfo.path} not found on Modrinth`);
        }

        lockfile.dependencies[fileInfo.category].push(entry);
    }

    // Calculate counts for each category
    for (const [category, entries] of Object.entries(lockfile.dependencies)) {
        lockfile.counts[category] = entries.length;
    }

    lockfile.total = fileEntries.length;

    return lockfile;
}

/**
 * Write lockfile to disk
 */
async function writeLockfile(lockfile, outputPath) {
    const content = JSON.stringify(lockfile, null, 2);
    await fs.writeFile(outputPath, content, "utf-8");
    logm.log(`${config.MODPACK_LOCKFILE_NAME} written to: ${outputPath}`);
}

/**
 * Generate the lockfile
 * @param {string} workingDir - The working directory
 * @param {Options} options - The options object
 * @returns {Lockfile} The lockfile object
 */
export async function generateLockfile(workingDir, options = {}) {
    logm.header("Scanning Directories");

    // Scan all directories
    const allFileEntries = [];
    for (const dirInfo of getScanDirectories(workingDir)) {
        logm.info(styleText(["cyan"], `${dirInfo.name}/`));
        const fileEntries = await scanDirectory(dirInfo, workingDir);
        logm.info(styleText(["dim"], ` └─ Found ${fileEntries.length} file${fileEntries.length !== 1 ? "s" : ""}`));
        allFileEntries.push(...fileEntries);
    }

    // Sort file entries
    allFileEntries.sort((a, b) => {
        if (a.category !== b.category) {
            return a.category.localeCompare(b.category, "en", {sensitivity: "base"});
        }
        return a.path.localeCompare(b.path, "en", {numeric: true, sensitivity: "base"});
    });

    if (allFileEntries.length === 0) {
        logm.warn("No files found. Creating empty lockfile.");
        const emptyLockfile = createEmptyLockfile();
        const outputPath = path.join(workingDir, config.MODPACK_LOCKFILE_NAME);
        if (options.dryRun) {
            logm.info(config.dryRunText(config.MODPACK_LOCKFILE_NAME, outputPath));
        } else {
            await writeLockfile(emptyLockfile, outputPath);
        }
        return emptyLockfile;
    }

    logm.info(styleText(["dim"], "Total:"), allFileEntries.length);
    logm.header("Querying Modrinth API");

    // Extract all hashes
    const hashes = allFileEntries.map((info) => info.hash);

    // Query Modrinth API
    const versionData = await getVersionsFromHashes(hashes);

    logm.log(`Found version information for ${Object.keys(versionData).length} out of ${hashes.length} files`);

    // Create lockfile
    const lockfile = createLockfile(allFileEntries, versionData);

    // Write lockfile
    const outputPath = path.join(workingDir, config.MODPACK_LOCKFILE_NAME);
    if (options.dryRun) {
        logm.debug(config.dryRunText(config.MODPACK_LOCKFILE_NAME, outputPath));
    } else {
        await writeLockfile(lockfile, outputPath);
    }

    return lockfile;
}

/**
 * Print a summary of the lockfile contents
 * @param {Lockfile} lockfile - The lockfile object
 */
export function printLockfileSummary(lockfile) {
    logm.header("Lockfile Summary");

    for (const [category, entries] of Object.entries(lockfile.dependencies)) {
        const withVersion = entries.filter((e) => e.version !== null).length;
        const withoutVersion = entries.length - withVersion;
        logm.info(
            styleText(["bold"], `${category}:`),
            entries.length,
            styleText(["dim"], `file${entries.length !== 1 ? "s" : ""}`),
        );
        logm.info(
            styleText(["dim"], " └─"),
            styleText(["green"], String(withVersion)),
            styleText(["dim"], "found,"),
            styleText(["yellow"], String(withoutVersion)),
            styleText(["dim"], "unknown"),
        );
    }
}
