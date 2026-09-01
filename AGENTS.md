# AGENTS.md

Instructions for GitHub Copilot (and any other AGENTS.md-aware coding agent) working in a
project that has AgenTeX installed — either as a real Copilot CLI plugin
(`copilot plugin install mabdel130/agentex-copilot`) or vendored in via the fallback installer
for non-CLI Copilot Chat use (see [DEPLOYMENT.md](./DEPLOYMENT.md)). This file is the entrypoint
Copilot reads before acting — it explains what AgenTeX is, which agents it ships, and the rules
that apply to every run.

## What this plugin does

AgenTeX turns manual QA execution into an agentic workflow: an agent plans test scenarios,
drives a real browser via [Playwright](https://playwright.dev), captures screenshot/log
evidence, and produces a consolidated defect report — either **sequentially**
(human-in-the-loop, one scenario at a time with checkpoints) or in **parallel** (autonomous,
one session per spec file). It **never modifies application code**.

## Agents shipped with this plugin

| Agent | File | Role |
|---|---|---|
| **test-orchestrator** | [`agents/test-orchestrator.agent.md`](./agents/test-orchestrator.agent.md) | Workflow definition the invoking Copilot session follows to resolve, plan, execute, and report a run. |
| **qa-executor** | [`agents/qa-executor.agent.md`](./agents/qa-executor.agent.md) | Per-spec execution role the invoking session follows in each isolated browser session. |

## How to use this plugin

```
Test https://example.com — the signup form: happy path plus empty and bad-email cases.
```

or explicitly:

```
Run a parallel regression against https://example.com from the specs in test/suite1/.
```

Every run writes to a timestamped `executions/execu_<timestamp>/` folder: `report.md`, an
interactive `extent-report.html` dashboard, persistent `run-summary.json`, per-session
logs/screenshots, and a merged
`bugs/bug-list.md`.

## Browser-testing skill

[`skills/browser-testing/SKILL.md`](./skills/browser-testing/SKILL.md) is the entry point for
browser requests. The invoking Copilot session performs the workflow itself because it owns the
browser, terminal, and file permissions; the agent files provide the role definitions. Its
`references/playwright.md` defines browser and evidence rules; its helper scripts preflight
Playwright, create isolated run/session paths, and merge defect evidence.

## Non-negotiable rules for every agent in this plugin

1. **Never modify application source code.** Only write test artifacts (`executions/**`).
2. **Never use real personal data.** Disposable values only (e.g. `qa.tester@example.com`);
   no real signup, login, checkout, or payment flows.
3. **Never print or log secrets.** Values under `{ "envSecret": "NAME" }` are resolved from
   `.env` at the point of use and never echoed back — see
   [`docs/ai/security-policy.md`](./docs/ai/security-policy.md).
4. **Catalog-only integrations.** `api:` / `db:` steps run only the named, parameterized
   requests/queries defined in the project's `integration/` catalog. The agent never composes
   its own SQL or HTTP request, and DDL (`DROP`/`TRUNCATE`/`ALTER`) is always refused.
5. **Ask, don't guess.** If scope, an environment, or a test user is ambiguous or undefined,
   stop and ask (sequential mode) or report it as BLOCKED (parallel mode) — never improvise.

Full policy detail: [`docs/ai/security-policy.md`](./docs/ai/security-policy.md) and
[`docs/ai/testing-policy.md`](./docs/ai/testing-policy.md). System design:
[`docs/ai/architecture.md`](./docs/ai/architecture.md). Project background:
[`docs/ai/context.md`](./docs/ai/context.md).

## Configuration this plugin reads

Three homes, one each — see [`config/project.json.example`](./config/project.json.example) and
[`config/environments/dev.json.example`](./config/environments/dev.json.example):

- `config/project.json` — project-level settings (`defaultEnvironment`, KB settings, login mode).
- `config/environments/<env>.json` — per-environment target URL, test users, DB/API integration
  targets.
- `.env` — secrets only, referenced by name from the JSON files, never inlined.

## Getting started

New to this plugin? Start at [`docs/getting-started.md`](./docs/getting-started.md).
