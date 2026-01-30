import {styleText} from "node:util";

class Logger {
    /**
     * The styles to apply to the console output.
     * @type {Object}
     */
    styles = {
        log: null,
        info: null,
        debug: ["magenta"],
        warn: ["yellow"],
        error: ["red"],
        label: ["inverse", "bold"],
        labelDebug: ["bgMagenta", "bold"],
        labelWarn: ["bgYellow", "bold"],
        labelError: ["bgRed", "bold"],
    };

    /**
     * Whether to quiet the console output.
     * @type {boolean}
     */
    quiet = false;

    /**
     * Whether to silence the console output.
     * @type {boolean}
     */
    silent = false;

    #styleArgs(style, args) {
        if (!style) {
            return args;
        }
        return args.map((arg) => (typeof arg === "string" ? styleText(style, arg) : arg));
    }

    /**
     * Style the text as a label.
     * @param {string} text - The text to style.
     * @param {string[]} style - The style to apply to the text.
     * @returns {string} The styled text.
     */
    label(text, style = this.styles.label) {
        return styleText(style, String(text).toUpperCase());
    }

    /**
     * Log a header.
     * @param {string} text - The text to log.
     */
    header(text) {
        if (!this.quiet) {
            console.log(this.label(text));
        }
    }

    /**
     * Log a message.
     * @param {...any} args - The arguments to log.
     */
    log(...args) {
        if (!this.quiet) {
            console.log(...this.#styleArgs(this.styles.log, args));
        }
    }

    /**
     * Log an info message.
     * @param {...any} args - The arguments to log.
     */
    info(...args) {
        if (!this.quiet) {
            console.info(...this.#styleArgs(this.styles.info, args));
        }
    }

    /**
     * Log a debug message.
     * @param {...any} args - The arguments to log.
     */
    debug(...args) {
        if (!this.quiet) {
            console.debug(this.label("//", this.styles.labelDebug), ...this.#styleArgs(this.styles.debug, args));
        }
    }

    /**
     * Log a warning message.
     * @param {...any} args - The arguments to log.
     */
    warn(...args) {
        if (!this.silent) {
            console.warn(this.label("WARNING", this.styles.labelWarn), ...this.#styleArgs(this.styles.warn, args));
        }
    }

    /**
     * Log an error message.
     * @param {...any} args - The arguments to log.
     */
    error(...args) {
        if (!this.silent) {
            console.error(this.label("ERROR", this.styles.labelError), ...this.#styleArgs(this.styles.error, args));
        }
    }
}

/**
 * Logger utility for logging formatted/colorized messages to the console.
 */
const logm = new Logger();

export {logm, styleText};
