import * as defaults from "./defaults.js";
import * as files from "./files.js";
import pkg from "../../package.json" with {type: "json"};

interface InfoField {
    prompt: string;
    option: string;
}

export const infoFields: {
    name: InfoField;
    version: InfoField;
    id: InfoField;
    description: InfoField;
    author: InfoField;
    projectUrl: InfoField;
    sourceUrl: InfoField;
    license: InfoField;
    modloader: InfoField;
    targetModloaderVersion: InfoField;
    targetMinecraftVersion: InfoField;
} = {
    name: {
        prompt: "modpack name",
        option: "The name of the modpack; defaults to the directory name",
    },
    version: {
        prompt: "modpack version",
        option: `The modpack version; defaults to ${defaults.DEFAULT_MODPACK_VERSION}`,
    },
    id: {
        prompt: "modpack slug/ID",
        option: "The modpack's slug/ID; defaults to the directory name slugified",
    },
    description: {
        prompt: "modpack description",
        option: "A description of the modpack",
    },
    author: {
        prompt: "modpack author",
        option: "The author of the modpack; required",
    },
    projectUrl: {
        prompt: "modpack URL",
        option: "The project's homepage URL; defaults to a guessed Modrinth project URL",
    },
    sourceUrl: {
        prompt: "modpack source code URL",
        option: "The project's source code URL; defaults to a guessed GitHub repository URL",
    },
    license: {
        prompt: "modpack license",
        option: `The modpack's license; popular licenses are fetched from GitHub; defaults to ${defaults.DEFAULT_MODPACK_LICENSE} in interactive mode`,
    },
    modloader: {
        prompt: "modpack modloader",
        option: "The modpack's modloader; a list of loaders is fetched from Modrinth; required",
    },
    targetModloaderVersion: {
        prompt: "target modloader version",
        option: "The target modloader version",
    },
    targetMinecraftVersion: {
        prompt: "target Minecraft version",
        option: "The target Minecraft version; a list of versions is fetched from Modrinth; required",
    },
};

export const fileFields: {
    addLicense: InfoField;
    addGitignore: InfoField;
    addReadme: InfoField;
} = {
    addLicense: {
        prompt: `Add the ${files.MODPACK_LICENSE_NAME} file`,
        option: `Add the ${files.MODPACK_LICENSE_NAME} file to the modpack`,
    },
    addGitignore: {
        prompt: `Update the ${files.GITIGNORE_NAME} file`,
        option: `Update the ${files.GITIGNORE_NAME} file to ignore content hosted on Modrinth`,
    },
    addReadme: {
        prompt: `Generate ${files.README_NAME} files`,
        option: `Generate ${files.README_NAME} files for each category`,
    },
};

export const headings: {
    options: string;
    generation: string;
    logging: string;
    packInfo: string;
    information: string;
} = {
    options: "Options:",
    generation: "GENERATION",
    logging: "LOGGING",
    packInfo: "MODPACK INFORMATION",
    information: "INFORMATION",
};

export const dryRunText: (filename: string, location: string) => string = (filename, location) => {
    return `[DRY RUN] Would write ${filename} to: ${location}`;
};

/** All-Rights-Reserved license text */
export const ARR_LICENSE_TEXT: string = "Copyright (c) [year] [fullname]\n" + "\n" + "All rights reserved.\n";

export {pkg};
