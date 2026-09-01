# Changelog

All notable changes to AgenTeX for GitHub Copilot are documented here.

## [2.6.6] — 2026-09-01

### Added
- `skills/browser-testing/scripts/run_parallel.js`, an opt-in deterministic runner for
  repeatable browser-only parallel runs. It uses one browser process with bounded, isolated
  contexts, constrained manifest validation, per-scenario screenshots, and sanitized
  console/network metadata.
- Focused Node tests for the manifest validation boundary.

### Changed
- Parallel-run guidance now selects the runner when a spec can be expressed with its safe action
  vocabulary, while retaining the Playwright Agent CLI fallback for exploratory or unsupported
  flows.

## [2.6.5] — 2026-09-01

### Fixed
- Browser testing now runs in the invoking Copilot session instead of dispatching custom agents
  that may not receive terminal, browser, or file capabilities. The bundled agent files remain
  the authoritative orchestration and per-spec execution roles.

## [2.6.4] — 2026-08-30

### Added
- Playwright Agent CLI-based browser execution with isolated `-s=<session>` sessions.
- Optional `playwright` project defaults for Chromium/Chrome, Firefox, WebKit, or Edge;
  headless/headed mode; isolated persistent profiles; and optional HTML dashboards. Clear
  request-level choices override these defaults.

### Changed
- Browser preflight now reports Playwright Agent CLI availability and documentation now installs
  `@playwright/cli` plus the selected browser engine.

## [2.6.3] — 2026-08-30

### Fixed
- Removed the restrictive `tools: [write]` allowlist from the test orchestrator and QA executor
  profiles. They now inherit the Copilot runtime's available file, terminal, and browser tools,
  allowing them to read specs, run Playwright, and write execution artifacts.

## [2.6.2] — 2026-08-29

### Added
- Browser-testing reference guidance plus portable preflight, isolated run-directory/session
  initialization, and defect-evidence merge helpers.

## [2.6.1] — 2026-08-29

### Added
- `browser-testing` as a first-class Copilot skill that delegates browser execution to the
  existing `test-orchestrator` and `qa-executor` agents.

## [2.6.0] — 2026-08-29

### Added
- Persistent `run-summary.json` (schema version 2) for every QA execution. It records safe
  scenario outcomes, active execution timing, evidence paths, and defects, then drives the
  enriched standalone `extent-report.html` dashboard.
- The extent-report renderer now accepts the enriched persistent run record while retaining
  compatibility with the legacy JSON input shape. It renders optional timing, evidence, and
  defect details when supplied.

### Changed
- The test orchestrator and QA executor now capture the safe timing and evidence metadata needed
  for the durable run record. Sequential approval wait time is excluded from execution duration.

## [2.5.1] — 2026-08-26

### Added
- Explicit sign-in step in the install walkthrough: `copilot` prompts
  `Please use /login to sign in to use Copilot` on first run for an unauthenticated user —
  documented as its own step in [`DEPLOYMENT.md`](./DEPLOYMENT.md), `README.md`, and
  [`docs/getting-started.md`](./docs/getting-started.md), with a matching troubleshooting row.
  Confirmed against a real `copilot` CLI session.
- `DEPLOYMENT.md`'s primary path is now a fully numbered walkthrough (sign in → install plugin
  → go to project → install Playwright → scaffold config → grant permissions → run first test
  → review results → use the other 10 skills), plus a quick-reference table mapping natural
  requests to which skill they trigger.

## [2.5.0] — 2026-08-26

### Added
Full parity with upstream AgenTeX v0.19.0's 12 QA skills — all now real, working `SKILL.md`
files (not just documented-only references), ported from the upstream Claude Code plugin and
adapted to this port's `config/` layout:

- `skills/api-integration/` — cataloged `api:` steps, `scripts/run_api.js`.
- `skills/db-integration/` — cataloged `db:` steps (SQL Server via `sqlcmd`), `scripts/run_db.js`.
- `skills/ask-kb/` — `kb:` steps against a project's Knowledge Base Ask API, `scripts/ask_kb.js`.
- `skills/ui-check/` — design-conformance `ui-check:` steps against a Figma frame or image
  baseline, `scripts/fetch_baseline.js`.
- `skills/define-flow/` — agent-led, define-by-doing spec authoring in a live browser.
- `skills/optimize-login/` — pay a login's cost once per session, `scripts/session.js`.
- `skills/extent-report/` — standalone `extent-report.html` dashboard generator,
  `scripts/make_html_report.js`.
- `skills/azure-integration/` — generic Azure CLI (`az`) access.
- `skills/task-estimation/` — QA effort estimation + `[Testing]` task creation on Azure DevOps
  User Stories, via `az boards`.
- `skills/test-design/` — Azure DevOps test case design/creation/linking from a story's ACs,
  `scripts/testplan.js`.
- `skills/bug-report-azure/` — files defects as Azure DevOps Bugs via the ADO REST API
  directly (no `az` CLI), fail-closed writes with an exact ledger; `scripts/create-bug.js`,
  `scripts/read-workitem.js`, `scripts/check-image.js`.
- `scripts/lib/tracker/` — the shared, provider-neutral Azure DevOps REST client
  (`index.js`, `cache.js`, `ledger.js`, `adapters/ado.js`) backing test-design and
  bug-report-azure. No `az` CLI, no dependencies, built on Node's `fetch`.
- `references/tracker/ado-boards-cli.md` — shared `az boards`/`az devops` CLI mechanics.

