import * as clc from 'cli-color';
import { matchMask, resolveLogLevel, LogEntry, LogLevel, Mask, Transformer } from './AnsiLogger';

function assertNever(__: never, msg?: string) {
	throw new Error(msg || 'Unsupported option ' + __);
}

const knownColors = ['SILENT', 'ERROR', 'WARN', 'SUCCESS', 'LOG', 'INFO', 'DEBUG', 'VERBOSE'].concat(['TIME', 'TITLE']);
function isKnownColorType(color: string): color is LogLevel | 'TIME' | 'TITLE' {
	return knownColors.includes(color);
}

export type ColorMap = { [mask: number]: clc.Format } & { TIME: clc.Format } & { TITLE: clc.Format };

export interface TextTransformerOptionsInput {
	colorMap: { [color: string]: clc.Format };
	colors: boolean;
	groupColor: clc.Format;
}

export interface TextTransformerOptions {
	colors: TextTransformerOptionsInput['colors'];
	groupColor?: clc.Format;
}

export class TextTransformer implements Transformer {
	public get options(): Partial<TextTransformerOptions> {
		return this._options;
	}

	// tslint:disable-next-line:variable-name
	private _options: TextTransformerOptions;

	/**
	 * Default color scheme
	 * can be overriden by providing a
	 * new full or partial ColorMap.
	 */
	public readonly colors: ColorMap = {
		[Mask.ERROR]: clc.bgRed.white,
		[Mask.WARN]: clc.red.bold,
		[Mask.SUCCESS]: clc.green,
		[Mask.LOG]: clc,
		[Mask.INFO]: clc.blue,
		[Mask.DEBUG]: clc.yellow,
		[Mask.VERBOSE]: clc.magenta,
		TIME: clc.cyan,
		TITLE: clc.cyan,
	};

	public constructor(options?: Partial<TextTransformerOptionsInput>) {
		this._options = {
			colors: true,
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
		if (color == null || !process.stdout.isTTY || !this._options.colors) {
			return msg;
		}
		return color(msg);
	}

	/**
	 * Format group if any.
	 */
	private formatGroup(group: string) {
		const groupTrimmed = group.trim();
		const pad = groupTrimmed.length - group.length;
		let padding = '';
		for (const __ of Array(pad)) {
			padding += ' ';
		}
		return `[${this.colorize(groupTrimmed, this.options.groupColor)}]${padding}`;
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

	private handleMultiline(msg: string, color?: clc.Format | null): string {
		const res = [];
		// colorize each line, so when the string is splitted later,
		// it will not mess up the colors.
		if ((msg != null ? msg.split : undefined) == null) {
			msg = `${msg}`;
		}
		for (const m of Array.from(msg.split('\n'))) {
			res.push(this.colorize(m, color));
		}
		return res.join('\n');
	}

	/**
	 *
	 * @param level
	 */
	private resolveLevelColor(level: number): clc.Format {
		switch (true) {
			case matchMask(level, Mask.ERROR):
				return this.colors[Mask.ERROR];
			case matchMask(level, Mask.WARN):
				return this.colors[Mask.WARN];
			case matchMask(level, Mask.SUCCESS):
				return this.colors[Mask.SUCCESS];
			case matchMask(level, Mask.INFO):
				return this.colors[Mask.INFO];
			case matchMask(level, Mask.DEBUG):
				return this.colors[Mask.DEBUG];
			case matchMask(level, Mask.VERBOSE):
				return this.colors[Mask.VERBOSE];
			default:
				return this.colors[Mask.LOG];
		}
	}

	/**
	 * Setting a single color in the `ColorMap`
	 */
	private setColor(level: LogLevel | 'TITLE' | 'TIME', color: clc.Format) {
		switch (level) {
			case 'ERROR':
				this.colors[Mask.ERROR] = color;
				break;
			case 'WARN':
				this.colors[Mask.WARN] = color;
				break;
			case 'SUCCESS':
				this.colors[Mask.SUCCESS] = color;
				break;
			case 'LOG':
				this.colors[Mask.LOG] = color;
				break;
			case 'INFO':
				this.colors[Mask.INFO] = color;
				break;
			case 'DEBUG':
				this.colors[Mask.DEBUG] = color;
				break;
			case 'VERBOSE':
				this.colors[Mask.VERBOSE] = color;
				break;
			case 'TITLE':
				this.colors.TITLE = color;
				break;
			case 'TIME':
				this.colors.TIME = color;
				break;
			case 'SILENT':
				break;
			default:
				assertNever(level);
				break;
		}
	}

	private setOptions(options: Partial<TextTransformerOptionsInput>) {
		if (options.colorMap != null) {
			this.setColors(options.colorMap);
		}

		const optionKeys = Object.keys(this.options) as (keyof TextTransformerOptions)[];
		for (const key of optionKeys) {
			const val = options[key];
			if (val != null) {
				this._options[key] = val;
			}
		}
	}

	/**
	 * Transform log entry to text output.
	 */
	public format(entry: LogEntry): string {
		// get the formatted current time.
		let str = this.formatTime(entry.timestamp);

		// get the formatted group
		if (entry.group != null) {
			str += ` ${this.formatGroup(entry.group)}`;
		}

		// get the formatted log-level.
		if (entry.levelText != null) {
			const levelText = this.formatLogLevel(entry.levelNumeric);
			if (levelText != null) {
				str += ` ${levelText}`;
			}
		}

		// now insert the time and log-level on each line.
		if (entry.message != null) {
			str += ` ${entry.message.replace(/\n/g, `\n${str} `)}`;
		}

		return this.handleMultiline(str, this.colors[entry.levelNumeric]);
	}

	/**
	 * Set new colors.
	 */
	public setColors(colorMap: { [level: string]: clc.Format }) {
		for (const level of Object.keys(colorMap)) {
			const color = colorMap[level];
			const needle = level.toUpperCase();
			if (isKnownColorType(needle)) {
				this.setColor(needle, color);
			}
		}
	}
}
