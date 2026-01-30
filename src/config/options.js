/** Options for slugify */
export const SLUGIFY_OPTIONS = {
    lower: true,
    strict: true,
    separator: "-",
    locale: "en",
    trim: true,
};

/** Options for prompts */
export const PROMPTS_OPTIONS = {
    onCancel: () => {
        console.warn("Modpack initialization was interrupted");
        process.exit(1);
    },
};
