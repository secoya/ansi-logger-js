import AnsiLogger, { LEVELS } from '../logger';

const getSimpleLogger = (logLevel?: number, err?: any, out?: any) => {
	return new AnsiLogger({
		'log-level': logLevel == null ? LEVELS.INFO : logLevel,
		'no-colors': true,
		outputters: { err: err || jest.fn(), out: out || jest.fn() },
		'startup-info': false,
	});
};

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

	test.only('silent log level does not output anything', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(LEVELS.SILENT, err, out);
		outputToAllLevels(logger);

		expect(err).not.toHaveBeenCalled();
		expect(out).not.toHaveBeenCalled();
	});

	test('error log level does only in `err` outputter, and nothing any other levels', () => {
		const err = jest.fn();
		const out = jest.fn();
		const logger = getSimpleLogger(LEVELS.ERROR, err, out);
		outputToAllLevels(logger);

		expect(err).toHaveBeenCalledTimes(1);
		expect(out).not.toHaveBeenCalled();
	});
});
