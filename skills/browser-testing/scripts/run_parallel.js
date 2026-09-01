'use strict';

// Executes a validated browser-only manifest in bounded parallel Playwright contexts.
// This deliberately accepts selectors and a small action vocabulary, never arbitrary code.
const fs = require('node:fs');
const path = require('node:path');
const { loadPlaywright } = require('../../optimize-login/scripts/session.js');
const { resolveProjectPath, resolveProjectRoot } = require('./project_root.js');

const BROWSERS = new Set(['chromium', 'chrome', 'msedge', 'firefox', 'webkit']);
const ACTIONS = new Set(['goto', 'click', 'fill', 'press', 'assertVisible', 'assertCount']);

function fail(message) {
  throw new Error(`invalid manifest: ${message}`);
}

function safeName(value, label) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9._-]+$/.test(value)) fail(`${label} must contain only letters, numbers, ".", "_" or "-"`);
}

function assertUrl(value, label) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) fail(`${label} must use http or https`);
  } catch {
    fail(`${label} must be a valid URL`);
  }
}

function assertRunDirectory(value) {
  if (typeof value !== 'string' || !value.trim()) fail('run.directory is required');
  if (path.isAbsolute(value) || value.split(/[\\/]+/).includes('..')) {
    fail('run.directory must be a relative path inside the working directory');
  }
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) fail('must be an object');
  if (manifest.version !== 1) fail('version must be 1');
  if (!manifest.run || typeof manifest.run !== 'object') fail('run is required');
  assertRunDirectory(manifest.run.directory);
  if (!manifest.options || typeof manifest.options !== 'object') fail('options is required');
  if (!BROWSERS.has(manifest.options.browser)) fail('options.browser is unsupported');
  if (!['headless', 'headed'].includes(manifest.options.mode)) fail('options.mode must be headless or headed');
  if (manifest.options.persistent === true) fail('options.persistent is not supported; use the Agent CLI fallback');
  if (!Number.isInteger(manifest.options.workers) || manifest.options.workers < 1 || manifest.options.workers > 16) fail('options.workers must be an integer from 1 to 16');
  if (!Array.isArray(manifest.specs) || manifest.specs.length === 0) fail('specs must be a non-empty array');

  const sessions = new Set();
  for (const spec of manifest.specs) {
    if (!spec || typeof spec !== 'object') fail('each spec must be an object');
    safeName(spec.id, 'spec.id');
    safeName(spec.session, 'spec.session');
    if (spec.session === 'default') fail('spec.session must not be "default"');
    if (spec.stateful !== undefined && typeof spec.stateful !== 'boolean') fail(`spec "${spec.id}" stateful must be boolean`);
    if (sessions.has(spec.session)) fail(`duplicate session "${spec.session}"`);
    sessions.add(spec.session);
    assertUrl(spec.url, `spec "${spec.id}" url`);
    if (!Array.isArray(spec.scenarios) || spec.scenarios.length === 0) fail(`spec "${spec.id}" requires scenarios`);
    for (const scenario of spec.scenarios) {
      if (!scenario || typeof scenario.name !== 'string' || !scenario.name.trim()) fail(`spec "${spec.id}" scenario requires a name`);
      if (!Array.isArray(scenario.steps) || scenario.steps.length === 0) fail(`scenario "${scenario.name}" requires steps`);
      for (const step of scenario.steps) {
        if (!step || !ACTIONS.has(step.action)) fail(`scenario "${scenario.name}" has an unsupported action`);
        if (step.action === 'goto') assertUrl(step.url, `scenario "${scenario.name}" goto URL`);
        if (step.action !== 'goto' && (typeof step.selector !== 'string' || !step.selector.trim())) {
          fail(`scenario "${scenario.name}" action "${step.action}" requires selector`);
        }
        if (step.action === 'fill' && typeof step.value !== 'string') fail(`scenario "${scenario.name}" fill requires a string value`);
        if (step.action === 'press' && typeof step.key !== 'string') fail(`scenario "${scenario.name}" press requires key`);
        if (step.action === 'assertCount' && (!Number.isInteger(step.minimum) || step.minimum < 0)) {
          fail(`scenario "${scenario.name}" assertCount requires non-negative integer minimum`);
        }
      }
    }
  }
  return manifest;
}

function browserOptions(options) {
  const launch = { headless: options.mode === 'headless' };
  if (options.browser === 'chrome') launch.channel = 'chrome';
  if (options.browser === 'msedge') launch.channel = 'msedge';
  return launch;
}

function browserType(playwright, browser) {
  return playwright[browser === 'chrome' || browser === 'msedge' ? 'chromium' : browser];
}

function safeResourceUrl(value) {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return 'unparseable resource URL';
  }
}

