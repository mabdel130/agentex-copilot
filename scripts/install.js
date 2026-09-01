#!/usr/bin/env node
// Fallback installer for environments without the `copilot` CLI (e.g. VS Code Copilot Chat
// only). If you have the Copilot CLI, prefer:
//   copilot plugin install mabdel130/agentex-copilot
// This script vendors the same agent, browser-testing skill, and policy files directly into a
// project instead, plus a .github/copilot-instructions.md pointer so Copilot Chat picks them up
// automatically. Re-runs update plugin-owned assets while preserving project instructions and
// configuration files.

const fs = require('fs');
const path = require('path');

const sourceRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const targetArgIndex = args.indexOf('--target');

function printUsage(stream = process.stdout) {
  stream.write(`Usage:
  npx github:mabdel130/agentex-copilot --target /path/to/your-project
  npx github:mabdel130/agentex-copilot              # installs into the current directory

Options:
  --target <path>   Project to scaffold for AgenTeX
  -h, --help        Show this help message
`);
}

if (args.includes('-h') || args.includes('--help')) {
  printUsage();
  process.exit(0);
}

if (targetArgIndex !== -1) {
  const targetValue = args[targetArgIndex + 1];
  if (!targetValue || targetValue.startsWith('-')) {
    printUsage(process.stderr);
    console.error('\nError: --target requires a directory path.');
    process.exit(1);
  }
}

const targetRoot = path.resolve(targetArgIndex !== -1 ? args[targetArgIndex + 1] : process.cwd());

if (targetRoot === sourceRoot) {
  console.error(
    'Refusing to install into agentex-copilot itself.\n' +
      'Run this from the project you want to test instead, e.g.:\n' +
      '  node ' + path.join(sourceRoot, 'scripts', 'install.js') + ' --target /path/to/your-project'
  );
  process.exit(1);
}

const created = [];
const updated = [];
const skipped = [];

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (fs.existsSync(destPath)) {
      if (fs.readFileSync(srcPath).equals(fs.readFileSync(destPath))) {
        skipped.push(path.relative(targetRoot, destPath));
      } else {
        fs.copyFileSync(srcPath, destPath);
        updated.push(path.relative(targetRoot, destPath));
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
      created.push(path.relative(targetRoot, destPath));
    }
  }
}

function ensureFile(destPath, srcPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  if (fs.existsSync(destPath)) {
    skipped.push(path.relative(targetRoot, destPath));
    return;
  }
  fs.copyFileSync(srcPath, destPath);
  created.push(path.relative(targetRoot, destPath));
}

// 1. Vendor the agent role definitions, browser-testing skill, and policy docs.
copyDir(path.join(sourceRoot, 'agents'), path.join(targetRoot, '.github', 'agentex', 'agents'));
copyDir(
  path.join(sourceRoot, 'skills', 'browser-testing'),
  path.join(targetRoot, '.github', 'agentex', 'skills', 'browser-testing')
);
copyDir(path.join(sourceRoot, 'docs', 'ai'), path.join(targetRoot, '.github', 'agentex', 'ai-docs'));

// 2. Entrypoint files (never overwritten if the project already has its own).
ensureFile(path.join(targetRoot, 'AGENTS.md'), path.join(sourceRoot, 'templates', 'AGENTS.md'));
ensureFile(
  path.join(targetRoot, '.github', 'copilot-instructions.md'),
  path.join(sourceRoot, 'templates', 'copilot-instructions.md')
);

// 3. Configuration scaffolding.
ensureFile(
  path.join(targetRoot, 'config', 'project.json'),
  path.join(sourceRoot, 'config', 'project.json.example')
);
ensureFile(
  path.join(targetRoot, 'config', 'environments', 'dev.json'),
  path.join(sourceRoot, 'config', 'environments', 'dev.json.example')
);
ensureFile(path.join(targetRoot, '.env'), path.join(sourceRoot, '.env.example'));

console.log(`\nagentex-copilot installed into ${targetRoot}\n`);
if (created.length) {
  console.log('Created:');
  created.forEach((f) => console.log('  [created] ' + f));
}
if (updated.length) {
  console.log('Updated bundled AgenTeX assets:');
  updated.forEach((f) => console.log('  [updated] ' + f));
}
if (skipped.length) {
  console.log('Already current or project-owned (left untouched):');
  skipped.forEach((f) => console.log('  [skipped] ' + f));
}

console.log(`
Next steps:
  1. npm install -D @playwright/test && npx playwright install chromium
  2. Edit config/project.json and config/environments/dev.json for your target app
  3. Fill in .env for any secrets your specs need
  4. In Copilot Chat (agent mode), ask: "Test <your-url> — <what to check>"

If you have the Copilot CLI, you likely didn't need this script — try instead:
  copilot plugin install mabdel130/agentex-copilot
`);
