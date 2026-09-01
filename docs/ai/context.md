# AI Context

Background for any agent (Copilot or otherwise) acting in a project that has this plugin
installed. Read this before `architecture.md`, `security-policy.md`, and `testing-policy.md`.

## What this plugin is

AgenTeX for GitHub Copilot is a QA automation plugin adapted from
[AgenTeX](https://github.com/MhmdElGazzar/agentex), a mature Claude Code plugin with the same
name. It turns manual test execution into an agentic workflow: an agent plans
scenarios, drives a real browser, captures evidence, and produces a defect report. See
[`docs/CONVERSION_REPORT.md`](../CONVERSION_REPORT.md) for exactly what changed in the port.

## Who uses it

A developer or QA engineer working inside a project that wants automated (but supervised)
browser testing, without writing and maintaining a full test automation framework by hand.

## What it is not

- Not a replacement for unit/integration test suites — it drives the UI like a human tester
  would, for scenarios that are expensive to script conventionally.
- Not an autonomous bug-fixer — it **never modifies application code**, only reports findings.
- Not a load/performance testing tool.
- Not a mobile testing tool. Azure DevOps planning, test design, and bug reporting are available
  through the corresponding installed skills, subject to their configuration and approval rules.

## Capabilities available to the agents (upstream reference)

This plugin ships 13 skills, including the Copilot-native `init-test` skill. The
`browser-testing` skill runs the core loop in the invoking Copilot session using the
`test-orchestrator` and `qa-executor` files as role definitions. Full descriptions live in
[`skills/README.md`](../../skills/README.md); the short version:

- **browser-testing** — the core loop this port implements.
- **api-integration** / **db-integration** — catalog-only `api:`/`db:` spec steps.
- **ask-kb** — advisory `kb:` questions against a project knowledge base.
- **ui-check** — compare a live page against a design baseline (Figma frame or screenshot).
- **define-flow** — build a spec step by step in a live browser instead of writing it blind.
- **optimize-login** — pay a login's cost once per session, not once per test.
- **extent-report** — render `report.md` results as an interactive HTML dashboard.
- **azure-integration**, **task-estimation**, **test-design**, **bug-report-azure** — Azure
  resource access plus Azure DevOps planning and bug filing.

## How an agent should orient itself

1. Read [`AGENTS.md`](../../AGENTS.md) — the entrypoint and non-negotiable rules.
2. Read [`docs/ai/architecture.md`](./architecture.md) — how the two agents compose.
3. Read [`docs/ai/security-policy.md`](./security-policy.md) before touching secrets,
   integrations, or anything resembling real user data.
4. Read [`docs/ai/testing-policy.md`](./testing-policy.md) before writing or judging a defect.
5. Consult [`config/project.json.example`](../../config/project.json.example) and
   [`config/environments/dev.json.example`](../../config/environments/dev.json.example) to
   understand what configuration the running project is likely to provide.
