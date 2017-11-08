#!/usr/bin/env node
'use strict';

const __doc__ = `Usage: ansi-logger [-t SECONDS] [-f FILE] [-l LEVEL | -m MASKS]

Options:
  -h --help             Show this help message.
  -f --file FILE        The log file to parse and format [default: -].
  -l --loglevel LEVEL   The level output [default: VERBOSE].
  -m --logmasks MASKS   Comma separated list of log masks to output.
  -s --split-pipes      Direct error entries to stderr.
  -t --timeout SECONDS  The timeout for receiving data [default: 1]. 0 for disable.

Levels available:
SILENT ERROR WARN SUCCESS LOG INFO DEBUG VERBOSE

Masks available:
ERROR WARN SUCCESS LOG INFO DEBUG VERBOSE

Examples:

# Only output log entries from INFO and DEBUG
tail -n200 -f big.log | ansi-logger -m INFO,DEBUG

# Only output log entries from ERROR and WARN
tail -n200 -f big.log | ansi-logger -l WARN

# Redirect file to stdin
ansi-logger < ./big.log | less

# Use file switch to read a log file
ansi-logger -f ./big.log | less
`;

const tt = require('../lib/TextTransformer');
const { Level, Mask, matchMask } = require('../lib/AnsiLogger');
const readline = require('readline');
const fs = require('fs');

/**
 * @param {{short?: string, long?: string}} argDefinition
 * @return boolean
 */
function parseArgBool(argDefinition) {
	const argIdx = process.argv.findIndex(
		arg => arg.startsWith(argDefinition.short) || arg.startsWith(argDefinition.long),
	);
	return argIdx === -1 ? false : true;
}

/**
 *
 * @param {{short?: string, long?: string}} argDefinition
 * @param {T=} defaultValue
 * @template T
 * @return {T | string}
 */
function parseArg(argDefinition, defaultValue) {
	const argIdx = process.argv.findIndex(
		arg => arg.startsWith(argDefinition.short) || arg.startsWith(argDefinition.long),
	);

	if (argIdx === -1) {
		return defaultValue;
	}

	const arg = process.argv[argIdx];
	for (const argDef of [argDefinition.short, argDefinition.long]) {
		if (arg.startsWith(argDef)) {
			if (arg.indexOf('=') === -1) {
				if (arg.length > argDef.length) {
					// support args like -t20 or --timeout20
					return arg.substr(argDef.length);
				} else {
					// support args like -t 20 or --timeout 20
					const nextArg = process.argv[argIdx + 1];
					if (nextArg) {
						return nextArg;
					} else {
						return defaultValue;
					}
				}
			} else {
				// support args like -t=20 or --timeout=20
				return arg.split('=')[1];
			}
		}
	}
	return defaultValue;
}

if (parseArgBool({ short: '-h', long: '--help' })) {
	process.stdout.write(__doc__);
	process.exit(127);
}
const timeout = parseInt(parseArg({ short: '-t', long: '--timeout' }, '1'), 10);
const file = parseArg({ short: '-f', long: '--file' }, '-');
const splitPipes = parseArgBool({ short: '-s', long: '--split-pipes' });
const logMasks = parseArg({ short: '-m', long: '--logmasks' }, '');
const masks = logMasks.split(',').reduce((carry, item) => {
	return carry | Mask[item];
}, Level.SILENT);
const logLevel = masks || Level[parseArg({ short: '-l', long: '--loglevel' }, 'VERBOSE')];

const transformer = new tt.TextTransformer({
	forceColors: true,
});

const startupTimer =
	timeout === 0
		? null
		: setTimeout(() => {
				process.stderr.write('No data received from stdin');
				process.exit(1);
			}, timeout * 1000);

function readLine(line) {
	if (line == null || line.trim() == '') {
		return;
	}
	clearTimeout(startupTimer);
	try {
		const entry = JSON.parse(line);
		if (!matchMask(logLevel, entry.levelNumeric)) {
			return;
		}
		const formattedEntry = transformer.format(entry);
		if (splitPipes && entry.levelNumeric === Mask.ERROR) {
			process.stderr.write(formattedEntry);
		} else {
			process.stdout.write(formattedEntry);
		}
	} catch (e) {
		console.log('test');
		process.stderr.write(e.stack);
		process.exit(1);
	}
}

// When piping output to another process e.g. less
// then quitting the process can end up closing the pipe
// before flushing the latest output, swallow that error type.
function rethrowNonEPIPE(err) {
	if (err.code === 'EPIPE') {
		process.exit(0);
		return;
	}
	throw err;
}
process.stdout.on('error', rethrowNonEPIPE);
process.stderr.on('error', rethrowNonEPIPE);

const input = file === '-' ? process.stdin : fs.createReadStream(file);
const rl = readline.createInterface({ input: input, output: process.stdout, terminal: false });
rl.on('line', readLine);
rl.on('end', () => {
	rl.close();
	process.exit(0);
});
rl.resume();
