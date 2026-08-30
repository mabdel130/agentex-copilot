'use strict';

const { spawnSync } = require('node:child_process');

function probe(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: 60_000,
  });
  if (result.error || result.status !== 0) {
    return {
      ok: false,
      error: (result.error && result.error.message) ||
        (result.stderr || '').trim().split(/\r?\n/)[0] ||
        `exit ${result.status}`,
    };
  }
  const version = `${result.stdout || ''}${result.stderr || ''}`
    .trim().split(/\r?\n/).find((line) => line.trim());
  return { ok: true, version: (version || 'available').slice(0, 120) };
}

function probePlaywright() {
  if (process.platform === 'win32') {
    return probe(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npx playwright --version']);
  }
  return probe('npx', ['playwright', '--version']);
}

function probePlaywrightCli() {
  if (process.platform === 'win32') {
    return probe(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npx --no-install playwright-cli --version']);
  }
  return probe('npx', ['--no-install', 'playwright-cli', '--version']);
}

module.exports = { probe, probePlaywright, probePlaywrightCli };

if (require.main === module) {
  console.log(JSON.stringify({
    node: { ok: true, version: process.version },
    playwright: probePlaywright(),
    playwrightCli: probePlaywrightCli(),
  }));
}
