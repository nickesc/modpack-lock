/**
 * Contains information about the modpack that is not dependent on the lockfile.
 * @property name - The name of the modpack (Required)
 * @property version - The modpack version (Required)
 * @property description - A description of the modpack
 * @property id - The modpack's slug/ID (Required)
 * @property author - The author of the modpack (Required)
 * @property projectUrl - The project's homepage URL
 * @property sourceUrl - The project's source code URL
 * @property license - The modpack's license
 * @property modloader - The modpack's modloader (Required)
 * @property targetModloaderVersion - The target modloader version
 * @property targetMinecraftVersion - The target Minecraft version (Required)
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
