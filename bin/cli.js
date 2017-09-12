#!/usr/bin/env node
'use strict';

const tt = require('../lib/TextTransformer');
const readline = require('readline');
const fs = require('fs');

const transformer = new tt.TextTransformer({
	forceColors: true,
});

const startupTimer = setTimeout(() => {
	process.stderr.write('No data received from stdin');
	process.exit(1);
}, 1000);

let input;
if (process.argv[2] === '-f') {
	const file = process.argv[3];
	if (file == null) {
		console.error('Missing file parameter');
		process.exit(1);
	}
	input = file === '-' ? process.stdin : fs.createReadStream(file);
} else {
	input = process.stdin;
}

const rl = readline.createInterface({
	input: input,
	output: process.stdout,
	terminal: false,
});

rl.on('line', line => {
	if (line == null || line.trim() == '') {
		return;
	}
	clearTimeout(startupTimer);
	try {
		const entry = JSON.parse(line);
		const formattedEntry = transformer.format(entry);
		if (entry.levelNumeric === 1) {
			process.stderr.write(formattedEntry);
			process.stderr.write('\n');
		} else {
			process.stdout.write(formattedEntry);
			process.stdout.write('\n');
		}
	} catch (e) {
		process.stderr.write(e.stack);
		process.exit(1);
	}
});

rl.on('end', () => {
	process.exit(0);
});

rl.resume();
