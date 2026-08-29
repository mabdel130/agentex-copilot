---
name: browser-testing
description: Test a website or web application through a real Playwright browser session. Use when the user asks to test a URL, a web page, a user flow, a form, a regression suite, happy paths, edge cases, negative cases, or browser defects. Supports sequential human-approved runs and autonomous parallel regressions with screenshots, logs, a durable run summary, and a consolidated defect report.
---

# Browser Testing

Use the installed `test-orchestrator` agent for every browser-testing request. It owns
environment and suite resolution, scenario planning, sequential approval checkpoints, parallel
execution, evidence collection, defect reporting, and final run artifacts.

## Bundled assets

- `references/playwright.md` — browser setup, execution, retry, session, and evidence rules.
- `scripts/preflight.js` — reports the local Node and Playwright availability as one JSON line.
- `scripts/init_run.js` — creates the isolated execution folder and unique per-run browser
  session paths.
- `scripts/merge_run.js` — copies the evidence selected for a defect into the run-level
  `bugs/screenshots/` folder.

## Invocation

- For exploratory requests, use sequential mode by default. The orchestrator must obtain scope
  and plan approval before interacting with the browser, then pause after every scenario.
- Use parallel mode only when the user explicitly asks for a parallel, autonomous, fast, or
  regression run. The orchestrator dispatches one isolated `qa-executor` session per spec file.
- If the user names a suite such as `suite3` or `test/suite3/`, run only that suite. Otherwise
  use the supplied specs or `test/suite1/`.
- If no test specs exist, let the orchestrator scaffold the bundled samples before proceeding.
- Before opening a browser, read `references/playwright.md`, run `scripts/preflight.js`, and
  initialize a new run through `scripts/init_run.js`. Use its generated session and evidence
  paths rather than constructing shared paths manually.

## Required behavior

- Drive all browser actions through Playwright.
- Preserve the safety rules in the `test-orchestrator` and `qa-executor` agents: never modify
  application source, use disposable test data only, never reveal secrets, and execute API/DB
  work only through cataloged integration entries.
- Store all execution artifacts beneath `executions/execu_<timestamp>/`, including `report.md`,
  `run-summary.json`, `extent-report.html`, session logs/screenshots, and consolidated defects.
- Do not recreate the orchestration logic in this skill. Read and follow the two agents as the
  authoritative workflow definitions.
