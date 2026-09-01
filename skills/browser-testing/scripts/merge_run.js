// AgenTeX evidence merger — copies the bug-evidence screenshots each subagent flagged into
// the run's bugs/screenshots/ folder, in one call.
//
// Usage: node merge_run.js --run-dir executions/execu_<ts> <evidence-path> [<evidence-path> ...]
// Prints ONE JSON line: {"copied": [...], "missing": [...]}
// (Writing bugs/bug-list.md and report.md stays with the orchestrator — that's judgment.)
const fs = require('fs');
const path = require('path');
const { resolveProjectPath, resolveProjectRoot } = require('./project_root.js');

const args = process.argv.slice(2);
let runDir; const evidence = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--run-dir') runDir = args[++i];
  else evidence.push(args[i]);
}
if (!runDir) { console.log(JSON.stringify({ error: 'usage: --run-dir <dir> <evidence-path>...' })); process.exit(2); }

const projectRoot = resolveProjectRoot();
try {
  runDir = resolveProjectPath(projectRoot, runDir, 'run directory');
} catch (error) {
  console.log(JSON.stringify({ error: error.message }));
  process.exit(2);
}

const dest = path.join(runDir, 'bugs', 'screenshots');
fs.mkdirSync(dest, { recursive: true });

const copied = [], missing = [];
for (const src of evidence) {
  let source;
  try {
    source = resolveProjectPath(projectRoot, src, 'evidence path');
  } catch (error) {
    missing.push(src);
    continue;
  }
  if (!fs.existsSync(source)) { missing.push(src); continue; }
  // prefix with the session name (…/browser-sessions/<session>/screenshots/x.png) to avoid collisions
  const m = source.replace(/\\/g, '/').match(/browser-sessions\/([^/]+)\//);
  const name = (m ? `${m[1]}-` : '') + path.basename(source);
  fs.copyFileSync(source, path.join(dest, name));
  copied.push(path.join(dest, name));
}
console.log(JSON.stringify({
  projectRoot,
  copied: copied.map(file => path.relative(projectRoot, file)),
  missing,
}));
