import * as clc from 'cli-color';
import * as _ from 'lodash';
import * as moment from 'moment';

export interface LogEntry {
	group?: string;
	levelNumeric: number;
	levelText: string | null;
	message: string | null;
	timestamp: string;
}

function assertNever(__: never, msg?: string) {
	throw new Error(msg || '');
}

/*
 * Transform log [entry] to text output.
 * @param LogEntry entry
 * @return String
 */
function textTransformer(this: AnsiLogger, entry: LogEntry) {
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

	return str;
}

/*
 * Transform log entry to text output.
 * @param LogEntry entry
 * @return String
 */
export function jsonTransformer(entry: LogEntry) {
	return JSON.stringify(entry);
}

/*
 * The identity transformer makes no transformation to the log entry
 * and just returns the [LogEntry] as is.
 * @param LogEntry entry
 * @return LogEntry
 */
export function identityTransformer(entry: LogEntry): LogEntry {
	return entry;
}

export interface LoggerOptions {
	colors: { [color: string]: clc.Format };
	group: string;
	'group-color': clc.Format;
	'log-level': number;
	'no-colors': boolean;
	outputters: {
		err: NodeJS.WritableStream['write'];
		out: NodeJS.WritableStream['write'];
	};
	'startup-info': boolean;
	timeformat: string;
	transformer: (entry: LogEntry) => any;
}

interface InternalLoggerOptions {
	group?: LoggerOptions['group'];
	'group-color'?: LoggerOptions['group-color'];

	'log-level': LoggerOptions['log-level'];
	'no-colors': LoggerOptions['no-colors'];
	outputters: LoggerOptions['outputters'];
	'startup-info': LoggerOptions['startup-info'];
	timeformat: LoggerOptions['timeformat'];
	transformer: LoggerOptions['transformer'];
}

// tslint:disable:object-literal-sort-keys
export const MASKS = {
	ERROR: 0b0000001,
	WARN: 0b0000010,
	SUCCESS: 0b0000100,
	LOG: 0b0001000,
	INFO: 0b0010000,
	DEBUG: 0b0100000,
	VERBOSE: 0b1000000,
};

export const LEVELS = {
	SILENT: 0b0000000,
	ERROR: 0b0000001,
	WARN: 0b0000011,
	SUCCESS: 0b0000111,
	LOG: 0b0001111,
	INFO: 0b0011111,
	DEBUG: 0b0111111,
	VERBOSE: 0b1111111,
};
// tslint:enable:object-literal-sort-keys

export type LogMask = keyof typeof MASKS;
export type LogLevel = keyof typeof LEVELS;

export type LookupMask = { [P in LogMask]: typeof MASKS[P] };
export type LookupLevel = { [P in LogLevel]: typeof LEVELS[P] };

export type ColorMap = { [P in LogLevel]: clc.Format } & { TIME: clc.Format } & { TITLE: clc.Format };

function matchMask(level: number, mask: number): boolean {
	// tslint:disable-next-line:no-bitwise
	return (level & mask) === mask;
}

const knownColors = Object.keys(LEVELS).concat(['TIME', 'TITLE']);
function isKnownColor(color: string): color is LogLevel | 'TIME' | 'TITLE' {
	return knownColors.includes(color);
}

/*
 * Ansi output logger.
 * This controls what should be ouputted to the console,
 * everything is categorized into log levels, so when you set a log level
 * you output from all the selected levels.
 * It is possible to disables colors (some teminals don't support colors).
 * you can also specify that you are only interested in output for a specific
 * log-level, then everything else is not outputted.
 * It is also possible to make the logger silent.
 * @author Brian K. Christensen, Secoya A/S <bkc@secoya.dk>
 */
export default class AnsiLogger {
	private DEBUG_COLOR: clc.Format = clc.yellow;
	// tslint:disable:react-aware-member-ordering no-bitwise

	// The color for each log-level
	private ERROR_COLOR: clc.Format = clc.bgRed.white;
	private INFO_COLOR: clc.Format = clc.blue;
	private LOG_COLOR: clc.Format = clc;

	/**
	 * The options object holder.
	 * This is filled with the default values when the Logger is constructed,
	 * it can be changed by using the setOptions method.
	 * @see Logger::setOptions()
	 * @var Object
	 */
	private options: InternalLoggerOptions;
	private SUCCESS_COLOR: clc.Format = clc.green;
	private TIME_COLOR: clc.Format = clc.cyan;

	// title isn't a log level, it is used for making all 'title's look the same.
	// Title is outputted in AnsiLogger::LOG_INFO
	private TITLE_COLOR: clc.Format = clc.cyan;
	private VERBOSE_COLOR: clc.Format = clc.magenta;
	private WARN_COLOR: clc.Format = clc.red.bold;
	// tslint:enable:react-aware-member-ordering

