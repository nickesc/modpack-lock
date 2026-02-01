import fs from "fs/promises";
import path from "path";
import {getProjects, getUsers} from "./modrinth_interactions.js";
import {getScanDirectories} from "./directory_scanning.js";
import * as config from "./config/index.js";
import {logm, styleText} from "./logger.js";

/**
 * @typedef {import('./config/types.js').Options} Options
 * @typedef {import('./config/types.js').InitOptions} InitOptions
 * @typedef {import('./config/types.js').Lockfile} Lockfile
 */

/**
 * Generate README.md content for a category
 */
function generateCategoryReadme(category, entries, projectsMap, usersMap) {
    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
    const lines = [`# ${categoryTitle}`, "", "| Name | Author | Version | Dependencies | Dependants |", "|-|-|-|-|-|"];

    // Map category to Modrinth URL path segment
    const categoryPathMap = {};
    for (const cat of config.DEPENDENCY_CATEGORIES) {
        categoryPathMap[cat] = cat === "shaderpacks" ? "shader" : cat.toLowerCase().slice(0, -1);
    }
    const categoryPath = categoryPathMap[category] || "project";

    // Build a set of project_ids present in this category for filtering dependencies
    const categoryProjectIds = new Set();
    for (const entry of entries) {
        if (entry.version && entry.version.project_id) {
            categoryProjectIds.add(entry.version.project_id);
        }
    }

    for (const entry of entries) {
        const version = entry.version;
        let nameCell = "";
        let authorCell = "";
        let versionCell = "";
        let dependenciesCell = "";
        let dependantsCell = "";

        if (version && version.project_id) {
            const project = projectsMap[version.project_id];
            const author = version.author_id ? usersMap[version.author_id] : null;

            // Name column with icon and link
            if (project) {
                const projectName = project.title || project.slug || "Unknown";
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
                const authorName = author.username || "Unknown";
                const authorUrl = `https://modrinth.com/user/${authorName}`;

                if (author.avatar_url) {
                    authorCell = `<img alt="Avatar" src="${author.avatar_url}" height="20px"> [${authorName}](${authorUrl})`;
                } else {
                    authorCell = `[${authorName}](${authorUrl})`;
                }
            } else {
                authorCell = "Unknown";
            }

            // Version column
            versionCell = version.version_number || "Unknown";

            // Dependencies column - only show dependencies that are present in this category
            if (version.dependencies && Array.isArray(version.dependencies) && version.dependencies.length > 0) {
                const dependencyLinks = [];
                for (const dep of version.dependencies) {
                    if (dep.project_id && categoryProjectIds.has(dep.project_id)) {
                        const depProject = projectsMap[dep.project_id];
                        if (depProject) {
                            const depProjectName = depProject.title || depProject.slug || "Unknown";
                            const depProjectSlug = depProject.slug || depProject.id;
                            const depUrl = `https://modrinth.com/${categoryPath}/${depProjectSlug}`;
                            if (depProject.icon_url) {
                                dependencyLinks.push(
                                    `<a href="${depUrl}"><img alt="${depProjectName}" src="${depProject.icon_url}" height="20px"></a>`,
                                );
                            } else {
                                dependencyLinks.push(`[${depProjectName}](${depUrl})`);
                            }
                        }
                    }
                }
                dependenciesCell = dependencyLinks.length > 0 ? dependencyLinks.join(" ") : "-";
            } else {
                dependenciesCell = "-";
            }

            // Dependants column - find all entries in the same category that depend on this project
            const dependants = [];
            for (const catEntry of entries) {
                // Skip if this is the same entry (same project_id)
                if (catEntry.version && catEntry.version.project_id === version.project_id) {
                    continue;
                }
                if (catEntry.version && catEntry.version.dependencies && Array.isArray(catEntry.version.dependencies)) {
                    const hasDependency = catEntry.version.dependencies.some(
                        (dep) => dep.project_id === version.project_id,
                    );
                    if (hasDependency) {
                        const depProject = projectsMap[catEntry.version.project_id];
                        if (depProject) {
                            const depProjectName = depProject.title || depProject.slug || "Unknown";
                            const depProjectSlug = depProject.slug || depProject.id;
                            const depUrl = `https://modrinth.com/${categoryPath}/${depProjectSlug}`;
                            if (depProject.icon_url) {
                                dependants.push(
                                    `<a href="${depUrl}"><img alt="${depProjectName}" src="${depProject.icon_url}" height="20px"></a>`,
                                );
                            } else {
                                dependants.push(`[${depProjectName}](${depUrl})`);
                            }
                        }
                    }
                }
            }
            dependantsCell = dependants.length > 0 ? dependants.join(" ") : "-";
        } else {
            // File not found on Modrinth
            const fileName = path.basename(entry.path);
            nameCell = fileName;
            authorCell = "Unknown";
            versionCell = "-";
            dependenciesCell = "-";
            dependantsCell = "-";
        }

        lines.push(`| ${nameCell} | ${authorCell} | ${versionCell} | ${dependenciesCell} | ${dependantsCell} |`);
    }

    return lines.join("\n") + "\n";
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
    logm.log(`Fetching data for ${projectIds.size} project(s) and ${authorIds.size} user(s)...`);

    const [projects, users] = await Promise.all([getProjects(Array.from(projectIds)), getUsers(Array.from(authorIds))]);

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
        const categoryDir = getScanDirectories(workingDir).find((d) => d.name === category);

        if (categoryDir) {
            const readmePath = path.join(categoryDir.path, config.README_NAME);

            if (options.dryRun) {
                logm.debug(config.dryRunText(config.README_NAME, readmePath));
            } else {
                try {
                    await fs.writeFile(readmePath, readmeContent, "utf-8");
                    logm.log(`Generated README: ${readmePath}`);
                } catch (error) {
                    logm.warn(`Could not write README to ${readmePath}: ${error.message}`);
                }
            }
        }
    }
}
