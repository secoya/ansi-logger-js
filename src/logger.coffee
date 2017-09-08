_      = require 'underscore'
moment = require 'moment'
clc    = require 'cli-color'

class LogEntry
	levelText: null
	levelNumeric: null
	timestamp: null
	group: null
	message: null

###
# Transform log [entry] to text output.
# @param LogEntry entry
# @return String
###
textTransformer = (entry) ->
	# get the formatted current time.
	str = @formatTime entry.timestamp
	# get the formatted group
	str += " " + @formatGroup entry.group if entry.group?
	# get the formatted log-level.
	str += " " + levelText if entry.levelText? and (levelText = @formatLogLevel(entry.levelNumeric))?
	# now insert the time and log-level on each line.
	str += " " + entry.message.replace(/\n/g,"\n#{str} ")

	return str

###
# Transform log entry to text output.
# @param LogEntry entry
# @return String
###
jsonTransformer = (entry) -> JSON.stringify entry

###
# The identity transformer makes no transformation to the log entry
# and just returns the [LogEntry] as is.
# @param LogEntry entry
# @return LogEntry
###
identityTransformer = (entry) -> entry

###
# Ansi output logger.
# This controls what should be ouputted to the console,
# everything is categorized into log levels, so when you set a log level
# you output from all the selected levels.
# It is possible to disables colors (some teminals don't support colors).
# you can also specify that you are only interested in output for a specific
# log-level, then everything else is not outputted.
# It is also possible to make the logger silent.
# @author Brian K. Christensen, Secoya A/S <bkc@secoya.dk>
###
class AnsiLogger

	# constants for log masks.
	ERROR_MASK:    0b0000001
	WARN_MASK:     0b0000010
	SUCCESS_MASK:  0b0000100
	LOG_MASK:      0b0001000
	INFO_MASK:     0b0010000
	DEBUG_MASK:    0b0100000
	VERBOSE_MASK:  0b1000000

	# constants for the log levels.
	SILENT_LEVEL:  0b0000000
	ERROR_LEVEL:   AnsiLogger::SILENT_LEVEL  | AnsiLogger::ERROR_MASK
	WARN_LEVEL:    AnsiLogger::ERROR_LEVEL   | AnsiLogger::WARN_MASK
	SUCCESS_LEVEL: AnsiLogger::WARN_LEVEL    | AnsiLogger::SUCCESS_MASK
	LOG_LEVEL:     AnsiLogger::SUCCESS_LEVEL | AnsiLogger::LOG_MASK
	INFO_LEVEL:    AnsiLogger::LOG_LEVEL     | AnsiLogger::INFO_MASK
	DEBUG_LEVEL:   AnsiLogger::INFO_LEVEL    | AnsiLogger::DEBUG_MASK
	VERBOSE_LEVEL: AnsiLogger::DEBUG_LEVEL   | AnsiLogger::VERBOSE_MASK

	# The color for each log-level
	LOG_COLOR:     clc
	INFO_COLOR:    clc.blue
	DEBUG_COLOR:   clc.yellow
	VERBOSE_COLOR: clc.magenta
	WARN_COLOR:    clc.red.bold
	ERROR_COLOR:   clc.bgRed.white
	SUCCESS_COLOR: clc.green
	TITLE_COLOR:   clc.cyan # title isn't a log level, it is used for making all 'title's look the same. Title is outputted in AnsiLogger::LOG_MASK
	TIME_COLOR:    clc.cyan

	###
	# The options object holder.
	# This is filled with the default values when the Logger is constructed,
	# it can be changed by using the setOptions method.
	# @see Logger::setOptions()
	# @var Object
	###
	options: null

	###
	# Constructs a Logger, and sets default option values.
	###
	constructor: (options) ->
		@options =
			'log-level':   AnsiLogger::LOG_LEVEL # the log level
			'no-colors':   no # disbles colors if true

			###
			# Moment.js formats.
			# @link http://momentjs.com
			###
			'timeformat':  "HH:mm:ss.SSS"
			'group':       null # Setting up default group
			'group-color': null
			'startup-info': true
			'transformer': textTransformer
			'outputters':
				out: (msg) -> process.stdout.write msg+"\n"
				err: (msg) -> process.stderr.write msg+"\n"

		@setOptions options if options?

	###
	# Sets the options.
	# @param Object options
	# @return void
	###
	setOptions: (options) ->
		@setColors  options.colors if options.colors?
		currentLoglevel = @options['log-level']

		for opt, val of @options
			@options[opt] = options[opt] if options[opt]?

		if not _.isNumber @options['log-level'] or @options['log-level'] > AnsiLogger::VERBOSE_LEVEL
			@options['log-level'] = currentLoglevel
			@warn "Invalid log level is trying to be set: #{options['log-level']}, aborting..."

		# log level changed
		else if @options['startup-info'] and @options['log-level'] isnt currentLoglevel
			loglevelStr = @resolveLogLevel @options['log-level']
			loglevelColor = @[loglevelStr+"_COLOR"]

			@info "Log levels enabled: #{@colorize loglevelStr, loglevelColor}"

	###
	# Set new colors.
	# @param Oject<String, Function> colorMap<levelStr, colorFn>
	# @return void
	###
	setColors: (colorMap) ->
		for level, color of colorMap
			if (level = level.toUpperCase()) in ["LOG","INFO","DEBUG","VERBOSE","WARN","ERROR","SUCCESS","TITLE","TIME"]
				@["#{level}_COLOR"] = color

	###
	# Print an info formatted message.
	# NB! AnsiLogger::LOG_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	default: () ->
		@print(msg, AnsiLogger::LOG_MASK, @LOG_COLOR) for msg in arguments
		return arguments[0]

	###
	# @alias Logger::default()
	# @see Logger::default()
	###
	log: AnsiLogger::default

	###
	# Print an info formatted message.
	# NB! AnsiLogger::INFO_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	info: () ->
		@print(msg, AnsiLogger::INFO_MASK, @INFO_COLOR) for msg in arguments
		return arguments[0]

	###
	# Print a debug formatted message.
	# NB! AnsiLogger::DEBUG_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return void
	###
	debug: () ->
		@print(msg, AnsiLogger::DEBUG_MASK, @DEBUG_COLOR) for msg in arguments
		return arguments[0]

	###
	# Print a verbose formatted message.
	# NB! AnsiLogger::VERBOSE_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	verbose: () ->
		@print(msg, AnsiLogger::VERBOSE_MASK, @VERBOSE_COLOR) for msg in arguments
		return arguments[0]

	###
	# Print a warning.
	# NB! AnsiLogger::WARN_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	warn: () ->
		@print(msg, AnsiLogger::WARN_MASK, @WARN_COLOR) for msg in arguments
		return arguments[0]

	###
	# Print an error.
	# NB! AnsiLogger::ERROR_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	error: () ->
		@print(msg, AnsiLogger::ERROR_MASK, @ERROR_COLOR) for msg in arguments
		return arguments[0]

	###
	# Print a success formatted message.
	# NB! AnsiLogger::SUCCESS_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	success: () ->
		@print(msg, AnsiLogger::SUCCESS_MASK, @SUCCESS_COLOR) for msg in arguments
		return arguments[0]

	###
	# Print a title formatted message.
	# NB! AnsiLogger::LOG_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	title: () ->
		@print(msg, AnsiLogger::LOG_MASK, @TITLE_COLOR) for msg in arguments
		return arguments[0]

	###
	# Colorize the message string.
	# NB! If no-colors mode is on or no color is given.
	# then this method just return the message as it is.
	# @param String msg
	# @param [ Function color ]
	# @return String The colorized message.
	###
	colorize: (msg, color) ->
		return msg if not color? or not process.stdout.isTTY or @options['no-colors']
		return color msg

	###
	# Print to console.
	# NB! This will print to the console based on the log level you have enabled.
	# @param String msg
	# @param [ Number loglevel = AnsiLogger::LOG_MASK ]
	# @param [ String|Array color ] @see colorize
	#	@return void
	###
	print: (msg, loglevel = AnsiLogger::LOG_MASK, color) ->
		# return if the log-level is higher than the selected the log-level.
		return unless (loglevel & @options['log-level']) is loglevel

		entry = new LogEntry

		handleMultiline = (msg, color) =>
			res = []
			# colorize each line, so when the string is splitted later,
			# it will not mess up the colors.
			msg = ""+msg unless msg?.split?
			res.push @colorize(m, color) for m in msg.split("\n")
			res.join "\n"

		entry.timestamp = moment().format(@options['timeformat'])
		entry.message = handleMultiline msg, color
		entry.group = @options.group
		entry.levelNumeric = loglevel
		entry.levelText = @resolveLogLevel loglevel

		# finally printing the output!.
		if (loglevel & AnsiLogger::ERROR_MASK) is AnsiLogger::ERROR_MASK
			@options.outputters.err.call @, @options.transformer.call @, entry
		else
			@options.outputters.out.call @, @options.transformer.call @, entry

	###
	# Format a object to string.
	# @param String time
	# @return String
	###
	formatTime: (time) ->
		return "["+@colorize(time, @TIME_COLOR)+"]"

	###
	# Format the loglevel to the console
	# @param Number loglevel
	# @return String The formatted loglevel
	###
	formatLogLevel: (loglevel) ->
		# no need to ouput the log level, if the default log level is selected.
		# then it's just a waste of space.
		return null if @options['log-level'] is AnsiLogger::LOG_LEVEL
		loglevelStr = @resolveLogLevel(loglevel)

		fill = ""
		# create the fill, in order to align everything nicely.
		fill += " " for i in (if loglevelStr.length < 6 then [loglevelStr.length..6] else [])

		# resolving the color for the log level.
		loglevelColor = @[loglevelStr+"_COLOR"]
		# the formatted log-level
		fll = "[#{@colorize loglevelStr, loglevelColor}]#{fill}"
		# append the message if there is any.
		#
		return fll

	###
	# Format group if any.
	# @return String The formatted group
	###
	formatGroup: (group) ->
		groupTrimmed = group.trim()
		pad = groupTrimmed.length - group.length
		padding = ""
		padding += " " for i in (if pad > 0 then [0..pad-1] else [])
		return "[#{@colorize groupTrimmed, @options['group-color']}]#{padding}"

	###
	# Resolve a string representation of the log-level.
	# @param Number loglevel
	# @return String
	###
	resolveLogLevel: (loglevel) ->
		switch loglevel
			when AnsiLogger::ERROR_MASK   then "ERROR"
			when AnsiLogger::WARN_MASK    then "WARN"
			when AnsiLogger::SUCCESS_MASK then "SUCCESS"
			when AnsiLogger::INFO_MASK    then "INFO"
			when AnsiLogger::DEBUG_MASK   then "DEBUG"
			when AnsiLogger::VERBOSE_MASK then "VERBOSE"
			when AnsiLogger::LOG_MASK     then "LOG"
			else @resolveCustomLoglevel loglevel

	###
	# Resolves custom loglevel string
	# @param Number loglevel
	# @return String
	###
	resolveCustomLoglevel: (loglevel) ->
		levels = ["ERROR","WARN","SUCCESS","LOG","INFO","DEBUG","VERBOSE"]
		result = []
		for level in levels
			mask = AnsiLogger::[level+"_MASK"]
			if (loglevel & mask) is mask
				levelStr = @resolveLogLevel mask
				result.push @colorize levelStr, @[levelStr+"_COLOR"]

		return result.join ", "

	###
	# Format types to string, some types make resively calls.
	# @param mixed type
	# @param [ Number seperator = 0 ]
	# @param [ Number depth = 3 ] The max depth of recursive calls.
	# @return String formated type.
	###
	formatTypes: (type, seperator = 0, depth = 3) ->
		# making the proper indentation
		fill = ""
		fill += "  " for i in (if seperator > 0 then [0..(seperator-1)] else [])

		# primitive types
		if _.isNumber(type) or _.isBoolean(type) or _.isUndefined(type) or _.isNull(type)
			return "#{fill}#{type}"
		if _.isString(type)
			return "#{fill}'#{type}'"
		# array is formatted as one-liners
		if _.isArray(type) and (seperator < depth)
			str = "#{fill}["
			for key, val of type
				str += " #{@formatTypes(val, (seperator+1), depth).trim()}"
				str += if key < type.length-1 then "," else " "
			return "#{str}]"

		# hashes is formatted with indentation for every level
		# of the object, the values of the properties are also resolved.
		if _.isObject(type) and ((cname = type.constructor.name) is 'Object') and (seperator < depth)
			str = "#{fill}{"
			for key, val of type
				str += "\n#{fill}  #{key}: #{@formatTypes(val, (seperator+1), depth).trim()}"
			str += "\n#{fill}" if str.length > fill.length+1
			return "#{str}}"

		# print the name of a complex type.
		if ((isFunc = _.isFunction(type)) or _.isObject(type))
			return "#{fill}#{type.message}" if cname is "Error"
			return "#{fill}[Function: #{cname}]" if isFunc and cname isnt "Function"
			return "#{fill}#{cname}"

		# print the name of an unhandled type.
		# typically this will return 'object'
		return "#{fill}#{typeof type}"

	###
	# Format a function call, for the debug level
	# NB! if passing arguments the function
	#     every argument, gonna be formatted with the formatTypes() function
	#     @see Logger::formatTypes()
	# @param String functionName
	# @param [ Array args = [] ]
	# @return void
	###
	formatFunctionCall: (functionName, args = []) ->
		formattedArgs = []
		formattedArgs.push @formatTypes(a) for a in args
		@debug functionName+"(#{formattedArgs.join(', ')})"

	###
	# Format an error, this is typically used, for string formatting an Exception/Error.
	# @param mixed err
	# @return void
	###
	formatError: (err) ->
		@print "  "+@formatTypes(err).replace(/\n/g, "\n  "), AnsiLogger::ERROR_MASK, @ERROR_COLOR

module.exports = AnsiLogger
module.exports.identityTransformer = identityTransformer
module.exports.jsonTransformer = jsonTransformer
module.exports.textTransformer = textTransformer