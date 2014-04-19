# ANSI Logger for Node.js #

Console logger with support for colors and log levels, it complies to the default console.log interface, with methods like log,error,warn and debug but is extended with some extra levels for nice formatting purposes.

## API

### setOptions(options:Object) : void
Set options changes the internal setting of the logger
and the behavior will change after this call.
if you change the log levels to output the new mask of log levels is outputted to
the `INFO` level, so if `INFO` level isn't in the new log level mask, nothing will be outputted.

### error(msg1 [, msg2,..]) : msg1
Log to the error level, iff the `ERROR` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### warn(msg1 [, msg2,..]) : msg1
Log to the warn level, iff the `WARN` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### success(msg1 [, msg2,..]) : msg1
Log to the success level, iff the `SUCCESS` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### log(msg1 [, msg2,..]) : msg1
Log to the log level, iff the `LOG` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### default(msg1 [, msg2,..]) : msg1
Alias for log

### info(msg1 [, msg2,..]) : msg1
Log to the info level, iff the `INFO` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### debug(msg1 [, msg2,..]) : msg1
Log to the debug level, iff the `DEBUG` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### verbose(msg1 [, msg2,..]) : msg1
Log to the verbose level, iff the `VERBOSE` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### title(msg, [, msg2,..]) : msg1
Title is a special level, it is outputted to level `LOG`, but formatted differently.

### colorize(msg, color, style) : String
Adds ANSI color characters to the message, and return the result.
NB! if the `no-color` option is set, the message is returned without adding the ANSI color characters.

### print(msg, [loglevel, color, style]) : void
Output to stdout or stderr if the loglevel is `ERROR`

### formatTime([time]) : String
Format time and return the colored and formatted string.

### formatLogLevel(loglevel, msg) : String
Add the colors of the loglevel to the message.

### formatGroup() : String
Format the group if such is configured.

### resolveLogLevel(loglevel) : String
Get the string representation of the log level mask.

### formatTypes(msg, [padding = 0, depth = 3]) : String
Recursively format msg. It is nice to format Object and arrays with.
You can set depth in order to avoid infinite recursion.

### formatError(err) : String
Formats an error, you can use e.g. in a try/catch block pass the error to formatError
and it will output it to `ERROR` log level.

## Log level system

The log level system is based on bit masks, with pre-compiled set of log levels.

### Level masks

    ERROR:    0b0000001
    WARN:     0b0000010
    SUCCESS:  0b0000100
    LOG:      0b0001000
    INFO:     0b0010000
    DEBUG:    0b0100000
    VERBOSE:  0b1000000

This way it's easy to compile a custom level mask, all you have to do is bit-wise or the masks together for the levels you want in your output.

E.g. if we only want `ERROR` and `INFO` outputted:

```javascript
var logLevel = AnsiLogger.prototype.ERROR | AnsiLogger.prototype.INFO;
var logger = new AnsiLogger({'log-level': logLevel});
logger.error('test');
logger.warn('test');
logger.success('test');
logger.log('test');
logger.info('test');
logger.debug('test');
logger.verbose('test');
```
Output:

```shell
[17:41:26.052] [ERROR] test
[17:41:50.807] [INFO]  test
```

#### Pre-compiled log level masks

```
ERROR_LEVEL
WARN_LEVEL
SUCCESS_LEVEL
LOG_LEVEL
INFO_LEVEL
DEBUG_LEVEL
VERBOSE_LEVEL
```

Each of the levels listed above will output their own level and them above. So `LOG_LEVEL` will output `ERROR`,`WARN`,`INFO` and `LOG`.

## Options

### log-level, default: LOG_LEVEL
Sets the log level of the logger.
NB! if the default log level is used, no [level] indication is outputted, this will behavior will be optional in a later release.

### no-colors, default: false
Disables the colors.
It can be nice if you will redirect the output to a file.

### colors
Setting the colors of the different log-levels. Each color is function that takes a string and return the string with the ANSI characters added.

```javascript
var clc = require('cli-color')
var AnsiLogger = require('ansi-logger');
var logger = new AnsiLogger({
  'colors': {
    'error': clc.bgMagenta
  }
});
```

### group, default: null
Sets up a group for the logger:

```javascript
var logger = new AnsiLogger({'group': 'server', 'group-color': 'blue'});
logger.log('test');
```
Outputs:

```shell
[17:44:35.443] [server] test
```

### group-color, default: null
Sets the color for the group. The color strings comes from the [cli-color npm module](https://github.com/medikoo/cli-color)

## Build ##
For building a new version simply run.
NB! It is required that coffee-script is globally installed. 

```shell
coffee -cbo lib lib/src
```
