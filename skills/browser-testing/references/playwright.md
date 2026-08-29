# Playwright browser testing

Read this reference before driving a browser for an AgenTeX run.

## Setup and preflight

- Use the project's local Playwright installation: `npx playwright`.
- Before the first run, confirm the tool with
  `node <plugin-root>/skills/browser-testing/scripts/preflight.js`.
- If the result reports Playwright unavailable, install the dependency the tested project uses,
  for example `npm install -D @playwright/test`, then install Chromium with
  `npx playwright install chromium`.
- Run headless for parallel regression work. Use headed mode only when the user asks to observe
  the browser.

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
  only the contexts the run created. Never globally close browsers or contexts.
- Save session evidence under the generated `logs/` and `screenshots/` folders.
- Use `scripts/merge_run.js --run-dir <run-dir> <evidence-path>...` to copy confirmed defect
  screenshots into `<run-dir>/bugs/screenshots/` without overwriting same-named shots from
  other sessions.
