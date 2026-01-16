import prompts from 'prompts';
import slugify from 'slugify';
import * as config from './config/index.js';
import { getLicenseList, getLicenseText } from './github_interactions.js';
import { getMinecraftVersions, getModloaders } from './modrinth_interactions.js';

function capitalize(string) {
    return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
}

/**
 * Validate that a value is not empty
 */
function validateNotEmpty(value, field) {
    if (value === undefined || value?.trim().length === 0) {
        return `${field} cannot be empty`;
    }
    return true;
}

/**
 * Test if the process was interrupted
 */
function exitOnCancel() {
    console.warn('Modpack initialization was interrupted');
    process.exit(1);
}

/**
 * Get an other answer from the user
 */
async function getOtherAnswer(value, message, initial) {
    if (value && value !== config.OTHER_OPTION.value) {
        return value;
    }
    const question = await prompts({
        type: 'text',
        name: 'other',
        message: `${capitalize(message)}`,
        initial: initial,
    });

    testInterrupt(question, 1);

    return question.other || config.OTHER_OPTION.value;
}

function requiredText(name, message, initial) {
    return {
        type: 'text',
        name: name,
        message: `${capitalize(message)}`,
        initial: initial,
        validate: (value) => {
            return validateNotEmpty(value, name);
        }
    }
}

function optionalText(name, message, initial) {
    return {
        type: 'text',
        name: name,
        message: `${capitalize(message)}`,
        initial: initial,
    }
}

/*
defaults.license = a = initial
config.DEFAULT_MODPACK_LICENSE = b = fallback
licenselist = c = choices
*/

function requiredAutocomplete(name, message, initial, choices, defaultValue) {
    initial = initial || defaultValue || config.OTHER_OPTION.value;
    if (initial && !choices.includes(initial)) {
        choices.push({ title: initial });
    }

    return {
        type: 'autocomplete',
        name: name,
        message: `${capitalize(message)}`,
        initial: initial,
        choices: choices,
        fallback: config.OTHER_OPTION.value,
        format: async (value) => {
            return await getOtherAnswer(value, ` └─𜰙 Other ${message}`, initial);
        }
    }
}
/**
 * @typedef {import('./config/types.js').ModpackInfo} ModpackInfo
 */

/**
 * Get user input for modpack information
 * @param {ModpackInfo} defaults - The initial/default modpack information
 * @returns {Promise<ModpackInfo>} The modpack information from the user
 */
export async function promptUserForInfo(defaults = {}) {
    const licenseList = await getLicenseList();
    const minecraftVersions = await getMinecraftVersions();
    const modloaders = await getModloaders();
    let answers = await prompts([
        requiredText(
            'name',
            'Modpack name',
            defaults.name
        ),
        requiredText(
            'version',
            'modpack version',
            defaults.version || config.DEFAULT_MODPACK_VERSION
        ),
        requiredText(
            'id',
            'modpack slug/ID',
            (prev, values) => slugify(defaults.id || values.name, config.SLUGIFY_OPTIONS)
        ),
        optionalText(
            'description',
            'modpack description',
            defaults.description
        ),
        requiredText(
            'author',
            'modpack author',
            defaults.author
        ),
        optionalText(
            'projectUrl',
            'modpack URL',
            (prev, values) => defaults.projectUrl || config.DEFAULT_PROJECT_URL(values.id)
        ),
        optionalText(
            'sourceUrl',
            'modpack source code URL',
            (prev, values) => defaults.sourceUrl || config.DEFAULT_SOURCE_URL(values.id, values.author)
        ),
        requiredAutocomplete(
            'license',
            'modpack license',
            defaults.license,
            licenseList,
            config.DEFAULT_MODPACK_LICENSE
        ),
        requiredAutocomplete(
            'modloader',
            'modpack modloader',
            defaults.modloader,
            modloaders,
            config.FALLBACK_MODLOADERS[0].value
        ),
        optionalText(
            'targetModloaderVersion',
            'target modloader version',
            defaults.targetModloaderVersion
        ),
        requiredAutocomplete(
            'targetMinecraftVersion',
            'target Minecraft version',
            defaults.targetMinecraftVersion,
            minecraftVersions,
            minecraftVersions[0].value
        )
    ], {
        onCancel: exitOnCancel
    });

    return answers;
}

/**
 * Prompt the user about adding the license text to the modpack
 * @param {ModpackInfo} modpackInfo - The modpack information
 * @returns {Promise<Object>} The answers from the user
 */
export async function promptUserAboutOptionalFiles(modpackInfo, defaults = {}) {

    const licenseText = await getLicenseText(modpackInfo.license);
    const answers = await (prompts([
        {
            type: (licenseText && defaults.addLicense === undefined) ? 'confirm' : null,
            name: 'addLicense',
            message: 'Add the LICENSE file to the modpack?',
            initial: true,
        },
        {
            type: (defaults.addReadme === undefined) ? 'confirm' : null,
            name: 'addReadme',
            message: 'Generate README.md files for each category?',
            initial: true,
        },
        {
            type: (defaults.addGitignore === undefined) ? 'confirm' : null,
            name: 'addGitignore',
            message: 'Print .gitignore rules for files not hosted on Modrinth?',
            initial: true,
        }
    ], {
        onCancel: exitOnCancel
    }));

    answers.addLicense = answers.addLicense === undefined ? (licenseText ? defaults.addLicense : false) : answers.addLicense;
    answers.addReadme = answers.addReadme === undefined ? defaults.addReadme : answers.addReadme;
    answers.addGitignore = answers.addGitignore === undefined ? defaults.addGitignore : answers.addGitignore;

    return answers;
}
