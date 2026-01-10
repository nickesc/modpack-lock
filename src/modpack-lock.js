#!/usr/bin/env NODE_OPTIONS=--no-warnings node

import { Command } from 'commander';
import generateLockfile from './generate-lockfile.js';

import pkg from '../package.json' with { type: 'json' };
const modpackLock = new Command('modpack-lock');

modpackLock
  .name(pkg.name)
  .description(pkg.description)
  .summary("Create a modpack lockfile")
  .optionsGroup("Options:")
  .option('-d, --dry-run', 'Dry-run mode - no files will be written')
  .option('-g, --gitignore', 'Print .gitignore rules for files not hosted on Modrinth')
  .option('-r, --readme', 'Generate README.md files for each category')
  .option('-p, --path <path>', 'Path to the modpack directory')
  .optionsGroup("LOGGING")
  .option('-q, --quiet', 'Quiet mode - only show errors and warnings')
  .option('-s, --silent', 'Silent mode - no output')
  .optionsGroup("INFORMATION")
  .helpOption("--help", `display help for ${pkg.name}`)
  .version(pkg.version)
  .action((options) => {
    generateLockfile({ ...options, path: options.path || process.cwd() }).catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
  });

modpackLock.parse()