async function runStep(page, step) {
  if (step.action === 'goto') return page.goto(step.url, { waitUntil: 'domcontentloaded', timeout: step.timeoutMs || 30_000 });
  const locator = page.locator(step.selector);
  if (step.action === 'click') return locator.click({ timeout: step.timeoutMs || 10_000 });
  if (step.action === 'fill') return locator.fill(step.value, { timeout: step.timeoutMs || 10_000 });
  if (step.action === 'press') return locator.press(step.key, { timeout: step.timeoutMs || 10_000 });
  if (step.action === 'assertVisible') {
    await locator.waitFor({ state: 'visible', timeout: step.timeoutMs || 10_000 });
    return;
  }
  const timeout = step.timeoutMs || 10_000;
  const deadline = Date.now() + timeout;
  do {
    if ((await locator.count()) >= step.minimum) return;
    await page.waitForTimeout(100);
  } while (Date.now() < deadline);
  throw new Error('required element count was not reached');
}

async function runSpec(browser, spec, runDir) {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const sessionDir = path.join(runDir, 'browser-sessions', spec.session);
  const screenshotsDir = path.join(sessionDir, 'screenshots');
  const logsDir = path.join(sessionDir, 'logs');
  fs.mkdirSync(screenshotsDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push({ type: 'error' });
  });
  page.on('requestfailed', request => failedRequests.push({ url: safeResourceUrl(request.url()) }));

  const scenarios = [];
  try {
    for (let index = 0; index < spec.scenarios.length; index++) {
      const scenario = spec.scenarios[index];
      const scenarioStarted = Date.now();
      let status = 'passed';
      let note = 'Completed';
      try {
        if (!spec.stateful || index === 0) {
          await page.goto(spec.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        }
        for (const step of scenario.steps) await runStep(page, step);
      } catch {
        status = 'failed';
        note = 'A browser action or assertion failed.';
      }
      const screenshot = `s${index + 1}-${scenario.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'scenario'}.png`;
      let screenshotPath;
      try {
        await page.screenshot({ path: path.join(screenshotsDir, screenshot), fullPage: status === 'failed' });
        screenshotPath = path.posix.join('browser-sessions', spec.session, 'screenshots', screenshot);
      } catch {
        status = 'failed';
        note = 'Evidence capture failed after the browser action completed.';
      }
      scenarios.push({
        name: scenario.name,
        status,
        note,
        durationMs: Date.now() - scenarioStarted,
        ...(screenshotPath ? { screenshot: screenshotPath } : {}),
      });
    }
  } finally {
    fs.writeFileSync(path.join(logsDir, 'browser-events.json'), JSON.stringify({
      consoleErrorCount: consoleErrors.length,
      failedRequests,
    }, null, 2));
    await context.close();
  }

  return {
    id: spec.id,
    session: spec.session,
    status: scenarios.some(s => s.status === 'failed') ? 'failed' : 'passed',
    startedAt,
    endedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    scenarios,
    consoleErrorCount: consoleErrors.length,
    failedRequestCount: failedRequests.length,
  };
}

async function runManifest(manifest, { cwd = process.cwd() } = {}) {
  validateManifest(manifest);
  const projectRoot = resolveProjectRoot(cwd);
  const runDir = resolveProjectPath(projectRoot, manifest.run.directory, 'run.directory');
  const playwright = loadPlaywright(projectRoot);
  const browser = await browserType(playwright, manifest.options.browser).launch(browserOptions(manifest.options));
  const queue = [...manifest.specs];
  const results = [];
  const workers = Array.from({ length: Math.min(manifest.options.workers, queue.length) }, async () => {
    while (queue.length) results.push(await runSpec(browser, queue.shift(), runDir));
  });
  try {
    await Promise.all(workers);
  } finally {
    await browser.close();
  }
  return { version: 1, results: results.sort((a, b) => a.id.localeCompare(b.id)) };
}

module.exports = { validateManifest, runManifest };

if (require.main === module) {
  const args = process.argv.slice(2);
  const manifestIndex = args.indexOf('--manifest');
  const outputIndex = args.indexOf('--output');
  if (manifestIndex < 0 || outputIndex < 0 || !args[manifestIndex + 1] || !args[outputIndex + 1]) {
    console.error('Usage: node run_parallel.js --manifest <manifest.json> --output <results.json>');
    process.exit(1);
  }
  try {
    const manifest = JSON.parse(fs.readFileSync(args[manifestIndex + 1], 'utf8'));
    runManifest(manifest).then(result => {
      fs.mkdirSync(path.dirname(args[outputIndex + 1]), { recursive: true });
      fs.writeFileSync(args[outputIndex + 1], JSON.stringify(result, null, 2));
      console.log(JSON.stringify({ specs: result.results.length, output: args[outputIndex + 1] }));
    }).catch(error => { console.error(error.message); process.exitCode = 1; });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
