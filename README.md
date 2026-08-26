# AgenTeX for GitHub Copilot

**Stop clicking through the same test cases by hand. Describe what to test, in plain English,
and let an agent plan it, run it in a real browser, and hand you back a defect report.**

[![Version](https://img.shields.io/badge/version-2.5.1-blue.svg)](./CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![GitHub Copilot CLI Plugin](https://img.shields.io/badge/GitHub%20Copilot%20CLI-plugin-8957e5.svg?logo=githubcopilot&logoColor=white)](https://docs.github.com/en/copilot/concepts/agents/about-plugins)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium%2FFirefox%2FWebKit-2EAD33.svg?logo=playwright&logoColor=white)](https://playwright.dev)
[![Ported from AgenTeX](https://img.shields.io/badge/ported%20from-AgenTeX%20v0.19.0-8A2BE2.svg)](https://github.com/MhmdElGazzar/agentex)

---

## Install

```bash
copilot plugin install mabdel130/agentex-copilot
```

That's it — this is a real [GitHub Copilot CLI plugin](https://docs.github.com/en/copilot/concepts/agents/about-plugins):
a `plugin.json` manifest plus `agents/*.agent.md` role definitions, installed the same way you'd
install any other Copilot CLI plugin. It also self-hosts its own marketplace
([`.github/plugin/marketplace.json`](./.github/plugin/marketplace.json)) if you'd rather go
through that flow:

```bash
copilot plugin marketplace add mabdel130/agentex-copilot
copilot plugin install agentex-copilot@agentex-copilot
```

No Copilot CLI yet? See
[**No Copilot CLI? Use the fallback installer**](#no-copilot-cli-use-the-fallback-installer) below.

> Earlier versions of this README claimed GitHub Copilot had no real plugin system at all and
> told people to hand-copy files into their repo instead. That was wrong — full story, and why
> it happened, in [`docs/CONVERSION_REPORT.md`](./docs/CONVERSION_REPORT.md#correction-v220).
> The install command above is the real, current, correct one.

---

## What this actually is

AgenTeX turns "please test this" into a real, evidence-backed QA run. Ask for it in plain
language — *"Test the signup form on staging: happy path plus a couple of bad-email cases"* —
and an agent:

1. **Plans** the scenarios out loud and waits for your go-ahead (nothing runs until you approve).
2. **Drives a real browser** via [Playwright](https://playwright.dev) through each scenario.
3. **Captures evidence** — a screenshot and console/network log for every scenario, pass or fail.
4. **Reports defects** in a consistent format: title, repro steps, expected vs. actual, severity.
5. **Never touches your application code.** It only ever writes test artifacts.

This repo is a GitHub Copilot–oriented port of [**AgenTeX**](https://github.com/MhmdElGazzar/agentex)
v0.19.0, originally a Claude Code plugin by Mohamed Elgazzar.

---

## Why this instead of a "normal" test framework

| | Hand-written Playwright/Selenium suite | AgenTeX |
|---|---|---|
| Writing scenarios | You write test code | You describe intent in plain language; the agent plans steps |
| Maintenance | Breaks silently on UI changes until someone notices | An agent re-reasons through the page each run |
| Negative/edge cases | Often skipped under time pressure | Explicitly planned as a category every run |
| Evidence | You wire up screenshots/logging yourself | Screenshot + console/network log captured automatically, every scenario |
| Report | You build your own | Consistent Title/Steps/Expected-vs-Actual/Severity/Evidence format, every time |
| Best for | Stable, high-value regression suites | Exploratory testing, new features, ad-hoc "does this still work" checks |

It's not a replacement for your unit/integration suite — it's for the UI-level, "would a human
tester have caught this" layer that's expensive to script conventionally.

---

## Quick start

```bash
# 1. Install the Copilot CLI if you don't have it, and sign in
npm install -g @github/copilot
copilot   # if prompted "Please use /login to sign in", run /login and follow the browser flow

# 2. Install the plugin (once, per developer machine)
copilot plugin install mabdel130/agentex-copilot

# 3. In the project you want to test, install the browser driver
npm install -D @playwright/test && npx playwright install chromium
```

Then, from that project, ask Copilot to scaffold config (this runs the bundled `init-test`
skill — mirrors upstream AgenTeX's `/init-test` command):

```
Set up AgenTeX for this project.
```

Then ask Copilot (CLI or Chat) for a test:

```
Test https://example.com — the signup form: happy path plus empty and bad-email cases.
```

Full walkthrough: **[DEPLOYMENT.md](./DEPLOYMENT.md)**. Guided version for first-timers:
**[docs/getting-started.md](./docs/getting-started.md)**.

---

## No Copilot CLI? Use the fallback installer

If you're on VS Code Copilot Chat without the standalone `copilot` CLI, there's no plugin
system to install into — but the same agent files still work as plain repo instructions.
Run this from the project you want to test:

```bash
npx github:mabdel130/agentex-copilot --target .
```

This copies `agents/` and `docs/ai/` into `.github/agentex/`, writes `AGENTS.md` and
`.github/copilot-instructions.md` so Copilot Chat picks them up automatically, and scaffolds
`config/`. It's idempotent — safe to re-run, never overwrites a file you've already edited.
See [`scripts/install.js`](./scripts/install.js) for exactly what it does.

---

## What you get back

Every run writes to a timestamped folder — nothing scattered elsewhere in your repo:

```
executions/execu_2026-08-26_11-00-53/
├── report.md                          # what passed, what failed, why
├── browser-sessions/default/
│   ├── screenshots/                   # one per scenario, pass AND fail
│   └── logs/                          # console + network capture per scenario
└── bugs/
    ├── bug-list.md                    # merged, ready to paste into your tracker
    └── screenshots/                   # evidence for each defect
```

A real defect entry looks like this (from this repo's own `example.com` smoke test):

> **Title:** Non-existent paths render the homepage content under a 404 status
> **Steps to reproduce:** 1) GET `/does-not-exist-xyz` 2) Inspect status code and rendered page.
> **Expected:** A distinguishable not-found response.
> **Actual:** Status is 404, but the body is byte-for-byte identical to the real homepage.
> **Severity:** Low
> **Evidence:** `bugs/screenshots/s4-badpath.png`

---

## How it works under the hood

Two roles, defined as plain markdown agent files:

| Agent | File | Job |
|---|---|---|
| **`test-orchestrator`** | [`agents/test-orchestrator.agent.md`](./agents/test-orchestrator.agent.md) | The one you talk to. Resolves the target environment, plans scenarios, picks sequential vs. parallel mode, dispatches executors, merges the final report. |
| **`qa-executor`** | [`agents/qa-executor.agent.md`](./agents/qa-executor.agent.md) | Runs exactly one test spec to completion in its own isolated browser session. Dispatched by the orchestrator, never invoked directly. |

Neither file restricts its `tools:` frontmatter — per GitHub's own docs, omitting that field
gives an agent access to everything (shell, file read/write, search), which is exactly what
browser-driven testing needs.

**Sequential mode** (the default) — human-in-the-loop, pauses after each scenario for your
review. Best for exploratory testing and new features.

**Parallel mode** (say "run a parallel regression…") — one `qa-executor` per spec file, all
dispatched at once, no pausing until the final merged report. Best for full regression sweeps.

Full design doc: [`docs/ai/architecture.md`](./docs/ai/architecture.md).

---

## Guardrails (non-negotiable, not suggestions)

- **Never modifies application code** — only writes to `executions/**`.
- **Never uses real personal data** — disposable values only, no real signup/login/checkout.
- **Never prints secrets** — `{ "envSecret": "NAME" }` resolves from `.env` at point of use, never logged.
- **`api:` / `db:` steps are catalog-only** — the agent runs only requests/queries you predefined; an undefined one is `BLOCKED`, never improvised. DDL is always refused.
- **Ambiguity → ask, never guess.**

Full policy: [`docs/ai/security-policy.md`](./docs/ai/security-policy.md) ·
[`docs/ai/testing-policy.md`](./docs/ai/testing-policy.md).

---

## Repository layout

```
agentex-copilot/
├── plugin.json                     # real Copilot CLI plugin manifest
├── .github/plugin/marketplace.json # self-hosted marketplace listing this one plugin
├── agents/                         # test-orchestrator + qa-executor role definitions
├── skills/                         # 12 capabilities — see skills/README.md for the full matrix
├── scripts/
│   ├── install.js              # fallback installer for non-CLI Copilot Chat users
│   └── lib/                    # shared project_config.js + Azure DevOps tracker client
├── references/tracker/         # shared az CLI mechanics reference
├── templates/                  # AGENTS.md / copilot-instructions.md used by the fallback installer
├── docs/
│   ├── getting-started.md      # first-timer walkthrough
│   ├── IMPLEMENTATION_GUIDE.md # wiring this into a real, multi-environment project
│   ├── CONVERSION_REPORT.md    # what changed porting from the Claude Code original
│   └── ai/                     # context, architecture, security-policy, testing-policy
├── config/                     # project.json.example, environments/dev.json.example
└── DEPLOYMENT.md               # full install + config walkthrough
```

## Configuration model

Three homes, one job each:

| File | Holds |
|---|---|
| `config/project.json` | `defaultEnvironment`, KB settings, login mode, `azure`/`figma` blocks for the Azure DevOps and ui-check skills |
| `config/environments/<env>.json` | Target `portalUrl`, test `users`, `db`/`api` integration targets |
| `.env` | Secrets **only** — referenced by name from the JSON files above, never inlined |

## What's ported vs. what's left

All 12 upstream QA capabilities are real, working skills here — see
[`skills/README.md`](./skills/README.md) for the full matrix and what each one's bundled
runner script does. What's still open, per
[`docs/CONVERSION_REPORT.md`](./docs/CONVERSION_REPORT.md): no bundled sample specs
(`test/suite1/`), no mobile testing (upstream dropped it too as of v0.19.0), and the bundled
scripts' own test suites weren't ported (they were smoke-tested manually during the port, but
there's no automated regression suite here yet).

## Security

Secrets never live in JSON config — see [`.env.example`](./.env.example) and
[`docs/ai/security-policy.md`](./docs/ai/security-policy.md). `.env` is gitignored by default.

## Contributing

Open issues and PRs on the [GitHub repository](https://github.com/mabdel130/agentex-copilot).

## Credits

Ported from [AgenTeX](https://github.com/MhmdElGazzar/agentex) by Mohamed Elgazzar, for
GitHub Copilot by [**@mabdel130**](https://github.com/mabdel130).

## License

MIT — see [LICENSE](./LICENSE).
