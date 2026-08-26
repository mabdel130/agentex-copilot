# AgenTeX for GitHub Copilot

**Agentic QA for GitHub Copilot — an agent plans, runs, and reports your tests so you don't
click through them by hand.**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](./CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![GitHub Copilot Plugin](https://img.shields.io/badge/GitHub%20Copilot-Plugin-8957e5.svg)](https://github.com/features/copilot)
[![Playwright](https://img.shields.io/badge/Playwright-Browser-2EAD33.svg?logo=playwright&logoColor=white)](https://playwright.dev)

AgenTeX (Agentic Test eXecution) takes manual test execution off your plate. Instead of
clicking the same scenarios by hand, an agent plans them, drives a **real browser** via
[Playwright](https://playwright.dev), captures screenshot/log evidence, and produces a
consolidated defect report — either **sequentially** (human-in-the-loop) or in **parallel**
(autonomous, one session per spec file). It **never modifies your application code**.

This is a GitHub Copilot CLI port of [AgenTeX](https://github.com/MhmdElGazzar/agentex) v0.19.0,
originally built as a Claude Code plugin, converted following the schema documented by
[copilot-plugin-converter](https://github.com/mabdel130/copilot-plugin-converter). See
[`docs/CONVERSION_REPORT.md`](./docs/CONVERSION_REPORT.md) for what changed in the port.

## [Getting Started](./docs/getting-started.md)

New here? **[Getting Started](./docs/getting-started.md)** walks you through install → browser
driver → scaffold → permissions → first run. The short version:

```
1. Add this repository as a Copilot plugin (see DEPLOYMENT.md)
2. npm install -D @playwright/test && npx playwright install chromium
3. Copy config/project.json.example -> config/project.json
4. Copy config/environments/dev.json.example -> config/environments/dev.json
5. cp .env.example .env   # fill in secrets
6. Ask Copilot: "Test https://example.com — the signup form"
```

## Features — how each one works

| Feature | How it works | Docs |
|---------|--------------|------|
| **Browser testing** | The `test-orchestrator` agent plans scenarios, drives a real browser via Playwright, screenshots each one, and reports defects — sequential (approve each step) or parallel (one `qa-executor` subagent per spec file). | [ai/architecture.md](./docs/ai/architecture.md) |
| **API & DB steps** | `api:` / `db:` scenario steps run **only** the named, parameterized requests/queries in your `integration/` catalog — the agent never composes its own SQL or HTTP; DDL is refused. | [ai/security-policy.md](./docs/ai/security-policy.md) |
| **Ask the KB** | `kb:` steps query your project's KB Ask API for advisory context — informs testing, **never** used as PASS/FAIL evidence. | [ai/context.md](./docs/ai/context.md) |
| **HTML report** | At the end of a run, generates a standalone, self-contained `extent-report.html` dashboard (donut chart, status cards, expandable per-test-case steps). | [skills/README.md](./skills/README.md) |
| **Configuration** | Three homes, one each: `config/project.json` (project settings), `config/environments/<env>.json` (targets, users, integrations), and a secrets-only `.env`. | [IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md) |

See [docs/](./docs/) for the full reference on any feature.

## Usage at a glance

```
# Sequential (human-in-the-loop) — natural language:
Test https://example.com — the signup form: happy path plus empty and bad-email cases.

# Parallel (autonomous):
Run a parallel regression against https://example.com from the specs in test/suite1/.
```

Every run writes to a timestamped `executions/execu_<timestamp>/` folder — `report.md`,
`extent-report.html`, per-session logs/screenshots, and a merged bug list.

## Repository layout

```
agentex-copilot/
├── plugin.json                 # Copilot plugin manifest
├── AGENTS.md                   # Instructions Copilot reads before acting
├── agents/                     # test-orchestrator + qa-executor agent definitions
├── docs/                       # user docs + docs/ai/ (context, architecture, policies)
├── config/                     # project.json.example, environments/dev.json.example
└── skills/                     # QA capability reference
```

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
