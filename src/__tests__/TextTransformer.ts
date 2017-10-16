import { resolveLogLevel, AnsiLogger, LogEntry, Mask } from '../AnsiLogger';
import { ColorMap, TextTransformer } from '../TextTransformer';

describe('TextTransformer', () => {
	describe('printer default', () => {
		const orgStdoutWrite = process.stdout.write;
		const orgStderrWrite = process.stderr.write;

		afterEach(() => {
			process.stderr.write = orgStderrWrite;
			process.stdout.write = orgStdoutWrite;
		});

		test('if no printer is passed to constructor stdout and stderr is used', () => {
			const transformer = new TextTransformer();
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

			const transformer = new TextTransformer({
				printer: {
					err: err,
					out: out,
				},
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

	describe('colors', () => {
		const orgIsTTY = process.stdout.isTTY;
		afterEach(() => {
			process.stdout.isTTY = orgIsTTY;
		});

		test('enable colors option, results in colorizing is used if prints to a TTY', () => {
			const err = jest.fn();
			const out = jest.fn();

			process.stdout.isTTY = undefined;
			const transformer = new TextTransformer({
				colors: true,
				printer: {
					err: err,
					out: out,
				},
			});

			expect(transformer.useColors).toBe(false);
			process.stdout.isTTY = true;
			expect(transformer.useColors).toBe(true);
		});

		test('disable colors option, results in colors are not used, even when prints to a TTY', () => {
			const err = jest.fn();
			const out = jest.fn();

			process.stdout.isTTY = true;
			const transformer = new TextTransformer({
				colors: false,
				printer: {
					err: err,
					out: out,
				},
			});

			expect(transformer.useColors).toBe(false);
		});

		// tslint:disable-next-line:max-line-length
		test('force colors option, results in colors are always used, even when printing to a non tty and colors option is disabled', () => {
			const err = jest.fn();
			const out = jest.fn();

			process.stdout.isTTY = undefined;
			const transformer = new TextTransformer({
				colors: false,
				forceColors: true,
				printer: {
					err: err,
					out: out,
				},
			});

			expect(transformer.useColors).toBe(true);

			expect(transformer.format({
				group: 'text',
				levelNumeric: Mask.INFO,
				levelText: resolveLogLevel(Mask.INFO),
				message: 'info',
				timestamp: 'NOW',
			})).toMatchSnapshot();
		});

		test('setting color via options', () => {
			// tslint:disable:object-literal-sort-keys
			const colorMap: ColorMap = {
				ERROR: jest.fn(),
				WARN: jest.fn(),
				SUCCESS: jest.fn(),
				LOG: jest.fn(),
				INFO: jest.fn(),
				DEBUG: jest.fn(),
				VERBOSE: jest.fn(),
				GROUP: jest.fn(),
				TIME: jest.fn(),
			} as any;

			// tslint:enable:object-literal-sort-keys
			const transformer = new TextTransformer({
				colorMap: colorMap,
			});

			expect(transformer.colors.ERROR).toBe(colorMap.ERROR);
			expect(transformer.colors.WARN).toBe(colorMap.WARN);
			expect(transformer.colors.SUCCESS).toBe(colorMap.SUCCESS);
			expect(transformer.colors.LOG).toBe(colorMap.LOG);
			expect(transformer.colors.INFO).toBe(colorMap.INFO);
			expect(transformer.colors.DEBUG).toBe(colorMap.DEBUG);
			expect(transformer.colors.VERBOSE).toBe(colorMap.VERBOSE);
			expect(transformer.colors.GROUP).toBe(colorMap.GROUP);
			expect(transformer.colors.TIME).toBe(colorMap.TIME);
		});

		test('setting invalid coloring function throws', () => {
			const colorMap = {
				INVALID: () => { return; },
			} as any;
			expect(() => {
				return new TextTransformer({
					colorMap: colorMap,
				});
			}).toThrowErrorMatchingSnapshot();
		});
	});

	describe('format', () => {
		test('returns string', () => {
			const transformer = new TextTransformer();
			const message = null;
			const logEntry: LogEntry = {
				group: 'text',
				levelNumeric: Mask.INFO,
				levelText: resolveLogLevel(Mask.INFO),
				message: message,
				timestamp: 'NOW',
			};
			expect(transformer.format(logEntry)).toEqual(expect.any(String));
		});

		test('formatting errors without stack does not fail', () => {
			const transformer = new TextTransformer();
			const message = new Error('Error: no stack');
			(message as any).stack = null;
			const logEntry: LogEntry = {
				group: 'text',
				levelNumeric: Mask.ERROR,
				levelText: resolveLogLevel(Mask.ERROR),
				message: message,
				timestamp: 'NOW',
			};

			expect(transformer.format(logEntry)).toMatchSnapshot();
		});

		test('complex types', () => {
			const err = jest.fn();
			const out = jest.fn();

			const logger = new AnsiLogger({
				timeformat: '0000-00-00 00:00:00.000+0000',
				transformer: new TextTransformer({
					printer: {
						err: err,
						out: out,
					},
				}),
			});

			const complexMessage = {
				featureEnabled: false,
				fn: () => { return; },
				list: ['1', '2', '3'],
				nested: {
					level: {
						must: {
							be: {
								exceeded: true,
							},
						},
					},
				},
				noValue: {
					provided: null,
					unprovided: undefined,
				},
				numeric: Math.PI,
				string: 'complex',
				transformer: new TextTransformer(),
			};

			logger.info(complexMessage);

			expect(out.mock.calls[0][0]).toMatchSnapshot();
		});

		test('custom level text mask, will simply output get outputtet as is', () => {
			const transformer = new TextTransformer();
			const message = 'message';
			const logEntry: LogEntry = {
				group: 'text',
				levelNumeric: Mask.INFO,
				levelText: 'CUSTOM',
				message: message,
				timestamp: 'NOW',
			} as any;

			expect(transformer.format(logEntry)).toMatchSnapshot();
		});

		test('unknown numeric level mask, without custom level text, will output UNKNOWN', () => {
			const transformer = new TextTransformer();
			const message = 'message';
			const logEntry: LogEntry = {
				group: 'text',
				levelNumeric: Mask.INFO,
				message: message,
				timestamp: 'NOW',
			} as any;

			expect(transformer.format(logEntry)).toMatchSnapshot();
		});

	});

	describe('formatTypes', () => {
		test('returnes a string', () => {
			const complexMessage = {
				some: 'complex',
				structure: [1, true],
			};
			const transformer = new TextTransformer();
			expect(transformer.formatTypes(complexMessage)).toEqual(expect.any(String));
		});

		test('named functions get outputted with name suffix', () => {
			const transformer = new TextTransformer();
			function withName() {
				return;
			}

			const message = {
				fns: [() => { return; }],
				withName: withName,
			};

			expect(transformer.formatTypes(message)).toMatchSnapshot();
		});

		test('formatting errors without stack without breaking', () => {
			const transformer = new TextTransformer();
			const errorWithoutStack = new Error('Without stack');
			(errorWithoutStack as any).stack = null;
			const errorWithStack = new Error('With stack');
			(errorWithStack as any).stack = `Error: With stack
at ... Mock stack trace`;
			const message = {
				errors: [
					errorWithoutStack,
					errorWithStack,
				],
			};

			expect(transformer.formatTypes(message)).toMatchSnapshot();
		});
	});
});
