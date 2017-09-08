# JSON example #

```js
const Logger = require('../lib/index');
const logger = new Logger.AnsiLogger({
	'group': 'json',
	'log-level': Logger.Level.VERBOSE,
	'timeformat': 'YYYY-MM-DD\THH:mm:ss.SSSZZ',
	'no-colors': true,
	'transformer': Logger.JSONTransformer,
	'startup-info': false,
});

logger.success('JSON logging is now supported yay!');
logger.error(new Error('Error in json'));
```

_Outputs something like:_

```
{"group":"json","levelNumeric":4,"levelText":"SUCCESS","message":"JSON logging is now supported yay!","timestamp":"2017-09-08T13:44:20.805+0200"}
{"group":"json","levelNumeric":1,"levelText":"ERROR","message":"  Error in json\n  Error: Error in json\n      at Object.<anonymous> (~/workspace/ansi-logger-js/examples/tempCodeRunnerFile.md:12:14)\n      at Module._compile (module.js:573:30)\n      at Object.Module._extensions..js (module.js:584:10)\n      at Module.load (module.js:507:32)\n      at tryModuleLoad (module.js:470:12)\n      at Function.Module._load (module.js:462:3)\n      at Function.Module.runMain (module.js:609:10)\n      at startup (bootstrap_node.js:158:16)\n      at bootstrap_node.js:598:3","timestamp":"2017-09-08T13:44:20.810+0200"}

```
