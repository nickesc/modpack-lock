#!/usr/bin/env NODE_OPTIONS=--no-warnings node

import {Command} from "commander";
import slugify from "slugify";
import path from "path";
import {spawn} from "child_process";
import {generateLockfile} from "./generate_lockfile.js";
import {generateReadmeFiles} from "./generate_readme.js";
import {generateGitignoreRules} from "./generate_gitignore.js";
import {generateModpackFiles} from "./modpack-lock.js";
import {promptUserForInfo, promptUserAboutOptionalFiles} from "./modpack_info.js";
import {getModpackInfo} from "./directory_scanning.js";
import generateLicense from "./generate_license.js";
import * as config from "./config/index.js";
import pkg from "../package.json" with {type: "json"};
import {logm, styleText} from "./logger.js";

const modpackLock = new Command("modpack-lock");

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
    .optionsGroup(config.headings.options)
    .option("-p, --path <path>", "Path to the modpack directory")
    .option("-d, --dry-run", "Dry-run mode - no files will be written")
    .optionsGroup(config.headings.generation)
    .option("-g, --gitignore", config.fileFields.addGitignore.option)
    .option("-r, --readme", config.fileFields.addReadme.option)
    .optionsGroup(config.headings.logging)
    .option("-q, --quiet", "Quiet mode - only show errors and warnings")
    .option("-s, --silent", "Silent mode - no output")
    .optionsGroup(config.headings.information)
    .helpOption("-h, --help", `display help for ${pkg.name}`)
    .version(pkg.version, "-V")
    .action(async (options) => {
        try {
            const currDir = options.path || process.cwd();

            if (options.quiet) {
                logm.quiet();
            } else if (options.silent) {
                logm.quiet(true);
            }

            const modpackInfo = await getModpackInfo(currDir);
            if (modpackInfo) {
                await generateModpackFiles(modpackInfo, currDir, options);
            } else {
                // Generate lockfile
                const lockfile = await generateLockfile(currDir, options);

                // Generate gitignore if requested
                if (options.gitignore) {
                    await generateGitignoreRules(lockfile, currDir, options);
                }

                // Generate README files if requested
                if (options.readme) {
                    await generateReadmeFiles(lockfile, currDir, options);
                }
            }
        } catch (error) {
            logm.error(error);
            process.exitCode = 1;
        }
    });

const jsonDescription = `This utility will walk you through creating a ${config.MODPACK_JSON_NAME} file. It only covers the most common items, and tries to guess sensible defaults.`;