All bundled scripts were smoke-tested manually against real inputs during the port (catalog
lookups, DDL bans, param sanitization, config-resolution chains for missing org/project/PAT,
and the HTML/JSON generators) — see the session's tool output for specifics. Their `*.test.js`
suites were not ported; there's no automated regression suite here yet.

`plugin.json` still declares `"skills": ["skills/"]` (unchanged from v2.4.0) — now backed by
12 real skills instead of one.

## [2.4.0] — 2026-08-26

### Added
- `skills/init-test/` — a real Agent Skill mirroring upstream AgenTeX's `/init-test` Claude
  Code command. Ask Copilot "Set up AgenTeX for this project" to scaffold
  `config/project.json`, `config/environments/dev.json`, `.env`, and `test/` — idempotent,
  never overwrites existing files. Built to the real [Agent Skills specification](https://agentskills.io/specification)
  (the open standard GitHub Copilot implements), confirmed against GitHub's own example plugins
  at [github/copilot-plugins](https://github.com/github/copilot-plugins).
- `plugin.json` now declares `"skills": ["skills/"]`, since the folder ships a real skill.

### Fixed
- `skills/README.md`'s "Adding a skill" section previously claimed `SKILL.md` needs a
  JSON-Schema `input` block, sourced from `copilot-plugin-converter` — the real spec has no
  such field; skills are triggered by matching `description` against the user's request, not
  invoked with typed parameters. Corrected with a link to the real spec and a working example.
- Install docs (`README.md`, `DEPLOYMENT.md`, `docs/getting-started.md`) replaced the manual
  "find the global install path and `cp` the example configs" step with asking Copilot to run
  `init-test` directly — matching the polish of upstream's own `/init-test` command.

## [2.3.0] — 2026-08-26

### Added
- `.github/plugin/marketplace.json` — a self-hosted Copilot CLI marketplace listing this one
  plugin (`source: "."`), so it can be installed either directly
  (`copilot plugin install mabdel130/agentex-copilot`) or via the marketplace flow
  (`copilot plugin marketplace add mabdel130/agentex-copilot` then
  `copilot plugin install agentex-copilot@agentex-copilot`) — both resolve to the same plugin.

## [2.2.0] — 2026-08-26

### Fixed
- **v2.1.0 over-corrected.** GitHub Copilot CLI plugins are real, officially documented at
  [docs.github.com/en/copilot/concepts/agents/about-plugins](https://docs.github.com/en/copilot/concepts/agents/about-plugins),
  with a real `copilot plugin install OWNER/REPO` command. v2.1.0 concluded no such system
  existed and pivoted entirely to a manual vendoring workflow — that conclusion was wrong. See
  [`docs/CONVERSION_REPORT.md`](./docs/CONVERSION_REPORT.md#correction-v220) for full sourcing.
- `plugin.json` restored as a real, working manifest: dropped the invented `$schema` URL and
  the non-existent `displayName` field, kept only fields confirmed in GitHub's actual CLI
  plugin reference (`name`, `description`, `version`, `author`, `license`, `keywords`,
  `homepage`, `repository`, `agents`).
- `agents/*.agent.md` frontmatter no longer specifies a `tools:` array — the exact tool-name
  strings are inconsistent across GitHub's own docs and examples, and omitting the field is
  documented to grant access to all available tools, which is what these agents need.
- README.md and DEPLOYMENT.md now lead with `copilot plugin install mabdel130/agentex-copilot`
  as the primary install path.

### Added
- `scripts/install.js` + `templates/AGENTS.md` + `templates/copilot-instructions.md` — a
  dependency-free, idempotent fallback installer for Copilot Chat users without the CLI
  (`npx github:mabdel130/agentex-copilot --target .`), implementing the vendoring approach from
  v2.1.0 as an actual one-command tool instead of a manual walkthrough.
- `package.json` — gives the repo a `bin` entry so `npx github:mabdel130/agentex-copilot` works.

### Unchanged
- Agent *behavior* in `agents/test-orchestrator.agent.md` and `agents/qa-executor.agent.md` —
  only the install mechanism and its documentation changed, across both this and the v2.1.0
  correction.

## [2.1.0] — 2026-08-26

### Fixed
- **Corrected the install mechanism.** v2.0.0 modeled `plugin.json` on the schema referenced by
  [copilot-plugin-converter](https://github.com/mabdel130/copilot-plugin-converter)
  (`https://json.schemastore.org/copilot-plugin.json`), which turned out to 404 — there is no
  such GitHub Copilot plugin-manifest system, and no `copilot plugin install` command. See
  [`docs/CONVERSION_REPORT.md`](./docs/CONVERSION_REPORT.md#correction-v210) for the full
  writeup.
- `plugin.json` no longer claims a `$schema`, `agents`, or `skills` manifest field it doesn't
  actually have consumers for — kept only as descriptive metadata, with an explicit note that
  Copilot doesn't read it.
- [`DEPLOYMENT.md`](./DEPLOYMENT.md) and [`docs/getting-started.md`](./docs/getting-started.md)
  rewritten around the integration path that's actually real and was validated end-to-end
  against a live Playwright run: vendor `AGENTS.md` + `agents/` + `docs/ai/` into the target
  project, and add `.github/copilot-instructions.md` so Copilot Chat picks it up on every
  request.

### Unchanged
- Agent behavior in `agents/test-orchestrator.agent.md` and `agents/qa-executor.agent.md` is
  unchanged — only the documentation of how Copilot discovers them was wrong, not the agents
  themselves.

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
