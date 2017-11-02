export { AnsiLogger as default } from './AnsiLogger';
export * from './AnsiLogger';
export * from './JSONTransformer';
export * from './TextTransformer';
export * from './IdentityTransformer';

import { Format } from 'cli-color';
import { AnsiLogger } from './AnsiLogger';
import { JSONTransformer } from './JSONTransformer';
import { TextTransformer } from './TextTransformer';

/**
 * Create a simple text logger, generally used to output human readable
 * format to the console.
 */
export function createTextLogger(options?: {
	group?: string;
	groupColor?: Format;
	logLevel?: number;
}): AnsiLogger<TextTransformer> {
	const opts = options == null ? {} : options;
	return new AnsiLogger({
		group: opts.group,
		logLevel: opts.logLevel,
		transformer: new TextTransformer(
			opts.groupColor == null
				? undefined
				: {
						colorMap: {
							GROUP: opts.groupColor,
						},
					},
		),
	});
}
/**
 * Create simple JSON logger, generally used for when outputting
 * to log services like e.g. Log Stash.
 */
export function createJSONLogger(options?: { group?: string; logLevel?: number }): AnsiLogger<JSONTransformer> {
	const opts = options == null ? {} : options;
	return new AnsiLogger({
		group: opts.group,
		logLevel: opts.logLevel,
		transformer: new JSONTransformer(),
	});
}
