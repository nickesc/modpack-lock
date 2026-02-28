import {logm} from "../logger.js";

/** Options for slugify */
export const SLUGIFY_OPTIONS: {
    lower: boolean;
    strict: boolean;
    separator: string;
    locale: string;
    trim: boolean;
} = {
    lower: true,
    strict: true,
    separator: "-",
    locale: "en",
    trim: true,
};

/** Options for prompts */
export const PROMPTS_OPTIONS: {
    onCancel: () => void;
} = {
    onCancel: () => {
        logm.warn("Modpack initialization was interrupted");
        process.exit(1);
    },
};
