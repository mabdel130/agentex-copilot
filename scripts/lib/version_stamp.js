'use strict';
// Shared `.agentex/version.json` stamp helpers — the ONE place that reads/writes a consumer
// project's recorded agentex-copilot version. Used by both the init-test skill (stamps a
// freshly-scaffolded project as up to date immediately) and the update-plugin skill's
// migration engine (advances the stamp forward as migrations run).
//
// Mirrors upstream agentex's own version-stamp convention (`scripts/lib/scaffold.js`'s
// `readVersionStamp`/`writeVersionStamp`), adapted to this port's plugin.json-based versioning
// (upstream reads its Claude plugin manifest; this port reads its own root plugin.json).

const fs = require('fs');
const path = require('path');

const STAMP_REL = path.join('.agentex', 'version.json');

// Reads the installed plugin's own version from its root plugin.json. `pluginRoot` is this
// plugin's own installed location (NOT the consumer project).
function readInstalledVersion(pluginRoot) {
  const pluginJsonPath = path.join(pluginRoot, 'plugin.json');
  const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
  if (!pluginJson.version) {
    throw new Error(`plugin.json at ${pluginJsonPath} has no "version" field`);
  }
  return pluginJson.version;
}

// Reads the consumer project's stamp. Returns { version: '0.0.0', path, existed: false } when
// absent or unparsable (treated as "no prior stamp" rather than an error) — never throws.
function readStamp(targetRoot) {
  const stampPath = path.join(targetRoot, STAMP_REL);
  if (!fs.existsSync(stampPath)) return { version: '0.0.0', path: stampPath, existed: false };
  try {
    const parsed = JSON.parse(fs.readFileSync(stampPath, 'utf8'));
    if (!parsed.agentexCopilotVersion) return { version: '0.0.0', path: stampPath, existed: true };
    return { version: parsed.agentexCopilotVersion, path: stampPath, existed: true };
  } catch {
    return { version: '0.0.0', path: stampPath, existed: true };
  }
}

function writeStamp(stampPath, version) {
  fs.mkdirSync(path.dirname(stampPath), { recursive: true });
  fs.writeFileSync(stampPath, JSON.stringify({ agentexCopilotVersion: version }, null, 2) + '\n');
}

module.exports = { STAMP_REL, readInstalledVersion, readStamp, writeStamp };
