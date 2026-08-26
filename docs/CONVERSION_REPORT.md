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

## Known gaps vs. the original (v0.19.0)

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

## Versioning note

This repository started at `2.0.0` to signal "port of a mature project," not a from-scratch v1.
`2.1.0` incorrectly concluded no real Copilot plugin system exists and pivoted entirely to
vendoring; `2.2.0` corrects that — the plugin system is real, `plugin.json` + `agents/` is the
primary install path again, and vendoring is kept as a documented fallback. Agent *behavior* in
`agents/*.agent.md` has not changed across any of these corrections — only how they're
installed and how that installation method is described. Future releases should track new
capabilities against the gaps listed earlier, and re-run the mapping whenever the upstream
`agentex` plugin.json version changes.