modpackLock
    .command("init")
    .description(`Initialize a modpack with a ${config.MODPACK_JSON_NAME} file and a ${config.LOCKFILE_NAME} lockfile.`)
    .optionsGroup(config.headings.options)
    .option("-f, --folder <path>", "Path to the modpack directory")
    .option("-n, --noninteractive", "Non-interactive mode - must provide options for required fields")
    .option("--add-license", config.fileFields.addLicense.option)
    .option("--add-gitignore", config.fileFields.addGitignore.option)
    .option("--add-readme", config.fileFields.addReadme.option)
    .optionsGroup(config.headings.packInfo)
    .option("--name <name>", config.infoFields.name.option)
    .option("--version <version>", config.infoFields.version.option)
    .option("--id <id>", config.infoFields.id.option)
    .option("--description <description>", config.infoFields.description.option)
    .option("--author <author>", config.infoFields.author.option)
    .option("--projectUrl <projectUrl>", config.infoFields.projectUrl.option)
    .option("--sourceUrl <sourceUrl>", config.infoFields.sourceUrl.option)
    .option("--license <license>", config.infoFields.license.option)
    .option("--modloader <modloader>", config.infoFields.modloader.option)
    .option("--targetModloaderVersion <targetModloaderVersion>", config.infoFields.targetModloaderVersion.option)
    .option("--targetMinecraftVersion <targetMinecraftVersion>", config.infoFields.targetMinecraftVersion.option)
    .optionsGroup(config.headings.information)
    .helpOption("-h, --help", `display help for ${pkg.name} init`)
    .action(async (options) => {
        options._init = true;
        const currDir = options.folder || process.cwd();

        let existingInfo = await getModpackInfo(currDir);

        if (options.noninteractive) {
            logm.quiet();
            if (
                (!options.author && !existingInfo?.author) ||
                (!options.modloader && !existingInfo?.modloader) ||
                (!options.targetMinecraftVersion && !existingInfo?.targetMinecraftVersion)
            ) {
                logm.error("Must provide options for required fields");
                process.exitCode = 1;
                return;
            } else {
                const defaultName = path.basename(currDir);
                const defaults = {
                    name: defaultName,
                    version: config.DEFAULT_MODPACK_VERSION,
                    id: defaultName,
                    description: "",
                    author: options.author, // Required, no default
                    projectUrl: "",
                    sourceUrl: "",
                    license: "",
                    modloader: options.modloader, // Required, no default
                    targetModloaderVersion: "",
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
                    logm.error(error);
                    process.exitCode = 1;
                }
            }
        } else {
            logm.info(logm.label("modpack-lock"), styleText(["bold", "italic", "blueBright"], "init"));
            logm.newline();
            logm.info(styleText(["dim"], "This utility will walk you through creating a"),
                 config.MODPACK_JSON_NAME,
                styleText(["dim"], "file and a"),
                config.MODPACK_LOCKFILE_NAME,
                styleText(["dim"], "lockfile. It only covers the most common items, and tries to guess sensible defaults."),
            );
            logm.newline();
            logm.info(styleText(["dim"], "See"), styleText(["white", "bgGray", "italic"], "modpack-lock init --help"), styleText(["dim"], "for definitive documentation on these fields and exactly what they do."));
            logm.newline();
            logm.info(styleText(["dim"], "Press"), styleText(["yellow"], "^C"), styleText(["dim"], "at any time to quit."));
            logm.newline();
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
                const modpackInfo = await promptUserForInfo(mergeModpackInfo(existingInfo, options, defaults));

                // prompt user if they want to add the license text
                const optionalFiles = await promptUserAboutOptionalFiles(modpackInfo, options);

                logm.newline();

                if (options.addLicense || optionalFiles.addLicense) {
                    await generateLicense(modpackInfo, currDir, options);
                }
                //logm.log();

                // generate the modpack files
                options.readme = optionalFiles.addReadme;
                options.gitignore = optionalFiles.addGitignore;
                await generateModpackFiles(modpackInfo, currDir, options);
            } catch (error) {
                logm.error(error);
                process.exitCode = 1;
            }
        }
    });

modpackLock
    .command("run")
    .description(`Run a script defined in the ${config.MODPACK_JSON_NAME} file's 'scripts' field`)
    .argument("<script>", "The name of the script to run")
    .optionsGroup(config.headings.options)
    .option("-f, --folder <path>", "Path to the modpack directory")
    .option("-D, --debug", "Debug mode -- show more information about how the command is being parsed")
    .optionsGroup(config.headings.information)
    .helpOption("-h, --help", `display help for ${pkg.name} run`)
    .allowExcessArguments(true)
    .allowUnknownOption(true)
    .action(async (script, options, command) => {
        options._run = true;
        try {
            if (options.debug) {
                logm.log("COMMAND:", command);
            }

            const currDir = options.folder || process.cwd();
            const modpackInfo = await getModpackInfo(currDir);

            // verify neccecary files and information exist
            if (!modpackInfo) {
                throw new Error(`No ${config.MODPACK_JSON_NAME} file found`);
            }
            if (!modpackInfo.scripts) {
                throw new Error(`No scripts defined in ${config.MODPACK_JSON_NAME}`);
            }
            if (!modpackInfo.scripts[script]) {
                throw new Error(`Script ${script} not found in ${config.MODPACK_JSON_NAME}`);
            }

            // build the full command
            const scriptCommand = modpackInfo.scripts[script];
            const args = command.args ? command.args.slice(1) : [];
            const fullCommand = `${scriptCommand} ${args.join(" ")}`;

            // debug logging
            if (options.debug) {
                logm.debug("CURR DIR:", currDir);
                logm.debug("OPTIONS:", options);
                logm.debug("SCRIPT:", script);
                logm.debug("SCRIPT COMMAND:", scriptCommand);
                logm.debug("ARGS:", args);
                logm.debug("FULL COMMAND:", fullCommand);
            }

            // spawn the command
            const child = spawn(fullCommand, [], {
                shell: true,
                stdio: "inherit",
                cwd: currDir,
            });

            // preserve exit code on completion
            const exitCode = await new Promise((resolve) => {
                child.on("close", (code) => {
                    resolve(code || 0);
                });
            });
            process.exitCode = exitCode;
        } catch (error) {
            logm.error(error.message);
            process.exitCode = 1;
        }
    });

modpackLock.parseAsync().catch((error) => {
    logm.error(error);
    process.exit(1);
});
