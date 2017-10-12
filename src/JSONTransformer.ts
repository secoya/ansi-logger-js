import { LogEntry, Transformer } from './AnsiLogger';

/**
 * Transform log entry to text output.
 */
export class JSONTransformer implements Transformer {
	public format(entry: LogEntry) {
		return JSON.stringify(entry) + '\n';
	}
}
