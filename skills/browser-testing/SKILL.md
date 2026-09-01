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

## Invocation

- For exploratory requests, use sequential mode by default. The orchestrator must obtain scope
  and plan approval before interacting with the browser, then pause after every scenario.
- Use parallel mode only when the user explicitly asks for a parallel, autonomous, fast, or
  regression run. Create one isolated browser session per spec file and execute without
  checkpoints. If the Copilot runtime cannot grant tool-capable worker agents, run those
  sessions from the invoking session; do not claim that the files ran concurrently.
- If the user names a suite such as `suite3` or `test/suite3/`, run only that suite. Otherwise
  use the supplied specs or `test/suite1/`.
- If no test specs exist, let the orchestrator scaffold the bundled samples before proceeding.
- Before opening a browser, read `references/playwright.md`, run `scripts/preflight.js`, and
  initialize a new run through `scripts/init_run.js`. Use its generated session and evidence
  paths rather than constructing shared paths manually.
- Resolve the optional `playwright` configuration in `config/project.json`. A clear request such
  as "run headed in Firefox without a dashboard" overrides those defaults.

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
