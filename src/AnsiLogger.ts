import * as moment from 'moment';
import { IdentityTransformer } from './IdentityTransformer';
import { JSONTransformer } from './JSONTransformer';
import { TextTransformer } from './TextTransformer';

export interface LogEntry {
	group?: string;
	levelNumeric: Mask;
	levelText: string | null;
	message: string | null;
	timestamp: string;
}

export interface Transformer {
	format(entry: LogEntry): any;
}

// tslint:disable:no-bitwise
export enum Mask {
	ERROR = 0b0000001,
	WARN = 0b0000010,
	SUCCESS = 0b0000100,
	LOG = 0b0001000,
	INFO = 0b0010000,
	DEBUG = 0b0100000,
	VERBOSE = 0b1000000,
}

export enum Level {
	SILENT = 0b0000000,
	ERROR = SILENT | Mask.ERROR,
	WARN = ERROR | Mask.WARN,
	SUCCESS = WARN | Mask.SUCCESS,
	LOG = SUCCESS | Mask.LOG,
	INFO = LOG | Mask.INFO,
	DEBUG = INFO | Mask.DEBUG,
	VERBOSE = DEBUG | Mask.VERBOSE,
}
// tslint:enable:no-bitwise

export interface LoggerOptionsInput {
	group: string;
	logLevel: number;
	outputters: {
		err: (msg: any) => void;
		out: (msg: any) => void;
	};
	timeformat: string;
	transformer: Transformer;
}

export interface LoggerOptions {
	group?: LoggerOptionsInput['group'];
	logLevel: LoggerOptionsInput['logLevel'];
	outputters: LoggerOptionsInput['outputters'];
	timeformat: LoggerOptionsInput['timeformat'];
	transformer: LoggerOptionsInput['transformer'];
}

export type LogMask = keyof typeof Mask;
export type LogLevel = keyof typeof Level;

export function matchMask<T extends Mask>(level: number, mask: T): level is T {
	// tslint:disable-next-line:no-bitwise
	return (level & mask) === mask;
}

/**
 * Resolve a string representation of the logLevel.
 */
export function resolveLogLevel(mask: Mask): string {
	switch (mask) {
		case Mask.ERROR:
			return 'ERROR';
		case Mask.WARN:
			return 'WARN';
		case Mask.SUCCESS:
			return 'SUCCESS';
		case Mask.LOG:
			return 'LOG';
		case Mask.INFO:
			return 'INFO';
		case Mask.DEBUG:
			return 'DEBUG';
		case Mask.VERBOSE:
			return 'VERBOSE';
		default:
			const x: never = mask;
			throw new Error(`Unsupported option ${x}`);
	}
}

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
export class AnsiLogger {
	// tslint:enable:react-aware-member-ordering

	public get options(): Partial<LoggerOptions> {
		return this._options;
	}

	/**
	 * The options object holder.
	 * This is filled with the default values when the Logger is constructed,
	 * it can be changed by using the setOptions method.
	 */
	// tslint:disable-next-line:variable-name react-aware-member-ordering
	private _options: LoggerOptions;

	/**
	 * Constructs a Logger, and sets default option values.
	 */
	public constructor(options?: Partial<LoggerOptionsInput>) {
		// tslint:disable:object-literal-key-quotes
		this._options = {
			group: undefined,
			logLevel: Level.INFO,
			outputters: {
				out(msg: any): void {
					// Setting up default group // the log level // disbles colors if true
					process.stdout.write(msg);
				},
				err(msg: any): void {
					process.stderr.write(msg);
				},
			},
			/**
			 * Moment.js formats.
			 * @link http://momentjs.com
			 */
			timeformat: 'YYYY-MM-DD HH:mm:ss.SSSZZ',
			transformer: new TextTransformer(),
		};
		// tslint:enable:object-literal-key-quotes

		if (options != null) {
			this.setOptions(options);
		}
	}

	/**
	 * Print to console.
	 * NB! This will print to the console based on the log level you have enabled.
	 */
	private print(msg: string, logMask?: number | null): void {
		// return if the logLevel is higher than the selected the logLevel.
		if (logMask == null) {
			logMask = Mask.LOG;
		}

		if (!matchMask(this._options.logLevel, logMask)) {
			return;
		}

		const entry: LogEntry = {
			group: this.options.group,
			levelNumeric: logMask,
			levelText: resolveLogLevel(logMask),
			message: msg,
			timestamp: moment().format(this.options.timeformat),
		};

		// finally printing the output!.
		if (matchMask(logMask, Mask.ERROR)) {
			this._options.outputters.err.call(this, this._options.transformer.format(entry));
		} else {
			this._options.outputters.out.call(this, this._options.transformer.format(entry));
		}
	}

