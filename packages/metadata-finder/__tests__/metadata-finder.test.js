'use strict';

const metadataFinder = require('..');
const assert = require('assert').strict;

assert.strictEqual(metadataFinder(), 'Hello from metadataFinder');
console.info('metadataFinder tests passed');
