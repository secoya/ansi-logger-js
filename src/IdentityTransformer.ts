import { LogEntry, Transformer } from './AnsiLogger';

/**
 * The identity transformer makes no transformation to the log entry
 * and just returns the `LogEntry` as is.
 */
export class IdentityTransformer<E extends LogEntry = LogEntry> implements Transformer<E> {
	/**
	 * Format log entry according to identity rules.
	 */
	public format(entry: LogEntry): E {
		return entry as E;
	}

	/**
	 * Return the complex type identity.
	 */
	public formatTypes<T>(msg: T): T {
		return msg;
	}
}
