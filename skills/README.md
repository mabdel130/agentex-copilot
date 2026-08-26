# Skills — QA Capability Reference

This plugin's two agents (`test-orchestrator`, `qa-executor` — see
[`../agents/`](../agents/)) implement the core browser-testing loop directly. The table below
documents all 12 QA capabilities from the upstream [AgenTeX](https://github.com/MhmdElGazzar/agentex)
v0.19.0 Claude Code plugin that this loop is ported from — which ones are active in this
version of the Copilot port, and which are documented here as the roadmap for full parity.
See [`../docs/CONVERSION_REPORT.md`](../docs/CONVERSION_REPORT.md) for the conversion rationale.

## Status legend

- ✅ **Ported** — behavior implemented directly in `agents/*.agent.md`.
- 📋 **Documented, not yet implemented** — behavioral contract described below and in
  [`../docs/ai/`](../docs/ai/); no runnable skill file yet in this repo.

## Capabilities

| Skill | Status | What it does |
|---|---|---|
| **browser-testing** | ✅ Ported | Drives a real browser via Playwright, sequential or parallel, producing per-scenario screenshots/logs and a consolidated defect report. This is the loop `test-orchestrator` + `qa-executor` implement. |
| **api-integration** | 📋 Documented | Executes user-defined API calls from the project's `integration/*_api.json` catalog for `api:` test-spec steps — never an improvised HTTP request. |
| **db-integration** | 📋 Documented | Executes user-defined database queries from `integration/*_db.json` for `db:` steps (SQL Server via `sqlcmd`) — catalog-only, DDL always refused. |
| **ask-kb** | 📋 Documented | Answers `kb:` steps by querying the project's Knowledge Base Ask API. Advisory context only — never PASS/FAIL evidence. |
| **ui-check** | 📋 Documented | Compares the live page under test against a declared design baseline (a Figma frame or a screenshot image), in exact or reference mode, for `ui-check:` steps. |
| **define-flow** | 📋 Documented | Builds a test spec interactively: the agent proposes a step, executes it live, and the user confirms the real outcome before the next step is defined — for specs too complex to write blind. |
| **optimize-login** | 📋 Documented | Pays a web app's login cost once per session instead of once per test — drives the login live, saves the browser session, reloads it for later scenarios. |
| **extent-report** | 📋 Documented | Renders a finished run's results as a standalone `extent-report.html` dashboard (donut chart, per-status stat cards, expandable per-scenario detail) next to `report.md`. |
| **azure-integration** | 📋 Documented (not in scope) | Generic Azure CLI (`az`) access — App Service, Storage, Key Vault, AKS — for tests that need to reach Azure resources mid-run. |
| **task-estimation** | 📋 Documented (not in scope) | Estimates QA effort for Azure DevOps User Stories and creates `[Testing]` tasks. |
| **test-design** | 📋 Documented (not in scope) | Turns a User Story's acceptance criteria into linked Azure DevOps test cases. |
| **bug-report-azure** | 📋 Documented (not in scope) | Files defects found during a run as Azure DevOps Bugs, one confirmation gate before any board write. |

## Adding a skill to this port

To bring a "Documented" capability to "Ported" status:

1. Read the equivalent `SKILL.md` in the upstream
   [agentex `skills/` folder](https://github.com/MhmdElGazzar/agentex/tree/main/skills) for the
   full behavioral contract (catalog rules, safety rules, evidence format).
2. Create `skills/<name>/SKILL.md` in this repo following the Copilot skill schema — frontmatter
   needs `name`, a required `description`, and a JSON-Schema `input` block (see
   [copilot-plugin-converter's schema reference](https://github.com/mabdel130/copilot-plugin-converter/blob/main/docs/schema-reference.md#skill-file-format)).
3. Port any deterministic runner script (`run_api.js`, `run_db.js`, …) into `skills/<name>/scripts/`,
   keeping the same safety enforcement (catalog-only lookups, DDL bans, param sanitization) —
   see [`../docs/ai/security-policy.md`](../docs/ai/security-policy.md) for what must hold.
4. Reference the new skill from `agents/test-orchestrator.agent.md` (or `qa-executor.agent.md`
   for step-level execution) so an agent actually invokes it.
5. Flip its row above to ✅ and update [`../docs/CONVERSION_REPORT.md`](../docs/CONVERSION_REPORT.md).
