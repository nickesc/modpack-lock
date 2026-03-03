/**
 * Contains options for the generation of the modpack files.
 * @property {boolean} dryRun - Whether to dry run the generation
 * @property {boolean} quiet - Whether to quiet the console output
 * @property {boolean} silent - Whether to silent the console output
 * @property {boolean} gitignore - Whether to generate a .gitignore file
 * @property {boolean} readme - Whether to generate README.md files
 * @property {boolean} licenseFile - Whether to generate a license file
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
 * @property {string} folder - The folder to generate the modpack files in
 * @property {boolean} noninteractive - Whether to run the interactive mode
 * @property {boolean} addLicense - Whether to add the license file to the modpack
 * @property {boolean} addGitignore - Whether to generate .gitignore rules
 * @property {boolean} addReadme - Whether to generate README.md files
 * @property {string} name - The name of the modpack
 * @property {string} version - The version of the modpack
 * @property {string} id - The slug/ID of the modpack
 * @property {string} description - The description of the modpack
 * @property {string} author - The author of the modpack
 * @property {string} projectUrl - The modpack's project URL
 * @property {string} sourceUrl - The modpack's source code URL
 * @property {string} license - The modpack's license
 * @property {string} modloader - The modpack's modloader
 * @property {string} targetModloaderVersion - The target modloader version
 * @property {string} targetMinecraftVersion - The target Minecraft version
 * @property {boolean} _init - Internal boolean added to indicate options come from the `init` command.
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
 * @property {string} folder - The folder to look for modpack.json in
 * @property {boolean} debug - Whether to print debug information about the executed script
 * @property {boolean} _run - Internal boolean added to indicate options come from the `run` command.
 */

export interface RunOptions extends Options {
    folder?: string;
    debug?: boolean;
    _run?: boolean;
}
