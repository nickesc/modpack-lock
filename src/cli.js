#!/usr/bin/env NODE_OPTIONS=--no-warnings node

import { Command } from 'commander';
import path from 'path';
import slugify from 'slugify';
import {generateLockfile} from './generate_lockfile.js';
import generateJson from './generate_json.js';
import { generateModpackFiles } from './modpack-lock.js';
import promptUserForInfo from './modpack_info.js';
import { getModpackInfo } from './directory_scanning.js';
import * as config from './config/index.js';
import pkg from '../package.json' with { type: 'json' };


const modpackLock = new Command('modpack-lock');

const originalLogs = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
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

/**
 * Restore the console's original functions
 */
function restoreConsole() {
    console.log = originalLogs.log;
    console.info = originalLogs.info;
    console.warn = originalLogs.warn;
    console.error = originalLogs.error;
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
    .helpOption("-h, --help", `display help for ${pkg.name}`)
    .version(pkg.version, '-V')
    .action(async (options) => {
        try {
            const currDir = options.path || process.cwd();

            if (options.quiet) {
                quietConsole();
            } else if (options.silent) {
                quietConsole(true);
            }

            const modpackInfo = await getModpackInfo(currDir);
            if (modpackInfo) {
                await generateModpackFiles(modpackInfo, currDir, options);
            } else {
                await generateLockfile(currDir, options);
            }
        } catch (error) {
            console.error('Error:', error);
            process.exitCode = 1;
        }
    });

const jsonDescription = `This utility will walk you through creating a ${config.MODPACK_JSON_NAME} file. It only covers the most common items, and tries to guess sensible defaults.`;

modpackLock.command('init')
    .description(jsonDescription)
    .optionsGroup("Options:")
    .option('-f, --folder <path>', 'Path to the modpack directory')
    .option("-n, --noninteractive", 'Non-interactive mode - must provide options for required fields')
    .optionsGroup("MODPACK INFORMATION")
    .option('--name <name>', 'Modpack name; defaults to the directory name')
    .option('--version <version>', 'Modpack version; defaults to 1.0.0')
    .option('--id <id>', 'Modpack slug/ID; defaults to the directory name slugified')
    .option('--description <description>', 'Modpack description')
    .option('--author <author>', 'Modpack author; required')
    .option('--projectUrl <projectUrl>', 'Modpack URL')
    .option('--sourceUrl <sourceUrl>', 'Modpack source code URL')
    .option('--license <license>', 'Modpack license')
    .option('--modloader <modloader>', 'Modpack modloader; required')
    .option('--targetModloaderVersion <targetModloaderVersion>', 'Target modloader version')
    .option('--targetMinecraftVersion <targetMinecraftVersion>', 'Target Minecraft version; required')
    .optionsGroup("INFORMATION")
    .helpOption("--help", `display help for ${pkg.name} init`)
    .action(async (options) => {
        const currDir = options.folder || process.cwd();

        if (options.noninteractive) {
            quietConsole();
            if (!options.author || !options.modloader || !options.targetMinecraftVersion) {
                console.error('Error: Must provide options for required fields');
                process.exitCode = 1;
                return;
            } else {
                const modpackInfo = {
                    name: options.name || path.basename(currDir),
                    version: options.version || '1.0.0',
                    id: slugify(options.id || options.name || path.basename(currDir), config.SLUGIFY_OPTIONS),
                    description: options.description || '',
                    author: options.author,
                    projectUrl: options.projectUrl || '',
                    sourceUrl: options.sourceUrl || '',
                    license: options.license || '',
                    modloader: options.modloader,
                    targetModloaderVersion: options.targetModloaderVersion || '',
                    targetMinecraftVersion: options.targetMinecraftVersion,
                };
                try {
                    await generateModpackFiles(modpackInfo, currDir, { dryRun: false });
                } catch (error) {
                    console.error('Error:', error);
                    process.exitCode = 1;
                }
            }
        } else {
            console.log(jsonDescription);
            console.log("\nSee `modpack-lock init --help` for definitive documentation on these fields and exactly what they do.\n");
            console.log("Press ^C at any time to quit.\n");
            try {
                const modpackInfo = await promptUserForInfo({
                    name: options.name || path.basename(currDir),
                    version: options.version,
                    id: options.id,
                    description: options.description,
                    author: options.author,
                    projectUrl: options.projectUrl,
                    sourceUrl: options.sourceUrl,
                    license: options.license,
                    modloader: options.modloader,
                    targetModloaderVersion: options.targetModloaderVersion,
                    targetMinecraftVersion: options.targetMinecraftVersion,
                });

                await generateModpackFiles(modpackInfo, currDir, { dryRun: false });
            } catch (error) {
                console.error('Error:', error);
                process.exitCode = 1;
            }
        }
    });

modpackLock.parseAsync().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
