#!/usr/bin/env node
'use strict';

// tslint:disable-next-line:variable-name
const __doc__ = `Usage: ansi-logger [-t SECONDS] [-f FILE] [-l LEVEL | -m MASKS] [--mapper FILE_OR_STRING]

Options:
  -h --help                Show this help message.
  -f --file FILE           The log file to parse and format [default: -].
  -l --loglevel LEVEL      The level output [default: VERBOSE].
  -m --logmasks MASKS      Comma separated list of log masks to output.
  -s --split-pipes         Direct error entries to stderr.
  -t --timeout SECONDS     The timeout for receiving data [default: 1]. 0 for disable.
  --mapper FILE_OR_STRING  JavaScript file that exports a single function to map parsed JSON structure to LogEntry
                           or a comma separated mapper pairs, e.g levelText=level,group=key

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

# Use grep combined with \`tail -f\`
tail -f ./big.log | grep --line-buffered 'UserID: 4' | ansi-logger -t10 -mWARN,DEBUG
`;

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { matchMask, Level, LogEntry, Mask, TextTransformer } from '..';

interface ArgDefinitionShort {
	long?: string;
	short: string;
}

interface ArgDefinitionLong {
	long: string;
	short?: string;
}

type ArgDefinition = ArgDefinitionShort | ArgDefinitionLong;

function findArgIdx(short?: string, long?: string): number {
	return process.argv.findIndex(arg => !!((short && arg.startsWith(short)) || (long && arg.startsWith(long))));
}

function parseArgBool(argDefinition: ArgDefinition): boolean {
	return findArgIdx(argDefinition.short, argDefinition.long) === -1 ? false : true;
}

function parseArg<T>(argDefinition: ArgDefinition, defaultValue: T): T | string {
	const { short, long } = argDefinition;
	const argIdx = findArgIdx(short, long);

	if (argIdx === -1) {
		return defaultValue;
	}

	const argValue = process.argv[argIdx];
	for (const argDef of [short, long]) {
		if (argDef && argValue.startsWith(argDef)) {
			if (argValue.indexOf('=') === -1) {
				if (argValue.length > argDef.length) {
					// support args like -t20 or --timeout20
					return argValue.substr(argDef.length);
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
				return argValue.split('=')[1];
			}
		}
	}
	return defaultValue;
}

function stringMapper(stringMap: string) {
	return (e: any) =>
		stringMap.split(',').reduce((entry, mapPair) => {
			const [newKey, oldKey] = mapPair.split('=');
			const value = entry[oldKey];
			return Object.assign({}, entry, {
				[oldKey]: undefined,
				[newKey]: value,
			});
		}, e);
}

function isFile(mayFilePath: string): boolean {
	try {
		return fs.statSync(mayFilePath).isFile();
	} catch {
		return false;
	}
}

if (parseArgBool({ short: '-h', long: '--help' })) {
	process.stdout.write(__doc__);
	process.exit(127);
}
const timeout = parseInt(parseArg({ short: '-t', long: '--timeout' }, '1'), 10);
const file = parseArg({ short: '-f', long: '--file' }, '-');
const splitPipes = parseArgBool({ short: '-s', long: '--split-pipes' });
const logMasks = parseArg({ short: '-m', long: '--logmasks' }, '');

const masks = logMasks.split(',').reduce((carry: Level, item) => {
	// tslint:disable-next-line:no-bitwise
	return carry | Mask[item as keyof typeof Mask];
}, Level.SILENT);
const logLevel = masks || Level[parseArg({ short: '-l', long: '--loglevel' }, 'VERBOSE') as keyof typeof Level];
const mapper = parseArg({ long: '--mapper' }, undefined);

// prettier-ignore
const mapFn =
	mapper == null
		? null
		: isFile(mapper)
			// tslint:disable-next-line:no-var-requires
			? require(path.resolve(process.cwd(), mapper))
			: stringMapper(mapper);

const transformer = new TextTransformer({
	forceColors: true,
});

const startupTimer =
	timeout === 0
		? null
		: setTimeout(() => {
				process.stderr.write('No data received from stdin');
				process.exit(1);
		  }, timeout * 1000);

function tryMapFromLevelText(entry: any, levelText: string | null) {
	if (levelText == null) {
		return;
	}

	switch (levelText.toUpperCase()) {
		case 'FATAL':
			entry.levelNumeric = Mask.ERROR;
			break;
		default:
			entry.levelNumeric = Mask[levelText.toUpperCase() as keyof typeof Mask];
			break;
	}
}

function readLine(line: string | null) {
	if (line == null || line.trim() === '') {
		return;
	}

	if (startupTimer != null) {
		clearTimeout(startupTimer);
	}

	try {
		const entryRaw = JSON.parse(line);
		const entry: LogEntry = mapFn == null ? entryRaw : mapFn(entryRaw, transformer);
		if (entry.levelNumeric == null) {
			tryMapFromLevelText(entry, entry.levelText);
		}
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
		process.stderr.write(e.stack);
		process.exit(1);
	}
}

// When piping output to another process e.g. less
// then quitting the process can end up closing the pipe
// before flushing the latest output, swallow that error type.
function rethrowNonEPIPE(err: NodeJS.ErrnoException) {
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

// Input stream is initally paused
// begin reading from input stream.
rl.resume();
