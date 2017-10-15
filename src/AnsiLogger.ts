import * as moment from 'moment';
import { TextTransformer } from './TextTransformer';

/**
 * The internal data structure, that represents a single log entry.
 */
export interface LogEntry {
	group?: string;
	levelNumeric: Mask;
	levelText: string | null;
	message: string | null;
	timestamp: string;
}

/**
 * Transforms `LogEntry` to `TOutput`
 * And describes how to format complex types
 * such as Array, Object and/or classes instances.
 */
export interface Transformer<TOutput> {
	format(entry: LogEntry): TOutput;
	formatTypes(msg: any): TOutput;
}

/**
 * Contains each mask for each log level.
 */
export enum Mask {
	ERROR = 0b0000001,
	WARN = 0b0000010,
	SUCCESS = 0b0000100,
	LOG = 0b0001000,
	INFO = 0b0010000,
	DEBUG = 0b0100000,
	VERBOSE = 0b1000000,
}

/**
 * Contains all the accumulated applied masks.
 * Each level contains it `own mask` and all levels before.
 */
export enum Level {
	SILENT = 0b0000000,
	ERROR = 0b0000001,
	WARN = 0b0000011,
	SUCCESS = 0b0000111,
	LOG = 0b0001111,
	INFO = 0b0011111,
	DEBUG = 0b0111111,
	VERBOSE = 0b1111111,
}

/**
 * The available options to configure the top level logger.
 */
export interface LoggerOptions<TOutput> {
	/**
	 * The group to mark the log entries with.
	 */
	group: string;
	/**
	 * The log level mask.
	 */
	logLevel: number;
	/**
	 * The outputters, split interface
	 * support the stderr and stdout.
	 * Error log level outputs to `err`.
	 * all other log levels are outputted to `out`.
	 *
	 * An outputter's is to "print" the transformed content.
	 */
	outputters: {
		err: (msg: TOutput) => void,
		out: (msg: TOutput) => void,
	};
	/**
	 * Moment.js formats.
	 * @link http://momentjs.com
	 */
	timeformat: string;
	/**
	 * The transformer to convert LogEntry types
	 * to what the outputters can print.
	 */
	transformer: Transformer<TOutput>;
}

/**
 * The internal options interface of `AnsiLogger`.
 */
export interface LoggerOptionsInternal<TOutput> {
	/**
	 * The group to mark the log entries with.
	 */
	group?: string;
	/**
	 * The log level mask.
	 */
	logLevel: number;
	/**
	 * The outputters, split interface
	 * support the stderr and stdout.
	 * Error log level outputs to `err`.
	 * all other log levels are outputted to `out`.
	 *
	 * An outputter's is to "print" the transformed content.
	 */
	outputters: {
		err: (msg: TOutput) => void;
		out: (msg: TOutput) => void;
	};
	/**
	 * Moment.js formats.
	 * @link http://momentjs.com
	 */
	timeformat: string;
	/**
	 * The transformer to convert LogEntry types
	 * to what the outputters can print.
	 */
	transformer: Transformer<TOutput>;
}

/**
 * Utility function to determine if `level` is masked by `mask`.
 */
export function matchMask<T extends Mask>(level: number, mask: T): level is T {
	// tslint:disable-next-line:no-bitwise
	return (level & mask) === mask;
}

/**
 * Resolve a string representation of the mask.
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
 * Ansi Logger.
 *
 * This controls what should be ouputted to the console,
 * everything is categorized into log levels, so when you set a log level
 * you output from all the selected levels.
 * It is possible to disables colors (some terminals don't support colors).
 * you can also specify that you are only interested in output for a specific
 * log masks, then everything else is not outputted.
 * It is also possible to make the logger silent.
 */
export class AnsiLogger<TOutput> {
	/**
	 * The options with defaults overriden by user input.
	 */
	public get options(): LoggerOptionsInternal<TOutput> {
		return this._options;
	}

	/**
	 * The options object holder.
	 * This is filled with the default values when the Logger is constructed,
	 * it can be changed by using the setOptions method.
	 */
	// tslint:disable-next-line:variable-name react-aware-member-ordering
	private _options: LoggerOptionsInternal<TOutput>;

