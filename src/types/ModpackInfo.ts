/**
 * Contains information about the modpack that is not dependent on the lockfile.
 * @property name - The name of the modpack (Required)
 * @property version - The version of the modpack (Required)
 * @property description - The description of the modpack
 * @property id - The slug/ID of the modpack (Required)
 * @property author - The author of the modpack (Required)
 * @property projectUrl - The project URL of the modpack
 * @property sourceUrl - The source code URL of the modpack
 * @property license - The license of the modpack
 * @property modloader - The modloader of the modpack (Required)
 * @property targetModloaderVersion - The target modloader version of the modpack
 * @property targetMinecraftVersion - The target Minecraft version of the modpack (Required)
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
