import js from "@eslint/js";
import globals from "globals";
import {defineConfig} from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{ts}", "test/**/*.{ts,js}"],
        plugins: {js},
        extends: ["js/recommended"],
        languageOptions: {globals: globals.node},
    },
]);
