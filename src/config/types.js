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

export {};
