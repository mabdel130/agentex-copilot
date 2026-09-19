#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');

const {
  resolveInstallPaths,
  renderLauncher,
  renderWindowsShim,
  isManagedLauncher,
} = require('./lib/global_launcher.js');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const uninstall = args.includes('--uninstall');
const force = args.includes('--force');
const unknown = args.filter((arg) => !['--dry-run', '--uninstall', '--force', '-h', '--help'].includes(arg));

function printUsage(stream = process.stdout) {
  stream.write(`Usage:
  node scripts/install-global-launcher.js [--dry-run] [--force]
  node scripts/install-global-launcher.js --uninstall [--dry-run]

Installs the user-level "agentex" command. Run "agentex --with-azure" to include the
optional read-only Azure command approvals, or "agentex --dry-run" to inspect the exact
Copilot CLI arguments without starting a session.

Options:
  --dry-run    Show the affected files without changing them
  --force      Replace an existing non-AgenTeX launcher
  --uninstall  Remove the managed launcher
  -h, --help   Show this help message
`);
}

if (args.includes('-h') || args.includes('--help')) {
  printUsage();
  process.exit(0);
}

if (unknown.length) {
  printUsage(process.stderr);
  console.error('\nUnknown option(s): ' + unknown.join(', '));
  process.exit(1);
}

const paths = resolveInstallPaths({ homeDir: os.homedir() });
const targets = [paths.launcherPath, paths.shimPath].filter(Boolean);

function existingUnmanagedTargets() {
  return targets.filter((target) => {
    if (!fs.existsSync(target)) return false;
    return !isManagedLauncher(fs.readFileSync(target, 'utf8'));
  });
}

if (uninstall) {
  const removable = targets.filter(
    (target) => fs.existsSync(target) && isManagedLauncher(fs.readFileSync(target, 'utf8'))
  );
  console.log('AgenTeX global launcher uninstall');
  removable.forEach((target) => console.log(`  - ${target}`));
  if (!removable.length) {
    console.log('No managed launcher is installed.');
    process.exit(0);
  }
  if (dryRun) {
    console.log('Dry run only; nothing removed.');
    process.exit(0);
  }
  removable.forEach((target) => fs.unlinkSync(target));
  console.log('Removed the AgenTeX global launcher.');
  process.exit(0);
}

const unmanaged = existingUnmanagedTargets();
if (unmanaged.length && !force) {
  console.error(
    'Refusing to overwrite an existing launcher not managed by AgenTeX:\n' +
      unmanaged.map((target) => `  ${target}`).join('\n') +
      '\nRe-run with --force only after reviewing those files.'
  );
  process.exit(1);
}

console.log('AgenTeX global launcher install');
targets.forEach((target) => console.log(`  + ${target}`));
if (dryRun) {
  console.log('Dry run only; nothing written.');
  process.exit(0);
}

fs.mkdirSync(paths.binDir, { recursive: true });
fs.writeFileSync(paths.launcherPath, renderLauncher(), { mode: 0o755 });
if (paths.shimPath) fs.writeFileSync(paths.shimPath, renderWindowsShim());

console.log(`
Installed the "agentex" command.

Examples:
  agentex
  agentex --with-azure
  agentex --dry-run
  agentex --uninstall

Directory trust remains project-specific. In each new project, choose
"Yes, and remember this folder for future sessions" only when you trust that project.`);
