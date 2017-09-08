import { AnsiLogger, LogEntry } from './AnsiLogger';
/**
 * Transform log entry to text output.
 */
export declare function TextTransformer(this: AnsiLogger, entry: LogEntry): string;
