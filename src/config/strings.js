import * as defaults from "./defaults.js";
import pkg from "../../package.json" with {type: "json"};

export const infoFields = {
    name: {
        prompt: "modpack name",
        option: "Modpack name; defaults to the directory name",
    },
    version: {
        prompt: "modpack version",
        option: `Modpack version; defaults to ${defaults.DEFAULT_MODPACK_VERSION}`,
    },
    id: {
        prompt: "modpack slug/ID",
        option: "Modpack slug/ID; defaults to the directory name slugified",
    },
    description: {
        prompt: "modpack description",
        option: "Modpack description",
    },
    author: {
        prompt: "modpack author",
        option: "Modpack author; required",
    },
    projectUrl: {
        prompt: "modpack URL",
        option: "Modpack URL; defaults to a guessed Modrinth project URL",
    },
    sourceUrl: {
        prompt: "modpack source code URL",
        option: "Modpack source code URL; defaults to a guessed GitHub repository URL",
    },
    license: {
        prompt: "modpack license",
        option: `Modpack license, popular licenses fetched from GitHub; defaults to ${defaults.DEFAULT_MODPACK_LICENSE} in interactive mode`,
    },
    modloader: {
        prompt: "modpack modloader",
        option: "Modpack modloader, list of loaders fetched from Modrinth; required",
    },
    targetModloaderVersion: {
        prompt: "target modloader version",
        option: "Target modloader version",
    },
    targetMinecraftVersion: {
        prompt: "target Minecraft version",
        option: "Target Minecraft version, list of versions fetched from Modrinth; required",
    },
};

export const fileFields = {
    addLicense: {
        prompt: "Add the LICENSE file",
        option: "Add the LICENSE file to the modpack",
    },
    addGitignore: {
        prompt: "Update the .gitignore file",
        option: "Update the .gitignore file to ignore content hosted on Modrinth",
    },
    addReadme: {
        prompt: "Generate README.md files",
        option: "Generate README.md files for each category",
    },
};

export const headings = {
    options: "Options:",
    generation: "GENERATION",
    logging: "LOGGING",
    packInfo: "MODPACK INFORMATION",
    information: "INFORMATION",
};

export const dryRunText = (filename, location) => {
    return `[DRY RUN] Would write ${filename} to: ${location}`;
};

/** All-Rights-Reserved license text */
export const ARR_LICENSE_TEXT = "Copyright (c) [year] [fullname]\n" + "\n" + "All rights reserved.\n";

export {pkg};
