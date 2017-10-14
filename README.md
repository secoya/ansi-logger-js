# ANSI Logger for Node.js #

Console logger with support for colors and log levels, it complies to the default console.log interface, with methods like log,error,warn and debug but is extended with some extra levels for nice formatting purposes.

## API - `AnsiLogger`

### `AnsiLogger(options: Partial<Options>)`
Set options changes the internal setting of the logger
and the behavior will change after this call.
if you change the log levels to output the new mask of log levels is outputted to
the `INFO` level, so if `INFO` level isn't in the new log level mask, nothing will be outputted.

### `AnsiLogger.setOptions(options: Partial<Options>): void`
See constructor description

### `AnsiLogger.error(msg1 [, msg2,..]): msg1`
Log to the error level, iff the `ERROR` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### `AnsiLogger.warn(msg1 [, msg2,..]): msg1`
Log to the warn level, iff the `WARN` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### `AnsiLogger.success(msg1 [, msg2,..]): msg1`
Log to the success level, iff the `SUCCESS` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### `AnsiLogger.log(msg1 [, msg2,..]): msg1`
Log to the log level, iff the `LOG` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### `AnsiLogger.info(msg1 [, msg2,..]): msg1`
Log to the info level, iff the `INFO` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### `AnsiLogger.debug(msg1 [, msg2,..]): msg1`
Log to the debug level, iff the `DEBUG` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### `AnsiLogger.verbose(msg1 [, msg2,..]): msg1`
Log to the verbose level, iff the `VERBOSE` mask is present in the log level mask of the logger
the message(s) will be outputted and formatted as an error.

### `AnsiLogger.print(msg, [loglevel, color, style]): void`
Output to stdout or stderr if the loglevel is `ERROR`

### `AnsiLogger.formatTypes(msg, [padding = 0, depth = 3]): String`
Recursively format msg. It is nice to format Object and arrays with.
You can set depth in order to avoid infinite recursion.

### `AnsiLogger.formatError(err: Error): void`
Formats an error, you can use e.g. in a try/catch block pass the error to formatError
and it will output it to `ERROR` log level.

## API - `TextTransformer`

### `TextTransformer(options: Partial<Options>)`
A transformer, that "pretty prints" to human readable format.

### `TextTransformer.format(entry: LogEntry): string`
Transform a `LogEntry` to to string output.

### `TextTransformer.setOptions(options: Partial<Options>): void`
Setting new options on the transformer. Can be used to disable/enable colors
or changing the colors.

## API - `JSONTransformer`

### `JSONTransformer()`
A transformer that JSON serializes `LogEntry`, this is great when using
log services like log stash.

### `JSONTransformer.format(entry: LogEntry): string`
Transformats `LogEntry` to JSON string.

## API - `IdentityTransformer`

### `IdentityTransformer()`
Transformer that does nothing, it is useful when implementing custom
outputters.

### `IdentityTransformer.format(entry: LogEntry): LogEntry`
Returns the `LogEntry` as is.

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

```js
const Logger = require('ansi-logger');
const logLevel = Logger.Mask.ERROR | Logger.Mask.INFO;
const logger = new Logger.AnsiLogger({ logLevel: logLevel });

logger.error('test');
logger.warn('test');
logger.success('test');
logger.log('test');
logger.info('test');
logger.debug('test');
logger.verbose('test');
```

Output:

```
[2017-10-01 17:41:26.052+0200] [ERROR]   test
[2017-10-01 17:41:50.807+0200] [INFO]    test
```

### Pre-compiled log level masks

```
SILENT
ERROR
WARN
SUCCESS
LOG
INFO
DEBUG
VERBOSE
```

Each of the levels listed above will output their own level and them above. So `LOG` will output `ERROR`,`WARN`,`INFO` and `LOG`.

## `AnsiLogger.Options`

### `group`: default: `null`
Sets the group name added to all log entries, produceed by this instance.

### `logLevel`, default: `Logger.Level.INFO`
Sets the log level of the logger.
NB! if the default log level is used, no [level] indication is outputted, this will behavior will be optional in a later release.

### `outputters`: default: `{err: process.stderr.write, out: process.stdout.write}`
An object containing `err` and `out` which are functions that consumes the transformed output
and `writes` it to  the output medium, e.g. stdout and stederr. But it very well can
output to files instead.

### `timeformat`: default: `YYYY-MM-DD HH:mm:ss.SSSZZ`
A momemnt format string used to format the timestamp in the log entries.

### `transformer`, default: `new Logger.TextTransformer()`
An object that can transform [LogEntry] objects to string

## `TextTransformer.Options`

### `colorMap`, default:
```js
{
  ERROR: clc.bgRed.white,
  WARN: clc.red.bold,
  SUCCESS: clc.green,
  LOG: clc,
  INFO: clc.blue,
  DEBUG: clc.yellow,
  VERBOSE: clc.magenta,
  GROUP: clc.yellow,
  TIME: clc.cyan,
}
```

### `colors`, default: `true`
Whether colors are enabled or not. Even if colors are enabled, the output
are not necessarily printed in colors, if the the output target is not a tty.
This behavior can be mitigated, by using the `forceColors` option.

### `forceColors`, default: `false`
Whether or not colors always should be used.


```js
const clc = require('cli-color')
const Logger = require('ansi-logger');
const logger = new Logger.AnsiLogger({
  transformer: new Logger.TextTransformer({
    'colors': {
      'ERROR': clc.bgMagenta
    }
  }
});
```

```js
const logger = new Logger.AnsiLogger({'group': 'server'});
logger.log('test');
```
Outputs:

```
[2017-01-01 17:44:35.443+0000] [server] test
```

## Build ##
For building a new version simply run.
NB! It is required that coffee-script is globally installed.

```bash
npm run build
```
