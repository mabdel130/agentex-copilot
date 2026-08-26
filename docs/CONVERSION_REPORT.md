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

## Versioning note

This repository starts at `2.0.0` to signal "port of a mature project," not a from-scratch v1.
Future releases should track new capabilities against the gaps listed above, and re-run the
mapping in this document whenever the upstream `agentex` plugin.json version changes.
