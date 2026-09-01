'use strict';

const fs = require('node:fs');
const path = require('node:path');

function resolveProjectRoot(startDirectory = process.cwd()) {
  let directory = path.resolve(startDirectory);

  while (true) {
    if (fs.existsSync(path.join(directory, 'config', 'project.json'))) return directory;
    const parent = path.dirname(directory);
    if (parent === directory) return path.resolve(startDirectory);
    directory = parent;
  }
}

function resolveProjectPath(projectRoot, value, label) {
  const resolved = path.resolve(projectRoot, value);
  const relative = path.relative(projectRoot, resolved);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`${label} must be inside the active project`);
  }
  return resolved;
}

module.exports = { resolveProjectPath, resolveProjectRoot };
