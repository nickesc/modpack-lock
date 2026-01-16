#!/usr/bin/env NODE_OPTIONS=--no-warnings node

import { Command } from 'commander';
import slugify from 'slugify';
import path from 'path';
import { spawn } from 'child_process';
import {generateLockfile} from './generate_lockfile.js';
import { generateModpackFiles } from './modpack-lock.js';
import { promptUserForInfo, promptUserAboutOptionalFiles } from './modpack_info.js';
import { getModpackInfo } from './directory_scanning.js';
import generateLicense from './generate_license.js';
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

/**
 * Merge modpack info with priority: options > existingInfo > defaults
 * Preserves all fields from existingInfo
 */
function mergeModpackInfo(existingInfo, options, defaults) {
    const result = {};
    for (const [key, defaultValue] of Object.entries(defaults)) {
        result[key] = options[key] || existingInfo?.[key] || defaultValue;
    }

    // Then, add any fields from existingInfo that aren't in defaults
    if (existingInfo) {
        for (const [key, value] of Object.entries(existingInfo)) {
            if (!(key in defaults)) {
                result[key] = value;
            }
        }
    }

    return result;
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
    .option('--add-license', 'Add the license file to the modpack')
    .option('--add-gitignore', 'Print .gitignore rules for files not hosted on Modrinth')
    .option('--add-readme', 'Generate README.md files for each category')
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
    .helpOption("-h, --help", `display help for ${pkg.name} init`)
    .action(async (options) => {
        options._init = true;
        const currDir = options.folder || process.cwd();

        let existingInfo = await getModpackInfo(currDir);

        if (options.noninteractive) {
            quietConsole();
            if ( (!options.author && !existingInfo?.author) || (!options.modloader && !existingInfo?.modloader) || (!options.targetMinecraftVersion && !existingInfo?.targetMinecraftVersion)) {
                console.error('Error: Must provide options for required fields');
                process.exitCode = 1;
                return;
            } else {
                const defaultName = path.basename(currDir);
                const defaults = {
                    name: defaultName,
                    version: config.DEFAULT_MODPACK_VERSION,
                    id: defaultName,
                    description: '',
                    author: options.author, // Required, no default
                    projectUrl: '',
                    sourceUrl: '',
                    license: '',
                    modloader: options.modloader, // Required, no default
                    targetModloaderVersion: '',
                    targetMinecraftVersion: options.targetMinecraftVersion, // Required, no default
                };

                const modpackInfo = mergeModpackInfo(existingInfo, options, defaults);
                modpackInfo.id = slugify(modpackInfo.id, config.SLUGIFY_OPTIONS);

                if (options.addLicense) {
                    await generateLicense(modpackInfo, currDir, options);
                }

                options.readme = options.addReadme;
                options.gitignore = options.addGitignore;

                // generate the modpack files
                try {
                    await generateModpackFiles(modpackInfo, currDir, options);
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
                const defaults = {
                    name: path.basename(currDir),
                    version: config.DEFAULT_MODPACK_VERSION,
                    id: undefined,
                    description: undefined,
                    author: undefined,
                    projectUrl: undefined,
                    sourceUrl: undefined,
                    license: config.DEFAULT_MODPACK_LICENSE,
                    modloader: undefined,
                    targetModloaderVersion: undefined,
                    targetMinecraftVersion: undefined,
                };

                // prompt user for modpack information
                const modpackInfo = await promptUserForInfo(
                    mergeModpackInfo(existingInfo, options, defaults)
                );

                // prompt user if they want to add the license text
                const optionalFiles = await promptUserAboutOptionalFiles(modpackInfo, options);
                console.log();
                if (options.addLicense || optionalFiles.addLicense) {
                    await generateLicense(modpackInfo, currDir, options);
                }
                console.log();

                // generate the modpack files
                options.readme = optionalFiles.addReadme;
                options.gitignore = optionalFiles.addGitignore;
                await generateModpackFiles(modpackInfo, currDir, options);
            } catch (error) {
                console.error('Error:', error);
                process.exitCode = 1;
            }
        }
    });

modpackLock.command('run')
    .description(`Run a script (shell command) defined in ${config.MODPACK_JSON_NAME}\'s \'scripts\' object`)
    .argument('<script>', 'The name of the script to run')
    .option('-f, --folder <path>', 'Path to the modpack directory')
    .option('-D, --debug', 'Debug mode -- show more information about how the command is being parsed')
    .helpOption("-h, --help", `display help for ${pkg.name} run`)
    .allowExcessArguments(true)
    .allowUnknownOption(true)
    .action(async (script, options, command) => {
        options._run = true;
        try {
            if (options.debug) {
                console.log("COMMAND:", command);
            }

            const currDir = options.folder || process.cwd();
            const modpackInfo = await getModpackInfo(currDir);

            // verify neccecary files and information exist
            if (!modpackInfo) {
                throw new Error('No modpack.json file found');
            }
            if (!modpackInfo.scripts) {
                throw new Error('No scripts defined in modpack.json');
            }
            if (!modpackInfo.scripts[script]) {
                throw new Error(`Script ${script} not found in modpack.json`);
            }

            // build the full command
            const scriptCommand = modpackInfo.scripts[script];
            const args = command.args ? command.args.slice(1) : [];
            const fullCommand = `${scriptCommand} ${args.join(' ')}`;

            // debug logging
            if (options.debug) {
                console.log("CURR DIR:", currDir);
                console.log("OPTIONS:", options);
                console.log("SCRIPT:", script);
                console.log("SCRIPT COMMAND:", scriptCommand);
                console.log("ARGS:", args);
                console.log("FULL COMMAND:", fullCommand);
            }

            // spawn the command
            const child = spawn(fullCommand, [], {
                shell: true,
                stdio: 'inherit',
                cwd: currDir
            });

            // preserve exit code on completion
            const exitCode = await new Promise((resolve) => {
                child.on('close', (code) => {
                    resolve(code || 0);
                });
            });
            process.exitCode = exitCode;
        } catch (error) {
            console.error('Error:', error.message);
            process.exitCode = 1;
        }
    });

modpackLock.parseAsync().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
