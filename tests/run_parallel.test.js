'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { validateManifest } = require('../skills/browser-testing/scripts/run_parallel.js');
const { resolveProjectPath, resolveProjectRoot } = require('../skills/browser-testing/scripts/project_root.js');

function validManifest() {
  return {
    version: 1,
    run: { directory: 'executions/execu_test' },
    options: { browser: 'chromium', mode: 'headless', workers: 2 },
    specs: [{
      id: 'catalog',
      session: 'catalog-1234',
      url: 'https://example.com/products',
      scenarios: [{ name: 'Catalog loads', steps: [{ action: 'assertVisible', selector: 'main' }] }],
    }],
  };
}

test('accepts a constrained browser manifest', () => {
  assert.equal(validateManifest(validManifest()).version, 1);
});

test('rejects unsupported executable actions', () => {
  const manifest = validManifest();
  manifest.specs[0].scenarios[0].steps = [{ action: 'eval', selector: 'main' }];
  assert.throws(() => validateManifest(manifest), /unsupported action/);
});

test('rejects duplicate isolated sessions', () => {
  const manifest = validManifest();
  manifest.specs.push({ ...manifest.specs[0], id: 'duplicate' });
  assert.throws(() => validateManifest(manifest), /duplicate session/);
});

test('rejects output paths outside the project', () => {
  const manifest = validManifest();
  manifest.run.directory = '../outside';
  assert.throws(() => validateManifest(manifest), /relative path/);
});

test('rejects persistent profiles to preserve fallback behavior', () => {
  const manifest = validManifest();
  manifest.options.persistent = true;
  assert.throws(() => validateManifest(manifest), /Agent CLI fallback/);
});

test('uses the nearest configured parent as the project root', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentex-project-'));
  const nested = path.join(root, 'test', 'suite1');
  fs.mkdirSync(path.join(root, 'config'), { recursive: true });
  fs.mkdirSync(nested, { recursive: true });
  fs.writeFileSync(path.join(root, 'config', 'project.json'), '{}');
  try {
    assert.equal(resolveProjectRoot(nested), root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('rejects paths outside the active project root', () => {
  assert.throws(
    () => resolveProjectPath(path.resolve('project'), '../another-project/executions/run', 'run directory'),
    /inside the active project/,
  );
});
