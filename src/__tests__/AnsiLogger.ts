import { resolveLogLevel } from '../AnsiLogger';
import AnsiLogger, { JSONTransformer, Level, Mask } from '../index';
import { TextTransformer } from '../TextTransformer';
// tslint:disable:max-line-length

const mockTimeformat = '0000-00-00 00:00:00';

const getSimpleLogger = (logLevel?: number, err?: any, out?: any) => {
	return new AnsiLogger({
		logLevel: logLevel == null ? Level.INFO : logLevel,
		timeformat: mockTimeformat,
		transformer: new TextTransformer({
			colors: false,
			printer: {
				err: err || jest.fn(),
				out: out || jest.fn(),
			},
		}),
	});
};

class MockError extends Error {
	public stack: string = '';
	public constructor(msg?: string) {
		super(msg);
		Object.setPrototypeOf(this, MockError.prototype);
	}
}

const outputToAllLevels = (logger: AnsiLogger<any>) => {
	logger.error('error');
	logger.warn('warn');
	logger.success('success');
	logger.log('log');
	logger.info('info');
	logger.debug('debug');
	logger.verbose('verbose');
};

describe('Logger', () => {
	test('first argument is returned', () => {
		const logger = getSimpleLogger();
		expect(logger.error('error')).toBe('error');
		expect(logger.warn('warn')).toBe('warn');
		expect(logger.success('success')).toBe('success');
		expect(logger.log('log')).toBe('log');
		expect(logger.info('info')).toBe('info');
		expect(logger.debug('debug')).toBe('debug');
		expect(logger.verbose('verbose')).toBe('verbose');
	});

	test('silent log level does not output anything', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.SILENT, err, out);
		outputToAllLevels(logger);

		expect(err).not.toHaveBeenCalled();
		expect(out).not.toHaveBeenCalled();
	});

	test('error log level only outputs to `err`, and nothing is outputted in the other levels', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.ERROR, err, out);
		outputToAllLevels(logger);

		expect(err).toHaveBeenCalledTimes(1);
		expect(out).not.toHaveBeenCalled();
	});

	test('warn log level outputs error to `err` and warn to out and the other levels are silent', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.WARN, err, out);
		outputToAllLevels(logger);

		expect(err).toHaveBeenCalledTimes(1);
		expect(out).toHaveBeenCalledTimes(1);
	});

	test('success log level outputs error to `err` and warn, success to out and the other levels are silent', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.SUCCESS, err, out);
		outputToAllLevels(logger);

		expect(err).toHaveBeenCalledTimes(1);
		expect(out).toHaveBeenCalledTimes(2);
	});

	test('default log level outputs error to `err` and warn, success, log to out and the other levels are silent', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.LOG, err, out);
		outputToAllLevels(logger);

		expect(err).toHaveBeenCalledTimes(1);
		expect(out).toHaveBeenCalledTimes(3);
	});

	test('info level outputs error to `err` and warn, success, log, info and title to out and the other levels are silent', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.INFO, err, out);
		outputToAllLevels(logger);

		expect(err).toHaveBeenCalledTimes(1);
		expect(out).toHaveBeenCalledTimes(4);
	});

	test('debug level outputs error to `err` and warn, success, log, info, title and debug to out and the other levels are silent', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.DEBUG, err, out);
		outputToAllLevels(logger);

		expect(err).toHaveBeenCalledTimes(1);
		expect(out).toHaveBeenCalledTimes(5);
	});

	test('verbose level outputs error to `err` and warn, success, log, info, title, debug and verbose to out and the other levels are silent', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.VERBOSE, err, out);
		outputToAllLevels(logger);

		expect(err).toHaveBeenCalledTimes(1);
		expect(out).toHaveBeenCalledTimes(6);
	});

	test('output format for simple types', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.VERBOSE, err, out);

		outputToAllLevels(logger);

		expect(err.mock.calls[0][0].toString()).toEqual('[0000-00-00 00:00:00] [ERROR]   error\n');
		expect(out.mock.calls[0]).toEqual(['[0000-00-00 00:00:00] [WARN]    warn\n']);
		expect(out.mock.calls[1]).toEqual(['[0000-00-00 00:00:00] [SUCCESS] success\n']);
		expect(out.mock.calls[2]).toEqual(['[0000-00-00 00:00:00] [LOG]     log\n']);
		expect(out.mock.calls[3]).toEqual(['[0000-00-00 00:00:00] [INFO]    info\n']);
		expect(out.mock.calls[4]).toEqual(['[0000-00-00 00:00:00] [DEBUG]   debug\n']);
		expect(out.mock.calls[5]).toEqual(['[0000-00-00 00:00:00] [VERBOSE] verbose\n']);
	});

	test('multiline output get meta prefix prepended on each line', () => {
		const out = jest.fn();
		const logger = getSimpleLogger(Level.INFO, undefined, out);

		logger.info(`
            multiline
            text is outputted
            correctly`);

		expect(out.mock.calls[0]).toMatchSnapshot();
	});

	test('formatting error types outputs message and stack', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.VERBOSE, err, out);

		const error = new MockError('This is the error message');
		error.stack = `MockError: This is the error message
    at Object.test (ansi-logger-js/src/__tests__/logger.ts:0:0)
    at .... Mocked jest call stack`;
		logger.formatError(error);

		expect(err.mock.calls[0]).toMatchSnapshot();
	});

	test('when logger has a group it is outputted in meta prefix', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = new AnsiLogger({
			group: 'GROUP',
			logLevel: Level.DEBUG,
			timeformat: '0000-00-00 00:00:00',
			transformer: new TextTransformer({ colors: false, printer: { err, out } }),
		});

		logger.info('info text');

		expect(out.mock.calls[0]).toMatchSnapshot();
	});

	test('combining log masks creating custom log-level', () => {
		const err = jest.fn();
		const out = jest.fn();
		// tslint:disable-next-line:no-bitwise
		const logger = getSimpleLogger(Mask.INFO | Mask.ERROR | Mask.VERBOSE, err, out);
		outputToAllLevels(logger);

		expect(err).toHaveBeenCalledTimes(1);
		expect(out).toHaveBeenCalledTimes(2);

		expect(err.mock.calls[0]).toEqual(['[0000-00-00 00:00:00] [ERROR]   error\n']);
		expect(out.mock.calls[0]).toEqual(['[0000-00-00 00:00:00] [INFO]    info\n']);
		expect(out.mock.calls[1]).toEqual(['[0000-00-00 00:00:00] [VERBOSE] verbose\n']);
	});

	test('simple json output', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = new AnsiLogger({
			group: 'json',
			logLevel: Level.VERBOSE,
			timeformat: mockTimeformat,
			transformer: new JSONTransformer({
				err: err,
				out: out,
			}),
		});

		outputToAllLevels(logger);

		expect(err.mock.calls[0]).toEqual([
			'{"group":"json","levelNumeric":1,"levelText":"ERROR","message":"error","timestamp":"0000-00-00 00:00:00"}\n',
		]);
		expect(out.mock.calls[0]).toEqual([
			'{"group":"json","levelNumeric":2,"levelText":"WARN","message":"warn","timestamp":"0000-00-00 00:00:00"}\n',
		]);
		expect(out.mock.calls[1]).toEqual([
			'{"group":"json","levelNumeric":4,"levelText":"SUCCESS","message":"success","timestamp":"0000-00-00 00:00:00"}\n',
		]);
		expect(out.mock.calls[2]).toEqual([
			'{"group":"json","levelNumeric":8,"levelText":"LOG","message":"log","timestamp":"0000-00-00 00:00:00"}\n',
		]);
		expect(out.mock.calls[3]).toEqual([
			'{"group":"json","levelNumeric":16,"levelText":"INFO","message":"info","timestamp":"0000-00-00 00:00:00"}\n',
		]);
		expect(out.mock.calls[4]).toEqual([
			'{"group":"json","levelNumeric":32,"levelText":"DEBUG","message":"debug","timestamp":"0000-00-00 00:00:00"}\n',
		]);
		expect(out.mock.calls[5]).toEqual([
			'{"group":"json","levelNumeric":64,"levelText":"VERBOSE","message":"verbose","timestamp":"0000-00-00 00:00:00"}\n',
		]);
	});

	test('multiple arguments to all', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.VERBOSE, err, out);

		logger.error('error', 'error1');
		logger.warn('warn', 'warn1');
		logger.success('success', 'success1');
		logger.log('log', 'log1');
		logger.info('info', 'info1');
		logger.debug('debug', 'debug1');
		logger.verbose('verbose', 'verbose1');

		expect(err.mock.calls[0]).toEqual(['[0000-00-00 00:00:00] [ERROR]   error\n']);
		expect(err.mock.calls[1]).toEqual(['[0000-00-00 00:00:00] [ERROR]   error1\n']);
		expect(out.mock.calls[0]).toEqual(['[0000-00-00 00:00:00] [WARN]    warn\n']);
		expect(out.mock.calls[1]).toEqual(['[0000-00-00 00:00:00] [WARN]    warn1\n']);
		expect(out.mock.calls[2]).toEqual(['[0000-00-00 00:00:00] [SUCCESS] success\n']);
		expect(out.mock.calls[3]).toEqual(['[0000-00-00 00:00:00] [SUCCESS] success1\n']);
		expect(out.mock.calls[4]).toEqual(['[0000-00-00 00:00:00] [LOG]     log\n']);
		expect(out.mock.calls[5]).toEqual(['[0000-00-00 00:00:00] [LOG]     log1\n']);
		expect(out.mock.calls[6]).toEqual(['[0000-00-00 00:00:00] [INFO]    info\n']);
		expect(out.mock.calls[7]).toEqual(['[0000-00-00 00:00:00] [INFO]    info1\n']);
		expect(out.mock.calls[8]).toEqual(['[0000-00-00 00:00:00] [DEBUG]   debug\n']);
		expect(out.mock.calls[9]).toEqual(['[0000-00-00 00:00:00] [DEBUG]   debug1\n']);
		expect(out.mock.calls[10]).toEqual(['[0000-00-00 00:00:00] [VERBOSE] verbose\n']);
		expect(out.mock.calls[11]).toEqual(['[0000-00-00 00:00:00] [VERBOSE] verbose1\n']);
	});

	test('json complex types output', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = new AnsiLogger({
			group: 'json',
			logLevel: Level.VERBOSE,
			timeformat: mockTimeformat,
			transformer: new JSONTransformer({
				err: err,
				out: out,
			}),
		});

		logger.debug({ host: 'localhost', name: 'test', pass: 'test', user: 'test' });

		expect(out.mock.calls[0]).toMatchSnapshot();
	});

	test('text complex types output', () => {
		const err = jest.fn();
		const out = jest.fn();

		const logger = new AnsiLogger({
			group: 'text',
			logLevel: Level.VERBOSE,
			timeformat: mockTimeformat,
			transformer: new TextTransformer({
				forceColors: true,
				printer: {
					err: err,
					out: out,
				},
			}),
		});

		logger.debug({ host: 'localhost', name: 'test', pass: 'test', user: 'test' });

		expect(out.mock.calls[0]).toMatchSnapshot();
	});

	describe('complex types for each level', () => {
		test('error', () => {
			const logger = getSimpleLogger(Level.VERBOSE);
			const message = 'error';
			logger.formatTypes = jest.fn().mockReturnValue(message);
			logger.error({ message: message });
			expect(logger.formatTypes).toHaveBeenCalled();
		});
		test('warn', () => {
			const logger = getSimpleLogger(Level.VERBOSE);
			const message = 'warn';
			logger.formatTypes = jest.fn().mockReturnValue(message);
			logger.warn({ message: message });
			expect(logger.formatTypes).toHaveBeenCalled();
		});
		test('success', () => {
			const logger = getSimpleLogger(Level.VERBOSE);
			const message = 'success';
			logger.formatTypes = jest.fn().mockReturnValue(message);
			logger.success({ message: message });
			expect(logger.formatTypes).toHaveBeenCalled();
		});
		test('log', () => {
			const logger = getSimpleLogger(Level.VERBOSE);
			const message = 'log';
			logger.formatTypes = jest.fn().mockReturnValue(message);
			logger.log({ message: message });
			expect(logger.formatTypes).toHaveBeenCalled();
		});
		test('info', () => {
			const logger = getSimpleLogger(Level.VERBOSE);
			const message = 'info';
			logger.formatTypes = jest.fn().mockReturnValue(message);
			logger.info({ message: message });
			expect(logger.formatTypes).toHaveBeenCalled();
		});
		test('debug', () => {
			const logger = getSimpleLogger(Level.VERBOSE);
			const message = 'debug';
			logger.formatTypes = jest.fn().mockReturnValue(message);
			logger.debug({ message: message });
			expect(logger.formatTypes).toHaveBeenCalled();
		});
		test('verbose', () => {
			const logger = getSimpleLogger(Level.VERBOSE);
			const message = 'verbose';
			logger.formatTypes = jest.fn().mockReturnValue(message);
			logger.verbose({ message: message });
			expect(logger.formatTypes).toHaveBeenCalled();
		});
	});

	describe('error', () => {
		test('formatError is called on custom error objects with stack property', () => {
			const logger = getSimpleLogger();
			const message = 'Error';
			logger.formatError = jest.fn().mockReturnValue(message);
			logger.error({
				message: message,
				stack: 'Error: With custom stack',
			});
			expect(logger.formatError).toHaveBeenCalled();
		});
		test('passing null does not throw', () => {
			const logger = getSimpleLogger();
			const message = null;
			expect(() => logger.error(message)).not.toThrow();
		});
	});
});

describe('resolveLogLevel', () => {
	test('resolving non-existing log mask returns UNKNOWN', () => {
		expect(resolveLogLevel(-10)).toMatchSnapshot();
	});
});
