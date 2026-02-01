import fs from "fs/promises";
import path from "path";
import * as config from "./config/index.js";
import {logm} from "./logger.js";

/**
 * @typedef {import('./config/types.js').Options} Options
 * @typedef {import('./config/types.js').InitOptions} InitOptions
 * @typedef {import('./config/types.js').Lockfile} Lockfile
 */

/**
 * Generate .gitignore rules for files not hosted on Modrinth and write them to .gitignore file
 * @param {Lockfile} lockfile - The lockfile object
 * @param {string} workingDir - The working directory
 * @param {Options | InitOptions} options - The options object
 */
export async function generateGitignoreRules(lockfile, workingDir, options = {}) {
    const rules = [];
    const exceptions = [];

    // Base ignore patterns for each category
    for (const category of config.DEPENDENCY_CATEGORIES) {
        rules.push(`${category}/*.${category === "mods" ? "jar" : "zip"}`);
    }
    rules.push(`*/**/*.disabled`);

    // Find files not hosted on Modrinth
    for (const [category, entries] of Object.entries(lockfile.dependencies)) {
        for (const entry of entries) {
            if (entry.version === null) {
                exceptions.push(`!${entry.path}`);
            }
        }
    }

    // Add exceptions if any
    if (exceptions.length > 0) {
        rules.push("\n## Exceptions");
        rules.push(...exceptions);
    }

    const rulesContent = rules.join("\n");
    const gitignorePath = path.join(workingDir, config.GITIGNORE_NAME);

    // Read existing .gitignore file if it exists
    let existingContent = "";
    try {
        existingContent = await fs.readFile(gitignorePath, "utf-8");
    } catch (error) {
        // File doesn't exist, that's okay - we'll create it
        if (error.code !== "ENOENT") {
            logm.warn(`Could not read .gitignore file: ${error.message}`);
            return;
        }
    }

    // Find markers in existing content
    const startMarkerIndex = existingContent.indexOf(config.GITIGNORE_START_MARKER);
    const endMarkerIndex = existingContent.indexOf(config.GITIGNORE_END_MARKER);

    let newContent = "";

    if (startMarkerIndex !== -1 && endMarkerIndex !== -1 && endMarkerIndex > startMarkerIndex) {
        // Both markers exist, replace content between them
        const beforeSection = existingContent.substring(0, startMarkerIndex);
        const afterSection = existingContent.substring(endMarkerIndex + config.GITIGNORE_END_MARKER.length);

        // Remove trailing newlines from before section and leading newlines from after section
        const beforeTrimmed = beforeSection.replace(/\n+$/, "");
        const afterTrimmed = afterSection.replace(/^\n+/, "");

        const parts = [beforeTrimmed];
        if (beforeTrimmed) parts.push(""); // Add separator if there's content before
        parts.push(config.GITIGNORE_START_MARKER, rulesContent, config.GITIGNORE_END_MARKER);
        if (afterTrimmed) {
            parts.push(""); // Add separator if there's content after
            parts.push(afterTrimmed);
        }

        newContent = parts.join("\n");
    } else if (startMarkerIndex !== -1 || endMarkerIndex !== -1) {
        // Only one marker exists, append to end
        const trimmed = existingContent.replace(/\n+$/, "");
        newContent = [trimmed, "", config.GITIGNORE_START_MARKER, rulesContent, config.GITIGNORE_END_MARKER].join("\n");
    } else {
        // No markers exist, append to end
        if (existingContent.trim() === "") {
            // File is empty or only whitespace
            newContent = [config.GITIGNORE_START_MARKER, rulesContent, config.GITIGNORE_END_MARKER].join("\n");
        } else {
            // File has content, append with newline
            const trimmed = existingContent.replace(/\n+$/, "");
            newContent = [trimmed, "", config.GITIGNORE_START_MARKER, rulesContent, config.GITIGNORE_END_MARKER].join(
                "\n",
            );
        }
    }

    // Write the updated content
    if (options.dryRun) {
        logm.debug(config.dryRunText(config.GITIGNORE_NAME, gitignorePath));
    } else {
        try {
            await fs.writeFile(gitignorePath, newContent, "utf-8");
            logm.log(`Updated ${config.GITIGNORE_NAME}: ${gitignorePath}`);
        } catch (error) {
            logm.warn(`Could not write ${config.GITIGNORE_NAME} file: ${error.message}`);
        }
    }
}
