import { LogEntry } from './AnsiLogger';

/**
 * Transform log entry to text output.
 */
export function JSONTransformer(entry: LogEntry) {
	return JSON.stringify(entry);
}