	/**
	 * Constructs a Logger, and sets default option values.
	 */
	public constructor(options?: Partial<LoggerOptions>) {
		// tslint:disable:object-literal-key-quotes
		this.options = {
			group: undefined,
			'group-color': undefined,
			'log-level': LEVELS.INFO,
			'no-colors': false,
			outputters: {
				out(msg: string) {
					// Setting up default group // the log level // disbles colors if true
					return process.stdout.write(msg + '\n');
				},
				err(msg: string) {
					return process.stderr.write(msg + '\n');
				},
			},
			'startup-info': true,
			/**
			 * Moment.js formats.
			 * @link http://momentjs.com
			 */
			timeformat: 'HH:mm:ss.SSS',
			transformer: textTransformer,
		};
		// tslint:enable:object-literal-key-quotes

		if (options != null) {
			this.setOptions(options);
		}
	}

	private resolveLevelColor(level: number): clc.Format {
		switch (true) {
			case matchMask(level, MASKS.ERROR):
				return this.ERROR_COLOR;
			case matchMask(level, MASKS.WARN):
				return this.WARN_COLOR;
			case matchMask(level, MASKS.SUCCESS):
				return this.SUCCESS_COLOR;
			case matchMask(level, MASKS.INFO):
				return this.INFO_COLOR;
			case matchMask(level, MASKS.DEBUG):
				return this.DEBUG_COLOR;
			case matchMask(level, MASKS.VERBOSE):
				return this.VERBOSE_COLOR;
			default:
				return this.LOG_COLOR;
		}
	}

	private setColor(level: LogLevel | 'TITLE' | 'TIME', color: clc.Format) {
		switch (level) {
			case 'ERROR':
				this.ERROR_COLOR = color;
				break;
			case 'WARN':
				this.WARN_COLOR = color;
				break;
			case 'SUCCESS':
				this.SUCCESS_COLOR = color;
				break;
			case 'LOG':
				this.LOG_COLOR = color;
				break;
			case 'INFO':
				this.INFO_COLOR = color;
				break;
			case 'DEBUG':
				this.DEBUG_COLOR = color;
				break;
			case 'VERBOSE':
				this.VERBOSE_COLOR = color;
				break;
			case 'TITLE':
				this.TITLE_COLOR = color;
				break;
			case 'TIME':
				this.TIME_COLOR = color;
				break;
			case 'SILENT':
				break;
			default:
				assertNever(level);
				break;
		}
	}

	/**
	 * Colorize the message string.
	 * NB! If no-colors mode is on or no color is given.
	 * then this method just return the message as it is.
	 * @param String msg
	 * @param [ Function color ]
	 * @return String The colorized message.
	 */
	public colorize(msg: string, color?: clc.Format | null) {
		if (color == null || !process.stdout.isTTY || this.options['no-colors']) {
			return msg;
		}
		return color(msg);
	}

