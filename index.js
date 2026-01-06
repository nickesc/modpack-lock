#!/usr/bin/env node

import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';

const LOCKFILE_VERSION = '1.0.0';
const MODPACK_LOCKFILE_NAME = 'modpack.lock';
const MODRINTH_API_BASE = 'https://api.modrinth.com/v2';
const MODRINTH_VERSION_FILES_ENDPOINT = `${MODRINTH_API_BASE}/version_files`;

// Get the workspace root from the current working directory
const WORKSPACE_ROOT = process.cwd();

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    quiet: args.includes('--quiet') || args.includes('-q'),
    gitignore: args.includes('--gitignore') || args.includes('-g'),
  };
}

/**
 * Create a logger function that respects quiet mode
 */
function createLogger(quiet) {
  if (quiet) {
    return () => {}; // No-op function when quiet
  }
  return (...args) => console.log(...args);
}

const DIRECTORIES_TO_SCAN = [
  { name: 'mods', path: path.join(WORKSPACE_ROOT, 'mods') },
  { name: 'resourcepacks', path: path.join(WORKSPACE_ROOT, 'resourcepacks') },
  { name: 'datapacks', path: path.join(WORKSPACE_ROOT, 'datapacks') },
  { name: 'shaderpacks', path: path.join(WORKSPACE_ROOT, 'shaderpacks') },
];

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
    // Directory doesn't exist or can't be read - skip it
    if (error.code !== 'ENOENT') {
      console.warn(`Warning: Could not read directory ${dirPath}: ${error.message}`);
    }
  }

  return files;
}

/**
 * Scan a directory and return file info with hashes
 */
async function scanDirectory(dirInfo) {
  const files = await findFiles(dirInfo.path);
  const fileEntries = [];

  for (const filePath of files) {
    try {
      const hash = await calculateSHA1(filePath);
      const relativePath = path.relative(WORKSPACE_ROOT, filePath);

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
 * Create empty lockfile structure
 */
function createEmptyLockfile() {
  return {
    version: LOCKFILE_VERSION,
    generated: new Date().toISOString(),
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
 * Main execution function
 */
async function main() {
  const config = parseArgs();
  const log = createLogger(config.quiet);

  if (config.dryRun) {
    log('[DRY RUN] Preview mode - no files will be written');
  }

  log('Scanning directories for modpack files...');

  // Scan all directories
  const allFileEntries = [];
  for (const dirInfo of DIRECTORIES_TO_SCAN) {
    log(`Scanning ${dirInfo.name}...`);
    const fileEntries = await scanDirectory(dirInfo);
    log(`  Found ${fileEntries.length} file(s)`);
    allFileEntries.push(...fileEntries);
  }

  if (allFileEntries.length === 0) {
    log('No files found. Creating empty lockfile.');
    const outputPath = path.join(WORKSPACE_ROOT, MODPACK_LOCKFILE_NAME);
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
  const outputPath = path.join(WORKSPACE_ROOT, MODPACK_LOCKFILE_NAME);
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
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
