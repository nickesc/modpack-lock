import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import * as files from './config/files.js';
import * as constants from './config/constants.js';

/**
 * Get the directories to scan for modpack files
 */
export function getScanDirectories(directoryPath) {
    const scanDirectories = [];
    for (const category of constants.DEPENDENCY_CATEGORIES) {
        scanDirectories.push({ name: category, path: path.join(directoryPath, category) });
    }
    return scanDirectories;
}

/**
 * Calculate SHA1 hash of a file
 */
async function calculateSHA1(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha1').update(fileBuffer).digest('hex');
}

/**
 * Find all files in a directory
 */
async function findFiles(dirPath) {
    const files = [];

    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isFile() && (entry.name.endsWith('.jar') || entry.name.endsWith('.zip'))) {
                const fullPath = path.join(dirPath, entry.name);
                files.push(fullPath);
            }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.warn(`Warning: Could not read directory ${dirPath}: ${error.message}`);
        }
    }

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
            console.warn(`Warning: Could not hash file ${filePath}: ${error.message}`);
        }
    }

    return fileEntries;
}

/**
 * Scan for existing JSON file and return the JSON object if it exists
 */
export async function getModpackJson(directoryPath) {
    const jsonPath = path.join(directoryPath, files.MODPACK_JSON_NAME);
    // try to read the file
    try {
        const fileContent = await fs.readFile(jsonPath, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw new Error(`Warning: Could not read file ${jsonPath}: ${error.message}`);
        } else {
            return null;
        }
    }
}
