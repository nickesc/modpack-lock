import js from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import {defineConfig} from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs}"],
        plugins: {js},
        extends: ["js/recommended"],
        languageOptions: {globals: globals.node},
        ignores: ["dist/**/*.js", "coverage/**/*.js", "node_modules/**/*.js", "docs/**/*"],
    },
    {
        files: ["**/*.{js,mjs,cjs}"],
        ...jsdoc.configs["flat/recommended"],
        ignores: ["dist/**/*.js", "coverage/**/*.js", "node_modules/**/*.js", "docs/**/*"],
    },
]);