	/**
	 * Print a debug formatted message.
	 * NB! AnsiLogger::DEBUG_MASK must be present in log level.
	 *
	 * @params mixed [, mixed] [, mixed]...
	 * @return void
	 */
	public debug<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, MASKS.DEBUG, this.DEBUG_COLOR);
		}
		return firstArg;
	}

	/**
	 * Print an error.
	 * NB! AnsiLogger::ERROR_MASK must be present in log level.
	 *
	 * @params mixed [, mixed] [, mixed]...
	 * @return mixed The first argument is returned
	 */
	public error<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, MASKS.ERROR, this.ERROR_COLOR);
		}
		return firstArg;
	}

	/**
	 * Format an error, this is typically used, for string formatting an Exception/Error.
	 * @param mixed err
	 * @return void
	 */
	public formatError(err: any): void {
		this.print(`  ${this.formatTypes(err).replace(/\n/g, '\n  ')}`, MASKS.ERROR, this.ERROR_COLOR);
	}

	/**
	 * Format a function call, for the debug level
	 * NB! if passing arguments the function
	 *     every argument, gonna be formatted with the formatTypes() function
	 *     @see Logger::formatTypes()
	 * @param String functionName
	 * @param [ Array args = [] ]
	 * @return void
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
	 * Format group if any.
	 * @return String The formatted group
	 */
	public formatGroup(group: string) {
		const groupTrimmed = group.trim();
		const pad = groupTrimmed.length - group.length;
		let padding = '';
		for (const __ of Array(pad)) {
			padding += ' ';
		}
		return `[${this.colorize(groupTrimmed, this.options['group-color'])}]${padding}`;
	}

	/**
	 * Format the loglevel to the console
	 * @param Number loglevel
	 * @return String The formatted loglevel
	 */
	public formatLogLevel(loglevel: number) {
		// no need to ouput the log level, if the default log level is selected.
		// then it's just a waste of space.
		if (this.options['log-level'] === LEVELS.LOG) {
			return null;
		}
		const loglevelStr = this.resolveLogLevel(loglevel);
		const pad = ' '.repeat(loglevelStr.length < 6 ? loglevelStr.length : 0);

		// resolving the color for the log level.
		const loglevelColor = this.resolveLevelColor(loglevel);

		// the formatted log-level
		return `[${this.colorize(loglevelStr, loglevelColor)}]${pad}`;
	}

	/**
	 * Format a object to string.
	 * @param String time
	 * @return String
	 */
	public formatTime(time: string) {
		return `[${this.colorize(time, this.TIME_COLOR)}]`;
	}

	/**
	 * Format types to string, some types make resively calls.
	 * @param mixed type
	 * @param [ Number seperator = 0 ]
	 * @param [ Number depth = 3 ] The max depth of recursive calls.
	 * @return String formated type.
	 */
	// tslint:disable-next-line:no-reserved-keywords
	public formatTypes(type: any, seperator?: number, depth?: number) {
		// making the proper indentation
		let val;
		if (seperator == null) {
			seperator = 0;
		}
		if (depth == null) {
			depth = 3;
		}

		const pad = ' '.repeat(seperator > 0 ? seperator - 1 : 0);

		// primitive types
		if (_.isNumber(type) || _.isBoolean(type) || _.isUndefined(type) || _.isNull(type)) {
			return `${pad}${type}`;
		}

		if (_.isString(type)) {
			return `${pad}'${type}'`;
		}

		// array is formatted as one-liners
		if (_.isArray(type) && seperator < depth) {
			let str = `${pad}[`;
			// tslint:disable-next-line:forin
			for (const key of type.keys()) {
				val = type[key];
				str += ` ${this.formatTypes(val, seperator + 1, depth).trim()}`;
				str += ((key as any) as number) < type.length - 1 ? ',' : ' ';
			}
			return `${str}]`;
		}

		// hashes is formatted with indentation for every level
		// of the object, the values of the properties are also resolved.
		if (_.isObject(type)) {
			const cname = type.constructor.name;
			if (cname === 'Object' && seperator < depth) {
				let str = `${pad}{`;
				for (const key of Object.keys(type)) {
					val = type[key];
					str += `\n${pad}  ${key}: ${this.formatTypes(val, seperator + 1, depth).trim()}`;
				}
				if (str.length > pad.length + 1) {
					str += `\n${pad}`;
				}
				return `${str}}`;
			}
		}

		// print the name of a complex type.
		const isFunc = _.isFunction(type);
		if (isFunc || _.isObject(type)) {
			const cname = type.constructor.name;
			if (cname === 'Error') {
				return `${pad}${type.message}`;
			}
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
	 * NB! AnsiLogger::INFO_MASK must be present in log level.
	 *
	 * @params mixed [, mixed] [, mixed]...
	 * @return mixed The first argument is returned
	 */
	public info<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, MASKS.INFO, this.INFO_COLOR);
		}
		return firstArg;
	}

	/**
	 * Print an info formatted message.
	 * NB! AnsiLogger::LOG_MASK must be present in log level.
	 *
	 * @params mixed [, mixed] [, mixed]...
	 * @return mixed The first argument is returned
	 */
	// tslint:disable-next-line:no-reserved-keywords
	public log<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, MASKS.LOG, this.LOG_COLOR);
		}
		return firstArg;
	}

	/**
	 * Print to console.
	 * NB! This will print to the console based on the log level you have enabled.
	 * @param String msg
	 * @param [ Number loglevel = AnsiLogger::LOG_MASK ]
	 * @param [ String|Array color ] @see colorize
	 * @return void
	 */
	public print(msg: string, logMask?: number | null, color?: clc.Format | null): void {
		// return if the log-level is higher than the selected the log-level.
		if (logMask == null) {
			logMask = MASKS.LOG;
		}
		console.log(logMask);
		if (!matchMask(this.options['log-level'], logMask)) {
			return;
		}

		const handleMultiline = (mMsg: string, mColor?: clc.Format | null) => {
			const res = [];
			// colorize each line, so when the string is splitted later,
			// it will not mess up the colors.
			if ((mMsg != null ? mMsg.split : undefined) == null) {
				mMsg = `${mMsg}`;
			}
			for (const m of Array.from(mMsg.split('\n'))) {
				res.push(this.colorize(m, mColor));
			}
			return res.join('\n');
		};

		const entry: LogEntry = {
			group: this.options.group,
			levelNumeric: logMask,
			levelText: this.resolveLogLevel(logMask),
			message: handleMultiline(msg, color),
			timestamp: moment().format(this.options.timeformat),
		};

		// finally printing the output!.
		if ((logMask & MASKS.ERROR) === MASKS.ERROR) {
			this.options.outputters.err.call(this, this.options.transformer.call(this, entry));
		} else {
			this.options.outputters.out.call(this, this.options.transformer.call(this, entry));
		}
	}

	/**
	 * Resolves custom loglevel string
	 * @param Number loglevel
	 * @return String
	 */
	public resolveCustomLoglevel(loglevel: number) {
		const result = [];
		for (const mask of Array.from(Object.values(MASKS))) {
			if ((loglevel & mask) === mask) {
				const levelStr = this.resolveLogLevel(mask);
				result.push(this.colorize(levelStr, this.resolveLevelColor(mask)));
			}
		}

		return result.join(', ');
	}

	/**
	 * Resolve a string representation of the log-level.
	 * @param Number loglevel
	 * @return String
	 */
	public resolveLogLevel(mask: number) {
		switch (mask) {
			case MASKS.ERROR:
				return 'ERROR';
			case MASKS.WARN:
				return 'WARN';
			case MASKS.SUCCESS:
				return 'SUCCESS';
			case MASKS.INFO:
				return 'INFO';
			case MASKS.DEBUG:
				return 'DEBUG';
			case MASKS.VERBOSE:
				return 'VERBOSE';
			case MASKS.LOG:
				return 'LOG';
			default:
				return this.resolveCustomLoglevel(mask);
		}
	}

	/**
	 * Set new colors.
	 * @param Oject<String, Function> colorMap<levelStr, colorFn>
	 * @return void
	 */
	public setColors(colorMap: { [level: string]: clc.Format }) {
		for (const level of Object.keys(colorMap)) {
			const color = colorMap[level];
			const needle = level.toUpperCase();
			if (isKnownColor(needle)) {
				this.setColor(needle, color);
			}
		}
	}

	/**
	 * Sets the options.
	 * @param Object options
	 * @return void
	 */
	public setOptions(options: Partial<LoggerOptions>) {
		if (options.colors != null) {
			this.setColors(options.colors);
		}
		const currentLoglevel = this.options['log-level'];
		const optionKeys = Object.keys(this.options);
		for (const key of optionKeys) {
			const val = (options as any)[key];
			if (val != null) {
				(this.options as any)[key] = val;
			}
		}

		if (!_.isNumber(this.options['log-level'] || this.options['log-level'] > LEVELS.VERBOSE)) {
			this.options['log-level'] = currentLoglevel;
			this.warn(`Invalid log level is trying to be set: ${options['log-level']}, aborting...`);

			// log level changed
		} else if (this.options['startup-info'] && this.options['log-level'] !== currentLoglevel) {
			const loglevelStr = this.resolveLogLevel(currentLoglevel);
			const loglevelColor = this.resolveLevelColor(currentLoglevel);
			this.info(`Log levels enabled: ${this.colorize(loglevelStr, loglevelColor)}`);
		}
	}

	/**
	 * Print a success formatted message.
	 * NB! AnsiLogger::SUCCESS_MASK must be present in log level.
	 *
	 * @params mixed [, mixed] [, mixed]...
	 * @return mixed The first argument is returned
	 */
	public success<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, MASKS.SUCCESS, this.SUCCESS_COLOR);
		}
		return firstArg;
	}

	/**
	 * Print a title formatted message.
	 * NB! AnsiLogger::LOG_MASK must be present in log level.
	 *
	 * @params mixed [, mixed] [, mixed]...
	 * @return mixed The first argument is returned
	 */
	public title<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, MASKS.LOG, this.TITLE_COLOR);
		}
		return firstArg;
	}

	/**
	 * Print a verbose formatted message.
	 * NB! AnsiLogger::VERBOSE_MASK must be present in log level.
	 *
	 * @params mixed [, mixed] [, mixed]...
	 * @return mixed The first argument is returned
	 */
	public verbose<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, MASKS.VERBOSE, this.VERBOSE_COLOR);
		}
		return firstArg;
	}

	/**
	 * Print a warning.
	 * NB! AnsiLogger::WARN_MASK must be present in log level.
	 *
	 * @params mixed [, mixed] [, mixed]...
	 * @return mixed The first argument is returned
	 */
	public warn<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, MASKS.WARN, this.WARN_COLOR);
		}
		return firstArg;
	}
}
