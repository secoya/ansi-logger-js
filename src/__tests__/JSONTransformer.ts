import { resolveLogLevel, AnsiLogger, LogEntry, Mask } from '../AnsiLogger';
import { JSONTransformer } from '../JSONTransformer';

describe('JSONTransformer', () => {
	describe('printer default', () => {
		const orgStdoutWrite = process.stdout.write;
		const orgStderrWrite = process.stderr.write;

		afterEach(() => {
			process.stderr.write = orgStderrWrite;
			process.stdout.write = orgStdoutWrite;
		});

		test('if no printer is passed to constructor stdout and stderr is used', () => {
			const transformer = new JSONTransformer();
			const logger = new AnsiLogger({
				transformer: transformer,
			});

			const stderrWrite = jest.fn();
			const stdoutWrite = jest.fn();

			process.stderr.write = stderrWrite;
			process.stdout.write = stdoutWrite;

			logger.error('error');
			logger.info('info');

			expect(stderrWrite).toHaveBeenCalledTimes(1);
			expect(stdoutWrite).toHaveBeenCalledTimes(1);
		});
	});

	describe('custom printer', () => {
		test('provided printer is used', () => {
			const err = jest.fn();
			const out = jest.fn();

			const transformer = new JSONTransformer({
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
		});
	});

	describe('format', () => {
		test('returns string', () => {
			const transformer = new JSONTransformer();
			const message = null;
			const logEntry: LogEntry = {
				group: 'json',
				levelNumeric: Mask.INFO,
				levelText: resolveLogLevel(Mask.INFO),
				message: message,
				timestamp: 'NOW',
			};
			expect(transformer.format(logEntry)).toEqual(expect.any(String));
		});

		test('format complex types', () => {
			const transformer = new JSONTransformer();
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
			const transformer = new JSONTransformer();
			expect(transformer.formatTypes(complexMessage)).toBe(complexMessage);
		});
	});
});
