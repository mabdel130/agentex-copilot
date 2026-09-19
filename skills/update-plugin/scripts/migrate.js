#!/usr/bin/env node
// CLI wrapper for the update-plugin skill's migration engine. Run from the consumer project
// root:
//   node <this skill's directory>/scripts/migrate.js
//
// Detects the project's current `.agentex/version.json` stamp (legacy projects carry none),
// runs any pending migrations from `./migrations/` via `engine.js`, prints one line per
// migration plus a summary, and writes the new stamp only when nothing manual/failed remains.
//
// Exit codes: 0 = success (including "already up to date"), 2 = aborted before any migration
// ran (dirty git tree, not a git repo, or stamp newer than the installed plugin), 1 = an
// unexpected error.

const path = require('path');
const { execSync } = require('child_process');

const engine = require('./engine.js');
const migrations = require('./index.js');
const { readInstalledVersion, readStamp: readStampShared, writeStamp } = require(
  path.join('..', '..', '..', 'scripts', 'lib', 'version_stamp.js')
);

const pluginRoot = path.resolve(__dirname, '..', '..', '..'); // skills/update-plugin/scripts -> plugin root
const targetRoot = process.cwd();

function fail(code, message) {
  console.error(message);
  process.exit(code);
}

if (targetRoot === pluginRoot) {
  fail(
    1,
    'Refusing to run inside the agentex-copilot plugin itself.\n' +
      'Run this from the consumer project you want to migrate instead.'
  );
}

function readStamp() {
  return readStampShared(targetRoot);
}

function isGitRepo() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: targetRoot, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function isGitTreeClean() {
  const status = execSync('git status --porcelain', { cwd: targetRoot, stdio: 'pipe' }).toString();
  return status.trim().length === 0;
}

function main() {
  const installedVersion = readInstalledVersion(pluginRoot);
  const stamp = readStamp();

  if (engine.compareVersions(stamp.version, installedVersion) > 0) {
    fail(
      2,
      `Project stamp (${stamp.version}) is newer than the installed plugin (${installedVersion}).\n` +
        'This project was set up by a newer agentex-copilot — update the plugin instead:\n' +
        '  copilot plugin update agentex-copilot'
    );
  }

  const pending = engine.pendingMigrations(migrations, stamp.version, installedVersion);

  if (pending.length === 0) {
    console.log(
      `agentex-copilot update-plugin: already up to date (project stamp ${stamp.version === '0.0.0' ? 'none' : stamp.version}, plugin ${installedVersion}).`
    );
    if (!stamp.existed || stamp.version !== installedVersion) {
      writeStamp(stamp.path, installedVersion);
      console.log(`  [ok] stamped .agentex/version.json -> ${installedVersion}`);
    }
    process.exit(0);
  }

  if (!isGitRepo()) {
    fail(
      2,
      'Not a git repository. git is this engine\'s rollback mechanism — run `git init`, ' +
        'commit, and re-run.'
    );
  }
  if (!isGitTreeClean()) {
    fail(
      2,
      'Working tree is not clean. Commit or stash your changes first, then re-run — git is ' +
        'the rollback mechanism for this migration.'
    );
  }

  console.log(
    `agentex-copilot update-plugin: migrating ${stamp.version === '0.0.0' ? '(no prior stamp)' : stamp.version} -> ${installedVersion}\n`
  );

  const results = engine.runMigrations(pending, targetRoot);
  for (const r of results) {
    const line = `  [${r.status}] ${r.id} (-> ${r.toVersion})` + (r.message ? `: ${r.message}` : '');
    console.log(line);
  }

  const newStamp = engine.nextStamp(results, installedVersion, stamp.version);
  if (newStamp !== stamp.version) {
    writeStamp(stamp.path, newStamp);
    console.log(`\n[ok] stamped .agentex/version.json -> ${newStamp}`);
  } else {
    console.log(
      '\n[withheld] stamp not updated — resolve the manual/failed items above, then re-run.'
    );
  }

  const hasFailed = results.some((r) => r.status === 'failed');
  process.exit(hasFailed ? 1 : 0);
}

main();
