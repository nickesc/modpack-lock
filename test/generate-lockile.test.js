import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import unzipper from 'unzipper';

import generateLockfile from '../src/generate_lockfile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ZIP = path.resolve(__dirname, 'workspace.zip');
const LOCKFILE_NAME = 'modpack.lock';

const tempDirs = [];

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

async function cleanupTempDirs() {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    await fs.rm(dir, { recursive: true, force: true });
  }
}

describe('generateLockfile', () => {
  let fetchSpy;

  beforeEach(async () => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await cleanupTempDirs();
  });

  it('creates a lockfile for the provided workspace fixture', async () => {
    const workspaceDir = await extractWorkspaceFixture();

    await generateLockfile({ path: workspaceDir, quiet: true });

    expect(fetchSpy).toHaveBeenCalled();

    const lockfile = await readLockfile(workspaceDir);
    expect(lockfile.total).toBe(12);
    expect(lockfile.counts.mods).toBe(3);
    expect(lockfile.counts.resourcepacks).toBe(3);
    expect(lockfile.counts.datapacks).toBe(3);
    expect(lockfile.counts.shaderpacks).toBe(3);

    expect(lockfile.dependencies.mods.length).toBe(3);
    expect(lockfile.dependencies.shaderpacks.length).toBe(3);
    expect(lockfile.dependencies.mods.some(entry => entry.path === 'mods/projector-1.4.1.jar')).toBe(true);
    expect(lockfile.dependencies.shaderpacks.some(entry => entry.path === 'shaderpacks/Base-Shader-3.0.zip')).toBe(true);
    expect(lockfile.dependencies.resourcepacks.some(entry => entry.path === 'resourcepacks/y.zip')).toBe(true);
    expect(lockfile.dependencies.datapacks.some(entry => entry.path === 'datapacks/ImprovedPillagerOutpost-v6.zip')).toBe(true);

    // Verify version data structure - entries should have either null or a valid version object
    const allEntries = [
      ...lockfile.dependencies.mods,
      ...lockfile.dependencies.resourcepacks,
      ...lockfile.dependencies.datapacks,
      ...lockfile.dependencies.shaderpacks,
    ];

    let nulls=0;

    allEntries.forEach(entry => {
      if (entry.version !== null) {
        // If version exists, it should have the expected structure from Modrinth API
        expect(entry.version).toHaveProperty('project_id');
        expect(typeof entry.version.project_id).toBe('string');
        expect(entry.version.project_id.length).toBeGreaterThan(0);
      } else {
        expect(entry.version).toBeNull();
        expect(entry.path).toBeDefined();
        nulls++;
      }
    });

    expect(nulls).toBe(4);
  });

  it('writes an empty lockfile when no files are found', async () => {
    const emptyDir = await createTempDir('modpack-lock-empty-');


    await generateLockfile({ path: emptyDir, quiet: true });

    expect(fetchSpy).not.toHaveBeenCalled();

    const lockfile = await readLockfile(emptyDir);
    expect(lockfile.total).toBe(0);
    expect(lockfile.dependencies).toEqual({});
    expect(lockfile.counts).toEqual({});
  });
});
