import fs from 'fs/promises';
import path from 'path';
import { getVersionsFromHashes, getProjects, getUsers } from './modrinth_interactions.js';
import { getScanDirectories, scanDirectory } from './directory_scanning.js';
import * as config from './config/index.js';

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
            console.warn(`Warning: File ${fileInfo.path} not found on Modrinth`);
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
    await fs.writeFile(outputPath, content, 'utf-8');
    console.log(`Lockfile written to: ${outputPath}`);
}

/**
 * Generate README.md content for a category
 */
function generateCategoryReadme(category, entries, projectsMap, usersMap) {
    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
    const lines = [`# ${categoryTitle}`, '', '| Name | Author | Version |', '|-|-|-|'];

    // Map category to Modrinth URL path segment
    const categoryPathMap = {};
    for (const category of config.DEPENDENCY_CATEGORIES) {
        categoryPathMap[category] = category === 'shaderpacks' ? 'shader' : category.toLowerCase().slice(0, -1);
    }
    const categoryPath = categoryPathMap[category] || 'project';

    for (const entry of entries) {
        const version = entry.version;
        let nameCell = '';
        let authorCell = '';
        let versionCell = '';

        if (version && version.project_id) {
            const project = projectsMap[version.project_id];
            const author = version.author_id ? usersMap[version.author_id] : null;

            // Name column with icon and link
            if (project) {
                const projectName = project.title || project.slug || 'Unknown';
                const projectSlug = project.slug || project.id;
                const projectUrl = `https://modrinth.com/${categoryPath}/${projectSlug}`;

                if (project.icon_url) {
                    nameCell = `<img alt="Icon" src="${project.icon_url}" height="20px"> [${projectName}](${projectUrl})`;
                } else {
                    nameCell = `[${projectName}](${projectUrl})`;
                }
            } else {
                // Project not found, use filename
                const fileName = path.basename(entry.path);
                nameCell = fileName;
            }

            // Author column with avatar and link
            if (author) {
                const authorName = author.username || 'Unknown';
                const authorUrl = `https://modrinth.com/user/${authorName}`;

                if (author.avatar_url) {
                    authorCell = `<img alt="Avatar" src="${author.avatar_url}" height="20px"> [${authorName}](${authorUrl})`;
                } else {
                    authorCell = `[${authorName}](${authorUrl})`;
                }
            } else {
                authorCell = 'Unknown';
            }

            // Version column
            versionCell = version.version_number || 'Unknown';
        } else {
            // File not found on Modrinth
            const fileName = path.basename(entry.path);
            nameCell = fileName;
            authorCell = 'Unknown';
            versionCell = '-';
        }

        lines.push(`| ${nameCell} | ${authorCell} | ${versionCell} |`);
    }

    return lines.join('\n') + '\n';
}

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
        rules.push('\n## Exceptions');
        rules.push(...exceptions);
    }

    const rulesContent = rules.join('\n');
    const gitignorePath = path.join(workingDir, config.GITIGNORE_NAME);

    // Read existing .gitignore file if it exists
    let existingContent = '';
    try {
        existingContent = await fs.readFile(gitignorePath, 'utf-8');
    } catch (error) {
        // File doesn't exist, that's okay - we'll create it
        if (error.code !== 'ENOENT') {
            console.warn(`Warning: Could not read .gitignore file: ${error.message}`);
            return;
        }
    }

    // Find markers in existing content
    const startMarkerIndex = existingContent.indexOf(config.GITIGNORE_START_MARKER);
    const endMarkerIndex = existingContent.indexOf(config.GITIGNORE_END_MARKER);

    let newContent = '';

    if (startMarkerIndex !== -1 && endMarkerIndex !== -1 && endMarkerIndex > startMarkerIndex) {
        // Both markers exist, replace content between them
        const beforeSection = existingContent.substring(0, startMarkerIndex);
        const afterSection = existingContent.substring(endMarkerIndex + config.GITIGNORE_END_MARKER.length);

        // Remove trailing newlines from before section and leading newlines from after section
        const beforeTrimmed = beforeSection.replace(/\n+$/, '');
        const afterTrimmed = afterSection.replace(/^\n+/, '');

        const parts = [beforeTrimmed];
        if (beforeTrimmed) parts.push(''); // Add separator if there's content before
        parts.push(
            config.GITIGNORE_START_MARKER,
            rulesContent,
            config.GITIGNORE_END_MARKER
        );
        if (afterTrimmed) {
            parts.push(''); // Add separator if there's content after
            parts.push(afterTrimmed);
        }

        newContent = parts.join('\n');
    } else if (startMarkerIndex !== -1 || endMarkerIndex !== -1) {
        // Only one marker exists, append to end
        const trimmed = existingContent.replace(/\n+$/, '');
        newContent = [
            trimmed,
            '',
            config.GITIGNORE_START_MARKER,
            rulesContent,
            config.GITIGNORE_END_MARKER
        ].join('\n');
    } else {
        // No markers exist, append to end
        if (existingContent.trim() === '') {
            // File is empty or only whitespace
            newContent = [
                config.GITIGNORE_START_MARKER,
                rulesContent,
                config.GITIGNORE_END_MARKER
            ].join('\n');
        } else {
            // File has content, append with newline
            const trimmed = existingContent.replace(/\n+$/, '');
            newContent = [
                trimmed,
                '',
                config.GITIGNORE_START_MARKER,
                rulesContent,
                config.GITIGNORE_END_MARKER
            ].join('\n');
        }
    }

    // Write the updated content
    if (options.dryRun) {
        console.log(config.dryRunText(config.GITIGNORE_NAME, gitignorePath));
        console.log();
    } else {
        try {
            await fs.writeFile(gitignorePath, newContent, 'utf-8');
            console.log(`Updated .gitignore: ${gitignorePath}`);
        } catch (error) {
            console.warn(`Warning: Could not write .gitignore file: ${error.message}`);
        }
    }
}

