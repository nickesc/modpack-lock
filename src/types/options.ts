/**
 * Contains options for the generation of the modpack files.
 * @property dryRun - Whether to run in dry-run mode (no files written)
 * @property quiet - Whether to quiet the console output
 * @property silent - Whether to silence the console output
 * @property gitignore - Whether to generate a .gitignore file
 * @property readme - Whether to generate README.md files
 * @property licenseFile - Whether to generate a license file
 */
export interface Options {
    dryRun?: boolean;
    quiet?: boolean;
    silent?: boolean;
    gitignore?: boolean;
    readme?: boolean;
    licenseFile?: boolean;
    path?: string;
}

/**
 * Contains options for the initialization of the modpack files.
 * @property folder - The modpack root directory
 * @property noninteractive - Whether to initialize in non-interactive mode
 * @property addLicense - Whether to add the license file to the modpack
 * @property addGitignore - Whether to generate .gitignore rules
 * @property addReadme - Whether to generate README.md files
 * @property name - The option to set the modpack name
 * @property version - The option to set the version
 * @property id - The option to set the slug/ID
 * @property description - The option to set the description
 * @property author - The option to set the author
 * @property projectUrl - The option to set the project URL
 * @property sourceUrl - The option to set the source code URL
 * @property license - The option to set the license
 * @property modloader - The option to set the modloader
 * @property targetModloaderVersion - The option to set the target modloader version
 * @property targetMinecraftVersion - The option to set the target Minecraft version
 * @property _init - Internal boolean added to indicate options come from the `init` command.
 */
export interface InitOptions extends Options {
    folder?: string;
    noninteractive?: boolean;
    addLicense?: boolean;
    addGitignore?: boolean;
    addReadme?: boolean;
    name?: string;
    version?: string;
    id?: string;
    description?: string;
    author?: string;
    projectUrl?: string;
    sourceUrl?: string;
    license?: string;
    modloader?: string;
    targetModloaderVersion?: string;
    targetMinecraftVersion?: string;
    _init?: boolean;
}

/**
 * Contains options for the running scripts defined in modpack.json.
 * @property folder - The modpack root directory
 * @property debug - Whether to print debug information
 * @property _run - Internal boolean added to indicate options come from the `run` command.
 */
export interface RunOptions extends Options {
    folder?: string;
    debug?: boolean;
    _run?: boolean;
}
