import AnsiLogger, { Level } from '../logger';
// tslint:disable:max-line-length

const getSimpleLogger = (logLevel?: number, err?: any, out?: any) => {
	return new AnsiLogger({
		'log-level': logLevel == null ? Level.INFO : logLevel,
		'no-colors': true,
		outputters: { err: err || jest.fn(), out: out || jest.fn() },
		'startup-info': false,
		timeformat: '0000-00-00 00:00:00',
	});
};

class MockError extends Error {
	public stack: string;
	public constructor(msg?: string) {
		super(msg);
		Object.setPrototypeOf(this, MockError.prototype);
	}
}

const outputToAllLevels = (logger: AnsiLogger) => {
	logger.error('error');
	logger.warn('warn');
	logger.success('success');
	logger.log('log');
	logger.info('info');
	logger.debug('debug');
	logger.verbose('verbose');
	logger.title('title');
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
		expect(logger.title('title')).toBe('title');
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
		expect(out).toHaveBeenCalledTimes(5);
	});

	test('debug level outputs error to `err` and warn, success, log, info, title and debug to out and the other levels are silent', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.DEBUG, err, out);
		outputToAllLevels(logger);

		expect(err).toHaveBeenCalledTimes(1);
		expect(out).toHaveBeenCalledTimes(6);
	});

	test('verbose level outputs error to `err` and warn, success, log, info, title, debug and verbose to out and the other levels are silent', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.VERBOSE, err, out);
		outputToAllLevels(logger);

		expect(err).toHaveBeenCalledTimes(1);
		expect(out).toHaveBeenCalledTimes(7);
	});

	test('output format for simple types', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(Level.VERBOSE, err, out);

		outputToAllLevels(logger);

		expect(err.mock.calls[0]).toEqual(['[0000-00-00 00:00:00] [ERROR]   error']);
		expect(out.mock.calls[0]).toEqual(['[0000-00-00 00:00:00] [WARN]    warn']);
		expect(out.mock.calls[1]).toEqual(['[0000-00-00 00:00:00] [SUCCESS] success']);
		expect(out.mock.calls[2]).toEqual(['[0000-00-00 00:00:00] [LOG]     log']);
		expect(out.mock.calls[3]).toEqual(['[0000-00-00 00:00:00] [INFO]    info']);
		expect(out.mock.calls[4]).toEqual(['[0000-00-00 00:00:00] [DEBUG]   debug']);
		expect(out.mock.calls[5]).toEqual(['[0000-00-00 00:00:00] [VERBOSE] verbose']);
		expect(out.mock.calls[6]).toEqual(['[0000-00-00 00:00:00] [INFO]    title']);
	});

	test('multiline output get meta prefix prepended on each line', () => {
		const out = jest.fn();
		const logger = getSimpleLogger(Level.INFO, undefined, out);

		logger.info(`
			multiline
			text is outputted
			correctly
		`);

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
			'log-level': Level.DEBUG,
			'no-colors': false,
			outputters: { out, err },
			'startup-info': false,
			timeformat: '0000-00-00 00:00:00',
		});

		logger.info('info text');
		expect(out.mock.calls[0]).toMatchSnapshot();
	});
});