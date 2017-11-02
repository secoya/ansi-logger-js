import * as clc from 'cli-color';
import { defaultLogLevel, AnsiLogger, Level } from '../AnsiLogger';
import { createJSONLogger, createLoggerFromEnvironment, createTextLogger } from '../index';
import { JSONTransformer } from '../JSONTransformer';
import { TextTransformer } from '../TextTransformer';

describe('createTextLogger', () => {
	test('creates a logger with text transformer', () => {
		const logger = createTextLogger();
		expect(logger).toBeInstanceOf(AnsiLogger);
		expect(logger.options.group).toBeUndefined();
		expect(logger.options.logLevel).toBe(defaultLogLevel);
		expect(logger.options.transformer).toBeInstanceOf(TextTransformer);
	});

	test('group option is passed along to the logger', () => {
		const logger = createTextLogger({ group: 'text' });
		expect(logger.options.group).toBe('text');
	});

	test('log level option is passed along to the logger', () => {
		const logger = createTextLogger({ logLevel: Level.VERBOSE });
		expect(logger.options.logLevel).toBe(Level.VERBOSE);
	});
});

describe('createJSONLogger', () => {
	test('creates a logger with JSON transformer', () => {
		const logger = createJSONLogger();
		expect(logger).toBeInstanceOf(AnsiLogger);
		expect(logger.options.group).toBeUndefined();
		expect(logger.options.logLevel).toBe(defaultLogLevel);
		expect(logger.options.transformer).toBeInstanceOf(JSONTransformer);
	});

	test('group options is passed along to the logger', () => {
		const logger = createJSONLogger({ group: 'json' });
		expect(logger.options.group).toBe('json');
	});

	test('log level options is passed along to the logger', () => {
		const logger = createJSONLogger({ logLevel: Level.DEBUG });
		expect(logger.options.logLevel).toBe(Level.DEBUG);
	});
});

describe('createLoggerFromEnvironment', () => {
	const oldEnv = process.env;
	afterEach(() => {
		process.env = oldEnv;
	});

	test('log level from options is used if env is empty', () => {
		process.env = {};
		let logger;
		logger = createLoggerFromEnvironment({ logLevel: Level.SILENT });
		expect(logger.options.logLevel).toBe(Level.SILENT);
		logger = createLoggerFromEnvironment({ logLevel: Level.ERROR });
		expect(logger.options.logLevel).toBe(Level.ERROR);
		logger = createLoggerFromEnvironment({ logLevel: Level.WARN });
		expect(logger.options.logLevel).toBe(Level.WARN);
		logger = createLoggerFromEnvironment({ logLevel: Level.SUCCESS });
		expect(logger.options.logLevel).toBe(Level.SUCCESS);
		logger = createLoggerFromEnvironment({ logLevel: Level.LOG });
		expect(logger.options.logLevel).toBe(Level.LOG);
		logger = createLoggerFromEnvironment({ logLevel: Level.INFO });
		expect(logger.options.logLevel).toBe(Level.INFO);
		logger = createLoggerFromEnvironment({ logLevel: Level.DEBUG });
		expect(logger.options.logLevel).toBe(Level.DEBUG);
		logger = createLoggerFromEnvironment({ logLevel: Level.VERBOSE });
		expect(logger.options.logLevel).toBe(Level.VERBOSE);
		// tslint:disable:no-bitwise
		logger = createLoggerFromEnvironment({ logLevel: Level.ERROR | Level.INFO });
		expect(logger.options.logLevel).toBe(Level.ERROR | Level.INFO);
		// tslint:enable:no-bitwise
	});

	test('log level from environment overrides log level from options', () => {
		let logger;

		process.env = { LOGLEVEL: 'ERROR' } as any;
		logger = createLoggerFromEnvironment({ logLevel: Level.SILENT });
		expect(logger.options.logLevel).toBe(Level.ERROR);

		process.env = { LOGLEVEL: 'SILENT' } as any;
		logger = createLoggerFromEnvironment({ logLevel: Level.VERBOSE });
		expect(logger.options.logLevel).toBe(Level.SILENT);
	});

	test('log level from environment works with numbers and level enum values', () => {
		let logger;

		process.env = { LOGLEVEL: 127 } as any;
		logger = createLoggerFromEnvironment();
		expect(logger.options.logLevel).toBe(Level.VERBOSE);
	});

	test('log format from options', () => {
		let logger;
		logger = createLoggerFromEnvironment({ logFormat: 'TEXT' });
		expect(logger.options.transformer).toBeInstanceOf(TextTransformer);
		logger = createLoggerFromEnvironment({ logFormat: 'JSON' });
		expect(logger.options.transformer).toBeInstanceOf(JSONTransformer);
	});

	test('log format from environment overrides options', () => {
		let logger;

		process.env = { LOGFORMAT: 'TEXT' } as any;
		logger = createLoggerFromEnvironment({ logFormat: 'JSON' });
		expect(logger.options.transformer).toBeInstanceOf(TextTransformer);
		process.env = { LOGFORMAT: 'JSON' } as any;
		logger = createLoggerFromEnvironment({ logFormat: 'TEXT' });
		expect(logger.options.transformer).toBeInstanceOf(JSONTransformer);
	});

	test('when creating a text logger from the group color is passed', () => {
		let logger;
		logger = createLoggerFromEnvironment({ groupColor: clc.red, logFormat: 'TEXT' });
		expect((logger.options.transformer as TextTransformer).colors.GROUP).toBe(clc.red);

		logger = createLoggerFromEnvironment({ groupColor: clc.green, logFormat: 'TEXT' });
		expect((logger.options.transformer as TextTransformer).colors.GROUP).toBe(clc.green);
	});

	test('when creating a logger from environment the group is passed along', () => {
		let logger;
		logger = createLoggerFromEnvironment();
		expect(logger.options.group).toBeUndefined();

		logger = createLoggerFromEnvironment({ group: 'test', logFormat: 'TEXT' });
		expect(logger.options.group).toBe('test');

		logger = createLoggerFromEnvironment({ group: 'test', logFormat: 'JSON' });
		expect(logger.options.group).toBe('test');
	});
});
