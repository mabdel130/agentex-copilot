'use strict';

// Tests for the setup-wizard server's small pure helpers (argument parsing, .env merging).
// Does not start an HTTP server or touch the network.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const { parseArgs, mergeEnvFile } = require(
  path.join('..', 'skills', 'init-test', 'scripts', 'wizard', 'server.js')
);

test('parseArgs reads projectRoot, --port, --no-open, --force', () => {
  const args = parseArgs(['/tmp/my-project', '--port=8080', '--no-open', '--force']);
  assert.equal(args.projectRoot, '/tmp/my-project');
  assert.equal(args.port, 8080);
  assert.equal(args.open, false);
  assert.equal(args.force, true);
});

test('parseArgs defaults to port 7373 and open=true', () => {
  const args = parseArgs([]);
  assert.equal(args.port, 7373);
  assert.equal(args.open, true);
  assert.equal(args.force, false);
});

test('mergeEnvFile creates a new .env with the given vars', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentex-wizard-'));
  const envPath = path.join(dir, '.env');
  mergeEnvFile(envPath, { DB_PASS: 'secret1', API_TOKEN: 'tok1' });
  const content = fs.readFileSync(envPath, 'utf8');
  assert.match(content, /DB_PASS=secret1/);
  assert.match(content, /API_TOKEN=tok1/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('mergeEnvFile updates an existing key in place and preserves other lines', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentex-wizard-'));
  const envPath = path.join(dir, '.env');
  fs.writeFileSync(envPath, 'OTHER_KEY=keep-me\nDB_PASS=old\n', 'utf8');
  mergeEnvFile(envPath, { DB_PASS: 'new-secret' });
  const content = fs.readFileSync(envPath, 'utf8');
  assert.match(content, /OTHER_KEY=keep-me/);
  assert.match(content, /DB_PASS=new-secret/);
  assert.doesNotMatch(content, /DB_PASS=old/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('mergeEnvFile is a no-op when there are no vars to write', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentex-wizard-'));
  const envPath = path.join(dir, '.env');
  mergeEnvFile(envPath, {});
  assert.equal(fs.existsSync(envPath), false);
  fs.rmSync(dir, { recursive: true, force: true });
});
