_      = require 'underscore'
moment = require 'moment'
clc    = require 'cli-color'

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
	DEFAULT_COLOR: null # what the default color is in the terminal.
	LOG_COLOR:     AnsiLogger::DEFAULT_COLOR
	INFO_COLOR:    "blue"
	DEBUG_COLOR:   "yellow"
	VERBOSE_COLOR: "magenta"
	WARN_COLOR:    "red"
	ERROR_COLOR:   ["red", "inverse"] # This is ugly!, but it makes the background color red.
	SUCCESS_COLOR: "green"
	TITLE_COLOR:   "cyan" # title isn't a log level, it is used for making all 'title's look the same. Title is outputted in AnsiLogger::LOG_MASK
	TIME_COLOR:    "cyan"

	###
	# Moment.js formats.
	# @link http://momentjs.com
	###
	DATE_FORMAT: "YYYY-MM-DD"
	TIME_FORAMT: "HH:mm:ss.SSS"

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
			'silent':    no # silent disables all output, except for the ERROR log-level
			'log-level': AnsiLogger::LOG_LEVEL # the log level
			'no-colors': no # disbles colors if true
			'date':      no # enables date in the log in stead of just time.
			'group':       null # Setting up default group
			'group-color': null

		@setOptions options if options?

	###
	# Sets the options.
	# @param Object options
	# @return void
	###
	setOptions: (options) ->
		currentLoglevel = @options['log-level']

		for opt, val of @options
			@options[opt] = options[opt] if options[opt]?

		if not _.isNumber @options['log-level'] or @options['log-level'] > AnsiLogger::VERBOSE_LEVEL
			@options['log-level'] = currentLoglevel
			@warn "Invalid log level is trying to be set: #{options['log-level']}, aborting..."

		# log level changed
		else if @options['log-level'] isnt currentLoglevel
			loglevelStr = @resolveLogLevel @options['log-level']
			loglevelColor = AnsiLogger::[loglevelStr+"_COLOR"]

			@info "Log levels enabled: #{@colorize loglevelStr, loglevelColor}"

	###
	# Print an info formatted message.
	# NB! AnsiLogger::LOG_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	default: () ->
		@print(msg, AnsiLogger::LOG_MASK, AnsiLogger::LOG_COLOR) for msg in arguments
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
		@print(msg, AnsiLogger::INFO_MASK, AnsiLogger::INFO_COLOR) for msg in arguments
		return arguments[0]

	###
	# Print a debug formatted message.
	# NB! AnsiLogger::DEBUG_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return void
	###
	debug: () ->
		@print(msg, AnsiLogger::DEBUG_MASK, AnsiLogger::DEBUG_COLOR) for msg in arguments
		return arguments[0]

	###
	# Print a verbose formatted message.
	# NB! AnsiLogger::VERBOSE_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	verbose: () ->
		@print(msg, AnsiLogger::VERBOSE_MASK, AnsiLogger::VERBOSE_COLOR) for msg in arguments
		return arguments[0]

	###
	# Print a warning.
	# NB! AnsiLogger::WARN_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	warn: () ->
		@print(msg, AnsiLogger::WARN_MASK, AnsiLogger::WARN_COLOR) for msg in arguments
		return arguments[0]

	###
	# Print an error.
	# NB! AnsiLogger::ERROR_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	error: () ->
		@print(msg, AnsiLogger::ERROR_MASK, AnsiLogger::ERROR_COLOR) for msg in arguments
		return arguments[0]

	###
	# Print a success formatted message.
	# NB! AnsiLogger::SUCCESS_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	success: () ->
		@print(msg, AnsiLogger::SUCCESS_MASK, AnsiLogger::SUCCESS_COLOR) for msg in arguments
		return arguments[0]

	###
	# Print a title formatted message.
	# NB! AnsiLogger::LOG_MASK must be present in log level.
	#
	# @params mixed [, mixed] [, mixed]...
	# @return mixed The first argument is returned
	###
	title: () ->
		@print(msg, AnsiLogger::LOG_MASK, AnsiLogger::TITLE_COLOR) for msg in arguments
		return arguments[0]

	###
	# Colorize the message string.
	# NB! If no-colors mode is on or no color is given.
	# then this method just return the message as it is.
	# @param String msg
	# @param [ String color ] @link https://github.com/medikoo/cli-color for see the color options.
	# @param [ String style ] { 'bold', 'italic', 'underline', 'inverse', 'strike' }. NB! some terminals change color, when using bold.
	# @return String The colorized message.
	###
	colorize: (msg, color, style) ->
		return msg if @options['no-colors'] or not color?
		[color, style] = color if _.isArray color
		if style? then func = clc[color][style] else func = clc[color]
		return func msg

	###
	# Print to console.
	# NB! This will print to the console based on the log level you have enabled.
	# @param String msg
	# @param [ Number loglevel = AnsiLogger::LOG_MASK ]
	# @param [ String|Array color ] @see colorize
	# @param [ String style ] @see colorize
	#	@return void
	###
	print: (msg, loglevel = AnsiLogger::LOG_MASK, color, style) ->
		# return if the log-level is higher than the selected the log-level.
		return unless (loglevel & @options['log-level']) is loglevel

		handleMultiline = (msg, color, style) =>
			res = []
			# colorize each line, so when the string is splitted later,
			# it will not mess up the colors.
			msg = ""+msg unless msg?.split?
			res.push @colorize(m, color, style) for m in msg.split("\n")
			res.join "\n"

		msg = handleMultiline msg, color, style

		# get the formatted current time.
		str = @formatTime()
		# get the formatted group
		str += " " + fg if (fg = @formatGroup())?
		# get the formatted log-level.
		str += " " + fll if (fll = @formatLogLevel loglevel)?
		# now insert the time and log-level on each line.
		str += " " + msg.replace(/\n/g,"\n#{str} ")
		# finally printing the output!.
		if (loglevel & AnsiLogger::ERROR_MASK) is AnsiLogger::ERROR_MASK
			process.stderr.write str+"\n"
		else
			process.stdout.write str+"\n"

	###
	# Format a Date object to string.
	# @param [ Date time = new Date ]
	# @return String
	###
	formatTime: (time = new Date) ->
		# if no custom format is defined.
		return "["+@colorize(moment(time).format(AnsiLogger::TIME_FORAMT), AnsiLogger::TIME_COLOR)+"]" unless @options['date']
		# if commandline options date is true, then date is included.
		return "["+@colorize(moment(time).format("#{AnsiLogger::DATE_FORMAT} #{AnsiLogger::TIME_FORAMT}"), AnsiLogger::TIME_COLOR)+"]" if @options['date'] is 'true'
		# if custom date is defined.
		return "["+@colorize(moment(time).format(@options['date']), AnsiLogger::TIME_COLOR)+"]"

	###
	# Format the loglevel to the console
	# @param Number loglevel
	# @param String msg
	# @return String The formatted loglevel
	###
	formatLogLevel: (loglevel, msg) ->
		# no need to ouput the log level, if the default log level is selected.
		# then it's just a waste of space.
		return msg if @options['log-level'] is AnsiLogger::LOG_LEVEL
		loglevelStr = @resolveLogLevel(loglevel)
		fill = ""
		# create the fill, in order to align everything nicely.
		fill += " " for i in (if loglevelStr.length < 6 then [loglevelStr.length..6] else [])

		# resolving the color for the log level.
		loglevelColor = AnsiLogger::[loglevelStr+"_COLOR"]
		# the formatted log-level
		fll = "[#{@colorize loglevelStr, loglevelColor}]#{fill}"
		# append the message if there is any.
		fll += msg if msg?
		return fll

	###
	# Format group if any.
	# @return String The formatted group
	###
	formatGroup: () ->
		return null unless @options['group']?
		group = @options['group'].trim()
		pad = @options['group'].length - group.length
		padding = ""
		padding += " " for i in (if pad > 0 then [0..pad-1] else [])
		return "[#{@colorize group, @options['group-color']}]#{padding}"

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
				result.push @colorize levelStr, AnsiLogger::[levelStr+"_COLOR"]

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
		@print "  "+@formatTypes(err).replace(/\n/g, "\n  "), AnsiLogger::ERROR_MASK, AnsiLogger::ERROR_COLOR

module.exports = AnsiLogger
