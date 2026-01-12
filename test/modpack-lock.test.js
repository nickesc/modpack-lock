import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import unzipper from 'unzipper';

// Import all exported functions from the package
import { generateModpackFiles,
    generateJson,
    generateLockfile,
    generateGitignoreRules,
    generateReadmeFiles,
    getModpackInfo,
    getLockfile,
} from '../src/modpack-lock.js';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ZIP = path.resolve(__dirname, 'workspace.zip');
const LOCKFILE_NAME = 'modpack.lock';
const JSON_NAME = 'modpack.json';
const CLI_PATH = path.resolve(__dirname, '../src/cli.js');

const DEPENDENCY_CATEGORIES = ['mods', 'resourcepacks', 'shaderpacks', 'datapacks'];

const tempDirs = [];

// ============================================================================
// Test Helper Functions
// ============================================================================

async function createTempDir(prefix = 'modpack-lock-') {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
    tempDirs.push(dir);
    return dir;
}

async function extractWorkspaceFixture() {
    const extractionRoot = await createTempDir('modpack-lock-workspace-');
    const archive = await unzipper.Open.file(WORKSPACE_ZIP);
    await archive.extract({ path: extractionRoot });
    return path.join(extractionRoot, 'workspace');
}

async function readLockfile(dirPath) {
    const lockfilePath = path.join(dirPath, LOCKFILE_NAME);
    const content = await fs.readFile(lockfilePath, 'utf-8');
    return JSON.parse(content);
}

async function readModpackJson(dirPath) {
    const jsonPath = path.join(dirPath, JSON_NAME);
    const content = await fs.readFile(jsonPath, 'utf-8');
    return JSON.parse(content);
}

async function cleanupTempDirs() {
    while (tempDirs.length > 0) {
        const dir = tempDirs.pop();
        await fs.rm(dir, { recursive: true, force: true });
    }
}

/**
 * Compute SHA1 hash of a file
 */
async function computeFileHash(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha1').update(fileBuffer).digest('hex');
}

/**
 * Scan workspace directories and return file info with computed hashes
 * This mirrors the logic in src/directory_scanning.js
 */
