import {logm} from "../logger.js";
import type {Options as slugifyOptions} from "@sindresorhus/slugify";

/** Options for slugify */
export const SLUGIFY_OPTIONS: slugifyOptions = {
    lowercase: true,
    separator: "-",
    locale: "en",
    transliterate: true,
    preserveTrailingDash: false,
    preserveLeadingUnderscore: false,
    decamelize: false,
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
