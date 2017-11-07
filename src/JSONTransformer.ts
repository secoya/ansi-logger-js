import { LogEntry, Transformer } from './AnsiLogger';

/**
 * Transform log entries JSON encoded string output.
 */
export class JSONTransformer implements Transformer<string> {
	public readonly printer: {
		readonly err: (msg: string) => void;
		readonly out: (msg: string) => void;
	};

	public constructor(printer?: { err: (msg: string) => void; out: (msg: string) => void }) {
		this.printer = Object.freeze(
			printer || {
				err: (msg: string) => {
					process.stderr.write(msg);
				},
				out: (msg: string) => {
					process.stdout.write(msg);
				},
			},
		);
	}

	/**
	 * Format log entries to json strings.
	 */
	public format(entry: LogEntry): string {
		return JSON.stringify(entry) + '\n';
	}

	/**
	 * Don't "format" complex types, just pass them along,
	 * and let the formatting happen in the `format` method.
	 */
	public formatTypes<T>(msg: T): T {
		return msg;
	}
}
