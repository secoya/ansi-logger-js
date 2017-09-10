import { LogEntry, Transformer } from './AnsiLogger';

/**
 * The identity transformer makes no transformation to the log entry
 * and just returns the [LogEntry] as is.
 */
export class IdentityTransformer implements Transformer {
	public format(entry: LogEntry): LogEntry {
		return entry;
	}
}
