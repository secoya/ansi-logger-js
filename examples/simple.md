# Simple example #

```js
const Logger = require('../lib/index');
const logger = new Logger.AnsiLogger();

logger.info('This is a simple example');
logger.error(new Error('Oops, something went horribly wrong!'));
```

_Outputs something like:_

```
[2017-09-08T14:59:11.603+0200] [INFO]    Log levels enabled: ERROR, WARN, SUCCESS, LOG, INFO
[2017-09-08T14:59:11.607+0200] [INFO]    This is a simple example
[2017-09-08T14:59:11.608+0200] [ERROR]   Oops, something went horribly wrong!
[2017-09-08T14:59:11.608+0200] [ERROR]   Error: Oops, something went horribly wrong!
[2017-09-08T14:59:11.608+0200] [ERROR]       at Object.<anonymous> (~/workspace/ansi-logger-js/examples/tempCodeRunnerFile.md:6:14)
[2017-09-08T14:59:11.608+0200] [ERROR]       at Module._compile (module.js:573:30)
[2017-09-08T14:59:11.608+0200] [ERROR]       at Object.Module._extensions..js (module.js:584:10)
[2017-09-08T14:59:11.608+0200] [ERROR]       at Module.load (module.js:507:32)
[2017-09-08T14:59:11.608+0200] [ERROR]       at tryModuleLoad (module.js:470:12)
[2017-09-08T14:59:11.608+0200] [ERROR]       at Function.Module._load (module.js:462:3)
[2017-09-08T14:59:11.608+0200] [ERROR]       at Function.Module.runMain (module.js:609:10)
[2017-09-08T14:59:11.608+0200] [ERROR]       at startup (bootstrap_node.js:158:16)
[2017-09-08T14:59:11.608+0200] [ERROR]       at bootstrap_node.js:598:3
```
