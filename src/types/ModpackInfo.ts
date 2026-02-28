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
export type ModpackInfo = {
    name: string;
    version: string;
    description: string;
    id: string;
    author: string;
    projectUrl: string;
    sourceUrl: string;
    license: string;
    modloader: string;
    targetModloaderVersion: string;
    targetMinecraftVersion: string;
};
