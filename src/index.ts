export { AnsiLogger as default } from './AnsiLogger';
export * from './AnsiLogger';
export * from './JSONTransformer';
export * from './TextTransformer';
export * from './IdentityTransformer';

import { AnsiLogger } from './AnsiLogger';
import { JSONTransformer } from './JSONTransformer';
import { TextTransformer } from './TextTransformer';

/**
 * Create a simple text logger, generally used to output human readable
 * format to the console.
 */
export function createTextLogger(group?: string): AnsiLogger<string> {
	return new AnsiLogger({
		group: group,
		transformer: new TextTransformer(),
	});
}
/**
 * Create simple JSON logger, generally used for when outputting
 * to log services like e.g. Log Stash.
 */
export function createJSONLogger(group?: string): AnsiLogger<string> {
	return new AnsiLogger({
		group: group,
		transformer: new JSONTransformer(),
	});
}
