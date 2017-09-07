import * as clc from 'cli-color';
import * as moment from 'moment';

export interface LogEntry {
	group?: string;
	levelNumeric: number;
	levelText: string | null;
	message: string | null;
	timestamp: string;
}

function assertNever(__: never, msg?: string) {
	throw new Error(msg || 'Unsupported option ' + __);
}

// tslint:disable:no-bitwise
export enum Mask {
	ERROR = 0b0000001,
	WARN = ERROR << 1,
	SUCCESS = WARN << 1,
	LOG = SUCCESS << 1,
	INFO = LOG << 1,
	DEBUG = INFO << 1,
	VERBOSE = DEBUG << 1,
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

export type LogMask = keyof typeof Mask;
export type LogLevel = keyof typeof Level;

export type ColorMap = { [mask: number]: clc.Format; } & { TIME: clc.Format } & { TITLE: clc.Format };

function matchMask(level: number, mask: number): boolean {
	// tslint:disable-next-line:no-bitwise
	return (level & mask) === mask;
}

const knownColors = Object.keys(Level).concat(['TIME', 'TITLE']);
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
	private readonly colors: ColorMap = {
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

	/**
	 * The options object holder.
	 * This is filled with the default values when the Logger is constructed,
	 * it can be changed by using the setOptions method.
	 * @see Logger::setOptions()
	 * @var Object
	 */
	private options: InternalLoggerOptions;
	// tslint:enable:react-aware-member-ordering

	/**
	 * Constructs a Logger, and sets default option values.
	 */
	public constructor(options?: Partial<LoggerOptions>) {
		// tslint:disable:object-literal-key-quotes
		this.options = {
			group: undefined,
			'group-color': undefined,
			'log-level': Level.INFO,
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

	private handleMultiline(mMsg: string, mColor?: clc.Format | null): string {
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
	}

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
			this.print(msg, Mask.DEBUG, this.colors[Mask.DEBUG]);
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
			this.print(msg, Mask.ERROR, this.colors[Mask.ERROR]);
		}
		return firstArg;
	}

	/**
	 * Format an error, this is typically used, for string formatting an Exception/Error.
	 * @param mixed err
	 * @return void
	 */
	public formatError(err: any): void {
		this.print(`  ${this.formatTypes(err).replace(/\n/g, '\n  ')}`, Mask.ERROR, this.colors[Mask.ERROR]);
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
		const loglevelStr = this.resolveLogLevel(loglevel);
		const pad = ' '.repeat(loglevelStr.length < 6 ? 7 - loglevelStr.length : 0);

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
		return `[${this.colorize(time, this.colors.TIME)}]`;
	}

	/**
	 * Format types to string, some types make resively calls.
	 * @param mixed type
	 * @param [ Number depth = 3 ] The max depth of recursive calls.
	 * @param [ Number seperator = 0 ]
	 * @return String formated type.
	 */
	// tslint:disable-next-line:no-reserved-keywords
	public formatTypes(type: any, depth?: number, indent?: number) {
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
	 * NB! AnsiLogger::INFO_MASK must be present in log level.
	 *
	 * @params mixed [, mixed] [, mixed]...
	 * @return mixed The first argument is returned
	 */
	public info<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, Mask.INFO, this.colors[Mask.INFO]);
		}
		return firstArg;
	}

	/**
	 * Print an default log formatted message.
	 * NB! AnsiLogger::LOG_MASK must be present in log level.
	 *
	 * @params mixed [, mixed] [, mixed]...
	 * @return mixed The first argument is returned
	 */
	// tslint:disable-next-line:no-reserved-keywords
	public log<T>(firstArg: T, ...__: any[]): T {
		for (const msg of Array.from(arguments)) {
			this.print(msg, Mask.LOG, this.colors[Mask.LOG]);
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
			logMask = Mask.LOG;
		}

		if (!matchMask(this.options['log-level'], logMask)) {
			return;
		}

		const entry: LogEntry = {
			group: this.options.group,
			levelNumeric: logMask,
			levelText: this.resolveLogLevel(logMask),
			message: this.handleMultiline(msg, color),
			timestamp: moment().format(this.options.timeformat),
		};

		// finally printing the output!.
		if (matchMask(logMask, Mask.ERROR)) {
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
		for (const mask of Array.from(Object.values(Mask))) {
			if (matchMask(loglevel, mask)) {
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
			case Mask.ERROR:
				return 'ERROR';
			case Mask.WARN:
				return 'WARN';
			case Mask.SUCCESS:
				return 'SUCCESS';
			case Mask.INFO:
				return 'INFO';
			case Mask.DEBUG:
				return 'DEBUG';
			case Mask.VERBOSE:
				return 'VERBOSE';
			case Mask.LOG:
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

		if (!Number.isInteger(this.options['log-level']) || this.options['log-level'] > Level.VERBOSE) {
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
			this.print(msg, Mask.SUCCESS, this.colors[Mask.SUCCESS]);
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
	public title<T>(msg: T, ...__: any[]): T {
		for (const m of Array.from(arguments)) {
			this.print(m, Mask.INFO, this.colors.TITLE);
		}
		return msg;
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
			this.print(msg, Mask.VERBOSE, this.colors[Mask.VERBOSE]);
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
			this.print(msg, Mask.WARN, this.colors[Mask.WARN]);
		}
		return firstArg;
	}
}
