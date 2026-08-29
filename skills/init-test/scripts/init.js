#!/usr/bin/env node
// Deterministic scaffolding for the init-test skill. Never overwrites an existing file —
// idempotent, safe to re-run. Run from the project you want to test; writes relative to
// process.cwd(), reading its templates from this plugin's own installed location.

const fs = require('fs');
const path = require('path');

const pluginRoot = path.resolve(__dirname, '..', '..', '..'); // skills/init-test/scripts -> plugin root
const targetRoot = process.cwd();

if (targetRoot === pluginRoot) {
  console.error(
    'Refusing to scaffold inside the agentex-copilot plugin itself.\n' +
      'Run this from the project you want to test instead.'
  );
  process.exit(1);
}

const created = [];
const skipped = [];
const skippedNoSuffix = [];

function ensureFile(destPath, srcPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  if (fs.existsSync(destPath)) {
    skipped.push(path.relative(targetRoot, destPath));
    return;
  }
  fs.copyFileSync(srcPath, destPath);
  created.push(path.relative(targetRoot, destPath));
}

function appendGitignore(lines) {
  const gitignorePath = path.join(targetRoot, '.gitignore');
  const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const existingLines = new Set(existing.split(/\r?\n/).map((l) => l.trim()));
  const missing = lines.filter((l) => !existingLines.has(l.trim()));
  if (missing.length === 0) {
    skippedNoSuffix.push('.gitignore (entries already present)');
    return;
  }
  const separator = existing.length && !existing.endsWith('\n') ? '\n' : '';
  fs.writeFileSync(
    gitignorePath,
    existing + separator + '\n# AgenTeX\n' + missing.join('\n') + '\n'
  );
  created.push('.gitignore (appended ' + missing.length + ' entr' + (missing.length === 1 ? 'y' : 'ies') + ')');
}

ensureFile(
  path.join(targetRoot, 'config', 'project.json'),
  path.join(pluginRoot, 'config', 'project.json.example')
);
ensureFile(
  path.join(targetRoot, 'config', 'environments', 'dev.json'),
  path.join(pluginRoot, 'config', 'environments', 'dev.json.example')
);
ensureFile(path.join(targetRoot, '.env'), path.join(pluginRoot, '.env.example'));

// integration/ catalog — the ONLY api:/db: entries an agent may ever execute. Samples come
// from the skills that own each format; never overwritten if the user already has their own.
ensureFile(
  path.join(targetRoot, 'integration', 'sample_api.json'),
  path.join(pluginRoot, 'skills', 'api-integration', 'templates', 'sample_api.json')
);
ensureFile(
  path.join(targetRoot, 'integration', 'sample_db.json'),
  path.join(pluginRoot, 'skills', 'db-integration', 'templates', 'sample_db.json')
);

// test/ specs — only seed the bundled samples when the user has no specs of their own yet.
// An existing test/ with any content (their own specs) is left completely untouched.
const testDir = path.join(targetRoot, 'test');
const testHasContent = fs.existsSync(testDir) && fs.readdirSync(testDir).length > 0;
if (!testHasContent) {
  ensureFile(path.join(testDir, 'README.md'), path.join(pluginRoot, 'test', 'README.md'));
  ensureFile(
    path.join(testDir, 'suite1', 'signup-form.md'),
    path.join(pluginRoot, 'test', 'suite1', 'signup-form.md')
  );
  ensureFile(
    path.join(testDir, 'suite1', 'product-search.md'),
    path.join(pluginRoot, 'test', 'suite1', 'product-search.md')
  );
} else {
  skippedNoSuffix.push('test/ (already has your own specs — left untouched)');
}

appendGitignore(['.env', '.env.*', '!.env.example', 'executions/*', '!executions/README.md', 'test/.auth/']);

console.log(`\nagentex-copilot init-test — scaffolded ${targetRoot}\n`);
if (created.length) {
  created.forEach((f) => console.log('  [created] ' + f));
}
if (skipped.length) {
  skipped.forEach((f) => console.log('  [skipped] ' + f + ' (already exists)'));
}
if (skippedNoSuffix.length) {
  skippedNoSuffix.forEach((f) => console.log('  [skipped] ' + f));
}
console.log('');
