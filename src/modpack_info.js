import prompts from 'prompts';
import slugify from 'slugify';
import * as config from './config/index.js';

/**
 * Validate that a value is not empty
 */
function validateNotEmpty(value, field) {
    if (value.trim().length === 0) {
        return `${field} cannot be empty`;
    }
    return true;
}

/**
 * @typedef {import('./config/types.js').ModpackInfo} ModpackInfo
 */

/**
 * Get user input for modpack information
 * @param {ModpackInfo} defaults - The initial/default modpack information
 * @returns {Promise<ModpackInfo>} The modpack information from the user
 */
export default async function promptUserForInfo(defaults = {}) {
    let name = await prompts({
        type: 'text',
        name: 'name',
        message: 'Modpack name',
        initial: defaults.name,
        validate: (value) => {
            return validateNotEmpty(value, 'Name');
        },
    });
    let version = await prompts({
        type: 'text',
        name: 'version',
        message: 'Modpack version',
        initial: defaults.version || config.DEFAULT_MODPACK_VERSION,
        validate: (value) => {
            return validateNotEmpty(value, 'Version');
        },
    });
    let id = await prompts({
        type: 'text',
        name: 'id',
        message: 'Modpack slug/ID',
        initial: slugify(defaults.id || name.name, config.SLUGIFY_OPTIONS),
        validate: (value) => {
            return validateNotEmpty(value, 'ID');
        },
    });
    let description = await prompts({
        type: 'text',
        name: 'description',
        message: 'Modpack description',
        initial: defaults.description,
    });
    let author = await prompts({
        type: 'text',
        name: 'author',
        message: 'Modpack author',
        initial: defaults.author,
        validate: (value) => {
            return validateNotEmpty(value, 'Author');
        },
    });
    let answers = await prompts([
        {
            type: 'text',
            name: 'projectUrl',
            message: 'Modpack URL',
            initial: defaults.projectUrl || config.DEFAULT_PROJECT_URL(id.id),
        },
        {
            type: 'text',
            name: 'sourceUrl',
            message: 'Modpack source code URL',
            initial: defaults.sourceUrl || config.DEFAULT_SOURCE_URL(id.id, author.author),
        },
        {
            type: 'text',
            name: 'license',
            message: 'Modpack license',
            initial: defaults.license || config.DEFAULT_MODPACK_LICENSE,
        },
        {
            type: 'autocomplete',
            name: 'modloader',
            message: 'Modpack modloader',
            initial: defaults.modloader,
            choices: [
                { title: 'fabric' },
                { title: 'forge' },
                { title: 'quilt' },
                { title: 'neoforge' },
                { title: 'sponge' },
                { title: 'paper' },
                { title: 'velocity' },
                { title: 'bungeecord' },
                { title: 'waterfall' },
                { title: 'travertia' },
                { title: 'nukkit' },
                { title: 'pufferfish' },
                { title: 'purpur' },
            ],
            validate: (value) => {
                return validateNotEmpty(value, 'Modloader');
            },
        },
        {
            type: 'text',
            name: 'targetModloaderVersion',
            message: 'Target modloader version',
            initial: defaults.targetModloaderVersion,
        },
        {
            type: 'text',
            name: 'targetMinecraftVersion',
            message: 'Target Minecraft version',
            initial: defaults.targetMinecraftVersion,
            validate: (value) => {
                return validateNotEmpty(value, 'Minecraft Version');
            },
        }
    ]);

    let modpackInfo = {...name, ...version, ...id, ...description, ...author, ...answers};
    if (Object.keys(modpackInfo).length < 11) {
        console.warn('Modpack initialization was interrupted');
        process.exit(1);
    }
    return modpackInfo;
}
