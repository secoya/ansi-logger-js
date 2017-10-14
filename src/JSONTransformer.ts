import { LogEntry, Transformer } from './AnsiLogger';

/**
 * Transform log entry to text output.
 */
export class JSONTransformer<E extends string = string> implements Transformer<E> {
	/**
	 *
	 */
	public format(entry: LogEntry): E {
		return JSON.stringify(entry) + '\n' as E;
	}
	public formatTypes(msg: any): E {
		return msg as E;
	}
}