async function scanWorkspaceFiles(workspaceDir) {
    const files = [];

    for (const category of DEPENDENCY_CATEGORIES) {
        const categoryDir = path.join(workspaceDir, category);

        try {
            const entries = await fs.readdir(categoryDir, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isFile() && (entry.name.endsWith('.jar') || entry.name.endsWith('.zip'))) {
                    const fullPath = path.join(categoryDir, entry.name);
                    const hash = await computeFileHash(fullPath);
                    const relativePath = path.relative(workspaceDir, fullPath);

                    files.push({
                        category,
                        path: relativePath,
                        fullPath,
                        hash,
                        filename: entry.name,
                    });
                }
            }
        } catch (error) {
            // Directory doesn't exist, skip
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    return files;
}

/**
 * Run CLI command and return result
 */
async function runCli(args = [], options = {}) {
    try {
        const { stdout, stderr } = await execFileAsync('node', [CLI_PATH, ...args], options);
        return { stdout, stderr, exitCode: 0 };
    } catch (error) {
        return {
            stdout: error.stdout || '',
            stderr: error.stderr || error.message,
            exitCode: error.code || 1
        };
    }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// ============================================================================
// Package API Tests
// ============================================================================

describe('Package API', () => {
    let workspaceDir;
    let scannedFiles;
    let lockfile;
    let fetchSpy;

    beforeAll(async () => {
        fetchSpy = vi.spyOn(global, 'fetch');

        // Extract workspace and scan files
        workspaceDir = await extractWorkspaceFixture();
        scannedFiles = await scanWorkspaceFiles(workspaceDir);

        // Generate lockfile once for reuse
        lockfile = await generateLockfile(workspaceDir);
    });

    afterAll(async () => {
        vi.restoreAllMocks();
        await cleanupTempDirs();
    });

    describe('generateLockfile', () => {
        it('creates a lockfile with correct file counts', async () => {
            // Verify counts match scanned files
            const totalScanned = scannedFiles.length;
            expect(lockfile.total).toBe(totalScanned);

            // Verify counts per category
            for (const category of DEPENDENCY_CATEGORIES) {
                const categoryFiles = scannedFiles.filter(f => f.category === category);
                if (categoryFiles.length > 0) {
                    expect(lockfile.counts[category]).toBe(categoryFiles.length);
                }
            }
        });

        it('includes all scanned files in the lockfile', async () => {
            for (const file of scannedFiles) {
                const categoryEntries = lockfile.dependencies[file.category];
                expect(categoryEntries).toBeDefined();
                expect(categoryEntries.some(e => e.path === file.path)).toBe(true);
            }
        });

        it('makes API calls to Modrinth', async () => {
            expect(fetchSpy).toHaveBeenCalled();
        });

        it('returns valid version objects for files found on Modrinth', async () => {
            const allEntries = Object.values(lockfile.dependencies).flat();

            const entriesWithVersion = allEntries.filter(e => e.version !== null);
            expect(entriesWithVersion.length).toBeGreaterThan(0);

            for (const entry of entriesWithVersion) {
                expect(entry.version).toHaveProperty('project_id');
                expect(typeof entry.version.project_id).toBe('string');
                expect(entry.version.project_id.length).toBeGreaterThan(0);
                expect(entry.version).toHaveProperty('version_number');
                expect(entry.version).toHaveProperty('author_id');
                expect(entry.version).toHaveProperty('files');
                expect(Array.isArray(entry.version.files)).toBe(true);
            }
        });

        it('returns null version for files not found on Modrinth', async () => {
            const allEntries = Object.values(lockfile.dependencies).flat();
            const entriesWithoutVersion = allEntries.filter(e => e.version === null);

            // We expect some files not to be on Modrinth (the test files x.jar, y.zip, z.zip, w.zip)
            expect(entriesWithoutVersion.length).toBeGreaterThan(0);

            for (const entry of entriesWithoutVersion) {
                expect(entry.version).toBeNull();
                expect(entry.path).toBeDefined();
            }
        });

        it('writes an empty lockfile when no files are found', async () => {
            const emptyDir = await createTempDir('modpack-lock-empty-');

            // Track call count before this test
            const callCountBefore = fetchSpy.mock.calls.length;

            await generateLockfile(emptyDir);

            // Should not make additional API calls for empty directory
            expect(fetchSpy.mock.calls.length).toBe(callCountBefore);

            const emptyLockfile = await readLockfile(emptyDir);
            expect(emptyLockfile.total).toBe(0);
            expect(emptyLockfile.dependencies).toEqual({});
            expect(emptyLockfile.counts).toEqual({});
        });
    });

    describe('generateGitignoreRules', () => {
        it('generates rules for all dependency categories', () => {
            const rules = generateGitignoreRules(lockfile);

            expect(rules).toContain('mods/*.jar');
            expect(rules).toContain('resourcepacks/*.zip');
            expect(rules).toContain('shaderpacks/*.zip');
            expect(rules).toContain('datapacks/*.zip');
        });

        it('includes exceptions for files not on Modrinth', () => {
            const rules = generateGitignoreRules(lockfile);

            // Find files without versions (not on Modrinth)
            const allEntries = Object.values(lockfile.dependencies).flat();
            const entriesWithoutVersion = allEntries.filter(e => e.version === null);

            for (const entry of entriesWithoutVersion) {
                expect(rules).toContain(`!${entry.path}`);
            }
        });

        it('handles lockfile with all files on Modrinth', () => {
            // Create a mock lockfile where all files have versions
            const mockLockfile = {
                dependencies: {
                    mods: [{ path: 'mods/test.jar', version: { project_id: 'abc' } }],
                },
            };

            const rules = generateGitignoreRules(mockLockfile);
            expect(rules).toContain('# No exceptions needed');
        });
    });

    describe('generateReadmeFiles', () => {
        it('creates README.md files in category directories', async () => {
            const readmeWorkspace = await extractWorkspaceFixture();
            const readmeLockfile = await generateLockfile(readmeWorkspace);

            await generateReadmeFiles(readmeLockfile, readmeWorkspace);

            // Check that README files were created for categories with entries
            for (const [category, entries] of Object.entries(readmeLockfile.dependencies)) {
                if (entries.length > 0) {
                    const readmePath = path.join(readmeWorkspace, category, 'README.md');
                    expect(await fileExists(readmePath)).toBe(true);

                    const content = await fs.readFile(readmePath, 'utf-8');
                    // Should have markdown table headers
                    expect(content).toContain('| Name | Author | Version |');
                    // Should have category title
                    const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
                    expect(content).toContain(`# ${categoryTitle}`);
                }
            }
        });
    });

    describe('generateJson', () => {
        it('creates modpack.json with required fields', async () => {
            const jsonWorkspace = await extractWorkspaceFixture();
            const jsonLockfile = await generateLockfile(jsonWorkspace);

            const modpackInfo = {
                name: 'Test Modpack',
                version: '1.0.0',
                id: 'test-modpack',
                author: 'Test Author',
                modloader: 'fabric',
                targetMinecraftVersion: '1.21.1',
            };

            const result = await generateJson(modpackInfo, jsonLockfile, jsonWorkspace);

            expect(result.name).toBe('Test Modpack');
            expect(result.version).toBe('1.0.0');
            expect(result.id).toBe('test-modpack');
            expect(result.author).toBe('Test Author');
            expect(result.modloader).toBe('fabric');
            expect(result.targetMinecraftVersion).toBe('1.21.1');
            expect(result.dependencies).toBeDefined();
        });

        it('dependencies are present and non-empty', async () => {
            const jsonWorkspace = await extractWorkspaceFixture();
            const jsonLockfile = await generateLockfile(jsonWorkspace);

            const modpackInfo = {
                name: 'Test Modpack',
                version: '1.0.0',
                id: 'test-modpack',
                author: 'Test Author',
                modloader: 'fabric',
                targetMinecraftVersion: '1.21.1',
            };

            const result = await generateJson(modpackInfo, jsonLockfile, jsonWorkspace);

            const allDeps = Object.values(result.dependencies).flat();
            expect(allDeps.length).toBeGreaterThan(0);
        });

        it('throws error when required fields are missing', async () => {
            const jsonWorkspace = await extractWorkspaceFixture();

            const incompleteInfo = {
                name: 'Test Modpack',
                // Missing required fields
            };

            await expect(generateJson(incompleteInfo, null, jsonWorkspace))
                .rejects.toThrow();
        });

        it('writes modpack.json to disk', async () => {
            const jsonWorkspace = await extractWorkspaceFixture();
            const jsonLockfile = await generateLockfile(jsonWorkspace);

            const modpackInfo = {
                name: 'Test Modpack',
                version: '1.0.0',
                id: 'test-modpack',
                author: 'Test Author',
                modloader: 'fabric',
                targetMinecraftVersion: '1.21.1',
            };

            await generateJson(modpackInfo, jsonLockfile, jsonWorkspace);

            const jsonPath = path.join(jsonWorkspace, JSON_NAME);
            expect(await fileExists(jsonPath)).toBe(true);

            const written = await readModpackJson(jsonWorkspace);
            expect(written.name).toBe('Test Modpack');
        });
    });

    describe('getModpackInfo / getLockfile', () => {
        it('reads existing modpack.json', async () => {
            const readWorkspace = await extractWorkspaceFixture();

            const modpackInfo = {
                name: 'Test Modpack',
                version: '1.0.0',
                id: 'test-modpack',
                author: 'Test Author',
                modloader: 'fabric',
                targetMinecraftVersion: '1.21.1',
            };

            const readLockfile = await generateLockfile(readWorkspace);
            await generateJson(modpackInfo, readLockfile, readWorkspace);

            const result = await getModpackInfo(readWorkspace);
            expect(result).not.toBeNull();
            expect(result.name).toBe('Test Modpack');
        });

        it('returns null when modpack.json does not exist', async () => {
            const emptyDir = await createTempDir('modpack-lock-no-json-');
            const result = await getModpackInfo(emptyDir);
            expect(result).toBeNull();
        });

        it('reads existing lockfile', async () => {
            const result = await getLockfile(workspaceDir);
            expect(result).not.toBeNull();
            expect(result.total).toBe(scannedFiles.length);
        });

        it('returns null when lockfile does not exist', async () => {
            const emptyDir = await createTempDir('modpack-lock-no-lock-');
            const result = await getLockfile(emptyDir);
            expect(result).toBeNull();
        });
    });

    describe('generateModpackFiles (default export)', () => {
        it('generates both lockfile and modpack.json', async () => {
            const fullWorkspace = await extractWorkspaceFixture();
            const fullScanned = await scanWorkspaceFiles(fullWorkspace);

            const modpackInfo = {
                name: 'Full Test Modpack',
                version: '2.0.0',
                id: 'full-test-modpack',
                author: 'Test Author',
                modloader: 'fabric',
                targetMinecraftVersion: '1.21.1',
            };

            const result = await generateModpackFiles(modpackInfo, fullWorkspace);

            // Should return lockfile
            expect(result.total).toBe(fullScanned.length);

            // Both files should exist
            expect(await fileExists(path.join(fullWorkspace, LOCKFILE_NAME))).toBe(true);
            expect(await fileExists(path.join(fullWorkspace, JSON_NAME))).toBe(true);

            // Verify modpack.json content
            const json = await readModpackJson(fullWorkspace);
            expect(json.name).toBe('Full Test Modpack');
        });
    });
});

// ============================================================================
// CLI Tests
// ============================================================================

describe('CLI', () => {
    afterAll(async () => {
        await cleanupTempDirs();
    });

    describe('modpack-lock (main command)', () => {
        it('creates lockfile when run with --path', async () => {
            const cliWorkspace = await extractWorkspaceFixture();
            const scanned = await scanWorkspaceFiles(cliWorkspace);

            await runCli(['--path', cliWorkspace]);

            const lockfile = await readLockfile(cliWorkspace);
            expect(lockfile.total).toBe(scanned.length);
        });

        it('creates lockfile in current directory when no path is provided', async () => {
            const cwdWorkspace = await extractWorkspaceFixture();
            const scanned = await scanWorkspaceFiles(cwdWorkspace);

            await runCli([], { cwd: cwdWorkspace });

            const lockfile = await readLockfile(cwdWorkspace);
            expect(lockfile.total).toBe(scanned.length);
        });

        it('does not write files with --dry-run', async () => {
            const dryRunWorkspace = await extractWorkspaceFixture();
            const lockfilePath = path.join(dryRunWorkspace, LOCKFILE_NAME);

            // Remove any existing lockfile first
            try {
                await fs.unlink(lockfilePath);
            } catch {
                // File doesn't exist, that's fine
            }

            await runCli(['--dry-run', '--path', dryRunWorkspace]);

            expect(await fileExists(lockfilePath)).toBe(false);
        });

        it('shows help with --help', async () => {
            const result = await runCli(['--help']);

            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('modpack-lock');
            expect(result.stdout).toContain('--path');
            expect(result.stdout).toContain('--dry-run');
        });

        it('shows version with -V', async () => {
            const result = await runCli(['-V']);

            expect(result.exitCode).toBe(0);
            // Should output version number
            expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
        });
    });

    describe('modpack-lock init', () => {
        it('creates both files with --noninteractive and required flags', async () => {
            const initWorkspace = await extractWorkspaceFixture();
            const scanned = await scanWorkspaceFiles(initWorkspace);

            await runCli([
                'init',
                '--noninteractive',
                '--folder', initWorkspace,
                '--name', 'CLI Test Pack',
                '--author', 'CLI Author',
                '--modloader', 'fabric',
                '--targetMinecraftVersion', '1.21.1',
            ]);

            // Both files should exist
            expect(await fileExists(path.join(initWorkspace, LOCKFILE_NAME))).toBe(true);
            expect(await fileExists(path.join(initWorkspace, JSON_NAME))).toBe(true);

            // Verify content
            const lockfile = await readLockfile(initWorkspace);
            expect(lockfile.total).toBe(scanned.length);

            const json = await readModpackJson(initWorkspace);
            expect(json.name).toBe('CLI Test Pack');
            expect(json.author).toBe('CLI Author');
            expect(json.modloader).toBe('fabric');
        });

        it('fails without required fields in --noninteractive mode', async () => {
            const failWorkspace = await extractWorkspaceFixture();

            const result = await runCli([
                'init',
                '--noninteractive',
                '--folder', failWorkspace,
                // Missing --author, --modloader, --targetMinecraftVersion
            ]);

            expect(result.exitCode).toBe(1);
        });

        it('shows help for init subcommand', async () => {
            const result = await runCli(['init', '--help']);

            expect(result.exitCode).toBe(0);
            expect(result.stdout).toContain('--noninteractive');
            expect(result.stdout).toContain('--name');
            expect(result.stdout).toContain('--author');
        });
    });

    describe('modpack-lock with existing modpack.json', () => {
        it('uses existing modpack.json when present', async () => {
            const existingJsonWorkspace = await extractWorkspaceFixture();
            const scanned = await scanWorkspaceFiles(existingJsonWorkspace);

            // First create a modpack.json
            const modpackInfo = {
                name: 'Existing Pack',
                version: '1.0.0',
                id: 'existing-pack',
                author: 'Existing Author',
                modloader: 'fabric',
                targetMinecraftVersion: '1.21.1',
            };

            // Write modpack.json manually
            await fs.writeFile(
                path.join(existingJsonWorkspace, JSON_NAME),
                JSON.stringify(modpackInfo, null, 2)
            );

            // Run main command
            await runCli(['--path', existingJsonWorkspace]);

            // Should have updated both files
            const lockfile = await readLockfile(existingJsonWorkspace);
            expect(lockfile.total).toBe(scanned.length);

            const json = await readModpackJson(existingJsonWorkspace);
            expect(json.name).toBe('Existing Pack');
        });
    });
});
