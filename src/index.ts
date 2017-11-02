export { AnsiLogger as default } from './AnsiLogger';
export * from './AnsiLogger';
export * from './JSONTransformer';
export * from './TextTransformer';
export * from './IdentityTransformer';

import { Format } from 'cli-color';
import { defaultLogLevel, AnsiLogger, Level, LoggerOptions, Transformer } from './AnsiLogger';
import { JSONTransformer } from './JSONTransformer';
import { TextTransformer } from './TextTransformer';

/**
 * Create a simple text logger, generally used to output human readable
 * format to the console.
 */
export function createTextLogger(options?: {
	group?: string;
	groupColor?: Format;
	logLevel?: number;
}): AnsiLogger<TextTransformer> {
	const opts = options == null ? {} : options;
	return new AnsiLogger({
		group: opts.group,
		logLevel: opts.logLevel,
		transformer: new TextTransformer(
			opts.groupColor == null
				? undefined
				: {
						colorMap: {
							GROUP: opts.groupColor,
						},
					},
		),
	});
}
/**
 * Create simple JSON logger, generally used for when outputting
 * to log services like e.g. Log Stash.
 */
export function createJSONLogger(options?: { group?: string; logLevel?: number }): AnsiLogger<JSONTransformer> {
	const opts = options == null ? {} : options;
	return new AnsiLogger({
		group: opts.group,
		logLevel: opts.logLevel,
		transformer: new JSONTransformer(),
	});
}

function resolveLogLevel(levelOrMask?: number | keyof typeof Level): Level {
	switch (levelOrMask) {
		case 'SILENT':
			return Level.SILENT;
		case 'ERROR':
			return Level.ERROR;
		case 'WARN':
			return Level.WARN;
		case 'SUCCESS':
			return Level.SUCCESS;
		case 'LOG':
			return Level.LOG;
		case 'INFO':
			return Level.INFO;
		case 'DEBUG':
			return Level.DEBUG;
		case 'VERBOSE':
			return Level.VERBOSE;
		case undefined:
			return defaultLogLevel;
		default:
			return parseInt(levelOrMask as any, 10);
	}
}

/**
 * Create logger based on the options passed,
 * but let environment variables overwrite the options
 * if they are defeined.
 *
 * Default is TEXT logger with log level INFO.
 *
 * The environment variables are:
 * - LOGLEVEL   possible values are: SILENT | ERROR | WARN | SUCCESS | LOG | INFO | DEBUG | VERBOSE | number
 * - LOGFORMAT  possible values are: TEXT | JSON
 */
export function createLoggerFromEnvironment(options?: {
	group?: string;
	groupColor?: Format;
	logFormat?: 'TEXT' | 'JSON';
	logLevel?: number | Level;
}): AnsiLogger<Transformer<string>> {
	const opts = options == null ? {} : options;

	const loggerOptions: Partial<LoggerOptions<any>> = {};

	const envLogLevel = process.env.LOGLEVEL;
	const envLogFormat =
		['TEXT', 'JSON'].indexOf(process.env.LOGFORMAT as string) !== -1 ? process.env.LOGFORMAT : null;

	const logLevel = envLogLevel == null ? opts.logLevel : resolveLogLevel(envLogLevel as number | keyof typeof Level);
	const logFormat = envLogFormat == null ? opts.logFormat : envLogFormat;

	if (logLevel != null) {
		loggerOptions.logLevel = logLevel;
	}

	return logFormat === 'TEXT'
		? createTextLogger({
				group: opts.group,
				groupColor: opts.groupColor,
				logLevel: loggerOptions.logLevel,
			})
		: createJSONLogger({
				group: opts.group,
				logLevel: loggerOptions.logLevel,
			});
}
