import prompts from 'prompts';
import slugify from 'slugify';
import * as config from './config/index.js';
import { getLicenseList, getLicenseText } from './github_interactions.js';
import { getMinecraftVersions, getModloaders } from './modrinth_interactions.js';

/**
 * Validate that a value is not empty
 */
function validateNotEmpty(value, field) {
    if (value && value.trim().length === 0) {
        return `${field} cannot be empty`;
    }
    return true;
}

/**
 * Test if the process was interrupted
 */
function testInterrupt(questions, expectedAnswers) {
    if (Object.keys(questions).length < expectedAnswers) {
        console.warn('Modpack initialization was interrupted');
        process.exit(1);
    }
}

/**
 * Get an other answer from the user
 */
async function getOtherAnswer(value, message) {
    if (value && value !== config.OTHER_OPTION.value) {
        return value;
    }
    const question = await prompts({
        type: 'text',
        name: 'other',
        message: message,
        initial: config.OTHER_OPTION.value,
    });

    testInterrupt(question, 1);

    return question.other || config.OTHER_OPTION.value;
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
    let answers = await prompts([{
        type: 'text',
        name: 'name',
        message: 'Modpack name',
        initial: defaults.name,
        validate: (value) => {
            return validateNotEmpty(value, 'Name');
        }
    },
    {
        type: 'text',
        name: 'version',
        message: 'Modpack version',
        initial: defaults.version || config.DEFAULT_MODPACK_VERSION,
        validate: (value) => {
            return validateNotEmpty(value, 'Version');
        }
    },
    {
        type: 'text',
        name: 'id',
        message: 'Modpack slug/ID',
        initial: (prev, values) => slugify(defaults.id || values.name, config.SLUGIFY_OPTIONS),
        validate: (value) => {
            return validateNotEmpty(value, 'ID');
        }
    },
    {
        type: 'text',
        name: 'description',
        message: 'Modpack description',
        initial: defaults.description,
    },
    {
        type: 'text',
        name: 'author',
        message: 'Modpack author',
        initial: defaults.author,
        validate: (value) => {
            return validateNotEmpty(value, 'Author');
        }
    },
    {
        type: 'text',
        name: 'projectUrl',
        message: 'Modpack URL',
        initial: (prev, values) => defaults.projectUrl || config.DEFAULT_PROJECT_URL(values.id),
    },
    {
        type: 'text',
        name: 'sourceUrl',
        message: 'Modpack source code URL',
        initial: (prev, values) => defaults.sourceUrl || config.DEFAULT_SOURCE_URL(values.id, values.author),
    },
    {
        type: 'autocomplete',
        name: 'license',
        message: 'Modpack license',
        initial: defaults.license || config.DEFAULT_MODPACK_LICENSE,
        choices: licenseList,
        fallback: 'other',
        format: async (value) => {
            return await getOtherAnswer(value, 'Other license ID (SPDX ID)');
        },
    },
    {
        type: 'autocomplete',
        name: 'modloader',
        message: 'Modpack modloader',
        initial: defaults.modloader || config.FALLBACK_MODLOADERS[0].value,
        choices: modloaders,
        fallback: 'other',
        format: async (value) => {
            return await getOtherAnswer(value, 'Other modloader');
        },
    },
    {
        type: 'text',
        name: 'targetModloaderVersion',
        message: 'Target modloader version',
        initial: defaults.targetModloaderVersion,
    },
    {
        type: 'autocomplete',
        name: 'targetMinecraftVersion',
        message: 'Target Minecraft version',
        initial: defaults.targetMinecraftVersion || minecraftVersions[0].value,
        choices: minecraftVersions,
        fallback: 'other',
        format: async (value) => {
            return await getOtherAnswer(value, 'Other Minecraft version');
        }
    }
    ]);

    let modpackInfo = { ...answers };

    // TODO: this might not be right. find a better way to ensure the user did not interrupt the prompts. need to do that for any other prompts we use as well, including the license text prompt.
    testInterrupt(answers, 11);

    return modpackInfo;
}

/**
 * Prompt the user about adding the license text to the modpack
 * @param {ModpackInfo} modpackInfo - The modpack information
 * @returns {Promise<boolean>} Whether the user wants to add the license text to the modpack
 */
export async function promptUserAboutLicenseText(modpackInfo) {
    const licenseText = await getLicenseText(modpackInfo.license);
    if (licenseText) {
        const answer = await prompts({
            type: 'confirm',
            name: 'licenseText',
            message: 'Add the LICENSE file to the modpack?',
            initial: true,
        });
        return licenseText;
    }
    return false;
}
