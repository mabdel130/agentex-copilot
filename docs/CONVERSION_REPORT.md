# Conversion Report — AgenTeX (Claude Code) → AgenTeX for GitHub Copilot

This document records what changed when porting [AgenTeX](https://github.com/MhmdElGazzar/agentex)
(a Claude Code plugin, **v0.19.0**) into a GitHub Copilot CLI plugin layout (this repository,
v2.0.0). The conversion follows the schema and field mapping documented by
[mabdel130/copilot-plugin-converter](https://github.com/mabdel130/copilot-plugin-converter),
which formalizes the Claude Code → GitHub Copilot CLI plugin conversion this repository applies
by hand. It exists so future contributors understand *why* the structure differs from the
original, not just *that* it does.

## Why convert at all

Claude Code plugins are built around a specific manifest (`.claude-plugin/plugin.json`),
subagent convention (`agents/*.md` with `{{PARAM}}` templating dispatched via the Task tool),
and a skills system (`skills/<name>/SKILL.md` + `references/` + `scripts/`). GitHub Copilot CLI
plugins use a root-level `plugin.json` against the
[`copilot-plugin.json`](https://json.schemastore.org/copilot-plugin.json) schema, `.agent.md`
agent files with an array-of-lowercase-strings `tools` field, and `SKILL.md` files with a
required `description` and a JSON-Schema `input` block. This conversion keeps the judgment and
policy content (what makes AgenTeX behave correctly) and reshapes only the packaging.

## plugin.json field mapping applied

Per the converter's [schema reference](https://github.com/mabdel130/copilot-plugin-converter/blob/main/docs/schema-reference.md):

| Claude (`​.claude-plugin/plugin.json`) | Copilot (`plugin.json`, root) | Change |
|---|---|---|
| `name`, `displayName`, `version`, `description`, `author`, `license`, `keywords` | same | kept as-is |
| (none) | `$schema` | added — `https://json.schemastore.org/copilot-plugin.json` |
| (none) | `agents` | added — `"agents/"` |
| (none) | `skills` | added — `["skills/"]` |
| `author.email` optional | `author.email` required | filled in |

## Agent frontmatter mapping applied

| Claude | Copilot |
|---|---|
| `tools: Bash, Read, Write, Glob, Grep` (comma-separated, capitalized) | `tools: ["bash", "read", "write", "glob"]` (lowercase JSON array) |
| `agents/qa-executor.md` | `agents/qa-executor.agent.md` (`.agent.md` extension) |

`browser` (Playwright) is included in both agents' `tools` array since neither agent functions
without it, per the converter's tool-compatibility reference (Bash↔bash, Read↔read, Write↔write,
Glob↔glob, Browser↔browser — all 1:1 compatible, no deprecated tools involved here).

## Structural changes

| Original (Claude Code) | Ported (Copilot) | Why |
|---|---|---|
| `.claude-plugin/plugin.json` | `plugin.json` (root) | Copilot plugin manifests live at the project root, not in a hidden subfolder. |
| Implicit orchestration inside `skills/browser-testing/SKILL.md` | `agents/test-orchestrator.agent.md` (explicit agent) | Copilot's plugin model expects orchestration logic as an addressable agent, not folded into a skill file the top-level agent merely "reads". |
| `environments/<env>.json` (project root) | `config/environments/<env>.json` | Consolidated all configuration under one `config/` root. |
| `docs/contributing/*.md` (architecture, conventions, aimed at plugin contributors) | `docs/ai/*.md` (context, architecture, security-policy, testing-policy — aimed at the agent itself) | Machine-facing policy docs the agent reads before acting, distinct from human contributor docs. |
| `skills/<name>/` — 12 full skill folders with `SKILL.md` + `references/` + `scripts/` | `skills/README.md` (capability overview only) | This initial port carries over the *behavioral contract* of each capability (documented in `docs/ai/*.md` and the agent files); full `SKILL.md` ports with runner scripts (`run_api.js`, `run_db.js`, `make_html_report.js`, etc.) are a follow-up milestone — see [`IMPLEMENTATION_GUIDE.md`](./IMPLEMENTATION_GUIDE.md). |
| Azure DevOps planning/bug-filing skills (`task-estimation`, `test-design`, `bug-report-azure`, `azure-integration`) | Not ported in v2.0.0 | Out of scope for the initial Copilot port, which focuses on the core browser-testing loop; tracked for a later release. |

## Behavioral content carried over unchanged

- The sequential (human-in-the-loop) vs. parallel (autonomous) execution modes and their
  checkpoints.
- The environment-resolution order (explicit → default → legacy fallback) and the rule that a
  named environment with no file is always an error.
- The `{ "envSecret": "NAME" }` convention and the rule that JSON config never holds a literal
  secret.
- The catalog-only principle for `api:`/`db:` steps, including the DDL ban.
- The `kb:` step's advisory-only status (never folded into a PASS/FAIL tally).
- The defect reporting format (Title / Steps / Expected vs Actual / Severity / Evidence).
- The autonomy boundary: no real signup/login/checkout, no real personal data, never print
  secrets, never modify application source.

## Known gaps vs. the original (v0.19.0) — as of v2.4.0

Most of the gaps below were closed in v2.5.0 (see that section further down); the sample-specs
gap specifically was closed slightly later, in "Closing the command-equivalent gaps" further
down still. Kept here as the historical record of what v2.0.0–v2.4.0 actually shipped.

- No bundled sample specs (`test/suite1/`) yet — add your own; see
  [`IMPLEMENTATION_GUIDE.md`](./IMPLEMENTATION_GUIDE.md#4-write-real-specs).
- No bundled runner scripts (`run_api.js`, `run_db.js`, `make_html_report.js`,
  `session.js` for optimize-login, `fetch_baseline.js` for ui-check) — the *policy* they
  enforced is documented in [`docs/ai/security-policy.md`](./ai/security-policy.md), but the
  code itself is not yet ported.
- **`ui-check`** (compare a live page against a Figma/screenshot baseline) and **`define-flow`**
  (build a spec interactively in a live browser) — both new in upstream since the version this
  port started from — are documented in [`skills/README.md`](../skills/README.md) but not yet
  implemented as Copilot agents/skills.
- No mobile testing support (upstream itself no longer ships a dedicated mobile-testing skill
  as of v0.19.0).
- No Azure DevOps integration (estimation, test design, bug filing, generic Azure CLI access).

## Correction (v2.1.0)

Everything above this section describes the conversion as originally done in v2.0.0, following
the schema at `https://json.schemastore.org/copilot-plugin.json` referenced by
[copilot-plugin-converter](https://github.com/mabdel130/copilot-plugin-converter). When this
plugin was actually wired up against real GitHub Copilot, that schema URL turned out to
**404** — it does not exist. There is no `copilot plugin install` command, no plugin-manifest
system, and no automatic discovery of a `agents/` or `skills/` directory in a real GitHub
Copilot installation. `copilot-plugin-converter`'s format models a plugin system that isn't an
actual, shipped GitHub Copilot capability.

What **is** real and documented, confirmed against GitHub's own Copilot docs:

| Mechanism | Status |
|---|---|
| `AGENTS.md` (nearest one in the directory tree) | Real — read by Copilot's coding agent |
| `.github/copilot-instructions.md` | Real — read by Copilot Chat on every request in the repo |
| `.github/instructions/*.instructions.md` (`applyTo` glob) | Real — path-scoped instructions |
| `plugin.json`, `.agent.md` tools array, `skills/*/SKILL.md` input schema, `copilot plugin install` | **Not real** — no such GitHub Copilot feature exists |

As of v2.1.0, this repository is repositioned accordingly:

- `plugin.json` is kept only as descriptive metadata (name/version/description) — it carries an
  explicit `_readme` note that Copilot does not read it, and no longer claims a `$schema` or
  `agents`/`skills` manifest field.
- [`DEPLOYMENT.md`](../DEPLOYMENT.md) and [`getting-started.md`](./getting-started.md) now
  document the real integration path: **vendor** `AGENTS.md`, `agents/`, and `docs/ai/` directly
  into the project you want tested, and add a `.github/copilot-instructions.md` pointing at
  them. This was validated end-to-end against a real Playwright run before being written down
  here — it is not theoretical.
- `agents/*.agent.md` and `docs/ai/*.md` are unchanged in content — the *files* were already
  fine; only the claim about how Copilot discovers them was wrong.

The `.agent.md` extension and lowercase-array `tools:` frontmatter are kept as a readable,
self-documenting convention (they cost nothing and make each file's purpose and required tools
clear to a human or an agent reading it directly) — just understand that nothing auto-parses
them the way `copilot-plugin-converter`'s docs implied.

## Correction (v2.2.0)

The v2.1.0 correction above over-corrected. It's true that
`https://json.schemastore.org/copilot-plugin.json` 404s and that `copilot-plugin-converter`
models a schema that isn't official — but the conclusion drawn from that ("Copilot has no
plugin system at all") was wrong. **GitHub Copilot CLI plugins are real**, officially documented,
and structurally very close to what v2.0.0 originally built. Sources, checked directly rather
than taken on faith this time:

- [docs.github.com/en/copilot/concepts/agents/about-plugins](https://docs.github.com/en/copilot/concepts/agents/about-plugins) — plugin concept, components (agents, skills, hooks, MCP/LSP configs), install methods.
- [docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference) — the actual `plugin.json` schema: only `name` is required; `agents`/`skills` default to `agents/`/`skills/` if omitted; manifest may live at `plugin.json`, `.plugin/plugin.json`, `.github/plugin/plugin.json`, or `.claude-plugin/plugin.json`.
- [github.com/github/copilot-plugins](https://github.com/github/copilot-plugins) — GitHub's own official plugin examples repo (notably, it ships a `.claude-plugin/` directory itself — the two ecosystems can share a manifest location).
- Real install commands confirmed from official docs and a third-party technical writeup: `copilot plugin install OWNER/REPO`, `copilot plugin marketplace add OWNER/REPO`, `copilot plugin install NAME@MARKETPLACE`.

What was genuinely wrong in v2.0.0, and is fixed now:

- The `$schema` URL was invented/guessed (schemastore's real copy 404s) — removed rather than
  replaced with another guess, since `$schema` is optional and only relevant for the separate
  "Open Plugin Spec" opt-in mode this plugin doesn't use.
- `displayName` is not a field in the real schema — removed.
- `author.email` was never required in the real schema (it's `name` that's required, at the
  `author` object level `name` is required, not `email`) — kept anyway since we have one, but no
  longer described as "required."
- The agent frontmatter `tools:` array used values (`bash`, `read`, `write`, `glob`, `browser`)
  that don't match any of the tool-name variants seen across GitHub's own docs and examples
  (`bash`/`view`/`rg`/`glob` in one official example, `read`/`edit`/`search` in another). Rather
  than guess a third combination, the field is **omitted entirely** — GitHub's docs state
  explicitly that omitting `tools:` grants access to all available tools, which is what these
  agents need anyway (shell for Playwright, file read/write for evidence).
- `skills: ["skills/"]` is still not declared, but now for the original, still-valid reason from
  v2.1.0: this repo doesn't ship any `skills/*/SKILL.md` files yet, only `skills/README.md`
  reference documentation.

As of v2.2.0: [`README.md`](../README.md) and [`DEPLOYMENT.md`](../DEPLOYMENT.md) lead with the
real, primary install path (`copilot plugin install mabdel130/agentex-copilot`) and keep the
v2.1.0 vendoring approach as a documented **fallback** for Copilot Chat users without the CLI —
that mechanism (`AGENTS.md` + `.github/copilot-instructions.md`) is still real and still useful,
just not the primary path anymore. [`scripts/install.js`](../scripts/install.js) implements that
fallback as a one-command, idempotent installer (`npx github:mabdel130/agentex-copilot`).

## Self-hosted marketplace (v2.3.0)

Added [`.github/plugin/marketplace.json`](../.github/plugin/marketplace.json), following the
real marketplace format confirmed from the same official sources as the v2.2.0 correction
(`name`, `owner{name,email}`, `metadata{description,version}`, `plugins[]` with each entry's
own `name`/`description`/`version`/`source`). Lists this repo's one plugin, sourced from `.`
(the repo root) — gives `copilot plugin marketplace add` + `install NAME@MARKETPLACE` as an
equivalent alternative to the direct-install command, matching the marketplace-based install
flow `mabdel130/agentex` uses on the Claude Code side.

## Real init-test skill (v2.4.0)

Closes the `skills: ["skills/"]` gap noted above by shipping one real skill,
[`skills/init-test/`](../skills/init-test/), mirroring upstream AgenTeX's `/init-test` Claude
Code command (there is no direct Copilot equivalent of a Claude "command," so this is
implemented as an Agent Skill instead — triggered by matching intent, e.g. "set up AgenTeX
here," rather than a typed slash command).

Building it surfaced one more inherited inaccuracy: [`skills/README.md`](../skills/README.md)'s
"Adding a skill" section, written in the v2.0.0 pass, claimed `SKILL.md` needs a JSON-Schema
`input` block — sourced from `copilot-plugin-converter`, the same unofficial repo responsible
for the v2.0.0/v2.1.0 back-and-forth. The real format is the
[Agent Skills specification](https://agentskills.io/specification) — an open standard GitHub
Copilot implements (linked from GitHub's own
[about-agent-skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills) page)
— which has no `input` field at all: `name` (matching the directory name) and `description`
(what it does *and* when to use it) are the only required frontmatter. Confirmed against
GitHub's own shipped example at
[github/copilot-plugins](https://github.com/github/copilot-plugins/blob/main/plugins/build-perf-cpp/skills/build-performance-analysis/SKILL.md),
fetched and read directly rather than summarized secondhand.

## Full skill parity (v2.5.0)

Closes every remaining gap listed above (except the two noted as still open below). All 12
upstream QA skills are now real `skills/<name>/SKILL.md` files, ported directly from a fresh
clone of `MhmdElGazzar/agentex` at v0.19.0 rather than re-derived from memory:

- **api-integration, db-integration, ask-kb, ui-check, extent-report, optimize-login** — each
  skill's bundled runner script (`run_api.js`, `run_db.js`, `ask_kb.js`, `fetch_baseline.js`,
  `make_html_report.js`, `session.js`) already used relative `require()` paths with no
  Claude-specific assumptions, so the scripts ported verbatim or near-verbatim. Path references
  inside `SKILL.md`/reference docs (`${CLAUDE_PLUGIN_ROOT}/...`, `environments/<env>.json`) were
  rewritten to this port's conventions (skill-relative paths, `config/environments/`).
- **define-flow** — no script, just an adapted `SKILL.md` (removed Claude-specific
  `playwright-cli` session-flag syntax and `/execute-test` command references in favor of the
  `test-orchestrator` agent).
- **azure-integration, task-estimation, test-design** — adapted `SKILL.md`s driving `az`/
  `az boards` directly, plus a shared `references/tracker/ado-boards-cli.md` at the plugin root
  (also already `config/project.json`-native upstream).
- **bug-report-azure** — the largest single addition: `scripts/create-bug.js`,
  `read-workitem.js`, `check-image.js`, plus the shared REST client library
  `scripts/lib/tracker/` (`index.js`, `cache.js`, `ledger.js`, `adapters/ado.js`) that
  test-design's `scripts/testplan.js` also depends on. None of it spawns `az`; it's direct
  ADO REST over Node's built-in `fetch`, with a fail-closed write ledger. Two hardcoded
  `(the /init-test wizard writes it)` messages were corrected to reflect that this port's
  `init-test` skill doesn't scaffold Azure-specific config fields (upstream's wizard did;
  this port doesn't have one).

**Verification approach:** with no live Azure DevOps org, KB server, or Figma file available
to test against, verification focused on what's actually load-bearing for correctness — the
guard rails: catalog-only enforcement (undefined `api:`/`db:` entries → `BLOCKED`), the DDL ban,
param sanitization (SQL-injection-shaped values rejected), and the config-resolution chain
(missing org/project/PAT surfaces the right error at the right layer, in order). All confirmed
against real script runs, not just read for plausibility. `make_html_report.js` was run
against a real sample JSON and produced valid HTML. Two real network calls in this environment
failed for lack of egress (not a code defect — `run_api.js`'s `BLOCKED`/`FAIL` paths both
behaved correctly around the failure).

**Still open**, unrelated to this pass: no bundled sample specs, no mobile testing (matches
upstream v0.19.0), and no `*.test.js` suites were ported — see
[`skills/README.md`](../skills/README.md#known-gaps-vs-upstream).

## Closing the command-equivalent gaps

Upstream ships a `commands/` folder — `ask-kb.md`, `define-flow.md`, `design-test.md`,
`estimate-story.md`, `execute-test.md`, `init-test.md`, `update-agentex.md` — each a thin
Claude Code slash-command wrapper that parses `$ARGUMENTS` and delegates to a skill. This port
never had a `commands/` folder, on purpose: **`commands` is not a confirmed GitHub Copilot
plugin feature.** It appeared once, in an AI-summarized fetch of a schema-reference page — the
same secondhand-summary failure mode that caused the v2.0.0/v2.1.0 back-and-forth documented
above. Checked directly this time: GitHub's own two official example plugins at
[github/copilot-plugins](https://github.com/github/copilot-plugins) (`build-perf-cpp`, `spark`)
use only `skills` (and `hooks`, for `build-perf-cpp`) — neither has a `commands/` folder, and
`spark` doesn't even ship a `plugin.json`. Adding one here would repeat the exact mistake this
document exists to catalog, so this port keeps delegating via natural-language skill triggers
(the confirmed mechanism) instead.

That said, six of those seven commands' *behavior* is real and worth having, and most of it
already existed via the skill it delegated to. What was actually missing, closed in this pass:

- **`execute-test`'s bare suite-name resolution** (`suite3/` → `./test/suite3/`) — added to
  `agents/test-orchestrator.agent.md`'s new "Suite/scope resolution" section.
- **`execute-test`'s auto-scaffold-from-samples** when `test/` is empty — same section; the
  agent now seeds `test/suite1/` from this plugin's own bundled samples (see below) rather than
  silently having nothing to run.
- **`init-test`'s `integration/` catalog scaffolding** — upstream's `/init-test` (via its setup
  wizard) seeds `integration/sample_api.json` / `sample_db.json`; this port's `init-test` skill
  now does the same, copying from the `api-integration` / `db-integration` skills' own
  `templates/` (no new content needed — those templates already existed, they just weren't
  being copied anywhere).
- **Bundled `test/suite1/` sample specs** — ported from upstream's `test/suite1/` (generic
  fixtures, no Claude-specific content) into this repo's own `test/` folder, referenced by both
  `init-test` and the orchestrator's auto-scaffold path. `test/README.md` was rewritten (not
  copied verbatim) to describe this port's conventions (`config/environments/`, skill names)
  rather than upstream's command names.
- **`ask-kb`, `define-flow`, `design-test`, `estimate-story` commands** — no gap; each was a
  thin argument-parsing shim around a skill this port already has in full
  (`ask-kb`/`define-flow`/`test-design`/`task-estimation`). Natural-language invocation already
  covers what `$ARGUMENTS` parsing did.

**Intentionally not ported, and not planned:**

- **`init-test`'s Setup Wizard** — upstream's `/init-test` can launch a local bilingual
  (Arabic/English) web UI (`scripts/wizard/server.js`, a Node HTTP server opened in a browser)
  for interactively filling config. This is Claude-Code-specific tooling (spawning a local
  server + opening a browser from an agent's Bash tool) with no equivalent invocation model in
  Copilot CLI/Chat, and scaffolding via plain files (this port's actual `init-test`) covers the
  same end state without it.
- **`update-agentex`** — upstream's self-migration engine (`scripts/migrate.js` +
  `scripts/lib/migrations/`) detects a consumer project's scaffold version and migrates it
  forward across upstream's own scaffold history (legacy `.env`-only → `environments/` →
  `config/`, etc.). That history is specific to *upstream's* schema evolution — this port has
  had exactly one config shape since v2.0.0, so there is nothing yet to migrate *from*. If this
  port's own `config/` schema changes in a way that breaks existing consumer projects, a
  same-spirit migration skill should be built then, scoped to this port's actual history, not a
  translation of upstream's.

## Versioning note

This repository started at `2.0.0` to signal "port of a mature project," not a from-scratch v1.
`2.1.0` incorrectly concluded no real Copilot plugin system exists and pivoted entirely to
vendoring; `2.2.0` corrects that — the plugin system is real, `plugin.json` + `agents/` is the
primary install path again, and vendoring is kept as a documented fallback. `2.3.0` added a
self-hosted marketplace; `2.4.0` added the first real skill and corrected the skill-format
documentation; `2.5.0` ported the remaining 11 skills for full upstream parity. Agent
*behavior* in `agents/*.agent.md` has not changed across any of these releases — only how the
plugin is installed, packaged, and described, and (as of 2.5.0) how much of upstream's
capability surface is actually implemented here. Future releases should track new capabilities
against the gaps listed earlier, and re-run the mapping whenever the
upstream `agentex` plugin.json version changes.

## Upstream v0.21 compatibility (v2.6.0)

Upstream's durable run record and enriched HTML report were adapted as `run-summary.json`
(schema version 2), the enhanced extent-report renderer, and matching Copilot agent
instructions. Version 2.6.1 also adds `skills/browser-testing/SKILL.md` as the discoverable
Copilot entry point; it originally delegated execution to Copilot-native agents instead of
duplicating the upstream Claude workflow. Current versions run the workflow in the invoking
Copilot session because custom-agent runtimes may not receive browser, terminal, and file
capabilities. The upstream's remaining v0.20/v0.21 additions include Claude
headless CI launching, a Claude self-update runner, Claude-era configuration migrations, a
local setup wizard, and upstream-only release/evaluation fixtures. They are not copied because
they either invoke Claude Code or maintain the upstream repository rather than an installed
plugin.

The historical "commands is not a confirmed GitHub Copilot plugin feature" statement above is
superseded: the current GitHub Copilot CLI plugin reference permits a `commands` manifest path.
However, GitHub's published plugin authoring guidance does not specify a command-file format
that makes the upstream `$ARGUMENTS` wrappers portable. The plugin therefore uses its installed
skills and `test-orchestrator` agent as the supported equivalents rather than shipping wrappers
that would be unverified in Copilot. See [`COPILOT_EQUIVALENTS.md`](./COPILOT_EQUIVALENTS.md)
for the complete mapping and the documented CLI commands for plugin updates.
