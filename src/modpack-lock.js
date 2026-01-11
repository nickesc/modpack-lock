#!/usr/bin/env NODE_OPTIONS=--no-warnings node

import { Command } from 'commander';
import prompts from 'prompts';
import path from 'path';
import generateLockfile from './generate-lockfile.js';
import generateJson from './generate-json.js';

import pkg from '../package.json' with { type: 'json' };
const modpackLock = new Command('modpack-lock');

const originalLogs = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
};

function slugify(string, separator = "-") {
    return string
        .toString()
        .normalize('NFD') // split an accented letter in the base letter and the accent
        .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '') // remove all chars not letters, numbers and spaces (to be replaced)
        .trim()
        .replace(/\s+/g, separator);
};

/**
 * Silence all console.log output
 */
function quietConsole(silent = false) {
    console.log = () => { };
    console.info = () => { };
    if (silent) {
        console.warn = () => { };
        console.error = () => { };
    }
}

function restoreConsole() {
    console.log = originalLogs.log;
    console.info = originalLogs.info;
    console.warn = originalLogs.warn;
    console.error = originalLogs.error;
}


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
            initial: slugify(defaultName),
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
                { title: 'fabric' },
                { title: 'forge' },
                { title: 'quilt' },
                { title: 'neoforge' },
                { title: 'sponge' },
                { title: 'paper' },
                { title: 'velocity' },
                { title: 'bungeecord' },
                { title: 'waterfall' },
                { title: 'travertia' },
                { title: 'nukkit' },
                { title: 'pufferfish' },
                { title: 'purpur' },
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
    if (Object.keys(answers).length < 11) {
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
        if (options.quiet) {
            quietConsole();
        } else if (options.silent) {
            quietConsole(true);
        }
        generateLockfile({ ...options, path: options.path || process.cwd() }).catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
    });

const jsonDescription = "This utility will walk you through creating a modpack.json file. It only covers the most common items, and tries to guess sensible defaults.";

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
        getModpackInfo(path.basename(options.folder || process.cwd()))
        .then(modpackInfo => {
            quietConsole();
            generateLockfile({ path: options.folder || process.cwd() }).then(lockfile => {
                restoreConsole();
                console.log('Lockfile generated');
                generateJson(modpackInfo, lockfile, options.folder || process.cwd());
            });
        }, error => {
            console.error('Error:', error);
            process.exit(1);
        });
    });

modpackLock.parse()

