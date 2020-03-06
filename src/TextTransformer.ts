import * as clc from 'cli-color';
import { matchMask, resolveLogLevel, LogEntry, Mask, Transformer } from './AnsiLogger';

/**
 * All the colors available to configure.
 *
 * - ERROR   - The color of the `error` output.
 * - WARN    - The color of the `warn` output,
 * - SUCCESS - The color of the `success` output.
 * - LOG     - The color of the `default` log output.
 * - INFO    - The color of the `info` log output.
 * - DEBUG   - The color of the `debug` log output.
 * - VERBOSE - The color of the `verbose` log output.
 * - GROUP   - The color of the `group section` of the output.
 * - TIME    - The color of the `time section` of the output.
 */
export type ColorType = 'ERROR' | 'WARN' | 'SUCCESS' | 'LOG' | 'INFO' | 'DEBUG' | 'VERBOSE' | 'GROUP' | 'TIME';

/**
 * The map from `ColorType`s to a coloring functions.
 */
export type ColorMap = { [P in ColorType]: clc.Format };

/**
 * Options interface for text transformer.
 */
export interface TextTransformerOptions {
	/**
	 * The map of which coloring functions to use when/where.
	 */
	colorMap?: Partial<ColorMap>;
	/**
	 * Whether or not if colors is enabled, default: `process.stdout.isTTY`.
	 */
	colors?: boolean;
	/**
	 * Always output colors, no matter if stdout is a TTY.
	 */
	forceColors?: boolean;
	/**
	 * The printer.
	 */
	printer?: {
		err: (msg: string) => void;
		out: (msg: string) => void;
	};
}

/**
 * Interface for the internal text transformer options.
 */
export interface TextTransformerOptionsInternal {
	/**
	 * Whether or not if colors is enabled, default: `process.stdout.isTTY`.
	 */
	colors: boolean;
	/**
	 * Always output colors, no matter if stdout is a TTY.
	 */
	forceColors: boolean;
}

/**
 * Transformer from log entries to human readable colorized text.
 */
export class TextTransformer implements Transformer<string> {
	/**
	 * Whether or not this transformer outputs colored text.
	 */
	public get useColors(): boolean {
		return this.options.forceColors || (!!process.stdout.isTTY && this.options.colors);
	}

	// tslint:disable:object-literal-sort-keys
	/**
	 * Default color scheme
	 * can be overriden by providing a
	 * new full or partial ColorMap.
	 */
	public readonly colors: ColorMap = {
		ERROR: clc.bgRed.white,
		WARN: clc.red.bold,
		SUCCESS: clc.green,
		LOG: clc,
		INFO: clc.blue,
		DEBUG: clc.yellow,
		VERBOSE: clc.magenta,
		GROUP: clc.yellow,
		TIME: clc.cyan,
	};
	// tslint:enable:object-literal-sort-keys

	public readonly options: Readonly<TextTransformerOptionsInternal>;

	public readonly printer: {
		readonly err: (msg: string) => void;
		readonly out: (msg: string) => void;
	};

	public constructor(options?: TextTransformerOptions) {
		const opts = options == null ? {} : options;
		this.options = Object.freeze({
			colors: opts.colors == null ? true : opts.colors,
			forceColors: opts.forceColors || false,
		});

		this.printer = Object.freeze(
			opts.printer || {
				err: (msg: string) => {
					process.stderr.write(msg);
				},
				out: (msg: string) => {
					process.stdout.write(msg);
				},
			},
		);

		if (opts.colorMap != null) {
			this.setColors(opts.colorMap);
		}
	}

	/**
	 * Colorize the message string.
	 * NB! If no-colors mode is on or no color is given.
	 * then this method just return the message as it is.
	 */
	private colorize(msg: string, color?: clc.Format | null): string {
		if (color == null || !this.useColors) {
			return msg;
		}
		return color(msg);
	}

	/**
	 * Format group if any.
	 */
	private formatGroup(group: string): string {
		const groupTrimmed = group.trim();
		const pad = ' '.repeat(groupTrimmed.length - group.length);
		return `[${this.colorize(groupTrimmed, this.colors.GROUP)}]${pad}`;
	}

	/**
	 * Format the log mask to the console.
	 */
	private formatLogLevel(loglevel: number): string {
		// no need to ouput the log level, if the default log level is selected.
		// then it's just a waste of space.
		const loglevelStr = resolveLogLevel(loglevel);
		const pad = ' '.repeat(loglevelStr.length < 6 ? 7 - loglevelStr.length : 0);

		// resolving the color for the log level.
		const loglevelColor = this.resolveLevelColor(loglevel);

		// the formatted log-level
		return `[${this.colorize(loglevelStr, loglevelColor)}]${pad}`;
	}

	/**
	 * Format a object to string.
	 */
	private formatTime(time: string): string {
		return `[${this.colorize(time, this.colors.TIME)}]`;
	}

