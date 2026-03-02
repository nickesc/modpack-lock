import {styleText} from "node:util";
import type {InspectColor} from "node:util";
import type {InitOptions, Options} from "./types/index.js";

class Logger {
    /**
     * The styles to apply to the console output.
     */
    styles: {
        log: InspectColor[];
        info: InspectColor[];
        debug: InspectColor[];
        warn: InspectColor[];
        error: InspectColor[];
        generated: InspectColor[];
        label: InspectColor[];
        labelDebug: InspectColor[];
        labelWarn: InspectColor[];
        labelError: InspectColor[];
        labelGenerated: InspectColor[];
    } = {
        log: [],
        info: [],
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

    quietConsole = false;
    silentConsole = false;
    lastLogWasNewline = false;

    quiet(silent: boolean = false) {
        this.quietConsole = true;
        this.silentConsole = silent;
    }

    quietFromOptions(options: InitOptions | Options) {
        if (options.silent) {
            this.quietConsole = true;
            this.silentConsole = true;
        } else if (options.quiet) {
            this.quietConsole = true;
        }
    }

    styleArgs(style: InspectColor[] | null, args: any[]) {
        if (!style) {
            return args;
        }
        if (args.length === 0) {
            return "";
        }
        return args.map((arg: any) => (typeof arg === "string" ? styleText(style, arg) : arg));
    }

    /**
     * Style the text as a label.
     * @param text - The text to style.
     * @param style - The style to apply to the text.
     * @returns The styled text.
     */
    label(text: string, style: InspectColor[] = this.styles.label) {
        return styleText(style, String(text).toUpperCase());
    }

    /**
     * Log a header.
     * @param text - The text to log.
     */
    header(text: string) {
        if (this.quietConsole) {
            return;
        }
        if (!this.lastLogWasNewline) {
            console.info();
        }
        console.info(this.label(text));
        console.info();
        this.lastLogWasNewline = true;
    }

    generated(desc: string, outputPath: string) {
        if (this.quietConsole) {
            return;
        }
        console.log(
            this.label("Generated", this.styles.labelGenerated),
            styleText(this.styles.generated, "Wrote"),
            styleText(this.styles.generated, desc),
            styleText(this.styles.generated, "to:"),
            styleText(["dim"], `${outputPath}`),
        );
        this.lastLogWasNewline = false;
    }

    newline() {
        if (this.quietConsole) {
            return;
        }
        if (this.lastLogWasNewline) {
            return;
        }
        console.info();
        this.lastLogWasNewline = true;
    }

    /**
     * Log a message.
     * @param message - The message to log.
     * @param otherMessages - The other messages to log.
     */
    log(message: any, ...otherMessages: any[]) {
        if (this.quietConsole) {
            return;
        }
        console.log(...this.styleArgs(this.styles.log, [message, ...otherMessages]));
        this.lastLogWasNewline = false;
    }

    /**
     * Log an info message.
     * @param message - The message to log.
     * @param otherMessages - The other messages to log.
     */
    info(message: any, ...otherMessages: any[]) {
        if (this.quietConsole) {
            return;
        }
        console.info(...this.styleArgs(this.styles.info, [message, ...otherMessages]));
        this.lastLogWasNewline = false;
    }

    /**
     * Log a debug message.
     * @param message - The message to log.
     * @param otherMessages - The other messages to log.
     */
    debug(message: any, ...otherMessages: any[]) {
        if (this.silentConsole) {
            return;
        }
        console.debug(
            this.label("//", this.styles.labelDebug),
            ...this.styleArgs(this.styles.debug, [message, ...otherMessages]),
        );
        this.lastLogWasNewline = false;
    }

    /**
     * Log a warning message.
     * @param message - The message to log.
     * @param otherMessages - The other messages to log.
     */
    warn(message: any, ...otherMessages: any[]) {
        if (this.silentConsole) {
            return;
        }
        console.warn(
            this.label("WARNING", this.styles.labelWarn),
            ...this.styleArgs(this.styles.warn, [message, ...otherMessages]),
        );
        this.lastLogWasNewline = false;
    }

    /**
     * Log an error message.
     * @param message - The message to log.
     * @param otherMessages - The other messages to log.
     */
    error(message: any, ...otherMessages: any[]) {
        if (this.silentConsole) {
            return;
        }
        console.error(
            this.label("ERROR", this.styles.labelError),
            ...this.styleArgs(this.styles.error, [message, ...otherMessages]),
        );
        this.lastLogWasNewline = false;
    }
}

const logm = new Logger();

export {logm, styleText};
