# AGENTS.md

Instructions for any AI coding agent (GitHub Copilot, Claude, etc.) working in this project.
This project has AgenTeX QA-testing behavior vendored in from
[agentex-copilot](https://github.com/mabdel130/agentex-copilot) — read this file before acting
on any request to test, check, or verify this application's behavior.

## What this gives you

Use the browser-testing skill and two agent roles when asked to test something:

- **`.github/agentex/skills/browser-testing/SKILL.md`** — read first for browser setup,
  evidence, run-directory, and isolated-session rules.

- **`.github/agentex/agents/test-orchestrator.agent.md`** — read this first for any testing
  request. Plans scenarios, resolves the target environment, decides sequential vs. parallel
  mode, dispatches executors, merges results into a report.
- **`.github/agentex/agents/qa-executor.agent.md`** — the role for running one test spec file
  to completion in an isolated browser session.

Non-negotiable rules (full detail in `.github/agentex/ai-docs/`):

1. **Never modify application source code.** Only write test artifacts under `executions/**`.
2. **Never use real personal data or complete real transactions** (no real signup/login/checkout).
3. **Never print or log secrets.** `{ "envSecret": "NAME" }` in config means: read `NAME` from
   `.env` at point of use, never echo it.
4. **`api:`/`db:` steps are catalog-only** — only requests/queries defined in `integration/`
   may run; an undefined one is BLOCKED, never improvised.
5. **Ask, don't guess** when scope or a config value is ambiguous.

Full policy: `.github/agentex/ai-docs/security-policy.md` and
`.github/agentex/ai-docs/testing-policy.md`. Architecture: `.github/agentex/ai-docs/architecture.md`.

## Configuration

- `config/project.json` — `defaultEnvironment`, KB settings, login mode.
- `config/environments/<env>.json` — target `portalUrl`, test `users`, `db`/`api` blocks.
- `.env` — secrets only, referenced by name from the JSON files above.

## How to use this

Just ask, in plain language: e.g. "Test https://example.com — the signup form: happy path
plus empty and bad-email cases." Read `test-orchestrator.agent.md`'s mode rules (sequential
is the default) before opening a browser.

---
Vendored by `npx github:mabdel130/agentex-copilot` — re-run it any time to pick up updates to
`.github/agentex/agents/`, `.github/agentex/skills/browser-testing/`, and
`.github/agentex/ai-docs/` (it never overwrites this file or your config once they exist, so
your own edits are safe).