/**
 * Generate the README.md files for each category
 * @param {Lockfile} lockfile - The lockfile object
 * @param {string} workingDir - The working directory
 * @param {Options | InitOptions} options - The options object
 */
export async function generateReadmeFiles(lockfile, workingDir, options = {}) {
    // Collect unique project IDs and author IDs from version data
    const projectIds = new Set();
    const authorIds = new Set();

    for (const [category, entries] of Object.entries(lockfile.dependencies)) {
        for (const entry of entries) {
            if (entry.version && entry.version.project_id) {
                projectIds.add(entry.version.project_id);
            }
            if (entry.version && entry.version.author_id) {
                authorIds.add(entry.version.author_id);
            }
        }
    }

    // Fetch projects and users in parallel
    console.log(`Fetching data for ${projectIds.size} project(s) and ${authorIds.size} user(s)...`);

    const [projects, users] = await Promise.all([
        getProjects(Array.from(projectIds)),
        getUsers(Array.from(authorIds)),
    ]);

    // Map projects and users to their IDs
    const projectsMap = {};
    for (const project of projects) {
        projectsMap[project.id] = project;
    }

    const usersMap = {};
    for (const user of users) {
        usersMap[user.id] = user;
    }

    // Generate README for each category
    for (const [category, entries] of Object.entries(lockfile.dependencies)) {
        if (entries.length === 0) {
            continue;
        }

        const readmeContent = generateCategoryReadme(category, entries, projectsMap, usersMap);
        const categoryDir = getScanDirectories(workingDir).find(d => d.name === category);

        if (categoryDir) {
            const readmePath = path.join(categoryDir.path, config.README_NAME);

            if (options.dryRun) {
                console.log(config.dryRunText(config.README_NAME, readmePath));
            } else {
                try {
                    await fs.writeFile(readmePath, readmeContent, 'utf-8');
                    console.log(`Generated README: ${readmePath}`);
                } catch (error) {
                    console.warn(`Warning: Could not write README to ${readmePath}: ${error.message}`);
                }
            }
        }
    }

    console.log('README generation complete.');
}

/**
 * Generate the lockfile
 * @param {string} workingDir - The working directory
 * @param {Options} options - The options object
 * @returns {Lockfile} The lockfile object
 */
export async function generateLockfile(workingDir, options = {}) {
    console.log('Scanning directories for modpack files...');

    // Scan all directories
    const allFileEntries = [];
    for (const dirInfo of getScanDirectories(workingDir)) {
        console.log(`Scanning ${dirInfo.name}...`);
        const fileEntries = await scanDirectory(dirInfo, workingDir);
        console.log(`  Found ${fileEntries.length} file(s)`);
        allFileEntries.push(...fileEntries);
    }

    // Sort file entries
    allFileEntries.sort((a, b) => {
        if (a.category !== b.category) {
            return a.category.localeCompare(b.category, 'en', { sensitivity: 'base' });
        }
        return a.path.localeCompare(b.path, 'en', { numeric: true, sensitivity: 'base' });
    });

    if (allFileEntries.length === 0) {
        console.log('No files found. Creating empty lockfile.');
        const outputPath = path.join(workingDir, config.MODPACK_LOCKFILE_NAME);
        if (options.dryRun) {
            console.log(config.dryRunText(config.MODPACK_LOCKFILE_NAME, outputPath));
        } else {
            await writeLockfile(createEmptyLockfile(), outputPath);
        }
        return;
    }

    console.log(`\nTotal files found: ${allFileEntries.length}`);
    console.log('\nQuerying Modrinth API...');

    // Extract all hashes
    const hashes = allFileEntries.map(info => info.hash);

    // Query Modrinth API
    const versionData = await getVersionsFromHashes(hashes);

    console.log(`\nFound version information for ${Object.keys(versionData).length} out of ${hashes.length} files`);

    // Create lockfile
    const lockfile = createLockfile(allFileEntries, versionData);

    // Write lockfile
    const outputPath = path.join(workingDir, config.MODPACK_LOCKFILE_NAME);
    if (options.dryRun) {
        console.log(config.dryRunText(config.MODPACK_LOCKFILE_NAME, outputPath));
    } else {
        await writeLockfile(lockfile, outputPath);
    }

    // Summary
    console.log('\n=== Summary ===');
    for (const [category, entries] of Object.entries(lockfile.dependencies)) {
        const withVersion = entries.filter(e => e.version !== null).length;
        const withoutVersion = entries.length - withVersion;
        console.log(`${category}: ${entries.length} file(s) (${withVersion} found on Modrinth, ${withoutVersion} unknown)`);
    }

    // Generate .gitignore rules
    if (options.gitignore) {
        await generateGitignoreRules(lockfile, workingDir, options);
    }

    // Generate README files
    if (options.readme) {
        console.log('\nGenerating README files...');
        await generateReadmeFiles(lockfile, workingDir, options);
    }

    return lockfile;
}
