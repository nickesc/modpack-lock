/**
 * @typedef {Object} ModpackInfo
 * Contains information about the modpack that is not dependent on the lockfile.
 * @property {string} name - The name of the modpack (Required)
 * @property {string} version - The version of the modpack (Required)
 * @property {string} description - The description of the modpack
 * @property {string} id - The slug/ID of the modpack (Required)
 * @property {string} author - The author of the modpack (Required)
 * @property {string} projectUrl - The project URL of the modpack
 * @property {string} sourceUrl - The source code URL of the modpack
 * @property {string} license - The license of the modpack
 * @property {string} modloader - The modloader of the modpack (Required)
 * @property {string} targetModloaderVersion - The target modloader version of the modpack
 * @property {string} targetMinecraftVersion - The target Minecraft version of the modpack (Required)
 */

/**
 * @typedef {Object} Lockfile
 * Contains information about the modpack dependencies and their versions.
 * @property {string} version - The version of the modpack
 * @property {string} generated - The date and time the lockfile was generated
 * @property {number} total - The total number of files in the modpack
 * @property {Object} counts - The counts object
 * @property {number} counts.mods - The mods count
 * @property {number} counts.resourcepacks - The resourcepacks count
 * @property {number} counts.datapacks - The datapacks count
 * @property {number} counts.shaderpacks - The shaderpacks count
 * @property {Object} dependencies - The dependencies object
 * @property {Array<Object>} dependencies.mods - The mods object
 * @property {Array<Object>} dependencies.resourcepacks - The resourcepacks object
 * @property {Array<Object>} dependencies.datapacks - The datapacks object
 * @property {Array<Object>} dependencies.shaderpacks - The shaderpacks object
 */

/**
 * @typedef {Object} Options
 * Contains options for the generation of the modpack files.
 * @property {boolean} dryRun - Whether to dry run the generation
 * @property {boolean} quiet - Whether to quiet the console output
 * @property {boolean} silent - Whether to silent the console output
 * @property {boolean} gitignore - Whether to generate a .gitignore file
 * @property {boolean} readme - Whether to generate README.md files
 */

/**
 * @typedef {Object} InitOptions
 * Contains options for the initialization of the modpack files.
 * @property {string} folder - The folder to generate the modpack files in
 * @property {boolean} noninteractive - Whether to run the interactive mode
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

/**
 * @typedef {Object} RunOptions
 * Contains options for the running scripts defined in modpack.json.
 * @property {string} folder - The folder to look for modpack.json in
 * @property {boolean} debug - Whether to print debug information about the executed script
 * @property {boolean} _run - Internal boolean added to indicate options come from the `run` command.
 */

export {};
