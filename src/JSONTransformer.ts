import { LogEntry, Transformer } from './AnsiLogger';

/**
 * Transform log entries JSON encoded string output.
 */
export class JSONTransformer<E extends string = string> implements Transformer<E> {
	/**
	 * Format log entries to json strings.
	 */
	public format(entry: LogEntry): E {
		return JSON.stringify(entry) + '\n' as E;
	}

	/**
	 * Don't "format" complex types, just pass them along,
	 * and let the formatting happen in the `format` method.
	 */
	public formatTypes<T>(msg: T): T {
		return msg;
	}
}
