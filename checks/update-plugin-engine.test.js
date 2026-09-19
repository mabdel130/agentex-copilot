'use strict';

// Focused Node tests for the update-plugin skill's pure migration-engine logic (engine.js).
// Run via `npm test` (node --test checks/*.test.js). No I/O, no git, no real migrations.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const engine = require(path.join('..', 'skills', 'update-plugin', 'scripts', 'engine.js'));

test('compareVersions orders plain x.y.z versions correctly', () => {
  assert.equal(engine.compareVersions('1.0.0', '1.0.0'), 0);
  assert.ok(engine.compareVersions('1.2.0', '1.10.0') < 0);
  assert.ok(engine.compareVersions('2.0.0', '1.9.9') > 0);
  assert.ok(engine.compareVersions('1.0', '1.0.1') < 0);
});

test('pendingMigrations selects only migrations above the stamp and at/below the installed version', () => {
  const migrations = [
    { id: 'a', toVersion: '2.1.0' },
    { id: 'b', toVersion: '2.5.0' },
    { id: 'c', toVersion: '3.0.0' },
  ];
  const pending = engine.pendingMigrations(migrations, '2.0.0', '2.5.0');
  assert.deepEqual(
    pending.map((m) => m.id),
    ['a', 'b']
  );
});

test('pendingMigrations returns an ascending-order empty list when nothing is pending', () => {
  const migrations = [{ id: 'a', toVersion: '2.1.0' }];
  assert.deepEqual(engine.pendingMigrations(migrations, '2.1.0', '2.7.0'), []);
});

test('pendingMigrations sorts by toVersion ascending regardless of registry order', () => {
  const migrations = [
    { id: 'later', toVersion: '2.9.0' },
    { id: 'earlier', toVersion: '2.2.0' },
  ];
  const pending = engine.pendingMigrations(migrations, '2.0.0', '3.0.0');
  assert.deepEqual(
    pending.map((m) => m.id),
    ['earlier', 'later']
  );
});

test('runMigrations records a migrated result for a successful migration', () => {
  const migrations = [{ id: 'a', toVersion: '2.1.0', migrate: () => ({ message: 'did it' }) }];
  const results = engine.runMigrations(migrations, '/fake/root');
  assert.deepEqual(results, [{ id: 'a', toVersion: '2.1.0', status: 'migrated', message: 'did it' }]);
});

test('runMigrations records a manual result without aborting later migrations', () => {
  const migrations = [
    { id: 'a', toVersion: '2.1.0', migrate: () => ({ manual: true, message: 'needs a human' }) },
    { id: 'b', toVersion: '2.2.0', migrate: () => ({ message: 'ran fine' }) },
  ];
  const results = engine.runMigrations(migrations, '/fake/root');
  assert.equal(results[0].status, 'manual');
  assert.equal(results[1].status, 'migrated');
});

test('runMigrations marks a throwing migration as failed and skips the rest', () => {
  const migrations = [
    { id: 'a', toVersion: '2.1.0', migrate: () => { throw new Error('boom'); } },
    { id: 'b', toVersion: '2.2.0', migrate: () => ({ message: 'never runs' }) },
  ];
  const results = engine.runMigrations(migrations, '/fake/root');
  assert.equal(results[0].status, 'failed');
  assert.equal(results[0].message, 'boom');
  assert.equal(results[1].status, 'skipped');
});

test('nextStamp advances to the installed version when nothing is blocking', () => {
  const results = [{ id: 'a', toVersion: '2.1.0', status: 'migrated' }];
  assert.equal(engine.nextStamp(results, '2.1.0', '2.0.0'), '2.1.0');
});

test('nextStamp withholds the stamp when a manual or failed item remains', () => {
  const manualResults = [{ id: 'a', toVersion: '2.1.0', status: 'manual' }];
  const failedResults = [{ id: 'a', toVersion: '2.1.0', status: 'failed' }];
  assert.equal(engine.nextStamp(manualResults, '2.1.0', '2.0.0'), '2.0.0');
  assert.equal(engine.nextStamp(failedResults, '2.1.0', '2.0.0'), '2.0.0');
});
