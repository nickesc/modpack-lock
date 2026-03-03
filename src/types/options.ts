/**
 * Contains options for the generation of the modpack files.
 * @property dryRun - Whether to dry run the generation
 * @property quiet - Whether to quiet the console output
 * @property silent - Whether to silent the console output
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
 * @property folder - The folder to generate the modpack files in
 * @property noninteractive - Whether to run the interactive mode
 * @property addLicense - Whether to add the license file to the modpack
 * @property addGitignore - Whether to generate .gitignore rules
 * @property addReadme - Whether to generate README.md files
 * @property name - The name of the modpack
 * @property version - The version of the modpack
 * @property id - The slug/ID of the modpack
 * @property description - The description of the modpack
 * @property author - The author of the modpack
 * @property projectUrl - The modpack's project URL
 * @property sourceUrl - The modpack's source code URL
 * @property license - The modpack's license
 * @property modloader - The modpack's modloader
 * @property targetModloaderVersion - The target modloader version
 * @property targetMinecraftVersion - The target Minecraft version
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
 * @property folder - The folder to look for modpack.json in
 * @property debug - Whether to print debug information about the executed script
 * @property _run - Internal boolean added to indicate options come from the `run` command.
 */
export interface RunOptions extends Options {
    folder?: string;
    debug?: boolean;
    _run?: boolean;
}
