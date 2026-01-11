#!/usr/bin/env NODE_OPTIONS=--no-warnings node

import { Command } from 'commander';
import prompts from 'prompts';
import path from 'path';
import generateLockfile from './generate-lockfile.js';
import generateJson from './generate-json.js';

import pkg from '../package.json' with { type: 'json' };
const modpackLock = new Command('modpack-lock');

function validateNotEmpty(value, field) {
  if (value.trim().length === 0) {
    return `${field} cannot be empty`;
  }
  return true;
}

/**
 * Get user input for modpack information
 */
async function getModpackInfo(defaultName) {
    let answers = await prompts([
        {
          type: 'text',
          name: 'name',
          message: 'Modpack name',
          initial: defaultName,
          validate: (value) => {
            return validateNotEmpty(value, 'Name');
          },
        },
        {
          type: 'text',
          name: 'version',
          message: 'Modpack version',
          initial: '1.0.0',
          validate: (value) => {
            return validateNotEmpty(value, 'Version');
          },
        },

        {
          type: 'text',
          name: 'id',
          message: 'Modpack slug/ID',
          initial: defaultName,
          validate: (value) => {
            return validateNotEmpty(value, 'ID');
          },
        },
        {
          type: 'text',
          name: 'description',
          message: 'Modpack description',
        },
        {
          type: 'text',
          name: 'author',
          message: 'Modpack author',
          validate: (value) => {
            return validateNotEmpty(value, 'Author');
          },
        },
        {
          type: 'text',
          name: 'projectUrl',
          message: 'Modpack URL',
        },
        {
          type: 'text',
          name: 'sourceUrl',
          message: 'Modpack source code URL',
        },
        {
          type: 'text',
          name: 'license',
          message: 'Modpack license',
          initial: 'MIT',
        },
        {
          type: 'autocomplete',
          name: 'modloader',
          message: 'Modpack modloader',
          choices: [
            { title: 'fabric'},
            { title: 'forge'},
            { title: 'quilt'},
            { title: 'neoforge'},
            { title: 'sponge'},
            { title: 'paper'},
            { title: 'velocity'},
            { title: 'bungeecord'},
            { title: 'waterfall'},
            { title: 'travertia'},
            { title: 'nukkit'},
            { title: 'pufferfish'},
            { title: 'purpur'},
          ],
          validate: (value) => {
            return validateNotEmpty(value, 'Modloader');
          },
        },
        {
          type: 'text',
          name: 'targetModloaderVersion',
          message: 'Target modloader version',
        },
        {
          type: 'text',
          name: 'targetMinecraftVersion',
          message: 'Target Minecraft version',
          validate: (value) => {
            return validateNotEmpty(value, 'Minecraft Version');
          },
        }
    ]);
    if (Object.keys(answers).length === 0) {
      console.warn('Modpack initialization was interrupted');
      process.exit(1);
    }
    return answers;
}

modpackLock
  .name(pkg.name)
  .description(pkg.description)
  .summary("Create a modpack lockfile")
  .optionsGroup("Options:")
  .option('-p, --path <path>', 'Path to the modpack directory')
  .option('-d, --dry-run', 'Dry-run mode - no files will be written')
  .optionsGroup("GENERATION")
  .option('-g, --gitignore', 'Print .gitignore rules for files not hosted on Modrinth')
  .option('-r, --readme', 'Generate README.md files for each category')
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

const jsonDescription = "This utility will walk you through creating a modpack.json file. It only covers the most common items, and tries to guess sensible defaults."

modpackLock.command('init')
  .description(jsonDescription)
  .optionsGroup("Options:")
  .option('-f, --folder <path>', 'Path to the modpack directory')
  .optionsGroup("INFORMATION")
  .helpOption("--help", `display help for ${pkg.name}`)
  .action((options) => {
    console.log(jsonDescription);
    console.log("\nSee `modpack-lock init --help` for definitive documentation on these fields and exactly what they do.\n");
    console.log("Press ^C at any time to quit.\n");
    getModpackInfo(path.basename(options.folder || process.cwd())).then(modpackInfo => {
        generateJson(modpackInfo, [], [options.folder || process.cwd()])
    }, error => {
      console.error('Error:', error);
      process.exit(1);
    });
  });

modpackLock.parse()

