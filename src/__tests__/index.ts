import { defaultLogLevel, AnsiLogger, Level } from '../AnsiLogger';
import { createJSONLogger, createTextLogger } from '../index';
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
