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
        generated: ["green"],
        label: ["inverse", "bold"],
        labelDebug: ["magenta", "inverse", "bold"],
        labelWarn: ["yellow", "inverse", "bold"],
        labelError: ["red", "inverse", "bold"],
        labelGenerated: ["green", "inverse", "bold"],
    };

    quiet(silent = false) {
        console.log = () => {};
        console.info = () => {};
        if (silent) {
            console.warn = () => {};
            console.error = () => {};
        }
    }

    styleArgs(style, args) {
        if (!style) {
            return args;
        }
        if (args.length === 0) {
            return "";
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
        console.log(this.label(text));
    }

    generated(desc, outputPath) {
        console.log(
            this.label("Generated", this.styles.labelGenerated),
            styleText(this.styles.generated, "Wrote"),
            styleText(this.styles.generated, desc),
            styleText(this.styles.generated, "to:"),
            styleText(["dim"], `${outputPath}`),
        );
    }

    newline() {
        console.log();
    }

    /**
     * Log a message.
     * @param {string} message - The message to log.
     * @param {...any} otherMessages - The other messages to log.
     */
    log(message, ...otherMessages) {
        console.log(...this.styleArgs(this.styles.log, [message, ...otherMessages]));
    }

    /**
     * Log an info message.
     * @param {string} message - The message to log.
     * @param {...any} otherMessages - The other messages to log.
     */
    info(message, ...otherMessages) {
        console.info(...this.styleArgs(this.styles.info, [message, ...otherMessages]));
    }

    /**
     * Log a debug message.
     * @param {string} message - The message to log.
     * @param {...any} otherMessages - The other messages to log.
     */
    debug(message, ...otherMessages) {
        console.debug(
            this.label("//", this.styles.labelDebug),
            ...this.styleArgs(this.styles.debug, [message, ...otherMessages]),
        );
    }

    /**
     * Log a warning message.
     * @param {string} message - The message to log.
     * @param {...any} otherMessages - The other messages to log.
     */
    warn(message, ...otherMessages) {
        console.warn(
            this.label("WARNING", this.styles.labelWarn),
            ...this.styleArgs(this.styles.warn, [message, ...otherMessages]),
        );
    }

    /**
     * Log an error message.
     * @param {string} message - The message to log.
     * @param {...any} otherMessages - The other messages to log.
     */
    error(message, ...otherMessages) {
        console.error(
            this.label("ERROR", this.styles.labelError),
            ...this.styleArgs(this.styles.error, [message, ...otherMessages]),
        );
    }
}

const logm = new Logger();

export {logm, styleText};
