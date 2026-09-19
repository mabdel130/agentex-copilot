'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  BASE_ALLOW_RULES,
  AZURE_ALLOW_RULES,
  DENY_RULES,
  buildCopilotArgs,
  resolveInstallPaths,
  renderLauncher,
  renderWindowsShim,
  isManagedLauncher,
} = require(path.join('..', 'scripts', 'lib', 'global_launcher.js'));

test('buildCopilotArgs adds base allow rules and destructive-command denials', () => {
  const args = buildCopilotArgs(['--model', 'auto']);

  for (const rule of BASE_ALLOW_RULES) assert.ok(args.includes(`--allow-tool=${rule}`));
  for (const rule of DENY_RULES) assert.ok(args.includes(`--deny-tool=${rule}`));
  assert.deepEqual(args.slice(-2), ['--model', 'auto']);
});

test('buildCopilotArgs adds Azure rules only when explicitly requested', () => {
  const defaultArgs = buildCopilotArgs([]);
  const azureArgs = buildCopilotArgs(['--with-azure']);

  for (const rule of AZURE_ALLOW_RULES) {
    assert.ok(!defaultArgs.includes(`--allow-tool=${rule}`));
    assert.ok(azureArgs.includes(`--allow-tool=${rule}`));
  }
  assert.ok(!azureArgs.includes('--with-azure'));
});

test('launcher never enables allow-all or persistent write approval', () => {
  const content = renderLauncher();

  assert.ok(content.includes("process.platform === 'win32' ? 'copilot.cmd' : 'copilot'"));
  assert.ok(!content.includes('--allow-all'));
  assert.ok(!content.includes('kind: \'write\''));
  assert.ok(!content.includes('shell(curl*)'));
  assert.ok(!content.includes('shell(sqlcmd*)'));
});

test('generated launcher and Windows shim carry the managed marker', () => {
  assert.equal(isManagedLauncher(renderLauncher()), true);
  assert.equal(isManagedLauncher(renderWindowsShim()), true);
  assert.equal(isManagedLauncher('# unrelated launcher'), false);
});

test('resolveInstallPaths uses the current user npm command directory on Windows', () => {
  const paths = resolveInstallPaths({
    platform: 'win32',
    env: { APPDATA: 'C:\\Users\\qa\\AppData\\Roaming' },
    homeDir: 'C:\\Users\\qa',
  });

  assert.equal(paths.binDir, 'C:\\Users\\qa\\AppData\\Roaming\\npm');
  assert.equal(paths.launcherPath, 'C:\\Users\\qa\\AppData\\Roaming\\npm\\agentex-launcher.js');
  assert.equal(paths.shimPath, 'C:\\Users\\qa\\AppData\\Roaming\\npm\\agentex.cmd');
});

test('resolveInstallPaths uses ~/.local/bin on non-Windows systems', () => {
  const paths = resolveInstallPaths({
    platform: 'linux',
    env: {},
    homeDir: '/home/qa',
  });

  assert.equal(paths.binDir, '/home/qa/.local/bin');
  assert.equal(paths.launcherPath, '/home/qa/.local/bin/agentex');
  assert.equal(paths.shimPath, null);
});

test(
  'installer refuses to overwrite an unmanaged Windows launcher',
  { skip: process.platform !== 'win32' },
  (t) => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agentex-launcher-'));
    t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
    const binDir = path.join(tempRoot, 'npm');
    const shimPath = path.join(binDir, 'agentex.cmd');
    fs.mkdirSync(binDir, { recursive: true });
    fs.writeFileSync(shimPath, '@echo off\r\necho unrelated\r\n');

    const result = spawnSync(process.execPath, ['scripts/install-global-launcher.js'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, APPDATA: tempRoot },
      encoding: 'utf8',
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Refusing to overwrite/);
    assert.equal(fs.readFileSync(shimPath, 'utf8'), '@echo off\r\necho unrelated\r\n');
  }
);

test('installer dry run does not create launcher files', { skip: process.platform !== 'win32' }, (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agentex-launcher-'));
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));

  const result = spawnSync(process.execPath, ['scripts/install-global-launcher.js', '--dry-run'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, APPDATA: tempRoot },
    encoding: 'utf8',
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Dry run only; nothing written/);
  assert.equal(fs.existsSync(path.join(tempRoot, 'npm', 'agentex.cmd')), false);
});

test('installed launcher exposes safe default and opt-in Azure arguments', { skip: process.platform !== 'win32' }, (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agentex-launcher-'));
  t.after(() => fs.rmSync(tempRoot, { recursive: true, force: true }));
  const options = {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, APPDATA: tempRoot },
    encoding: 'utf8',
  };

  const install = spawnSync(process.execPath, ['scripts/install-global-launcher.js'], options);
  assert.equal(install.status, 0, install.stderr);

  const launcherPath = path.join(tempRoot, 'npm', 'agentex-launcher.js');
  const defaultRun = spawnSync(process.execPath, [launcherPath, '--dry-run'], options);
  const azureRun = spawnSync(process.execPath, [launcherPath, '--with-azure', '--dry-run'], options);
  assert.equal(defaultRun.status, 0, defaultRun.stderr);
  assert.equal(azureRun.status, 0, azureRun.stderr);

  const defaultArgs = JSON.parse(defaultRun.stdout).args;
  const azureArgs = JSON.parse(azureRun.stdout).args;
  assert.ok(defaultArgs.includes('--deny-tool=shell(git push*)'));
  assert.ok(!defaultArgs.includes('--allow-tool=shell(az account*)'));
  assert.ok(azureArgs.includes('--allow-tool=shell(az account*)'));
  assert.ok(!azureArgs.includes('--allow-all'));
});
