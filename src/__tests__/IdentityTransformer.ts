import { resolveLogLevel, AnsiLogger, LogEntry, Mask } from 'ansi-logger/AnsiLogger';
import { IdentityTransformer } from 'ansi-logger/IdentityTransformer';

describe('IdentityTransformer', () => {
	describe('printer', () => {
		test('provided printer is used', () => {
			const err = jest.fn();
			const out = jest.fn();

			const transformer = new IdentityTransformer({
				err: err,
				out: out,
			});

			const logger = new AnsiLogger({
				transformer: transformer,
			});

			logger.error('error');
			logger.info('info');

			expect(err).toHaveBeenCalledTimes(1);
			expect(out).toHaveBeenCalledTimes(1);
			expect(err).toHaveBeenCalledWith(
				expect.objectContaining({
					group: undefined,
					levelNumeric: Mask.ERROR,
					levelText: resolveLogLevel(Mask.ERROR),
					message: 'error',
					timestamp: expect.any(String),
				}),
			);
			expect(out).toHaveBeenCalledWith(
				expect.objectContaining({
					group: undefined,
					levelNumeric: Mask.INFO,
					levelText: resolveLogLevel(Mask.INFO),
					message: 'info',
					timestamp: expect.any(String),
				}),
			);
		});
	});

	describe('format', () => {
		test('returns input as is', () => {
			const err = jest.fn();
			const out = jest.fn();

			const transformer = new IdentityTransformer({
				err: err,
				out: out,
			});

			const message = null;
			const logEntry: LogEntry = {
				group: 'json',
				levelNumeric: Mask.INFO,
				levelText: resolveLogLevel(Mask.INFO),
				message: message,
				timestamp: 'NOW',
			};

			expect(transformer.format(logEntry)).toBe(logEntry);
		});

		test('format complex types', () => {
			const err = jest.fn();
			const out = jest.fn();

			const transformer = new IdentityTransformer({
				err: err,
				out: out,
			});

			const complexMessage = {
				some: 'complex',
				structure: [1, true],
			};

			const logEntry: LogEntry = {
				group: 'json',
				levelNumeric: Mask.INFO,
				levelText: resolveLogLevel(Mask.INFO),
				message: complexMessage,
				timestamp: 'NOW',
			};

			expect(transformer.format(logEntry)).toMatchSnapshot();
		});
	});

	describe('formatTypes', () => {
		test('input is returned as is', () => {
			const complexMessage = {
				some: 'complex',
				structure: [1, true],
			};

			const err = jest.fn();
			const out = jest.fn();

			const transformer = new IdentityTransformer({
				err: err,
				out: out,
			});

			expect(transformer.formatTypes(complexMessage)).toBe(complexMessage);
		});
	});
});
