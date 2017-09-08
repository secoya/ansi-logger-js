import { AnsiLogger, LogEntry } from './AnsiLogger';
/**
 * The identity transformer makes no transformation to the log entry
 * and just returns the [LogEntry] as is.
 */
export declare function IdentityTransformer(this: AnsiLogger, entry: LogEntry): LogEntry;
