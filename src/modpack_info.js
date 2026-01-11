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
 * Get user input for modpack information
 */
export default async function promptUserForInfo(defaults = {}) {
    let answers = await prompts([
        {
            type: 'text',
            name: 'name',
            message: 'Modpack name',
            initial: defaults.name,
            validate: (value) => {
                return validateNotEmpty(value, 'Name');
            },
        },
        {
            type: 'text',
            name: 'version',
            message: 'Modpack version',
            initial: defaults.version || '1.0.0',
            validate: (value) => {
                return validateNotEmpty(value, 'Version');
            },
        },

        {
            type: 'text',
            name: 'id',
            message: 'Modpack slug/ID',
            initial: slugify(defaults.id || defaults.name, config.SLUGIFY_OPTIONS),
            validate: (value) => {
                return validateNotEmpty(value, 'ID');
            },
        },
        {
            type: 'text',
            name: 'description',
            message: 'Modpack description',
            initial: defaults.description || undefined,
        },
        {
            type: 'text',
            name: 'author',
            message: 'Modpack author',
            initial: defaults.author || undefined,
            validate: (value) => {
                return validateNotEmpty(value, 'Author');
            },
        },
        {
            type: 'text',
            name: 'projectUrl',
            message: 'Modpack URL',
            initial: defaults.projectUrl || undefined,
        },
        {
            type: 'text',
            name: 'sourceUrl',
            message: 'Modpack source code URL',
            initial: defaults.sourceUrl || undefined,
        },
        {
            type: 'text',
            name: 'license',
            message: 'Modpack license',
            initial: defaults.license || undefined,
        },
        {
            type: 'autocomplete',
            name: 'modloader',
            message: 'Modpack modloader',
            initial: defaults.modloader || undefined,
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
            initial: defaults.targetModloaderVersion || undefined,
        },
        {
            type: 'text',
            name: 'targetMinecraftVersion',
            message: 'Target Minecraft version',
            initial: defaults.targetMinecraftVersion || undefined,
            validate: (value) => {
                return validateNotEmpty(value, 'Minecraft Version');
            },
        }
    ]);
    if (Object.keys(answers).length < 11) {
        console.warn('Modpack initialization was interrupted');
        process.exit(1);
    }
    return answers;
}
