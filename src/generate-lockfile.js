import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';

const LOCKFILE_VERSION = '1.0.1';
const MODPACK_LOCKFILE_NAME = 'modpack.lock';
const MODRINTH_API_BASE = 'https://api.modrinth.com/v2';
const MODRINTH_VERSION_FILES_ENDPOINT = `${MODRINTH_API_BASE}/version_files`;
const MODRINTH_PROJECTS_ENDPOINT = `${MODRINTH_API_BASE}/projects`;
const MODRINTH_USERS_ENDPOINT = `${MODRINTH_API_BASE}/users`;
const BATCH_SIZE = 100;

// Get the workspace root from the current working directory
//const WORKSPACE_ROOT = process.cwd();

/**
 * Create a logger function that respects quiet mode
 */
function createLogger(quiet) {
  if (quiet) {
    return () => {};
  }
  return (...args) => console.log(...args);
}

/**
 * Silence all console.log output
 */
function silenceConsole() {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  console.info = () => {};
}

/**
 * Get the directories to scan for modpack files
 */
function getScanDirectories(directoryPath) {
  return [
    { name: 'mods', path: path.join(directoryPath, 'mods') },
    { name: 'resourcepacks', path: path.join(directoryPath, 'resourcepacks') },
    { name: 'datapacks', path: path.join(directoryPath, 'datapacks') },
    { name: 'shaderpacks', path: path.join(directoryPath, 'shaderpacks') },
  ];
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
async function scanDirectory(dirInfo, workspaceRoot) {
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
 * Query Modrinth API for version information from hashes
 */
async function getVersionsFromHashes(hashes) {
  if (hashes.length === 0) {
    return {};
  }

  try {
    const response = await fetch(MODRINTH_VERSION_FILES_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hashes: hashes,
        algorithm: 'sha1',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Modrinth API error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error querying Modrinth API: ${error.message}`);
    throw error;
  }
}

/**
 * Split an array into chunks of specified size
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Fetch multiple projects by their IDs in batches
 */
async function getProjects(projectIds) {
  if (projectIds.length === 0) {
    return [];
  }

  const chunks = chunkArray(projectIds, BATCH_SIZE);
  const results = [];

  for (const chunk of chunks) {
    try {
      const url = `${MODRINTH_PROJECTS_ENDPOINT}?ids=${encodeURIComponent(JSON.stringify(chunk))}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Modrinth API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      results.push(...data);
    } catch (error) {
      console.error(`Error fetching projects: ${error.message}`);
      throw error;
    }
  }

  return results;
}

/**
 * Fetch multiple users by their IDs in batches
 */
async function getUsers(userIds) {
  if (userIds.length === 0) {
    return [];
  }

  const chunks = chunkArray(userIds, BATCH_SIZE);
  const results = [];

  for (const chunk of chunks) {
    try {
      const url = `${MODRINTH_USERS_ENDPOINT}?ids=${encodeURIComponent(JSON.stringify(chunk))}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Modrinth API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      results.push(...data);
    } catch (error) {
      console.error(`Error fetching users: ${error.message}`);
      throw error;
    }
  }

  return results;
}


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
async function writeLockfile(lockfile, outputPath, log) {
  const content = JSON.stringify(lockfile, null, 2);
  await fs.writeFile(outputPath, content, 'utf-8');
  log(`Lockfile written to: ${outputPath}`);
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
  const log = createLogger(config.quiet);

  if (config.silent) {
    silenceConsole();
  }

  if (config.dryRun) {
    log('[DRY RUN] Preview mode - no files will be written');
  }

  log('Scanning directories for modpack files...');

  // Scan all directories
  const allFileEntries = [];
  for (const dirInfo of getScanDirectories(config.path)) {
    log(`Scanning ${dirInfo.name}...`);
    const fileEntries = await scanDirectory(dirInfo, config.path);
    log(`  Found ${fileEntries.length} file(s)`);
    allFileEntries.push(...fileEntries);
  }

  if (allFileEntries.length === 0) {
    log('No files found. Creating empty lockfile.');
    const outputPath = path.join(config.path, MODPACK_LOCKFILE_NAME);
    if (config.dryRun) {
      log(`[DRY RUN] Would write lockfile to: ${outputPath}`);
    } else {
      await writeLockfile(createEmptyLockfile(), outputPath, log);
    }
    return;
  }

  log(`\nTotal files found: ${allFileEntries.length}`);
  log('\nQuerying Modrinth API...');

  // Extract all hashes
  const hashes = allFileEntries.map(info => info.hash);

  // Query Modrinth API
  const versionData = await getVersionsFromHashes(hashes);

  log(`\nFound version information for ${Object.keys(versionData).length} out of ${hashes.length} files`);

  // Create lockfile
  const lockfile = createLockfile(allFileEntries, versionData);

  // Write lockfile
  const outputPath = path.join(config.path, MODPACK_LOCKFILE_NAME);
  if (config.dryRun) {
    log(`[DRY RUN] Would write lockfile to: ${outputPath}`);
  } else {
    await writeLockfile(lockfile, outputPath, log);
  }

  // Summary
  log('\n=== Summary ===');
  for (const [category, entries] of Object.entries(lockfile.dependencies)) {
    const withVersion = entries.filter(e => e.version !== null).length;
    const withoutVersion = entries.length - withVersion;
    log(`${category}: ${entries.length} file(s) (${withVersion} found on Modrinth, ${withoutVersion} unknown)`);
  }

  // Generate .gitignore rules
  if (config.gitignore) {
    log('\n=== .gitignore Rules ===');
    log(generateGitignoreRules(lockfile));
  }

  // Generate README files
  if (config.readme) {
    log('\nGenerating README files...');

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
    log(`Fetching data for ${projectIds.size} project(s) and ${authorIds.size} user(s)...`);

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
          log(`[DRY RUN] Would write README to: ${readmePath}`);
        } else {
          try {
            await fs.writeFile(readmePath, readmeContent, 'utf-8');
            log(`Generated README: ${readmePath}`);
          } catch (error) {
            console.warn(`Warning: Could not write README to ${readmePath}: ${error.message}`);
          }
        }
      }
    }

    log('README generation complete.');
  }
  return true;
}

export default generateLockfile;
