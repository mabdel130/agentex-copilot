'use strict';

// Focused Node tests for scripts/lib/permissions_merge.js — the pure merge logic behind
// scripts/merge-permissions.js. Run via `npm test` (node --test checks/*.test.js). No file I/O.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  flattenCommandIdentifiers,
  filterTemplateIdentifiers,
  computeMissingIdentifiers,
  toLocationKey,
} = require(path.join('..', 'scripts', 'lib', 'permissions_merge.js'));

test('flattenCommandIdentifiers collects identifiers across multiple commands entries', () => {
  const approvals = [
    { kind: 'commands', commandIdentifiers: ['node:*'] },
    { kind: 'write' },
    { kind: 'commands', commandIdentifiers: ['npm test', 'npm run build'] },
  ];
  const set = flattenCommandIdentifiers(approvals);
  assert.deepEqual([...set].sort(), ['node:*', 'npm run build', 'npm test'].sort());
});

test('flattenCommandIdentifiers returns an empty set for no approvals', () => {
  assert.deepEqual(flattenCommandIdentifiers(undefined), new Set());
  assert.deepEqual(flattenCommandIdentifiers([]), new Set());
});

test('filterTemplateIdentifiers excludes az:* rules by default', () => {
  const template = [
    { kind: 'commands', commandIdentifiers: ['node:*'] },
    { kind: 'commands', commandIdentifiers: ['az login:*'] },
    { kind: 'commands', commandIdentifiers: ['az account:*'] },
  ];
  assert.deepEqual(filterTemplateIdentifiers(template), ['node:*']);
});

test('filterTemplateIdentifiers includes az:* rules when includeAzure is true', () => {
  const template = [
    { kind: 'commands', commandIdentifiers: ['node:*'] },
    { kind: 'commands', commandIdentifiers: ['az login:*'] },
  ];
  assert.deepEqual(filterTemplateIdentifiers(template, { includeAzure: true }), ['node:*', 'az login:*']);
});

test('filterTemplateIdentifiers ignores non-commands entries', () => {
  const template = [{ kind: 'write' }, { kind: 'commands', commandIdentifiers: ['node:*'] }];
  assert.deepEqual(filterTemplateIdentifiers(template), ['node:*']);
});

test('computeMissingIdentifiers returns only identifiers not already approved', () => {
  const existing = new Set(['node:*', 'npm install:*']);
  const desired = ['node:*', 'npx playwright-cli:*', 'npm install:*'];
  assert.deepEqual(computeMissingIdentifiers(existing, desired), ['npx playwright-cli:*']);
});

test('computeMissingIdentifiers returns an empty array when nothing is missing', () => {
  const existing = new Set(['node:*']);
  assert.deepEqual(computeMissingIdentifiers(existing, ['node:*']), []);
});

test('toLocationKey normalizes forward slashes to backslashes on win32', { skip: process.platform !== 'win32' }, () => {
  assert.equal(toLocationKey('D:/src/my-repo'), 'D:\\src\\my-repo');
});
