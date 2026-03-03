import type {InitOptions} from "./index.js";

export type FileOptionPrompts = keyof InitOptions & ("addLicense" | "addReadme" | "addGitignore");
