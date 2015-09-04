AnsiLogger = require './lib/src/logger'
clc = require 'cli-color'

logger = new AnsiLogger {
	'group': 'test'
	'group-color': clc.yellow
	'log-level': AnsiLogger::VERBOSE_LEVEL
	'timeformat': 'YYYY-MM-DD\THH:mm:ssZ'
}

logger.verbose logger.formatTypes {test: "test", id:1}

jsonLogger = new AnsiLogger {
	'group': 'json'
	'log-level': AnsiLogger::VERBOSE_LEVEL
	'timeformat': 'YYYY-MM-DD\THH:mm:ssZ'
	'no-colors': true
	'transformer': AnsiLogger.jsonTransformer
	'startup-info': false
}

jsonLogger.success 'JSON logging is now supported yay!'
jsonLogger.error 'Error in json'