	/**
	 * Constructs a Logger, and patch default values with the `options` passed.
	 */
	public constructor(options?: Partial<LoggerOptions<TOutput>>) {
		const opts = options == null ? {} : options;
		this._options = {
			group: opts.group,
			logLevel: opts.logLevel == null ? Level.INFO : opts.logLevel,
			outputters: opts.outputters || {
				err: (msg) => {
					process.stderr.write(msg as any);
				},
				out: (msg) => {
					process.stdout.write(msg as any);
				},
			},
			timeformat: opts.timeformat || 'YYYY-MM-DD HH:mm:ss.SSSZZ',
			transformer: opts.transformer || new TextTransformer() as any as Transformer<TOutput>,
		};
	}

	/**
	 * Print to outputters.
	 * NB! This will print to the outputter based on what log levels you have enabled.
	 */
	private print(msg: string, outputMask?: number | null): void {
		// return if the logLevel is higher than the selected the logLevel.
		if (outputMask == null) {
			outputMask = Mask.LOG;
		}

		if (!matchMask(this._options.logLevel, outputMask)) {
			return;
		}

		const entry: LogEntry = {
			group: this.options.group,
			levelNumeric: outputMask,
			levelText: resolveLogLevel(outputMask),
			message: msg,
			timestamp: moment().format(this.options.timeformat),
		};

		// finally printing the output!.
		if (matchMask(outputMask, Mask.ERROR)) {
			this.options.outputters.err.call(this, this.options.transformer.format(entry));
		} else {
			this.options.outputters.out.call(this, this.options.transformer.format(entry));
		}
	}

	/**
	 * Print message(s) to debug log level if enabled.
	 */
	public debug<E>(firstArg: E, ...__: any[]): E {
		for (const msg of Array.from(arguments)) {
			if (typeof msg === 'string') {
				this.print(msg, Mask.DEBUG);
			} else {
				this.print(this.formatTypes(msg) as any, Mask.DEBUG);
			}
		}
		return firstArg;
	}

	/**
	 * Print message(s) to error log level if enabled.
	 */
	public error<E>(firstArg: E, ...__: any[]): E {
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
	 * Format an error.
	 *
	 * This is typically used, for text transforming an Exception(s)/Error(s).
	 */
	public formatError(err: any): void {
		this.print(this.formatTypes(err) as any, Mask.ERROR);
	}

	/**
	 * Format a function call, for the debug level
	 *
	 * **NB!** if passing `arguments` to the function
	 *         every argument will be formatted with `formatTypes()`
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
	 * Text transform Format types to string, some types make resively calls.
	 */
	public formatTypes(inputType: any): TOutput {
		return this.options.transformer.formatTypes(inputType);
	}

	/**
	 * Print messeage(s) to info log level if enabled.
	 */
	public info<E>(firstArg: E, ...__: any[]): E {
		for (const msg of Array.from(arguments)) {
			if (typeof msg === 'string') {
				this.print(msg, Mask.INFO);
			} else {
				this.print(this.formatTypes(msg) as any, Mask.INFO);
			}
		}
		return firstArg;
	}

	/**
	 * Print message(s) to default log level if enabled..
	 */
	public log<E>(firstArg: E, ...__: any[]): E {
		for (const msg of Array.from(arguments)) {
			if (typeof msg === 'string') {
				this.print(msg, Mask.LOG);
			} else {
				this.print(this.formatTypes(msg) as any, Mask.LOG);
			}
		}
		return firstArg;
	}

	/**
	 * Sets the options.
	 */
	public setOptions<LOutput = TOutput>(
		options: Partial<LoggerOptions<LOutput>>,
	): AnsiLogger<LOutput> {
		const currentLoglevel = this._options.logLevel;
		const optionKeys = Array.from(Object.keys(this.options));
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

		return this as any as AnsiLogger<LOutput>;
	}

	/**
	 * Print a success formatted message.
	 */
	public success<E>(firstArg: E, ...__: any[]): E {
		for (const msg of Array.from(arguments)) {
			this.print(msg, Mask.SUCCESS);
		}
		return firstArg;
	}

	/**
	 * Print a verbose formatted message.
	 */
	public verbose<E>(firstArg: E, ...__: any[]): E {
		for (const msg of Array.from(arguments)) {
			this.print(msg, Mask.VERBOSE);
		}
		return firstArg;
	}

	/**
	 * Print a warning formatted message.
	 */
	public warn<E>(firstArg: E, ...__: any[]): E {
		for (const msg of Array.from(arguments)) {
			this.print(msg, Mask.WARN);
		}
		return firstArg;
	}
}

export default AnsiLogger;