	private formatTypesInternal(inputType: any, depth: number = 3, indent: number = 0): string {
		// making the proper indentation
		let val;

		const pad = '    '.repeat(indent > 0 ? indent : 0);

		// primitive types
		if (typeof inputType === 'number' || typeof inputType === 'boolean') {
			return `${pad}${inputType}`;

			// tslint:disable-next-line:no-typeof-undefined
		} else if (typeof inputType === 'undefined') {
			return `${pad}undefined`;
		} else if (inputType === null) {
			return `${pad}null`;
		} else if (typeof inputType === 'string') {
			return `${pad}'${inputType}'`;

			// array is formatted as one-liners
		} else if (Array.isArray(inputType) && indent < depth) {
			let str = `${pad}[`;
			// tslint:disable-next-line:forin
			for (const key of Array.from(inputType.keys())) {
				val = inputType[key];
				str += ` ${this.formatTypesInternal(val, depth, indent + 1).trim()}`;
				str += ((key as any) as number) < inputType.length - 1 ? ',' : ' ';
			}
			return `${str}]`;

			// hashes is formatted with indentation for every level
			// of the object, the values of the properties are also resolved.
		} else if (typeof inputType === 'object') {
			const cname = inputType.constructor.name;
			if (cname === 'Error' || inputType instanceof Error) {
				let str = `${pad}${inputType.message}`;
				if (inputType.stack != null) {
					str += `\n${pad}${inputType.stack}`;
				}
				return str;
			} else if (cname === 'Object' && indent < depth) {
				let str = `${pad}{`;
				for (const key of Array.from(Object.keys(inputType))) {
					val = inputType[key];
					str += `\n${pad}    ${key}: ${this.formatTypesInternal(val, depth, indent + 1).trim()}`;
				}
				if (str.length > pad.length + 1) {
					str += `\n${pad}`;
				}
				return `${str}}`;
			} else if (cname !== 'Object') {
				return `${pad}${cname}`;
			}
		} else if (typeof inputType === 'function') {
			const cname = inputType.name;
			if (cname && cname !== 'Function') {
				return `${pad}[Function: ${cname}]`;
			} else {
				return `${pad}Function`;
			}
		}
		// print the name of an unhandled type.
		// typically this will return 'object'
		return `${pad}${typeof inputType}`;
	}

	/**
	 * Prefix eact line of msg with prefix.
	 */
	private handleMultiline(prefix: string, msg: string, color?: clc.Format | null): string {
		const res = [];
		for (const m of Array.from(msg.split('\n'))) {
			res.push(prefix + this.colorize(m, color));
		}
		return res.join('\n');
	}

	/**
	 * Resolve which coloring function to use for the level mask.
	 */
	private resolveLevelColor(level: Mask): clc.Format {
		switch (true) {
			case matchMask(level, Mask.ERROR):
				return this.colors.ERROR;
			case matchMask(level, Mask.WARN):
				return this.colors.WARN;
			case matchMask(level, Mask.SUCCESS):
				return this.colors.SUCCESS;
			case matchMask(level, Mask.INFO):
				return this.colors.INFO;
			case matchMask(level, Mask.DEBUG):
				return this.colors.DEBUG;
			case matchMask(level, Mask.VERBOSE):
				return this.colors.VERBOSE;
			default:
				return this.colors.LOG;
		}
	}

	/**
	 * Setting a single color in the `ColorMap`.
	 */
	private setColor(level: ColorType, color: clc.Format): void {
		switch (level) {
			case 'ERROR':
				this.colors.ERROR = color;
				break;
			case 'WARN':
				this.colors.WARN = color;
				break;
			case 'SUCCESS':
				this.colors.SUCCESS = color;
				break;
			case 'LOG':
				this.colors.LOG = color;
				break;
			case 'INFO':
				this.colors.INFO = color;
				break;
			case 'DEBUG':
				this.colors.DEBUG = color;
				break;
			case 'VERBOSE':
				this.colors.VERBOSE = color;
				break;
			case 'GROUP':
				this.colors.GROUP = color;
				break;
			case 'TIME':
				this.colors.TIME = color;
				break;
			default:
				const x: never = level;
				throw new Error(`Unsupported option ${x}`);
		}
	}

	/**
	 * Set new colors.
	 */
	private setColors(colorMap: Partial<ColorMap>): void {
		for (const level of Array.from(Object.keys(colorMap)) as (keyof ColorMap)[]) {
			const color = colorMap[level];
			if (color != null) {
				this.setColor(level, color);
			}
		}
	}

	/**
	 * Transform log entry to text output.
	 */
	public format(entry: LogEntry): string {
		// get the formatted current time.
		let prefix = this.formatTime(entry.timestamp);

		// get the formatted group
		if (entry.group != null) {
			prefix += ` ${this.formatGroup(entry.group)}`;
		}

		// get the formatted log-level.
		const levelText = this.formatLogLevel(entry.levelNumeric);
		prefix += ` ${levelText}`;

		return (
			this.handleMultiline(prefix + ' ', String(entry.message), this.resolveLevelColor(entry.levelNumeric)) + '\n'
		);
	}

	/**
	 * Format complex types.
	 */
	public formatTypes<T>(inputType: T): string {
		return this.formatTypesInternal(inputType);
	}
}
