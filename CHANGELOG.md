# Changelog

All notable changes to AgenTeX for GitHub Copilot are documented here.

## [2.0.0] — 2026-08-26

### Added
- Initial GitHub Copilot CLI port of AgenTeX, converted from the Claude Code plugin
  (v0.19.0) into a `plugin.json` + `AGENTS.md` layout following the schema in
  [copilot-plugin-converter](https://github.com/mabdel130/copilot-plugin-converter)
  (`$schema`/`agents`/`skills` fields, lowercase array `tools`, `.agent.md` files).
- `agents/test-orchestrator.agent.md` — plans scenarios, resolves the active
  environment, chooses sequential vs. parallel mode, dispatches executors, and
  merges results into `report.md` / `extent-report.html`.
- `agents/qa-executor.agent.md` — runs a single test spec to completion in an
  isolated Playwright browser session.
- `docs/ai/` — machine-readable context, architecture, security policy, and
  testing policy for Copilot to read before acting.
- `docs/CONVERSION_REPORT.md` — full record of what changed moving from the
  Claude Code plugin format to the Copilot plugin format.
- `config/project.json.example` and `config/environments/dev.json.example` —
  configuration templates carried over from the original project.
- `skills/README.md` — overview of the QA capabilities available to the agents.

### Changed
- Renamed the Claude Code `qa-executor` subagent convention (`agents/*.md` with
  `{{PARAM}}` templating) to the Copilot `*.agent.md` convention.
- Configuration path `environments/<env>.json` moved under `config/environments/`
  to match the Copilot plugin's single `config/` root.

### Notes
- This is a documentation/agent-definition port. Skill implementation scripts
  (Node runners for API/DB/report generation) are referenced in
  [`skills/README.md`](./skills/README.md) as the next milestone — see
  [`docs/IMPLEMENTATION_GUIDE.md`](./docs/IMPLEMENTATION_GUIDE.md).

## [1.0.0] — pre-release

- Internal planning only; no public release under the `agentex-copilot` name
  before v2.0.0.