	/**
	 * Print a debug formatted message.
	 */
	public debug<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			if (typeof msg === 'string') {
				this.print(msg, Mask.DEBUG);
			} else {
				this.print(this.formatTypes(msg), Mask.DEBUG);
			}
		}
		return firstArg;
	}

	/**
	 * Print an error.
	 */
	public error<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			if (msg instanceof Error || (typeof msg === 'object' && 'stack' in msg)) {
				this.formatError(msg);
			} else {
				this.print(msg, Mask.ERROR);
			}
		}
		return firstArg;
	}

	/**
	 * Format an error, this is typically used, for string formatting an Exception/Error.
	 */
	public formatError(err: any): void {
		this.print(this.formatTypes(err), Mask.ERROR);
	}

	/**
	 * Format a function call, for the debug level
	 * NB! if passing arguments the function
	 *     every argument, gonna be formatted with the formatTypes() function
	 */
	public formatFunctionCall(functionName: string, args?: any[]) {
		if (args == null) {
			args = [];
		}
		const formattedArgs = [];
		for (const a of Array.from(args)) {
			formattedArgs.push(this.formatTypes(a));
		}
		return this.debug(functionName + `(${formattedArgs.join(', ')})`);
	}

	/**
	 * Format types to string, some types make resively calls.
	 */
	// tslint:disable-next-line:no-reserved-keywords
	public formatTypes(type: any, depth?: number, indent?: number) {
		if (
			this.options.transformer instanceof JSONTransformer ||
			this.options.transformer instanceof IdentityTransformer
		) {
			return type;
		}

		// making the proper indentation
		let val;
		if (indent == null) {
			indent = 0;
		}
		if (depth == null) {
			depth = 3;
		}

		const pad = ' '.repeat(indent > 0 ? indent - 1 : 0);

		// primitive types
		if (typeof type === 'number' || typeof type === 'boolean' || type == null) {
			return `${pad}${type}`;
		}

		if (typeof type === 'string') {
			return `${pad}'${type}'`;
		}

		// array is formatted as one-liners
		if (Array.isArray(type) && indent < depth) {
			let str = `${pad}[`;
			// tslint:disable-next-line:forin
			for (const key of type.keys()) {
				val = type[key];
				str += ` ${this.formatTypes(val, indent + 1, depth).trim()}`;
				str += ((key as any) as number) < type.length - 1 ? ',' : ' ';
			}
			return `${str}]`;
		}

		// hashes is formatted with indentation for every level
		// of the object, the values of the properties are also resolved.
		if (typeof type === 'object') {
			const cname = type.constructor.name;
			if (cname === 'Error' || type instanceof Error) {
				let str = `${pad}${type.message}`;
				if (type.stack != null) {
					str += `\n${pad}${type.stack}`;
				}
				return str;
			} else if (cname === 'Object' && indent < depth) {
				let str = `${pad}{`;
				for (const key of Object.keys(type)) {
					val = type[key];
					str += `\n${pad}  ${key}: ${this.formatTypes(val, indent + 1, depth).trim()}`;
				}
				if (str.length > pad.length + 1) {
					str += `\n${pad}`;
				}
				return `${str}}`;
			}
		}

		// print the name of a complex type.
		const isFunc = typeof type === 'function';
		if (isFunc) {
			const cname = type.constructor.name;
			if (isFunc && cname !== 'Function') {
				return `${pad}[Function: ${cname}]`;
			}
			return `${pad}${cname}`;
		}

		// print the name of an unhandled type.
		// typically this will return 'object'
		return `${pad}${typeof type}`;
	}

	/**
	 * Print an info formatted message.
	 */
	public info<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			if (typeof msg === 'string') {
				this.print(msg, Mask.INFO);
			} else {
				this.print(this.formatTypes(msg), Mask.INFO);
			}
		}
		return firstArg;
	}

	/**
	 * Print an default log formatted message.
	 */
	public log<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			if (typeof msg === 'string') {
				this.print(msg, Mask.LOG);
			} else {
				this.print(this.formatTypes(msg), Mask.LOG);
			}
		}
		return firstArg;
	}

	/**
	 * Sets the options.
	 */
	public setOptions(options: Partial<LoggerOptionsInput>) {
		const currentLoglevel = this._options.logLevel;
		const optionKeys = Object.keys(this.options);
		for (const key of optionKeys) {
			const val = (options as any)[key];
			if (val != null) {
				(this._options as any)[key] = val;
			}
		}

		if (!Number.isInteger(this._options.logLevel) || this._options.logLevel > Level.VERBOSE) {
			this._options.logLevel = currentLoglevel;
			this.warn(`Invalid log level is trying to be set: ${options.logLevel}, aborting...`);
		}
	}

	/**
	 * Print a success formatted message.
	 */
	public success<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, Mask.SUCCESS);
		}
		return firstArg;
	}

	/**
	 * Print a verbose formatted message.
	 */
	public verbose<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, Mask.VERBOSE);
		}
		return firstArg;
	}

	/**
	 * Print a warning.
	 */
	public warn<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, Mask.WARN);
		}
		return firstArg;
	}
}

export default AnsiLogger;
