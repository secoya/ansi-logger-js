import * as moment from 'moment';

/**
 * The internal data structure, that represents a single log entry.
 */
export interface LogEntry {
	group?: string;
	levelNumeric: Mask;
	levelText: string | null;
	message: any;
	timestamp: string;
}

/**
 * Transforms `LogEntry` to `TTransformer`
 * And describes how to format complex types
 * such as Array, Object and/or classes instances.
 */
export interface Transformer<TOutput> {
	printer: {
		err(msg: TOutput): void;
		out(msg: TOutput): void;
	};
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
export interface LoggerOptions<TTransformer extends Transformer<any>> {
	/**
	 * The group to mark the log entries with.
	 */
	group?: string;
	/**
	 * The log level mask.
	 */
	logLevel?: number;
	/**
	 * Moment.js formats.
	 * @link http://momentjs.com
	 */
	timeformat?: string;
	/**
	 * The transformer to convert LogEntry types
	 * to what the outputters can print.
	 */
	transformer: TTransformer;
}

/**
 * The internal options interface of `AnsiLogger`.
 */
export interface LoggerOptionsInternal<TTransformer extends Transformer<any>> {
	/**
	 * The group to mark the log entries with.
	 */
	group?: string;
	/**
	 * The log level mask.
	 */
	logLevel: number;
	/**
	 * Moment.js formats.
	 * @link http://momentjs.com
	 */
	timeformat: string;
	/**
	 * The transformer to convert LogEntry types
	 * to what the outputters can print.
	 */
	transformer: TTransformer;
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
			return 'UNKNOWN';
	}
}

export const defaultLogLevel: Level = Level.INFO;

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
export class AnsiLogger<TTransformer extends Transformer<any>> {
	/**
	 * The options object holder.
	 * This is filled with the default values when the Logger is constructed,
	 * it can be changed by using the setOptions method.
	 */
	public readonly options: Readonly<LoggerOptionsInternal<TTransformer>>;

	/**
	 * Constructs a Logger, and patch default values with the `options` passed.
	 */
	public constructor(options: LoggerOptions<TTransformer>) {
		this.options = Object.freeze({
			group: options.group,
			logLevel: options.logLevel == null ? defaultLogLevel : options.logLevel,
			timeformat: options.timeformat || 'YYYY-MM-DD HH:mm:ss.SSSZZ',
			transformer: options.transformer,
		});
	}

	/**
	 * Print to outputters.
	 * NB! This will print to the outputter based on what log levels you have enabled.
	 */
	private print(msg: any, outputMask: number): void {
		// return if the logLevel is higher than the selected the logLevel.
		if (!matchMask(this.options.logLevel, outputMask)) {
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
			this.options.transformer.printer.err.call(this, this.options.transformer.format(entry));
		} else {
			this.options.transformer.printer.out.call(this, this.options.transformer.format(entry));
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
				this.print(this.formatTypes(msg), Mask.DEBUG);
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
			} else if (typeof msg === 'string') {
				this.print(msg, Mask.ERROR);
			} else {
				this.print(this.formatTypes(msg), Mask.ERROR);
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
		this.print(this.formatTypes(err), Mask.ERROR);
	}

	/**
	 * Text transform Format types to string, some types make resively calls.
	 */
	public formatTypes(inputType: any): TTransformer {
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
				this.print(this.formatTypes(msg), Mask.INFO);
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
				this.print(this.formatTypes(msg), Mask.LOG);
			}
		}
		return firstArg;
	}

	/**
	 * Print a success formatted message.
	 */
	public success<E>(firstArg: E, ...__: any[]): E {
		for (const msg of Array.from(arguments)) {
			if (typeof msg === 'string') {
				this.print(msg, Mask.SUCCESS);
			} else {
				this.print(this.formatTypes(msg), Mask.SUCCESS);
			}
		}
		return firstArg;
	}

	/**
	 * Print a verbose formatted message.
	 */
	public verbose<E>(firstArg: E, ...__: any[]): E {
		for (const msg of Array.from(arguments)) {
			if (typeof msg === 'string') {
				this.print(msg, Mask.VERBOSE);
			} else {
				this.print(this.formatTypes(msg), Mask.VERBOSE);
			}
		}
		return firstArg;
	}

	/**
	 * Print a warning formatted message.
	 */
	public warn<E>(firstArg: E, ...__: any[]): E {
		for (const msg of Array.from(arguments)) {
			if (typeof msg === 'string') {
				this.print(msg, Mask.WARN);
			} else {
				this.print(this.formatTypes(msg), Mask.WARN);
			}
		}
		return firstArg;
	}
}

export default AnsiLogger;
