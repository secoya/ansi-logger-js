import { LogEntry, Transformer } from 'ansi-logger/AnsiLogger';

/**
 * The identity transformer makes no transformation to the log entry
 * and just returns the `LogEntry` as is.
 */
export class IdentityTransformer implements Transformer<LogEntry> {
	public readonly printer: {
		readonly err: (msg: LogEntry) => void;
		readonly out: (msg: LogEntry) => void;
	};

	public constructor(printer: { err: (msg: LogEntry) => void; out: (msg: LogEntry) => void }) {
		this.printer = Object.freeze(printer);
	}

	/**
	 * Format log entry according to identity rules.
	 */
	public format(entry: LogEntry): LogEntry {
		return entry;
	}

	/**
	 * Return the complex type identity.
	 */
	public formatTypes<T>(msg: T): T {
		return msg;
	}
}
