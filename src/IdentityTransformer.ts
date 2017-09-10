import { LogEntry } from './AnsiLogger';

/**
 * The identity transformer makes no transformation to the log entry
 * and just returns the [LogEntry] as is.
 */
export class IdentityTransformer {
	public format(entry: LogEntry): LogEntry {
		return entry;
	}
}
