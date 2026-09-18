'use strict';

// Focused Node tests for the setup-wizard's pure mapping/validation logic (engine.js).
// Run via `npm test` (node --test checks/*.test.js). No I/O, no server involved.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const engine = require(path.join('..', 'skills', 'init-test', 'scripts', 'wizard', 'engine.js'));

test('buildConfigs produces the project.json shape used by this plugin', () => {
  const { projectConfig, envName } = engine.buildConfigs({
    name: 'Acme Shop',
    envName: 'staging',
    'login.mode': 'fresh',
    'playwright.browser': 'firefox',
    'playwright.mode': 'headed',
    'playwright.workers': 8,
    portalUrl: 'https://staging.acme.test',
    users: [{ handle: 'valid_user', phone: '0550000001' }],
  });

  assert.equal(envName, 'staging');
  assert.equal(projectConfig.name, 'Acme Shop');
  assert.equal(projectConfig.defaultEnvironment, 'staging');
  assert.equal(projectConfig.login.mode, 'fresh');
  assert.equal(projectConfig.playwright.browser, 'firefox');
  assert.equal(projectConfig.playwright.mode, 'headed');
  assert.equal(projectConfig.playwright.workers, 8);
  assert.ok(!('kb' in projectConfig), 'empty kb block should be omitted');
});

test('buildConfigs clamps workers into the supported 1-16 range', () => {
  const over = engine.buildConfigs({ name: 'x', portalUrl: 'https://x.test', users: [{ handle: 'u' }], 'playwright.workers': 99 });
  const under = engine.buildConfigs({ name: 'x', portalUrl: 'https://x.test', users: [{ handle: 'u' }], 'playwright.workers': 0 });
  assert.equal(over.projectConfig.playwright.workers, 16);
  assert.equal(under.projectConfig.playwright.workers, 1);
});

test('buildUsers falls back to sample users when the list is empty', () => {
  const users = engine.buildUsers([]);
  assert.ok(users.valid_user);
  assert.ok(users.expired_user);
});

test('buildUsers omits blank optional fields per user', () => {
  const users = engine.buildUsers([{ handle: 'qa_tester', phone: '0501234567', email: '', role: '', notes: '' }]);
  assert.deepEqual(users.qa_tester, { phone: '0501234567' });
});

test('buildConfigs writes db/api secret refs as envSecret pointers, never literal values', () => {
  const { envConfig, envVars } = engine.buildConfigs({
    name: 'x', portalUrl: 'https://x.test', users: [{ handle: 'u' }],
    'db.server': 'localhost', 'db.passwordEnvVar': 'DB_PASS', 'db.passwordValue': 's3cret',
    'api.baseUrl': 'https://api.x.test', 'api.tokenEnvVar': 'API_TOKEN', 'api.tokenValue': 'tok123',
  });
  assert.deepEqual(envConfig.db.password, { envSecret: 'DB_PASS' });
  assert.deepEqual(envConfig.api.token, { envSecret: 'API_TOKEN' });
  assert.equal(envVars.DB_PASS, 's3cret');
  assert.equal(envVars.API_TOKEN, 'tok123');
  assert.equal(JSON.stringify(envConfig).includes('s3cret'), false);
});

test('validate flags missing project name, bad env name, bad URL, and no users', () => {
  const errors = engine.validate({ name: '', envName: 'BAD NAME!', portalUrl: 'not-a-url', users: [] });
  assert.ok(errors.some((e) => /project name/i.test(e)));
  assert.ok(errors.some((e) => /environment name/i.test(e)));
  assert.ok(errors.some((e) => /portal url/i.test(e)));
  assert.ok(errors.some((e) => /test user/i.test(e)));
});

test('validate accepts a minimal valid answer set', () => {
  const errors = engine.validate({
    name: 'Acme', envName: 'dev', portalUrl: 'https://acme.test',
    users: [{ handle: 'valid_user' }],
  });
  assert.deepEqual(errors, []);
});

test('validateConfigs catches an invalid built config even if validate() was bypassed', () => {
  const errors = engine.validateConfigs({ name: '' }, { portalUrl: 'nope', users: {} }, 'BAD ENV');
  assert.ok(errors.length >= 3);
});
