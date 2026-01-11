import fs from 'fs/promises';
import path from 'path';
import { getVersionsFromHashes, getProjects, getUsers } from './modrinth_interactions.js';
import { getScanDirectories, scanDirectory } from './directory_scanning.js';

const LOCKFILE_VERSION = '1.0.1';
const MODPACK_LOCKFILE_NAME = 'modpack.lock';

// Get the workspace root from the current working directory
//const WORKSPACE_ROOT = process.cwd();

/**
 * Create empty lockfile structure
 */
function createEmptyLockfile() {
    return {
        version: LOCKFILE_VERSION,
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
    const categoryPathMap = {
        mods: 'mod',
        resourcepacks: 'resourcepack',
        shaderpacks: 'shader',
        datapacks: 'datapack',
    };
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
 * Generate .gitignore rules for files not hosted on Modrinth
 */
function generateGitignoreRules(lockfile) {
    const rules = [];
    const exceptions = [];

    // Base ignore patterns for each category
    rules.push('mods/*.jar');
    rules.push('resourcepacks/*.zip');
    rules.push('datapacks/*.zip');
    rules.push('shaderpacks/*.zip');
    rules.push('');
    rules.push('## Exceptions');

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
        rules.push(...exceptions);
    } else {
        rules.push('# No exceptions needed - all files are hosted on Modrinth');
    }

    return rules.join('\n');
}

/**
 * Main execution function
 */
async function generateLockfile(config) {
    if (config.dryRun) {
        console.log('[DRY RUN] Preview mode - no files will be written');
    }

    console.log('Scanning directories for modpack files...');

    // Scan all directories
    const allFileEntries = [];
    for (const dirInfo of getScanDirectories(config.path)) {
        console.log(`Scanning ${dirInfo.name}...`);
        const fileEntries = await scanDirectory(dirInfo, config.path);
        console.log(`  Found ${fileEntries.length} file(s)`);
        allFileEntries.push(...fileEntries);
    }

    if (allFileEntries.length === 0) {
        console.log('No files found. Creating empty lockfile.');
        const outputPath = path.join(config.path, MODPACK_LOCKFILE_NAME);
        if (config.dryRun) {
            console.log(`[DRY RUN] Would write lockfile to: ${outputPath}`);
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
    const outputPath = path.join(config.path, MODPACK_LOCKFILE_NAME);
    if (config.dryRun) {
        console.log(`[DRY RUN] Would write lockfile to: ${outputPath}`);
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
    if (config.gitignore) {
        console.log('\n=== .gitignore Rules ===');
        console.log(generateGitignoreRules(lockfile));
    }

    // Generate README files
    if (config.readme) {
        console.log('\nGenerating README files...');

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
            const categoryDir = getScanDirectories(config.path).find(d => d.name === category);

            if (categoryDir) {
                const readmePath = path.join(categoryDir.path, 'README.md');

                if (config.dryRun) {
                    console.log(`[DRY RUN] Would write README to: ${readmePath}`);
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
    return true;
}

export default generateLockfile;
