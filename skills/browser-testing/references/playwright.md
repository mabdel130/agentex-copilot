# Playwright browser testing

Read this reference before driving a browser for an AgenTeX run.

## Setup and preflight

- Use the [Playwright Agent CLI](https://playwright.dev/agent-cli/introduction) from the
  project: `npx playwright-cli`. It provides token-efficient accessibility snapshots,
  deterministic element references, and isolated persistent browser sessions for agents.
- Before the first run, confirm the tool with
  `node <plugin-root>/skills/browser-testing/scripts/preflight.js`.
- If `playwrightCli.ok` is false, install it locally with
  `npm install -D @playwright/cli@latest`. Install the engine selected for the run with
  `npx playwright-cli install-browser <browser>`.

## Run configuration

Resolve the `playwright` object in `config/project.json` before launching. A clear request such
as "run headed in Firefox without a dashboard" overrides the corresponding default. Defaults are
`chromium`, headless, non-persistent, and dashboard enabled.

| Setting | Accepted values | Agent CLI launch behavior |
|---|---|---|
| `browser` | `chromium`, `chrome`, `firefox`, `webkit`, `msedge` | `chromium` omits `--browser`; every other value uses `open --browser=<browser>` |
| `mode` | `headless`, `headed` | add `--headed` only for `headed` |
| `persistent` | `true`, `false` | add `--persistent --profile=<session-dir>/profile` when true |
| `dashboard` | `true`, `false` | generate `extent-report.html` only when true |

Use the execution-unique session from `init_run.js` on every Agent CLI command:

```bash
npx playwright-cli -s=<session> open <url>
```

For Chrome, Firefox, WebKit, or Edge, append `--browser=<browser>`. Append `--headed` and/or
`--persistent --profile=<session-dir>/profile` only when selected.
Never substitute another browser if the requested engine cannot launch; report the run as
blocked with the launch error.

## Execution rules

- Obtain a fresh accessibility snapshot or DOM query before every interaction and again after
  navigation. Element references can become stale after a page load.
- Capture a screenshot for every scenario, whether it passes, fails, or is blocked.
- Capture console errors and failed network requests. They are defects even when the visible UI
  looks correct.
- Verify that success/error content is visible, not merely present in static or hidden DOM.
- Treat application responses with incorrect UI, 4xx/5xx outcomes, and rendered-page locator
  failures as defects. Treat browser startup failures, DNS/connectivity failures, and a page
  that never renders as infrastructure problems; retry an infrastructure failure at most once
  from a clean isolated browser context.

## Sessions and evidence

- Initialize each run with `scripts/init_run.js`; use only the generated session names and close
  only the contexts the run created. Pass the generated name as `-s=<session>` to
  `playwright-cli`, and never use `close-all` or `kill-all`.
- Save session evidence under the generated `logs/` and `screenshots/` folders.
- Use `scripts/merge_run.js --run-dir <run-dir> <evidence-path>...` to copy confirmed defect
  screenshots into `<run-dir>/bugs/screenshots/` without overwriting same-named shots from
  other sessions.
