#!/usr/bin/env NODE_OPTIONS=--no-warnings node

import {Command} from "commander";
import slugify from "slugify";
import path from "path";
import {ChildProcess, spawn} from "child_process";
import {generateLockfile, printLockfileSummary} from "./generate_lockfile.js";
import {generateReadmeFiles} from "./generate_readme.js";
import {generateGitignoreRules} from "./generate_gitignore.js";
import {generateModpackFiles} from "./modpack-lock.js";
import {promptUserForInfo, promptUserAboutOptionalFiles} from "./user_prompts.js";
import {getModpackInfo} from "./directory_scanning.js";
import * as config from "./config/index.js";
import pkg from "../package.json" with {type: "json"};
import {logm, styleText} from "./logger.js";
import type {
    Jsonfile,
    Options,
    InitOptions,
    Lockfile,
    ModpackInfo,
    OptionalFileOptions,
    RunOptions,
} from "./types/index.js";
import type prompts from "prompts";

const modpackLock = new Command("modpack-lock");

/**
 * Merge modpack info with priority: options > existingInfo > defaults
 * Preserves all fields from existingInfo
 */
function mergeModpackInfo(existingInfo: Jsonfile | null, options: InitOptions, defaults: ModpackInfo): Jsonfile {
    const mergedInfo: Jsonfile = {
        ...defaults,
        ...(existingInfo ?? {}),
    };

    for (const key of config.MODPACK_INFO_FIELDS) {
        const defaultValue = defaults[key];
        mergedInfo[key] = options[key] || existingInfo?.[key] || defaultValue;
    }

    return mergedInfo;
}

modpackLock
    .name(pkg.name)
    .description(pkg.description)
    .summary("Create a modpack lockfile")
    .optionsGroup(config.headings.options)
    .option("-p, --path <path>", "Path to the modpack directory")
    .option("-d, --dry-run", "Dry-run mode - no files will be written")
    .optionsGroup(config.headings.generation)
    .option("-l, --licenseFile", config.fileFields.addLicense.option)
    .option("-g, --gitignore", config.fileFields.addGitignore.option)
    .option("-r, --readme", config.fileFields.addReadme.option)
    .optionsGroup(config.headings.logging)
    .option("-q, --quiet", "Quiet mode - only show errors and warnings")
    .option("-s, --silent", "Silent mode - no output")
    .optionsGroup(config.headings.information)
    .helpOption("-h, --help", `display help for ${pkg.name}`)
    .version(pkg.version, "-V")
    .action(async (options: Options) => {
        try {
            const currDir: string = options.path || process.cwd();

            logm.quietFromOptions(options);

            const modpackInfo: Jsonfile | null = await getModpackInfo(currDir);
            if (modpackInfo) {
                const lockfile: Lockfile = await generateModpackFiles(modpackInfo, currDir, options);
                printLockfileSummary(lockfile);
            } else {
                // Warn if license option is passed but no modpack.json exists
                if (options.licenseFile) {
                    logm.warn(
                        `License generation requires a ${config.MODPACK_JSON_NAME} file. Skipping license generation.`,
                    );
                }

                // Generate lockfile
                const lockfile: Lockfile = await generateLockfile(currDir, options);

                if (options.gitignore || options.readme) {
                    logm.header("Generating Optional Files");
                }

                // Generate gitignore if requested
                if (options.gitignore) {
                    await generateGitignoreRules(lockfile, currDir, options);
                }

                // Generate README files if requested
                if (options.readme) {
                    await generateReadmeFiles(lockfile, currDir, options);
                }

                printLockfileSummary(lockfile);
            }
        } catch (error) {
            logm.error(error);
            process.exitCode = 1;
        }
    });

