import * as clc from 'cli-color';
import { matchMask, resolveLogLevel, LogEntry, Mask, Transformer } from './AnsiLogger';

export type ColorType = 'ERROR' | 'WARN' | 'SUCCESS' | 'LOG' | 'INFO' | 'DEBUG' | 'VERBOSE' | 'GROUP' | 'TIME';
export type ColorMap = { [P in ColorType]: clc.Format };

export interface TextTransformerOptionsInput {
	colorMap: ColorMap;
	colors: boolean;
	forceColors: boolean;
}

export interface TextTransformerOptions {
	colors: TextTransformerOptionsInput['colors'];
	forceColors: TextTransformerOptionsInput['forceColors'];
}

export class TextTransformer implements Transformer {
	public get options(): Partial<TextTransformerOptions> {
		return this._options;
	}

	// tslint:disable-next-line:variable-name
	private _options: TextTransformerOptions;

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

	public constructor(options?: Partial<TextTransformerOptionsInput>) {
		this._options = {
			colors: true,
			forceColors: false,
		};

		if (options != null) {
			this.setOptions(options);
		}
	}

	/**
	 * Colorize the message string.
	 * NB! If no-colors mode is on or no color is given.
	 * then this method just return the message as it is.
	 */
	private colorize(msg: string, color?: clc.Format | null) {
		if (color == null || !this.useColors) {
			return msg;
		}
		return color(msg);
	}

	/**
	 * Format group if any.
	 */
	private formatGroup(group: string) {
		const groupTrimmed = group.trim();
		const pad = ' '.repeat(groupTrimmed.length - group.length);
		return `[${this.colorize(groupTrimmed, this.colors.GROUP)}]${pad}`;
	}

	/**
	 * Format the loglevel to the console
	 */
	private formatLogLevel(loglevel: number) {
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
	private formatTime(time: string) {
		return `[${this.colorize(time, this.colors.TIME)}]`;
	}

	private handleMultiline(prefix: string, msg: string, color?: clc.Format | null): string {
		const res = [];
		for (const m of Array.from(msg.split('\n'))) {
			res.push(prefix + this.colorize(m, color));
		}
		return res.join('\n');
	}

	/**
	 *
	 * @param level
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
	 * Setting a single color in the `ColorMap`
	 */
	private setColor(level: ColorType, color: clc.Format) {
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

	private setOptions(options: Partial<TextTransformerOptionsInput>) {
		if (options.colorMap != null) {
			this.setColors(options.colorMap);
		}

		const optionKeys = Array.from(Object.keys(this.options)) as (keyof TextTransformerOptions)[];
		for (const key of optionKeys) {
			const val = options[key];
			if (val != null) {
				this._options[key] = val;
			}
		}
	}

	public get useColors(): boolean {
		return this._options.forceColors || (!!process.stdout.isTTY && this._options.colors);
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
		if (entry.levelText != null) {
			const levelText = this.formatLogLevel(entry.levelNumeric);
			if (levelText != null) {
				prefix += ` ${levelText}`;
			}
		}

		return this.handleMultiline(prefix + ' ', String(entry.message), this.resolveLevelColor(entry.levelNumeric));
	}

	/**
	 * Set new colors.
	 */
	public setColors(colorMap: ColorMap) {
		for (const level of Array.from(Object.keys(colorMap)) as (keyof ColorMap)[]) {
			const color = colorMap[level];
			this.setColor(level, color);
		}
	}
}
