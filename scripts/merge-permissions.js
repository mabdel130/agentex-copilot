#!/usr/bin/env node
// Merges this plugin's recommended `tool_approvals` (from
// config/copilot-permissions-config.example.json) into a CONSUMER project's
// ~/.copilot/permissions-config.json, so routine commands (bundled node scripts, Playwright,
// read-only az calls) stop prompting for approval on every run.
//
// Usage:
//   node scripts/merge-permissions.js [projectDir] [--with-azure] [--dry-run]
//
//   projectDir   Defaults to process.cwd(). Resolved to its git root (or used as-is if it
//                isn't a git repo), matching how Copilot CLI keys permissions-config.json.
//   --with-azure Also approve the read-only `az ...` commands (azure-integration skill users
//                only). Omitted by default.
//   --dry-run    Print what would change without writing the file.
//
// Deliberately narrow: only ever ADDS `commands`-kind approvals for the specific identifiers
// upstream's settings.example.json recommends (node:*, npx playwright-cli:*, npm install:*,
// and the read-only az:* set). Never adds `write` or any destructive-command approval — this
// file format has no deny concept (see the docs comment in permissions_merge.js), so keeping
// the *allow* side narrow is the only protection available here. Pair this with the
// `--deny-tool` flags documented in DEPLOYMENT.md step 7 for rm/git-push/source-tree denials.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const {
  flattenCommandIdentifiers,
  filterTemplateIdentifiers,
  computeMissingIdentifiers,
  toLocationKey,
} = require('./lib/permissions_merge.js');

const pluginRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const withAzure = args.includes('--with-azure');
const dryRun = args.includes('--dry-run');
const positional = args.find((a) => !a.startsWith('--'));
const targetInput = path.resolve(positional || process.cwd());

if (targetInput === pluginRoot) {
  console.error(
    'Refusing to merge permissions for the agentex-copilot plugin itself.\n' +
      'Pass the path to the consumer project you want to test instead:\n' +
      '  node scripts/merge-permissions.js /path/to/your-project'
  );
  process.exit(1);
}

function resolveGitRoot(dir) {
  try {
    return execSync('git rev-parse --show-toplevel', { cwd: dir, stdio: 'pipe' })
      .toString()
      .trim();
  } catch {
    return dir; // not a git repo — use the normalized directory itself, per the docs
  }
}

function resolvePermissionsConfigPath() {
  const configDir = process.env.COPILOT_HOME || path.join(os.homedir(), '.copilot');
  return path.join(configDir, 'permissions-config.json');
}

function readTemplateApprovals() {
  const templatePath = path.join(pluginRoot, 'config', 'copilot-permissions-config.example.json');
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  const placeholderKey = '<ABSOLUTE-PATH-TO-YOUR-PROJECT>';
  return template.locations[placeholderKey].tool_approvals;
}

function readPermissionsConfig(configPath) {
  if (!fs.existsSync(configPath)) return { locations: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!parsed.locations) parsed.locations = {};
    return parsed;
  } catch (err) {
    throw new Error(`Could not parse ${configPath}: ${err.message}`);
  }
}

function main() {
  const gitRoot = resolveGitRoot(targetInput);
  const locationKey = toLocationKey(gitRoot);

  const templateApprovals = readTemplateApprovals();
  const desiredIdentifiers = filterTemplateIdentifiers(templateApprovals, { includeAzure: withAzure });

  const configPath = resolvePermissionsConfigPath();
  const config = readPermissionsConfig(configPath);
  const location = config.locations[locationKey] || { tool_approvals: [] };
  if (!Array.isArray(location.tool_approvals)) location.tool_approvals = [];

  const existing = flattenCommandIdentifiers(location.tool_approvals);
  const missing = computeMissingIdentifiers(existing, desiredIdentifiers);

  console.log(`agentex-copilot merge-permissions\n  config file: ${configPath}\n  location:    ${locationKey}\n`);

  if (missing.length === 0) {
    console.log('Already up to date — every recommended command identifier is already approved.');
    if (!withAzure) {
      console.log('(az:* rules were not requested — pass --with-azure to add them.)');
    }
    return;
  }

  console.log('Would add:' + (dryRun ? ' (dry run — nothing written)' : ''));
  missing.forEach((id) => console.log(`  + ${id}`));

  const alreadyPresent = desiredIdentifiers.filter((id) => !missing.includes(id));
  if (alreadyPresent.length) {
    console.log('\nAlready approved (left untouched):');
    alreadyPresent.forEach((id) => console.log(`  = ${id}`));
  }

  if (dryRun) return;

  location.tool_approvals.push({ kind: 'commands', commandIdentifiers: missing });
  config.locations[locationKey] = location;
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

  console.log(
    `\n[ok] wrote ${configPath}\n\n` +
      'Reminder: this file has no deny concept. For rm/git-push/source-tree protection, use the ' +
      '--deny-tool flags in DEPLOYMENT.md step 7, or answer "deny" (not "don\'t ask again") at ' +
      'the prompt. If a Copilot CLI session is currently running against this project, restart ' +
      'it to pick up the change.'
  );
}

main();
