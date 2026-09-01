---
name: browser-testing
description: Test a website or web application through Playwright Agent CLI browser sessions. Use when the user asks to test a URL, a web page, a user flow, a form, a regression suite, happy paths, edge cases, negative cases, or browser defects. Supports Chromium, Chrome, Firefox, WebKit, and Edge; headless, headed, and persistent launch modes; optional HTML dashboards; sequential human-approved runs; and autonomous parallel regressions.
---

# Browser Testing

Run every browser-testing request in the **invoking Copilot session**. Read the installed
`test-orchestrator` and `qa-executor` agent files as the authoritative workflow and
per-spec execution role definitions, then perform their work yourself using this session's
terminal and browser capabilities. Do not dispatch either agent for browser work: custom-agent
runtimes may not receive the invoking session's browser, terminal, or file permissions.

## Bundled assets

- `references/playwright.md` — browser setup, execution, retry, session, and evidence rules.
- `scripts/preflight.js` — reports the local Node and Playwright availability as one JSON line.
- `scripts/init_run.js` — creates the isolated execution folder and unique per-run browser
  session paths.
- `scripts/merge_run.js` — copies the evidence selected for a defect into the run-level
  `bugs/screenshots/` folder.
- `scripts/run_parallel.js` — executes a validated, browser-only JSON manifest with bounded
  Playwright workers. It is the fast path for autonomous parallel runs.

## Invocation

- For exploratory requests, use sequential mode by default. The orchestrator must obtain scope
  and plan approval before interacting with the browser, then pause after every scenario.
- Use parallel mode only when the user explicitly asks for a parallel, autonomous, fast, or
  regression run. Create one isolated browser session per spec file and execute without
  checkpoints. For repeatable browser-only specs, compile a constrained manifest and invoke
  `run_parallel.js` once; it provides real bounded concurrency using one browser process with
  isolated contexts. Keep stateful scenarios ordered within their own spec. Fall back to the
  Agent CLI workflow when a spec requires interactive exploration or cannot be represented by
  the manifest; set `stateful: true` on a manifest spec to preserve its scenario order without
  resetting the page between scenarios. Do not claim concurrency for a serialized fallback.
- If the user names a suite such as `suite3` or `test/suite3/`, run only that suite. Otherwise
  use the supplied specs or `test/suite1/`.
- If no test specs exist, let the orchestrator scaffold the bundled samples before proceeding.
- Before opening a browser, read `references/playwright.md`, run `scripts/preflight.js`, and
  initialize a new run through `scripts/init_run.js`. Use its generated session and evidence
  paths rather than constructing shared paths manually.
- Artifact location is automatic: scripts locate the nearest parent containing
  `config/project.json` and write only to that project's `executions/` directory. A run started
  in `test1` (or any child folder) therefore writes to `test1\executions\...`; one started in
  `test2` writes to `test2\executions\...`. Never direct a run into the plugin source folder or
  another project's execution directory.
- Resolve the optional `playwright` configuration in `config/project.json`. A clear request such
  as "run headed in Firefox without a dashboard" overrides those defaults.
- The manifest must contain only the runner's allowed actions (`goto`, `click`, `fill`, `press`,
  `assertVisible`, and `assertCount`). Do not put credentials, secrets, API/DB operations, or
  arbitrary JavaScript in it. The orchestrator still resolves safety policy and writes the final
  report from the runner's safe result JSON.
- The fast path does not support persistent profiles. Use the Agent CLI fallback when
  `playwright.persistent` is enabled.

### Parallel runner manifest

Create the manifest as a run-local artifact, with a path inside the generated execution folder,
then invoke:

```text
node <plugin>/skills/browser-testing/scripts/run_parallel.js \
  --manifest executions/execu_<timestamp>/execution-manifest.json \
  --output executions/execu_<timestamp>/runner-results.json
```

The required shape is:

```json
{
  "version": 1,
  "run": { "directory": "executions/execu_<timestamp>" },
  "options": { "browser": "chromium", "mode": "headless", "workers": 4 },
  "specs": [{
    "id": "products",
    "session": "products-<unique-run-id>",
    "url": "https://app.example.test/products",
    "stateful": false,
    "scenarios": [{
      "name": "catalog loads",
      "steps": [{ "action": "assertVisible", "selector": "main" }]
    }]
  }]
}
```

`goto` requires `url`; `click`, `fill`, `press`, and `assertVisible` require `selector`;
`fill` also requires `value`; `press` requires `key`; and `assertCount` requires `selector`
plus a non-negative `minimum`. The runner saves one screenshot and sanitized browser-event
metadata per scenario. It never writes the final report; the orchestrator merges
`runner-results.json` into the established report and dashboard artifacts.

## Required behavior

- Drive all browser actions through Playwright.
- Preserve the safety rules in the `test-orchestrator` and `qa-executor` agents: never modify
  application source, use disposable test data only, never reveal secrets, and execute API/DB
  work only through cataloged integration entries.
- Store all execution artifacts beneath `executions/execu_<timestamp>/`, including `report.md`,
  `run-summary.json`, session logs/screenshots, and consolidated defects. Create
  `extent-report.html` only when the resolved dashboard option is enabled.
- Do not recreate the orchestration logic in this skill. Read and follow the two agent files as
  the authoritative workflow definitions, adapting their delegated-worker language to direct
  execution in the invoking session.
