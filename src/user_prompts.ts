import prompts, {type Choice, type InitialReturnValue, type PromptObject} from "prompts";
import slugify from "@sindresorhus/slugify";
import * as config from "./config/index.js";
import {getLicenseList, getLicenseText} from "./github_interactions.js";
import {getMinecraftVersions, getModloaders} from "./modrinth_interactions.js";
import type {OptionalFileOptions, InitOptions, Jsonfile, ModpackInfo} from "./types/index.js";

/**
 * Capitalizes a string
 */
function capitalize(string: string) {
    return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
}

/**
 * Validate that a value is not empty
 */
function validateNotEmpty(value: string, field: string) {
    if (value === undefined || value?.trim().length === 0) {
        return `${field} cannot be empty`;
    }
    return true;
}

/**
 * Returns a required text prompt
 */
function requiredText(
    name: keyof ModpackInfo | "other",
    message: string,
    initial: PromptObject["initial"],
): PromptObject {
    return {
        type: "text",
        name: name,
        message: `${capitalize(message)}`,
        initial: initial,
        validate: (value: string) => {
            return validateNotEmpty(value, name);
        },
    };
}

/**
 * Returns an optional text prompt
 */
function optionalText(
    name: keyof ModpackInfo | "other",
    message: string,
    initial: PromptObject["initial"],
): PromptObject {
    return {
        type: "text",
        name: name,
        message: `${capitalize(message)}`,
        initial: initial,
    };
}

/**
 * Get the value of an "other" answer from the user
 */
async function getOtherAnswer(value: string, message: string, initial: PromptObject["initial"]) {
    if (value && value !== config.OTHER_OPTION.value) {
        return value;
    }
    const question = await prompts(requiredText("other", message, initial), config.PROMPTS_OPTIONS);

    return question.other || config.OTHER_OPTION.value;
}

/**
 * Returns a required autocomplete prompt with a fallback to the "other" option
 */
function requiredAutocomplete(
    name: keyof ModpackInfo | "other",
    message: string,
    initial: PromptObject["initial"],
    choices: Choice[],
    defaultValue: string,
): PromptObject {
    initial = initial || defaultValue || config.OTHER_OPTION.value;
    if (initial && !choices.some((choice) => choice.value === initial)) {
        choices.push({title: initial as string, value: initial as string});
    }

    return {
        type: "autocomplete",
        name: name,
        message: `${capitalize(message)}`,
        initial: initial,
        choices: choices,
        //fallback: config.OTHER_OPTION.value,
        format: async (value: string) => {
            return await getOtherAnswer(value, ` └─𜰙 Other ${message}`, initial as string);
        },
    };
}

/**
 * Returns a confirmation prompt to generate an optional file
 */
function fileGenerationConfirm(
    name: OptionalFileOptions | "other",
    message: string,
    showPrompt: boolean,
): PromptObject {
    return {
        type: showPrompt ? "confirm" : null,
        name: name,
        message: `${capitalize(message)}`,
        initial: true,
    };
}

/**
 * Prompt the user for modpack information
 * @param defaults - The default modpack information, used as the initial value for each prompt
 * @returns The answers to the prompts from the user
 */
export async function promptUserForInfo(defaults: Jsonfile): Promise<prompts.Answers<keyof ModpackInfo>> {
    const licenseList = await getLicenseList();
    const minecraftVersions = await getMinecraftVersions();
    const modloaders = await getModloaders();
    let answers: prompts.Answers<keyof ModpackInfo> = await prompts(
        [
            requiredText("name", config.infoFields.name.prompt, defaults.name),
            requiredText(
                "version",
                config.infoFields.version.prompt,
                defaults.version || config.DEFAULT_MODPACK_VERSION,
            ),
            requiredText("id", config.infoFields.id.prompt, (prev: string, values: any) => {
                return slugify(defaults.id || values.name, config.SLUGIFY_OPTIONS);
            }),
            optionalText("description", config.infoFields.description.prompt, defaults.description),
            requiredText("author", config.infoFields.author.prompt, defaults.author),
            optionalText(
                "projectUrl",
                config.infoFields.projectUrl.prompt,
                (prev, values) => defaults.projectUrl || config.DEFAULT_PROJECT_URL(values.id),
            ),
            optionalText(
                "sourceUrl",
                config.infoFields.sourceUrl.prompt,
                (prev, values) => defaults.sourceUrl || config.DEFAULT_SOURCE_URL(values.id, values.author),
            ),
            requiredAutocomplete(
                "license",
                config.infoFields.license.prompt,
                defaults.license,
                licenseList,
                config.DEFAULT_MODPACK_LICENSE,
            ),
            requiredAutocomplete(
                "modloader",
                config.infoFields.modloader.prompt,
                defaults.modloader,
                modloaders,
                config.FALLBACK_MODLOADERS[0] ? config.FALLBACK_MODLOADERS[0].value : "",
            ),
            optionalText(
                "targetModloaderVersion",
                config.infoFields.targetModloaderVersion.prompt,
                defaults.targetModloaderVersion,
            ),
            requiredAutocomplete(
                "targetMinecraftVersion",
                config.infoFields.targetMinecraftVersion.prompt,
                defaults.targetMinecraftVersion,
                minecraftVersions,
                minecraftVersions[0]?.value || "",
            ),
        ],
        config.PROMPTS_OPTIONS,
    );

    return answers;
}

/**
 * Prompt the user about adding the license text to the modpack
 * @param modpackInfo - The Jsonfile object containing the modpack information
 * @param options - The default options
 * @returns The answers from the user
 */
export async function promptUserAboutOptionalFiles(
    modpackInfo: Jsonfile,
    options: InitOptions,
): Promise<prompts.Answers<OptionalFileOptions>> {
    const licenseText = modpackInfo.license ? await getLicenseText(modpackInfo.license) : null;
    const answers: prompts.Answers<OptionalFileOptions> = await prompts(
        [
            fileGenerationConfirm(
                "addLicense",
                `${config.fileFields.addLicense.prompt}?`,
                licenseText && options.addLicense === undefined ? true : false,
            ),
            fileGenerationConfirm(
                "addReadme",
                `${config.fileFields.addReadme.prompt}?`,
                options.addReadme === undefined,
            ),
            fileGenerationConfirm(
                "addGitignore",
                `${config.fileFields.addGitignore.prompt}?`,
                options.addGitignore === undefined,
            ),
        ],
        config.PROMPTS_OPTIONS,
    );

    answers.addLicense =
        answers.addLicense === undefined ? (licenseText ? options.addLicense : false) : answers.addLicense;
    answers.addReadme = answers.addReadme === undefined ? options.addReadme : answers.addReadme;
    answers.addGitignore = answers.addGitignore === undefined ? options.addGitignore : answers.addGitignore;

    return answers;
}