modpackLock
    .command("init")
    .description(
        `Initialize a modpack with a ${config.MODPACK_JSON_NAME} file and a ${config.MODPACK_LOCKFILE_NAME} lockfile.`,
    )
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
    .action(async (options: InitOptions) => {
        options._init = true;
        const currDir: string = options.folder || process.cwd();

        let existingInfo: Jsonfile | null = await getModpackInfo(currDir);

        if (options.noninteractive) {
            logm.quiet();
            const defaultName: string = path.basename(currDir);

            const author: string = options.author || existingInfo?.author || "";
            const modloader: string = options.modloader || existingInfo?.modloader || "";
            const targetMinecraftVersion: string =
                options.targetMinecraftVersion || existingInfo?.targetMinecraftVersion || "";

            if (!author || !modloader || !targetMinecraftVersion) {
                logm.error(
                    `Must provide options for required fields:`,
                    styleText(
                        ["bold"],
                        `${author ? "" : "author"}$ ${modloader ? "" : "modloader"} ${targetMinecraftVersion ? "" : "targetMinecraftVersion"}`,
                    ),
                );
                process.exitCode = 1;
                return;
            }

            const defaults: ModpackInfo = {
                name: defaultName,
                version: config.DEFAULT_MODPACK_VERSION,
                id: defaultName,
                description: "",
                author: author, // Required, no default
                projectUrl: "",
                sourceUrl: "",
                license: "",
                modloader: modloader, // Required, no default
                targetModloaderVersion: "",
                targetMinecraftVersion: targetMinecraftVersion, // Required, no default
            };

            const modpackInfo: Jsonfile = mergeModpackInfo(existingInfo, options, defaults);
            modpackInfo.id = slugify(modpackInfo.id, config.SLUGIFY_OPTIONS);

            options.readme = options.addReadme || false;
            options.gitignore = options.addGitignore || false;
            options.licenseFile = options.addLicense || false;

            // generate the modpack files
            try {
                await generateModpackFiles(modpackInfo, currDir, options);
            } catch (error) {
                logm.error(error);
                process.exitCode = 1;
            }
        } else {
            logm.info(logm.label("modpack-lock"), styleText(["bold", "italic", "blueBright"], "init"));
            logm.newline();
            logm.info(
                styleText(["dim"], "This utility will walk you through creating a"),
                config.MODPACK_JSON_NAME,
                styleText(["dim"], "file and a"),
                config.MODPACK_LOCKFILE_NAME,
                styleText(
                    ["dim"],
                    "lockfile. It only covers the most common items, and tries to guess sensible defaults.",
                ),
            );
            logm.newline();
            logm.info(
                styleText(["dim"], "See"),
                styleText(["white", "bgGray", "italic"], "modpack-lock init --help"),
                styleText(["dim"], "for definitive documentation on these fields and exactly what they do."),
            );
            logm.newline();
            logm.info(
                styleText(["dim"], "Press"),
                styleText(["yellow"], "^C"),
                styleText(["dim"], "at any time to quit."),
            );
            logm.newline();
            try {
                const defaults: ModpackInfo = {
                    name: path.basename(currDir),
                    version: config.DEFAULT_MODPACK_VERSION,
                    id: "",
                    description: "",
                    author: "",
                    projectUrl: "",
                    sourceUrl: "",
                    license: config.DEFAULT_MODPACK_LICENSE,
                    modloader: "",
                    targetModloaderVersion: "",
                    targetMinecraftVersion: "",
                };
                const mergedDefaults = mergeModpackInfo(existingInfo, options, defaults);

                // prompt user for modpack information
                const userAnswers: prompts.Answers<keyof ModpackInfo> = await promptUserForInfo(mergedDefaults);

                // Preserve extra fields (e.g. scripts) from existing modpack.json
                const modpackInfo: Jsonfile = {...mergedDefaults, ...userAnswers};

                // prompt user if they want to add the license text
                const optionalFiles: prompts.Answers<OptionalFileOptions> = await promptUserAboutOptionalFiles(
                    modpackInfo,
                    options,
                );

                logm.newline();

                // generate the modpack files
                options.readme = optionalFiles.addReadme;
                options.gitignore = optionalFiles.addGitignore;
                options.licenseFile = optionalFiles.addLicense;
                const lockfile: Lockfile = await generateModpackFiles(modpackInfo, currDir, options);

                printLockfileSummary(lockfile);
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
    .action(async (script: string, options: RunOptions, command: Command) => {
        options._run = true;
        try {
            if (options.debug) {
                logm.debug("COMMAND:", command);
            }

            const currDir: string = options.folder || process.cwd();
            const modpackInfo: Jsonfile | null = await getModpackInfo(currDir);

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
            const scriptCommand: string = modpackInfo.scripts[script];
            const args: string[] = command.args ? command.args.slice(1) : [];
            const fullCommand: string = `${scriptCommand} ${args.join(" ")}`;

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
            const child: ChildProcess = spawn(fullCommand, [], {
                shell: true,
                stdio: "inherit",
                cwd: currDir,
            });

            // preserve exit code on completion
            const exitCode: number = await new Promise<number>((resolve) => {
                child.on("close", (code: number) => {
                    resolve(code || 0);
                });
            });
            process.exitCode = exitCode;
        } catch (error: any) {
            logm.error(error.message);
            process.exitCode = 1;
        }
    });

modpackLock.parseAsync().catch((error) => {
    logm.error(error);
    process.exit(1);
});
