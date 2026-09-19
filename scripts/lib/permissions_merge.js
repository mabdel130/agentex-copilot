'use strict';
// Pure logic for merging this plugin's recommended `tool_approvals` into a consumer project's
// permissions-config.json — no file/git I/O here, so it's directly testable.
// `scripts/merge-permissions.js` is the CLI wrapper that does the actual reading/writing.
//
// Schema reference (confirmed against GitHub's own docs, "GitHub Copilot CLI configuration
// directory" → permissions-config.json): a `commands` approval's `commandIdentifiers` are
// matched literally, except a trailing `:*` matches the text before it, alone or followed by a
// space and more text. There is no deny/ask/default-mode concept in this file — that's why this
// script only ever ADDS narrow `commands` approvals, never `write` or destructive commands.

const path = require('path');

// Every `commands`-kind identifier already approved for a location, across however many
// separate tool_approvals entries recorded them.
function flattenCommandIdentifiers(toolApprovals) {
  const out = new Set();
  for (const approval of toolApprovals || []) {
    if (approval && approval.kind === 'commands' && Array.isArray(approval.commandIdentifiers)) {
      for (const id of approval.commandIdentifiers) out.add(id);
    }
  }
  return out;
}

// Reduces the template file's tool_approvals (read from
// config/copilot-permissions-config.example.json) to just the `commands`-kind identifiers,
// optionally excluding the `az ...` entries when the project doesn't use the azure-integration
// skill.
function filterTemplateIdentifiers(templateApprovals, { includeAzure = false } = {}) {
  const identifiers = [];
  for (const approval of templateApprovals || []) {
    if (approval.kind !== 'commands') continue;
    for (const id of approval.commandIdentifiers || []) {
      if (!includeAzure && id.startsWith('az ')) continue;
      identifiers.push(id);
    }
  }
  return identifiers;
}

// The identifiers that still need to be added for a location.
function computeMissingIdentifiers(existingIdentifiers, desiredIdentifiers) {
  return desiredIdentifiers.filter((id) => !existingIdentifiers.has(id));
}

// permissions-config.json location keys are absolute paths, backslash-separated and
// case-insensitive-compared on Windows (per the docs), forward-slash elsewhere. `git
// rev-parse --show-toplevel` always returns forward slashes even on Windows, so normalize.
function toLocationKey(rawPath) {
  return process.platform === 'win32' ? path.win32.normalize(rawPath.replace(/\//g, '\\')) : rawPath;
}

module.exports = {
  flattenCommandIdentifiers,
  filterTemplateIdentifiers,
  computeMissingIdentifiers,
  toLocationKey,
};
