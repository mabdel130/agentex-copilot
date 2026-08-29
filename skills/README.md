# Skills — QA Capability Reference

`plugin.json` declares `"skills": ["skills/"]`. Every capability below is a real, working
`SKILL.md` (plus bundled runner scripts where needed) — adapted from
[AgenTeX](https://github.com/MhmdElGazzar/agentex) and extended for this plugin's
`config/` layout and to the real [Agent Skills specification](https://agentskills.io/specification)
(no `input` schema field — skills trigger by matching `description` against the user's
request, not typed invocation). See [`../docs/CONVERSION_REPORT.md`](../docs/CONVERSION_REPORT.md)
for the full conversion history.

The `browser-testing` skill is the primary entry point and delegates the core loop to the two
agents (`test-orchestrator`, `qa-executor` — see [`../agents/`](../agents/)). The remaining
skills are invoked by name or natural-language trigger during a run.

## Capabilities

| Skill | What it does |
|---|---|
| **[browser-testing](./browser-testing/SKILL.md)** | The primary entry point for testing a web application. Delegates to the `test-orchestrator` / `qa-executor` agents for real Playwright execution, sequential approvals or autonomous parallel regression, evidence capture, and durable run reports. |
| **[init-test](./init-test/SKILL.md)** | Scaffolds `config/project.json`, `config/environments/dev.json`, `.env`, an `integration/` catalog with sample API/DB entries, and starter `test/suite1/` specs (only when the project has none of its own) — idempotent, never overwrites. The Copilot-native equivalent of upstream's `/init-test` command. |
| **[api-integration](./api-integration/SKILL.md)** | Executes user-defined API calls from the project's `integration/*_api.json` catalog for `api:` test-spec steps — never an improvised HTTP request. Bundled runner: `scripts/run_api.js`. |
| **[db-integration](./db-integration/SKILL.md)** | Executes user-defined database queries from `integration/*_db.json` for `db:` steps (SQL Server via `sqlcmd`) — catalog-only, DDL always refused. Bundled runner: `scripts/run_db.js`. |
| **[ask-kb](./ask-kb/SKILL.md)** | Answers `kb:` steps by querying the project's Knowledge Base Ask API. Advisory context only — never PASS/FAIL evidence. Bundled runner: `scripts/ask_kb.js`. |
| **[ui-check](./ui-check/SKILL.md)** | Compares the live page under test against a declared design baseline (a Figma frame or a screenshot image), in exact or reference mode, for `ui-check:` steps. Bundled runner: `scripts/fetch_baseline.js`. |
| **[define-flow](./define-flow/SKILL.md)** | Builds a test spec interactively: the agent proposes a step, executes it live, and the user confirms the real outcome before the next step is defined — for specs too complex to write blind. Agent-led, no bundled script. |
| **[optimize-login](./optimize-login/SKILL.md)** | Pays a web app's login cost once per session instead of once per test — drives the login live, saves the browser session, reloads it for later scenarios. Bundled library: `scripts/session.js`. |
| **[extent-report](./extent-report/SKILL.md)** | Renders a finished run's results as a standalone `extent-report.html` dashboard (donut chart, per-status stat cards, expandable per-scenario detail) next to `report.md`. Bundled generator: `scripts/make_html_report.js`. |
| **[azure-integration](./azure-integration/SKILL.md)** | Generic Azure CLI (`az`) access — App Service, Storage, Key Vault, AKS — for tests that need to reach Azure resources mid-run. |
| **[task-estimation](./task-estimation/SKILL.md)** | Estimates QA effort for Azure DevOps User Stories and creates `[Testing]` tasks, via `az boards`. |
| **[test-design](./test-design/SKILL.md)** | Turns a User Story's acceptance criteria into linked Azure DevOps test cases. Bundled mechanics script: `scripts/testplan.js`. |
| **[bug-report-azure](./bug-report-azure/SKILL.md)** | Files defects found during a run as Azure DevOps Bugs via the ADO REST API directly (no `az` CLI) — one confirmation gate before any board write, fail-closed writes with an exact ledger. Bundled scripts: `scripts/create-bug.js`, `scripts/read-workitem.js`, `scripts/check-image.js`. |

## Shared libraries

Several skills above share code rather than duplicating it, at the plugin root:

- **`../scripts/lib/project_config.js`** — the one place that knows where project data lives
  (`config/project.json`, `config/environments/<env>.json`, `.env`). Used by api-integration,
  db-integration, ui-check, and the tracker layer below.
- **`../scripts/lib/tracker/`** — a provider-neutral Azure DevOps REST client (built-in `fetch`,
  no `az` CLI, no dependencies) with a fail-closed write ledger (`ledger.js`) and a per-project
  field/picklist cache (`cache.js`). Used by test-design's `testplan.js` and all of
  bug-report-azure's scripts.
- **`../references/tracker/ado-boards-cli.md`** — shared `az boards`/`az devops` CLI mechanics,
  used by task-estimation and test-design (which still drive `az` directly for their own
  workflows; bug filing does not).

## Command equivalents

Upstream ships thin Claude Code slash-command wrappers (`commands/*.md`) around several
skills. GitHub Copilot CLI supports a `commands` manifest path, but GitHub's published plugin
authoring guide does not define a portable format for the upstream Claude `$ARGUMENTS` wrappers.
The plugin therefore uses natural-language skill activation and the `test-orchestrator` agent
as the supported interface. See [`../docs/COPILOT_EQUIVALENTS.md`](../docs/COPILOT_EQUIVALENTS.md)
for the command-by-command mapping.

## Known gaps vs. upstream

- No mobile testing support (upstream itself no longer ships a dedicated mobile-testing skill
  as of v0.19.0).
- Test files (`*.test.js`) for the bundled scripts were not ported — the scripts themselves
  were smoke-tested manually during the port (catalog lookups, DDL bans, config-resolution
  chains, and the HTML/JSON generators all verified against real inputs), but there's no
  automated regression suite here yet.
- Upstream's `init-test` Setup Wizard (a local bilingual web UI for interactive config) and its
  `update-agentex` self-migration engine are intentionally not ported — see
  [`../docs/CONVERSION_REPORT.md`](../docs/CONVERSION_REPORT.md#closing-the-command-equivalent-gaps)
  for why.

## Adding or updating a skill

1. Read the equivalent `SKILL.md` in the upstream
   [agentex `skills/` folder](https://github.com/MhmdElGazzar/agentex/tree/main/skills) for the
   full behavioral contract.
2. Follow the real [Agent Skills specification](https://agentskills.io/specification):
   frontmatter needs `name` (must match the directory name, lowercase-hyphenated) and a
   required `description` stating both what the skill does and when to use it.
3. Any bundled script should resolve its own plugin-relative paths via `__dirname` (see any
   script in this folder for the pattern) rather than assuming a fixed install location.
4. Update this table and [`../docs/CONVERSION_REPORT.md`](../docs/CONVERSION_REPORT.md).
