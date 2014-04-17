_ = require 'underscore'

###
# Ansi formatter.
# @author Brian K. Christensen, Secoya A/S <bkc@secoya.dk>
###
class AnsiFormatter

	# The default colors.
	BLACK:   0
	RED:     1
	GREEN:   2
	YELLOW:  3
	BLUE:    4
	MAGENTA: 5
	CYAN:    6
	WHITE:   7

	# The bold style.
	BOLD:    8

	# Ansi escape characters.
	ANSI_ESC_CHAR: "\x1B["
	ANSI_RESET_CHAR: AnsiFormatter::ANSI_ESC_CHAR+"0m"

	###
	# Construct the Ansi formatter.
	# @param [{Number} fgColor]
	# @param [{Number} bgColor]
	# @return Formatter A context bound formatter function.
	###
	constructor: () ->
		return @bindOutput()

	###
	# Binds the output function to correct context
	# and clouse scope the colors.
	# @param [{Number} fgColor]
	# @param [{Number} bgColor]
	# @return Formatter A context bound formatter function.
	###
	bindOutput: ({fgColor, bgColor} = opts = {}) ->
		that = @
		t = (msg) ->
			that.output.call that, msg, (fgColor ? t['fgColor']), (bgColor ? t['bgColor'])
		for own k, v of AnsiFormatter::
			t[k] = v
		for own k, v of that
			t[k] = v
		t['fgColor'] = fgColor ? that['fgColor']
		t['bgColor'] = bgColor ? that['bgColor']
		return t

	###
	# Returns the Ansi formatted string.
	# @param {String} msg
	# @param [{Number} fgColor]
	# @param [{Number} bgColor]
	# @return String
	###
	output: (msg, fgColor, bgColor) ->
		res = ""
		res += "#{@ANSI_ESC_CHAR}38;5;#{fgColor}m" if fgColor?
		res += "#{@ANSI_ESC_CHAR}48;5;#{bgColor}m" if bgColor?
		res += msg
		res += @ANSI_RESET_CHAR if fgColor? or bgColor?
		return res

	###
	# Set the defined colors and return the new context.
	# @param [{Number} color]
	# @param [{Boolean} bg]
	# @param [{Boolean} bold]
	# @return Formatter A context bound formatter function.
	###
	color: ({color, bg, bold}) ->
		bg ?= false
		bold ?= false
		color += AnsiFormatter::BOLD if bold
		if bg
			bgColor = color
		else
			fgColor = color
		return @bindOutput {fgColor, bgColor}

	###
	# Set the color to black.
	# and return the new context.
	# @param [{Boolean} bg = false]
	# @param [{Boolean} bold = false]
	# @return Formatter A context bound formatter function.
	###
	black: ({bg, bold} = opts = {}) ->
		bg ?= false
		bold ?= false
		@color {color: AnsiFormatter::BLACK, bg, bold}

	###
	# Set the color to red.
	# and return the new context.
	# @param [{Boolean} bg = false]
	# @param [{Boolean} bold = false]
	# @return Formatter A context bound formatter function.
	###
	red: ({bg, bold} = opts = {}) ->
		bg ?= false
		bold ?= false
		@color {color: AnsiFormatter::RED, bg, bold}

	###
	# Set the color to green.
	# and return the new context.
	# @param [{Boolean} bg = false]
	# @param [{Boolean} bold = false]
	# @return Formatter A context bound formatter function.
	###
	green: ({bg, bold} = opts = {}) ->
		bg ?= false
		bold ?= false
		@color {color: AnsiFormatter::GREEN, bg, bold}

	###
	# Set the color to yellow.
	# and return the new context.
	# @param [{Boolean} bg = false]
	# @param [{Boolean} bold = false]
	# @return Formatter A context bound formatter function.
	###
	yellow: ({bg, bold} = opts = {}) ->
		bg ?= false
		bold ?= false
		@color {color: AnsiFormatter::YELLOW, bg, bold}

	###
	# Set the color to blue.
	# and return the new context.
	# @param [{Boolean} bg = false]
	# @param [{Boolean} bold = false]
	# @return Formatter A context bound formatter function.
	###
	blue: ({bg, bold} = opts = {}) ->
		bg ?= false
		bold ?= false
		@color {color: AnsiFormatter::BLUE, bg, bold}

	###
	# Set the color to magenta.
	# and return the new context.
	# @param [{Boolean} bg = false]
	# @param [{Boolean} bold = false]
	# @return Formatter A context bound formatter function.
	###
	magenta: ({bg, bold} = opts = {}) ->
		bg ?= false
		bold ?= false
		@color {color: AnsiFormatter::MAGENTA, bg, bold}

	###
	# Set the color to cyan.
	# and return the new context.
	# @param [{Boolean} bg = false]
	# @param [{Boolean} bold = false]
	# @return Formatter A context bound formatter function.
	###
	cyan: ({bg, bold} = opts = {}) ->
		bg ?= false
		bold ?= false
		@color {color: AnsiFormatter::CYAN, bg, bold}

	###
	# Set the color to white.
	# and return the new context.
	# @param [{Boolean} bg = false]
	# @param [{Boolean} bold = false]
	# @return Formatter A context bound formatter function.
	###
	white: ({bg, bold} = opts = {}) ->
		bg ?= false
		bold ?= false
		@color {color: AnsiFormatter::WHITE, bg, bold}

module.exports = AnsiFormatter
