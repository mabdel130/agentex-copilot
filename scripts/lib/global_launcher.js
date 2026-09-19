'use strict';

const path = require('path');

const MANAGED_MARKER = 'agentex-copilot managed global launcher';

const BASE_ALLOW_RULES = [
  'shell(npx playwright-cli*)',
  'shell(node*)',
  'shell(npm install*)',
];

const AZURE_ALLOW_RULES = [
  'shell(az --version)',
  'shell(az login*)',
  'shell(az account*)',
  'shell(az group list*)',
  'shell(az resource list*)',
  'shell(az webapp list*)',
  'shell(az webapp show*)',
  'shell(az webapp log*)',
  'shell(az storage account list*)',
  'shell(az storage blob list*)',
  'shell(az keyvault list*)',
  'shell(az keyvault secret list*)',
  'shell(az aks list*)',
];

const DENY_RULES = [
  'shell(rm -rf*)',
  'shell(rm -fr*)',
  'shell(rm -r*)',
  'shell(Remove-Item*)',
  'shell(rmdir*)',
  'shell(git push*)',
  'shell(git reset --hard*)',
  'shell(git clean*)',
];

function buildCopilotArgs(userArgs) {
  const includeAzure = userArgs.includes('--with-azure');
  const passthrough = userArgs.filter((arg) => arg !== '--with-azure');
  const allowRules = includeAzure ? BASE_ALLOW_RULES.concat(AZURE_ALLOW_RULES) : BASE_ALLOW_RULES;

  return [
    ...allowRules.map((rule) => `--allow-tool=${rule}`),
    ...DENY_RULES.map((rule) => `--deny-tool=${rule}`),
    ...passthrough,
  ];
}

function resolveInstallPaths({ platform = process.platform, env = process.env, homeDir }) {
  if (platform === 'win32') {
    const appData = env.APPDATA;
    if (!appData) throw new Error('APPDATA is not set; cannot locate the current user npm command directory.');
    const binDir = path.win32.join(appData, 'npm');
    return {
      binDir,
      launcherPath: path.win32.join(binDir, 'agentex-launcher.js'),
      shimPath: path.win32.join(binDir, 'agentex.cmd'),
    };
  }

  const binDir = path.posix.join(homeDir, '.local', 'bin');
  return {
    binDir,
    launcherPath: path.posix.join(binDir, 'agentex'),
    shimPath: null,
  };
}

function renderLauncher() {
  return `#!/usr/bin/env node
'use strict';
// ${MANAGED_MARKER}

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const BASE_ALLOW_RULES = ${JSON.stringify(BASE_ALLOW_RULES, null, 2)};
const AZURE_ALLOW_RULES = ${JSON.stringify(AZURE_ALLOW_RULES, null, 2)};
const DENY_RULES = ${JSON.stringify(DENY_RULES, null, 2)};
const args = process.argv.slice(2);

if (args.includes('--uninstall')) {
  const files = [__filename];
  if (process.platform === 'win32') files.unshift(path.join(__dirname, 'agentex.cmd'));
  for (const file of files) {
    try {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch (err) {
      console.error('Could not remove ' + file + ': ' + err.message);
      process.exitCode = 1;
    }
  }
  if (!process.exitCode) console.log('Removed the AgenTeX global launcher.');
  process.exit();
}

const includeAzure = args.includes('--with-azure');
const dryRun = args.includes('--dry-run');
const passthrough = args.filter((arg) => arg !== '--with-azure' && arg !== '--dry-run');
const allowRules = includeAzure ? BASE_ALLOW_RULES.concat(AZURE_ALLOW_RULES) : BASE_ALLOW_RULES;
const copilotArgs = [
  ...allowRules.map((rule) => '--allow-tool=' + rule),
  ...DENY_RULES.map((rule) => '--deny-tool=' + rule),
  ...passthrough,
];

if (dryRun) {
  console.log(JSON.stringify({ command: 'copilot', args: copilotArgs }, null, 2));
  process.exit();
}

const command = process.platform === 'win32' ? 'copilot.cmd' : 'copilot';
const result = spawnSync(command, copilotArgs, { stdio: 'inherit' });
if (result.error) {
  console.error('Could not start Copilot CLI: ' + result.error.message);
  process.exit(1);
}
process.exit(result.status === null ? 1 : result.status);
`;
}

function renderWindowsShim() {
  return `@echo off\r
rem ${MANAGED_MARKER}\r
node "%~dp0agentex-launcher.js" %*\r
exit /b %ERRORLEVEL%\r
`;
}

function isManagedLauncher(content) {
  return content.includes(MANAGED_MARKER);
}

module.exports = {
  MANAGED_MARKER,
  BASE_ALLOW_RULES,
  AZURE_ALLOW_RULES,
  DENY_RULES,
  buildCopilotArgs,
  resolveInstallPaths,
  renderLauncher,
  renderWindowsShim,
  isManagedLauncher,
};
