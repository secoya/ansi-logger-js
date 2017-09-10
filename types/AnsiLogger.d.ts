export interface LogEntry {
    group?: string;
    levelNumeric: number;
    levelText: string | null;
    message: string | null;
    timestamp: string;
}
export interface Transformer {
    format(entry: LogEntry): any;
}
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
    group: string;
    logLevel: number;
    outputters: {
        err: (msg: any) => void;
        out: (msg: any) => void;
    };
    startupInfo: boolean;
    timeformat: string;
    transformer: Transformer;
}
export interface LoggerOptions {
    group?: LoggerOptionsInput['group'];
    logLevel: LoggerOptionsInput['logLevel'];
    outputters: LoggerOptionsInput['outputters'];
    startupInfo: LoggerOptionsInput['startupInfo'];
    timeformat: LoggerOptionsInput['timeformat'];
    transformer: LoggerOptionsInput['transformer'];
}
export declare type LogMask = keyof typeof Mask;
export declare type LogLevel = keyof typeof Level;
export declare function matchMask(level: number, mask: number): boolean;
/**
 * Resolve a string representation of the logLevel.
 */
export declare function resolveLogLevel(mask: number): "ERROR" | "WARN" | "SUCCESS" | "LOG" | "INFO" | "DEBUG" | "VERBOSE" | "CUSTOM";
/**
 * Ansi output logger.
 * This controls what should be ouputted to the console,
 * everything is categorized into log levels, so when you set a log level
 * you output from all the selected levels.
 * It is possible to disables colors (some teminals don't support colors).
 * you can also specify that you are only interested in output for a specific
 * logLevel, then everything else is not outputted.
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
     * Constructs a Logger, and sets default option values.
     */
    constructor(options?: Partial<LoggerOptionsInput>);
    /**
     * Print to console.
     * NB! This will print to the console based on the log level you have enabled.
     */
    private print(msg, logMask?);
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
     * Sets the options.
     */
    setOptions(options: Partial<LoggerOptionsInput>): void;
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
