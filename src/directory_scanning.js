import fs from "fs/promises";
import crypto from "crypto";
import path from "path";
import * as config from "./config/index.js";
import {logm} from "./logger.js";

/**
 * @typedef {import('./config/types.js').ModpackInfo} ModpackInfo
 * @typedef {import('./config/types.js').Lockfile} Lockfile
 */

/**
 * Get the directories to scan for modpack files
 * @param {string} directoryPath - The path to the directory to scan
 * @returns {Array<Object>} The directories to scan
 */
export function getScanDirectories(directoryPath) {
    const scanDirectories = [];
    for (const category of config.DEPENDENCY_CATEGORIES) {
        scanDirectories.push({name: category, path: path.join(directoryPath, category)});
    }
    return scanDirectories;
}

/**
 * Calculate SHA1 hash of a file
 */
async function calculateSHA1(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash("sha1").update(fileBuffer).digest("hex");
}

/**
 * Find all files in a directory
 */
async function findFiles(dirPath) {
    const files = [];

    try {
        const entries = await fs.readdir(dirPath, {withFileTypes: true});

        for (const entry of entries) {
            if (entry.isFile() && (entry.name.endsWith(".jar") || entry.name.endsWith(".zip"))) {
                const fullPath = path.join(dirPath, entry.name);
                files.push(fullPath);
            }
        }
    } catch (error) {
        if (error.code !== "ENOENT") {
            logm.warn(`Could not read directory ${dirPath}: ${error.message}`);
        }
    }

    files.sort((a, b) => a.localeCompare(b, "en", {numeric: true, sensitivity: "base"}));
    return files;
}

/**
 * Scan a directory and return file info with hashes
 */
export async function scanDirectory(dirInfo, workspaceRoot) {
    const files = await findFiles(dirInfo.path);
    const fileEntries = [];

    for (const filePath of files) {
        try {
            const hash = await calculateSHA1(filePath);
            const relativePath = path.relative(workspaceRoot, filePath);

            fileEntries.push({
                path: relativePath,
                fullPath: filePath,
                hash: hash,
                category: dirInfo.name,
            });
        } catch (error) {
            logm.warn(`Could not hash file ${filePath}: ${error.message}`);
        }
    }

    return fileEntries;
}

/**
 * Scan for existing JSON file and return the JSON object if it exists
 */
async function getJsonFile(directoryPath, filename) {
    const jsonPath = path.join(directoryPath, filename);
    // try to read the file
    try {
        const fileContent = await fs.readFile(jsonPath, "utf-8");
        return JSON.parse(fileContent);
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw new Error(`Error: Could not read file ${jsonPath}: ${error.message}`);
        } else {
            return null;
        }
    }
}

/**
 * Get the modpack info from the JSON file if it exists
 * @param {string} directoryPath - The path to the directory to scan
 * @returns {Promise<ModpackInfo|null>} The modpack info JSON object if the file exists, otherwise null
 */
export async function getModpackInfo(directoryPath) {
    return getJsonFile(directoryPath, config.MODPACK_JSON_NAME);
}

/**
 * Get the lockfile file if it exists
 * @param {string} directoryPath - The path to the directory to scan
 * @returns {Lockfile|null} The JSON object if the file exists, otherwise null
 */
export async function getLockfile(directoryPath) {
    return getJsonFile(directoryPath, config.MODPACK_LOCKFILE_NAME);
}
