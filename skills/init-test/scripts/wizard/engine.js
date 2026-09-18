'use strict';

// AgenTeX Setup Wizard — engine (pure logic, no I/O).
// Maps wizard form answers to this plugin's actual config shape:
//   config/project.json            (name, login.mode, playwright.*, kb.*)
//   config/environments/<env>.json (portalUrl, defaults, users, db?, api?)
// Shared by server.js (writes files) and engine.test.js (asserts behavior) so the mapping
// logic is unit-testable without spinning up an HTTP server.
//
// Scope note (MVP): this is a leaner port of upstream AgenTeX's wizard
// (github.com/MhmdElGazzar/agentex/tree/main/scripts/wizard). It targets this plugin's
// CURRENT config shape (no azure/figma blocks, no customizable userFields/defaultsFields
// schema, single active environment, English only). See docs/setup-wizard.md.

const DEFAULT_ENV_NAME = 'dev';
const ENV_NAME_RE = /^[a-z0-9][a-z0-9_-]{0,30}$/;
const ENV_VAR_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const BROWSERS = ['chromium', 'chrome', 'firefox', 'webkit', 'msedge'];
const LAUNCH_MODES = ['headless', 'headed'];
const LOGIN_MODES = ['session', 'fresh'];

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Build the `users` object (config/environments/<env>.json's `users` key) from the wizard's
 * flat `users[]` answer array: [{ handle, phone, email, role, notes }, ...].
 * A field left blank is omitted from that user's entry rather than written as "".
 */
function buildUsers(rawUsers) {
  const users = {};
  if (Array.isArray(rawUsers)) {
    for (const u of rawUsers) {
      if (!u || !u.handle) continue;
      const entry = {};
      for (const key of ['phone', 'email', 'role', 'notes']) {
        const v = u[key];
        if (v !== undefined && v !== null && String(v).trim() !== '') entry[key] = String(v).trim();
      }
      // A user may rely entirely on defaults.password (no `password` field is written here —
      // per-user overrides are not part of this MVP's field set).
      users[String(u.handle).trim()] = entry;
    }
  }
  if (Object.keys(users).length === 0) {
    // Same fallback shipped in config/environments/dev.json.example, so an empty submission
    // still produces a usable, editable environment file rather than an invalid empty one.
    users.valid_user = { phone: '0550000001', role: 'customer' };
    users.expired_user = { phone: '0550000002', notes: 'for negative login scenarios' };
  }
  return users;
}

/**
 * Given the wizard's flat answers object, build the two output config objects plus the list
 * of env-var names (with their plaintext values) that must be written to `.env`.
 *
 * @param {object} answers - flat, e.g. { name, 'login.mode', envName, portalUrl,
 *   'defaults.otp', 'defaults.password', users: [...], 'db.server', 'db.passwordEnvVar',
 *   'db.passwordValue', 'api.baseUrl', 'api.tokenEnvVar', 'api.tokenValue',
 *   'kb.baseUrl', 'kb.project', 'playwright.browser', ... }
 * @returns {{ projectConfig: object, envConfig: object, envName: string, envVars: object }}
 */
function buildConfigs(answers = {}) {
  const envName = String(answers.envName || DEFAULT_ENV_NAME).trim() || DEFAULT_ENV_NAME;
  const envVars = {}; // { VAR_NAME: "plaintext value to write into .env" }

  const projectConfig = {
    name: String(answers.name || 'my-project').trim() || 'my-project',
    defaultEnvironment: envName,
    kb: {
      baseUrl: String(answers['kb.baseUrl'] || '').trim(),
      project: String(answers['kb.project'] || '').trim(),
    },
    login: { mode: LOGIN_MODES.includes(answers['login.mode']) ? answers['login.mode'] : 'session' },
    playwright: {
      browser: BROWSERS.includes(answers['playwright.browser']) ? answers['playwright.browser'] : 'chromium',
      mode: LAUNCH_MODES.includes(answers['playwright.mode']) ? answers['playwright.mode'] : 'headless',
      persistent: answers['playwright.persistent'] === true,
      dashboard: answers['playwright.dashboard'] !== false,
      workers: Number.isInteger(answers['playwright.workers'])
        ? Math.min(16, Math.max(1, answers['playwright.workers']))
        : 4,
    },
  };
  // Strip an empty kb block so a fresh project.json matches the shipped .example shape.
  if (!projectConfig.kb.baseUrl && !projectConfig.kb.project) delete projectConfig.kb;

  const defaults = {};
  const otp = String(answers['defaults.otp'] || '').trim();
  const password = String(answers['defaults.password'] || '').trim();
  if (otp) defaults.otp = otp;
  if (password) defaults.password = password;

  const envConfig = {
    portalUrl: String(answers.portalUrl || 'https://example.com').trim() || 'https://example.com',
    defaults,
    users: buildUsers(answers.users),
  };

  if (answers['db.server']) {
    const dbVar = String(answers['db.passwordEnvVar'] || 'SQLCMDPASSWORD').trim() || 'SQLCMDPASSWORD';
    envConfig.db = {
      server: String(answers['db.server']).trim(),
      port: Number.isFinite(Number(answers['db.port'])) && Number(answers['db.port']) > 0
        ? Number(answers['db.port']) : 1433,
      name: String(answers['db.name'] || '').trim(),
      user: String(answers['db.user'] || '').trim(),
      password: { envSecret: dbVar },
    };
    if (answers['db.passwordValue']) envVars[dbVar] = String(answers['db.passwordValue']);
  }

  if (answers['api.baseUrl']) {
    const apiVar = String(answers['api.tokenEnvVar'] || 'API_TOKEN').trim() || 'API_TOKEN';
    envConfig.api = {
      baseUrl: String(answers['api.baseUrl']).trim(),
      token: { envSecret: apiVar },
    };
    if (answers['api.tokenValue']) envVars[apiVar] = String(answers['api.tokenValue']);
  }

  if (answers['kb.apiKeyValue']) envVars.KB_ASK_API_KEY = String(answers['kb.apiKeyValue']);

  return { projectConfig, envConfig, envName, envVars };
}

/**
 * Validate the flat answers object before it is turned into configs (client AND server side —
 * /api/save must never trust the browser's own validation).
 * Returns an array of human-readable error strings; empty means valid.
 */
function validate(answers = {}) {
  const errors = [];
  if (!String(answers.name || '').trim()) errors.push('Project name is required.');
  if (!ENV_NAME_RE.test(String(answers.envName || DEFAULT_ENV_NAME))) {
    errors.push('Environment name must be lowercase letters, digits, "-" or "_" (max 31 characters) — it becomes a file name.');
  }
  if (!isHttpUrl(answers.portalUrl)) errors.push('Portal URL must be a valid http(s) URL.');
  const users = Array.isArray(answers.users) ? answers.users.filter(u => u && u.handle) : [];
  if (users.length === 0) errors.push('At least one test user (with a handle) is required.');
  for (const u of users) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(String(u.handle))) {
      errors.push(`User handle "${u.handle}" must start with a letter and use only letters/digits/_ (it becomes a JSON key).`);
    }
  }
  if (answers['db.server'] && answers['db.passwordEnvVar'] && !ENV_VAR_NAME_RE.test(answers['db.passwordEnvVar'])) {
    errors.push('Database password env var name must contain only letters, digits, and "_".');
  }
  if (answers['api.baseUrl']) {
    if (!isHttpUrl(answers['api.baseUrl'])) errors.push('API base URL must be a valid http(s) URL.');
    if (answers['api.tokenEnvVar'] && !ENV_VAR_NAME_RE.test(answers['api.tokenEnvVar'])) {
      errors.push('API token env var name must contain only letters, digits, and "_".');
    }
  }
  if (answers['kb.baseUrl'] && !isHttpUrl(answers['kb.baseUrl'])) {
    errors.push('Knowledge base base URL must be a valid http(s) URL.');
  }
  return errors;
}

/**
 * Defense-in-depth validation of the already-built configs (used server-side right before
 * writing files, independent of whatever the browser claims it validated).
 */
function validateConfigs(projectConfig, envConfig, envName) {
  const errors = [];
  if (!projectConfig || typeof projectConfig !== 'object' || !String(projectConfig.name || '').trim()) {
    errors.push('projectConfig.name is required.');
  }
  if (!ENV_NAME_RE.test(String(envName || ''))) {
    errors.push('envName must be lowercase letters/digits/-/_ (max 31 chars).');
  }
  if (!envConfig || typeof envConfig !== 'object' || !isHttpUrl(envConfig.portalUrl)) {
    errors.push('envConfig.portalUrl must be a valid http(s) URL.');
  }
  if (!envConfig || !envConfig.users || Object.keys(envConfig.users).length === 0) {
    errors.push('At least one test user is required.');
  }
  return errors;
}

module.exports = {
  DEFAULT_ENV_NAME,
  ENV_NAME_RE,
  ENV_VAR_NAME_RE,
  BROWSERS,
  LAUNCH_MODES,
  LOGIN_MODES,
  isHttpUrl,
  buildUsers,
  buildConfigs,
  validate,
  validateConfigs,
};
