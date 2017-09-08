import { Format } from 'cli-color';
import { matchMask, AnsiLogger, LogEntry, Mask } from './AnsiLogger';

function handleMultiline(this: AnsiLogger, msg: string, color?: Format | null): string {
	const res = [];
	// colorize each line, so when the string is splitted later,
	// it will not mess up the colors.
	if ((msg != null ? msg.split : undefined) == null) {
		msg = `${msg}`;
	}
	for (const m of Array.from(msg.split('\n'))) {
		res.push(colorize.call(this, m, color));
	}
	return res.join('\n');
}

/**
 * Format a object to string.
 */
function formatTime(this: AnsiLogger, time: string) {
	return `[${colorize.call(this, time, this.colors.TIME)}]`;
}

/**
 * Format group if any.
 */
function formatGroup(this: AnsiLogger, group: string) {
	const groupTrimmed = group.trim();
	const pad = groupTrimmed.length - group.length;
	let padding = '';
	for (const __ of Array(pad)) {
		padding += ' ';
	}
	return `[${colorize.call(this, groupTrimmed, this.options['group-color'])}]${padding}`;
}

/**
 * Colorize the message string.
 * NB! If no-colors mode is on or no color is given.
 * then this method just return the message as it is.
 */
function colorize(this: AnsiLogger, msg: string, color?: Format | null) {
	if (color == null || !process.stdout.isTTY || this.options['no-colors']) {
		return msg;
	}
	return color(msg);
}

/**
 *
 * @param level
 */
function resolveLevelColor(this: AnsiLogger, level: number): Format {
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
 * Resolves custom loglevel string
 */
export function resolveCustomLoglevel(this: AnsiLogger, loglevel: number) {
	const result = [];
	for (const mask of Array.from(Object.values(Mask))) {
		if (matchMask(loglevel, mask)) {
			const levelStr = this.resolveLogLevel(mask);
			result.push(colorize.call(this, levelStr, resolveLevelColor.call(this, mask)));
		}
	}

	return result.join(', ');
}

/**
 * Format the loglevel to the console
 */
function formatLogLevel(this: AnsiLogger, loglevel: number) {
	// no need to ouput the log level, if the default log level is selected.
	// then it's just a waste of space.
	const loglevelStr = this.resolveLogLevel(loglevel);
	const pad = ' '.repeat(loglevelStr.length < 6 ? 7 - loglevelStr.length : 0);

	// resolving the color for the log level.
	const loglevelColor = resolveLevelColor.call(this, loglevel);

	// the formatted log-level
	return `[${colorize.call(this, loglevelStr, loglevelColor)}]${pad}`;
}

/**
 * Transform log entry to text output.
 */
export function TextTransformer(this: AnsiLogger, entry: LogEntry): string {
	// get the formatted current time.
	let str = formatTime.call(this, entry.timestamp);

	// get the formatted group
	if (entry.group != null) {
		str += ` ${formatGroup.call(this, entry.group, this.options['group-color'])}`;
	}

	// get the formatted log-level.
	if (entry.levelText != null) {
		const levelText = formatLogLevel.call(this, entry.levelNumeric);
		if (levelText != null) {
			str += ` ${levelText}`;
		}
	}

	// now insert the time and log-level on each line.
	if (entry.message != null) {
		str += ` ${entry.message.replace(/\n/g, `\n${str} `)}`;
	}

	return handleMultiline.call(this, str, this.colors[entry.levelNumeric]);
}
