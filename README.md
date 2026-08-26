# AgenTeX for GitHub Copilot

**Stop clicking through the same test cases by hand. Describe what to test, in plain English,
and let an agent plan it, run it in a real browser, and hand you back a defect report.**

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](./CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Works with GitHub Copilot](https://img.shields.io/badge/GitHub%20Copilot-agent%20mode-8957e5.svg?logo=githubcopilot&logoColor=white)](https://github.com/features/copilot)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium%2FFirefox%2FWebKit-2EAD33.svg?logo=playwright&logoColor=white)](https://playwright.dev)
[![Ported from AgenTeX](https://img.shields.io/badge/ported%20from-AgenTeX%20v0.19.0-8A2BE2.svg)](https://github.com/MhmdElGazzar/agentex)

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

> **Read this before you install anything:** GitHub Copilot has no plugin marketplace and no
> `copilot plugin install` command — this repo used to imply otherwise, and that was wrong (full
> story in [`docs/CONVERSION_REPORT.md`](./docs/CONVERSION_REPORT.md#correction-v210)). What
> actually works, and what the instructions below use, is **vendoring**: you copy a handful of
> instruction files into your own project, and GitHub Copilot's real, documented mechanisms
> (`AGENTS.md`, `.github/copilot-instructions.md`) pick them up automatically.

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

## 5-minute quick start

```bash
# 1. Vendor the agent files into the project you want to test
mkdir -p .github/agentex
cp -r /path/to/agentex-copilot/agents      .github/agentex/agents
cp -r /path/to/agentex-copilot/docs/ai     .github/agentex/ai-docs
cp    /path/to/agentex-copilot/AGENTS.md   ./AGENTS.md

# 2. Point Copilot Chat at them (create this file — see DEPLOYMENT.md for exact contents)
#    .github/copilot-instructions.md

# 3. Install the browser driver
npm install -D @playwright/test && npx playwright install chromium

# 4. Scaffold config
mkdir -p config/environments
cp /path/to/agentex-copilot/config/project.json.example              config/project.json
cp /path/to/agentex-copilot/config/environments/dev.json.example     config/environments/dev.json
cp /path/to/agentex-copilot/.env.example                              .env
```

Then, in an editor with **GitHub Copilot Chat in agent mode**, just ask:

```
Test https://example.com — the signup form: happy path plus empty and bad-email cases.
```

Full walkthrough, including *why* it's set up this way: **[DEPLOYMENT.md](./DEPLOYMENT.md)**.
Guided version for first-timers: **[docs/getting-started.md](./docs/getting-started.md)**.

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

Two roles, defined as plain markdown agent files — no proprietary format, just frontmatter +
instructions any capable coding agent can follow:

| Agent | File | Job |
|---|---|---|
| **`test-orchestrator`** | [`agents/test-orchestrator.agent.md`](./agents/test-orchestrator.agent.md) | The one you talk to. Resolves the target environment, plans scenarios, picks sequential vs. parallel mode, dispatches executors, merges the final report. |
| **`qa-executor`** | [`agents/qa-executor.agent.md`](./agents/qa-executor.agent.md) | Runs exactly one test spec to completion in its own isolated browser session. Dispatched by the orchestrator, never invoked directly. |

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
├── AGENTS.md                   # entrypoint instructions — vendor this into your project
├── agents/                     # test-orchestrator + qa-executor role definitions
├── docs/
│   ├── getting-started.md      # first-timer walkthrough
│   ├── IMPLEMENTATION_GUIDE.md # wiring this into a real, multi-environment project
│   ├── CONVERSION_REPORT.md    # what changed porting from the Claude Code original
│   └── ai/                     # context, architecture, security-policy, testing-policy
├── config/                     # project.json.example, environments/dev.json.example
├── skills/                     # capability reference — what's ported vs. documented-only
├── DEPLOYMENT.md               # the real install instructions (read this first)
└── plugin.json                 # descriptive metadata only — Copilot does not read this file
```

## Configuration model

Three homes, one job each:

| File | Holds |
|---|---|
| `config/project.json` | `defaultEnvironment`, KB settings, login mode |
| `config/environments/<env>.json` | Target `portalUrl`, test `users`, `db`/`api` integration targets |
| `.env` | Secrets **only** — referenced by name from the JSON files above, never inlined |

## Roadmap / known gaps

This is a documentation-and-agent-definition port, not a full 1:1 reimplementation. See
[`skills/README.md`](./skills/README.md) for the full capability matrix (ported vs.
documented-only) and [`docs/CONVERSION_REPORT.md`](./docs/CONVERSION_REPORT.md) for the
complete gap list — in short: no bundled runner scripts yet (`run_api.js`, `run_db.js`,
HTML report generation), no `ui-check`/`define-flow` implementation yet, no Azure DevOps
integration in this port.

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
