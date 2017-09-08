/// <reference types="cli-color" />
import * as clc from 'cli-color';
export interface LogEntry {
    group?: string;
    levelNumeric: number;
    levelText: string | null;
    message: string | null;
    timestamp: string;
}
export declare type Transformer = (this: AnsiLogger, entry: LogEntry) => any;
export declare enum Mask {
    ERROR = 1,
    WARN = 2,
    SUCCESS = 4,
    LOG = 8,
    INFO = 16,
    DEBUG = 32,
    VERBOSE = 64,
}
export declare enum Level {
    SILENT = 0,
    ERROR = 1,
    WARN = 3,
    SUCCESS = 7,
    LOG = 15,
    INFO = 31,
    DEBUG = 63,
    VERBOSE = 127,
}
export interface LoggerOptionsInput {
    colors: {
        [color: string]: clc.Format;
    };
    group: string;
    'group-color': clc.Format;
    'log-level': number;
    'no-colors': boolean;
    outputters: {
        err: (msg: any) => void;
        out: (msg: any) => void;
    };
    'startup-info': boolean;
    timeformat: string;
    transformer: (this: AnsiLogger, entry: LogEntry) => any;
}
export interface LoggerOptions {
    group?: LoggerOptionsInput['group'];
    'group-color'?: LoggerOptionsInput['group-color'];
    'log-level': LoggerOptionsInput['log-level'];
    'no-colors': LoggerOptionsInput['no-colors'];
    outputters: LoggerOptionsInput['outputters'];
    'startup-info': LoggerOptionsInput['startup-info'];
    timeformat: LoggerOptionsInput['timeformat'];
    transformer: LoggerOptionsInput['transformer'];
}
export declare type LogMask = keyof typeof Mask;
export declare type LogLevel = keyof typeof Level;
export declare type ColorMap = {
    [mask: number]: clc.Format;
} & {
    TIME: clc.Format;
} & {
    TITLE: clc.Format;
};
/**
 * Ansi output logger.
 * This controls what should be ouputted to the console,
 * everything is categorized into log levels, so when you set a log level
 * you output from all the selected levels.
 * It is possible to disables colors (some teminals don't support colors).
 * you can also specify that you are only interested in output for a specific
 * log-level, then everything else is not outputted.
 * It is also possible to make the logger silent.
 */
export declare class AnsiLogger {
    readonly options: Partial<LoggerOptions>;
    /**
     * The options object holder.
     * This is filled with the default values when the Logger is constructed,
     * it can be changed by using the setOptions method.
     */
    private _options;
    /**
     * Default color scheme
     * can be overriden by providing a
     * new full or partial ColorMap.
     */
    readonly colors: ColorMap;
    /**
     * Constructs a Logger, and sets default option values.
     */
    constructor(options?: Partial<LoggerOptionsInput>);
    private outputStartupInfo();
    /**
     *
     * @param level
     */
    private resolveLevelColor(level);
    /**
     * Setting a single color in the `ColorMap`
     */
    private setColor(level, color);
    /**
     * Colorize the message string.
     * NB! If no-colors mode is on or no color is given.
     * then this method just return the message as it is.
     */
    colorize(msg: string, color?: clc.Format | null): string;
    /**
     * Print a debug formatted message.
     */
    debug<T>(firstArg: T, ...__: any[]): T;
    /**
     * Print an error.
     */
    error<T>(firstArg: T, ...__: any[]): T;
    /**
     * Format an error, this is typically used, for string formatting an Exception/Error.
     */
    formatError(err: any): void;
    /**
     * Format a function call, for the debug level
     * NB! if passing arguments the function
     *     every argument, gonna be formatted with the formatTypes() function
     */
    formatFunctionCall(functionName: string, args?: any[]): string;
    /**
     * Format the loglevel to the console
     */
    formatLogLevel(this: AnsiLogger, loglevel: number): string;
    /**
     * Format types to string, some types make resively calls.
     */
    formatTypes(type: any, depth?: number, indent?: number): any;
    /**
     * Print an info formatted message.
     */
    info<T>(firstArg: T, ...__: any[]): T;
    /**
     * Print an default log formatted message.
     */
    log<T>(firstArg: T, ...__: any[]): T;
    /**
     * Print to console.
     * NB! This will print to the console based on the log level you have enabled.
     */
    print(msg: string, logMask?: number | null): void;
    /**
     * Resolves custom loglevel string
     */
    resolveCustomLoglevel(loglevel: number): string;
    /**
     * Resolve a string representation of the log-level.
     */
    resolveLogLevel(mask: number): string;
    /**
     * Set new colors.
     */
    setColors(colorMap: {
        [level: string]: clc.Format;
    }): void;
    /**
     * Sets the options.
     */
    setOptions(options: Partial<LoggerOptionsInput>, initial?: boolean): void;
    /**
     * Print a success formatted message.
     */
    success<T>(firstArg: T, ...__: any[]): T;
    /**
     * Print a title formatted message.
     */
    title<T>(msg: T, ...__: any[]): T;
    /**
     * Print a verbose formatted message.
     */
    verbose<T>(firstArg: T, ...__: any[]): T;
    /**
     * Print a warning.
     */
    warn<T>(firstArg: T, ...__: any[]): T;
}
export default AnsiLogger;
