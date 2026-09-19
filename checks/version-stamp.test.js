'use strict';

// Focused Node tests for scripts/lib/version_stamp.js — the shared `.agentex/version.json`
// stamp helpers used by both the init-test and update-plugin skills. Uses real tmp
// directories (matching this repo's wizard-server.test.js pattern), no mocking.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { readInstalledVersion, readStamp, writeStamp, STAMP_REL } = require(
  path.join('..', 'scripts', 'lib', 'version_stamp.js')
);

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agentex-version-stamp-'));
}

test('readInstalledVersion reads the version field from plugin.json', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'plugin.json'), JSON.stringify({ version: '9.9.9' }));
  assert.equal(readInstalledVersion(dir), '9.9.9');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('readInstalledVersion throws when plugin.json has no version field', () => {
  const dir = tmpDir();
  fs.writeFileSync(path.join(dir, 'plugin.json'), JSON.stringify({ name: 'x' }));
  assert.throws(() => readInstalledVersion(dir));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('readStamp reports no prior stamp when the file is absent', () => {
  const dir = tmpDir();
  const stamp = readStamp(dir);
  assert.equal(stamp.version, '0.0.0');
  assert.equal(stamp.existed, false);
  assert.equal(stamp.path, path.join(dir, STAMP_REL));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('readStamp reads an existing stamp', () => {
  const dir = tmpDir();
  fs.mkdirSync(path.join(dir, '.agentex'));
  fs.writeFileSync(
    path.join(dir, '.agentex', 'version.json'),
    JSON.stringify({ agentexCopilotVersion: '2.7.0' })
  );
  const stamp = readStamp(dir);
  assert.equal(stamp.version, '2.7.0');
  assert.equal(stamp.existed, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('readStamp treats an unparsable stamp file as no prior version, not an error', () => {
  const dir = tmpDir();
  fs.mkdirSync(path.join(dir, '.agentex'));
  fs.writeFileSync(path.join(dir, '.agentex', 'version.json'), 'not json');
  const stamp = readStamp(dir);
  assert.equal(stamp.version, '0.0.0');
  assert.equal(stamp.existed, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('writeStamp creates the .agentex directory and file', () => {
  const dir = tmpDir();
  const stampPath = path.join(dir, STAMP_REL);
  writeStamp(stampPath, '3.1.4');
  const written = JSON.parse(fs.readFileSync(stampPath, 'utf8'));
  assert.equal(written.agentexCopilotVersion, '3.1.4');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('writeStamp followed by readStamp round-trips the version', () => {
  const dir = tmpDir();
  writeStamp(path.join(dir, STAMP_REL), '1.2.3');
  assert.equal(readStamp(dir).version, '1.2.3');
  fs.rmSync(dir, { recursive: true, force: true });
});
