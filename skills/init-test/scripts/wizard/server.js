#!/usr/bin/env node
'use strict';

// AgenTeX Setup Wizard — local HTTP server.
// Zero external dependencies: only Node built-ins. Binds to 127.0.0.1 only, never the network.
// Launched by the init-test skill after scaffolding (see skills/init-test/SKILL.md), or run
// directly: `node skills/init-test/scripts/wizard/server.js [projectRoot] [--port=7373] [--no-open]`
//
// Writes config/project.json + config/environments/<env>.json using this plugin's CURRENT
// config shape (see engine.js). Secret values entered in the browser are written straight to
// a local .env file — never echoed back to the wizard UI, never logged, and never passed
// through this chat session. See docs/ai/security-policy.md.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const engine = require('./engine');

function parseArgs(argv) {
  const args = { projectRoot: null, port: 7373, open: true, force: false };
  for (const raw of argv) {
    if (raw === '--no-open') args.open = false;
    else if (raw === '--force') args.force = true;
    else if (raw.startsWith('--port=')) args.port = Number(raw.slice('--port='.length)) || 7373;
    else if (!raw.startsWith('--')) args.projectRoot = raw;
  }
  return args;
}

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/** Merge new KEY=value pairs into an existing .env file without disturbing other lines. */
function mergeEnvFile(envPath, vars) {
  const names = Object.keys(vars);
  if (names.length === 0) return;
  let lines = [];
  if (fs.existsSync(envPath)) {
    lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  }
  const remaining = new Set(names);
  const out = lines.map((line) => {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line);
    if (m && remaining.has(m[1])) {
      remaining.delete(m[1]);
      return `${m[1]}=${vars[m[1]]}`;
    }
    return line;
  });
  while (out.length && out[out.length - 1] === '') out.pop();
  for (const name of remaining) out.push(`${name}=${vars[name]}`);
  fs.writeFileSync(envPath, out.join('\n') + '\n', 'utf8');
}

function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === 'win32') execFile('cmd', ['/c', 'start', '""', url]);
    else if (platform === 'darwin') execFile('open', [url]);
    else execFile('xdg-open', [url]);
  } catch {
    // Best-effort only — the user can still open the printed URL manually.
  }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  res.end(body);
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json; charset=utf-8' });
}

function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('Request body too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectRoot = path.resolve(args.projectRoot || process.cwd());
  const pluginRoot = path.resolve(__dirname, '..', '..', '..', '..');

  if (projectRoot === pluginRoot && !args.force) {
    console.error(
      '[setup-wizard] Refusing to run inside the AgenTeX plugin repo itself.\n' +
      '               Pass a target project path, or --force if this is intentional.'
    );
    process.exit(1);
  }

  const configDir = path.join(projectRoot, 'config');
  const envDir = path.join(configDir, 'environments');
  const projectConfigPath = path.join(configDir, 'project.json');
  const envPath = path.join(projectRoot, '.env');
  const token = crypto.randomBytes(24).toString('hex');
  const uiHtmlPath = path.join(__dirname, 'ui.html');
  let uiHtmlTemplate = fs.readFileSync(uiHtmlPath, 'utf8');

  function currentEnvName() {
    const existing = readJsonSafe(projectConfigPath);
    return (existing && existing.defaultEnvironment) || engine.DEFAULT_ENV_NAME;
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://127.0.0.1:${args.port}`);

      if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/setup')) {
        const html = uiHtmlTemplate
          .replace('__WIZARD_TOKEN__', token)
          .replace('__PROJECT_ROOT__', projectRoot.replace(/\\/g, '\\\\').replace(/"/g, '\\"'));
        return send(res, 200, html, { 'Content-Type': 'text/html; charset=utf-8' });
      }

      if (url.pathname === '/favicon.ico') return send(res, 204, '');

      if (url.pathname.startsWith('/api/')) {
        if (req.headers['x-wizard-token'] !== token) {
          return sendJson(res, 403, { ok: false, error: 'Invalid or missing wizard token.' });
        }

        if (req.method === 'GET' && url.pathname === '/api/config') {
          const envName = url.searchParams.get('env') || currentEnvName();
          const project = readJsonSafe(projectConfigPath) || {};
          const envConfig = readJsonSafe(path.join(envDir, `${envName}.json`)) || {};
          // Never return secret values — only the env-var NAMEs already referenced, so the UI
          // can show "already set" without ever reading .env or echoing a secret.
          return sendJson(res, 200, { ok: true, envName, project, env: envConfig });
        }

        if (req.method === 'POST' && url.pathname === '/api/save') {
          const bodyText = await readBody(req);
          let answers;
          try {
            answers = JSON.parse(bodyText);
          } catch {
            return sendJson(res, 400, { ok: false, errors: ['Request body must be valid JSON.'] });
          }
          const answerErrors = engine.validate(answers);
          if (answerErrors.length) return sendJson(res, 400, { ok: false, errors: answerErrors });

          const { projectConfig, envConfig, envName, envVars } = engine.buildConfigs(answers);
          const configErrors = engine.validateConfigs(projectConfig, envConfig, envName);
          if (configErrors.length) return sendJson(res, 400, { ok: false, errors: configErrors });

          ensureDir(configDir);
          ensureDir(envDir);
          fs.writeFileSync(projectConfigPath, JSON.stringify(projectConfig, null, 2) + '\n', 'utf8');
          fs.writeFileSync(
            path.join(envDir, `${envName}.json`),
            JSON.stringify(envConfig, null, 2) + '\n',
            'utf8'
          );
          if (Object.keys(envVars).length) mergeEnvFile(envPath, envVars);

          return sendJson(res, 200, {
            ok: true,
            filesWritten: [
              path.relative(projectRoot, projectConfigPath),
              path.relative(projectRoot, path.join(envDir, `${envName}.json`)),
              ...(Object.keys(envVars).length ? [path.relative(projectRoot, envPath)] : []),
            ],
          });
        }

        if (req.method === 'POST' && url.pathname === '/api/done') {
          sendJson(res, 200, { ok: true });
          console.log('[setup-wizard] \u2705 Done. Closing server.');
          setTimeout(() => {
            server.close();
            process.exit(0);
          }, 150);
          return;
        }

        return sendJson(res, 404, { ok: false, error: 'Unknown API route.' });
      }

      return send(res, 404, 'Not found');
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: err.message });
    }
  });

  server.listen(args.port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${args.port}/setup`;
    console.log(`[setup-wizard] Listening on ${url}`);
    console.log(`[setup-wizard] Project root: ${projectRoot}`);
    if (args.open) openBrowser(url);
    else console.log('[setup-wizard] Open the URL above in your browser.');
  });
}

if (require.main === module) main();

module.exports = { parseArgs, mergeEnvFile };
