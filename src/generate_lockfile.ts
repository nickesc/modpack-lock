import fs from "fs/promises";
import path from "path";
import {getVersionsFromHashes} from "./modrinth_interactions.js";
import {getScanDirectories, scanDirectory} from "./directory_scanning.js";
import * as config from "./config/index.js";
import {logm, styleText} from "./logger.js";
import type {
    ContentFile,
    Lockfile,
    Options,
    InitOptions,
    ContentVersion,
    DependencyCategory,
    LockfileDependency,
} from "./types/index.js";

/**
 * Create empty lockfile structure
 */
function createEmptyLockfile(): Lockfile {
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
function createLockfile(fileEntries: ContentFile[], versionData: Record<string, ContentVersion>): Lockfile {
    const lockfile: Lockfile = createEmptyLockfile();

    logm.newline();
    // Organize by category
    for (const fileInfo of fileEntries) {
        const version: ContentVersion | undefined = versionData[fileInfo.hash];

        lockfile.dependencies[fileInfo.category] ||= [];

        const entry = {
            path: fileInfo.path,
            version: version || null,
        };

        if (!version) {
            logm.warn(`File ${fileInfo.path} not found on Modrinth`);
        }

        lockfile.dependencies[fileInfo.category]?.push(entry);
    }

    logm.header("Generating Lockfile");

    // Calculate counts for each category
    for (const [category, entries] of Object.entries(lockfile.dependencies)) {
        lockfile.counts[category as DependencyCategory] = entries.length;
    }

    lockfile.total = fileEntries.length;

    return lockfile;
}

/**
 * Write lockfile to disk
 */
async function writeLockfile(lockfile: Lockfile, outputPath: string): Promise<void> {
    const content: string = JSON.stringify(lockfile, null, 2);
    await fs.writeFile(outputPath, content, "utf-8");
    logm.generated(config.MODPACK_LOCKFILE_NAME, outputPath);
}

/**
 * Generate the lockfile
 * @param workingDir - The working directory
 * @param options - The options object
 * @returns The lockfile object
 */
export async function generateLockfile(workingDir: string, options: Options | InitOptions = {}): Promise<Lockfile> {
    logm.quietFromOptions(options);

    logm.header("Scanning Directories");

    // Scan all directories
    const allFileEntries: ContentFile[] = [];
    for (const dirInfo of getScanDirectories(workingDir)) {
        logm.info(styleText(["cyan"], `${dirInfo.name}/`));
        const fileEntries: ContentFile[] = await scanDirectory(dirInfo, workingDir);
        logm.info(
            styleText(["dim"], ` └─ Found`),
            styleText(["yellow"], `${fileEntries.length}`),
            styleText(["dim"], `file${fileEntries.length !== 1 ? "s" : ""}`),
        );
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
        logm.header("GENERATING LOCKFILE");
        logm.warn("No files found. Creating empty lockfile.");
        const emptyLockfile: Lockfile = createEmptyLockfile();
        const outputPath: string = path.join(workingDir, config.MODPACK_LOCKFILE_NAME);
        if (options.dryRun) {
            logm.debug(config.dryRunText(config.MODPACK_LOCKFILE_NAME, outputPath));
        } else {
            await writeLockfile(emptyLockfile, outputPath);
        }
        return emptyLockfile;
    }

    logm.info(styleText(["dim"], "Total:"), allFileEntries.length);
    logm.header("Querying Modrinth API");

    // Extract all hashes
    const hashes: string[] = allFileEntries.map((info) => info.hash);

    // Query Modrinth API
    const versionData: Record<string, ContentVersion> = await getVersionsFromHashes(hashes);

    logm.info(styleText(["dim"], "Found version information for:"));
    logm.info(
        styleText(["dim"], " └─"),
        styleText(["green"], `${Object.keys(versionData).length}`),
        styleText(["dim"], "out of"),
        styleText(["yellow"], `${hashes.length}`),
        styleText(["dim"], "files"),
    );

    // Create lockfile
    const lockfile: Lockfile = createLockfile(allFileEntries, versionData);

    // Write lockfile
    const outputPath: string = path.join(workingDir, config.MODPACK_LOCKFILE_NAME);
    if (options.dryRun) {
        logm.debug(config.dryRunText(config.MODPACK_LOCKFILE_NAME, outputPath));
    } else {
        await writeLockfile(lockfile, outputPath);
    }

    return lockfile;
}

/**
 * Print a summary of the lockfile contents
 * @param lockfile - The lockfile object
 */
export function printLockfileSummary(lockfile: Lockfile): void {
    logm.header("Lockfile Summary");

    if (lockfile.total === 0) {
        logm.info(styleText(["dim"], "No files found. Empty lockfile created."));
        return;
    }

    for (const [category, entries] of Object.entries(lockfile.dependencies) as [
        DependencyCategory,
        LockfileDependency[],
    ][]) {
        const withVersion: number = entries.filter((e) => e.version !== null).length;
        const withoutVersion: number = entries.length - withVersion;
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
