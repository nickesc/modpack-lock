import type {InitOptions} from "./index.js";

/**
 * The options available for the user to add optional files to the modpack
 * @property addLicense - Whether to add the license text to the modpack
 * @property addReadme - Whether to add the README.md file to the modpack
 * @property addGitignore - Whether to add the .gitignore file to the modpack
 */
export type OptionalFileOptions = "addLicense" | "addReadme" | "addGitignore";
