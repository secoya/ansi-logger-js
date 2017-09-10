import { LogEntry } from './AnsiLogger';

/**
 * Transform log entry to text output.
 */
export class JSONTransformer {
	public format(entry: LogEntry) {
		return JSON.stringify(entry);
	}
}
