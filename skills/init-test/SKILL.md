---
name: init-test
description: >
  Scaffold AgenTeX's QA-testing configuration in the current project: config/project.json,
  config/environments/dev.json, a secrets-only .env, and a test/ directory for specs. Use this
  skill when the user wants to set up, initialize, or scaffold AgenTeX/QA testing in a new
  project, or asks things like "init test", "set up agentex here", "scaffold the QA config",
  or "get this project ready for testing". Idempotent — never overwrites a file that already
  exists, so it's also safe to re-run after a partial setup.
---

# Init Test — scaffold AgenTeX configuration

Mirrors the `/init-test` command from the original [AgenTeX](https://github.com/MhmdElGazzar/agentex)
Claude Code plugin this was ported from. The mechanical work (which files to create, where, and
never overwriting existing ones) is deterministic and handled by a bundled script rather than
agent judgment — run it, then explain the results and next steps to the user.

## Steps

1. Confirm you're in the project the user wants to test (not inside the `agentex-copilot`
   plugin's own installed files). If unclear, ask.
2. Run the bundled scaffolding script from the project root:
   ```bash
   node <this skill's directory>/scripts/init.js
   ```
   (Resolve "this skill's directory" as the folder containing this `SKILL.md` — it sits next to
   `scripts/init.js`.)
3. The script prints one `[created]` or `[skipped]` line per file. Read its output and relay it
   to the user plainly — don't re-describe it in different words.
4. After scaffolding, tell the user the concrete next steps, in order:
   - Install the browser driver: `npm install -D @playwright/test && npx playwright install chromium`
   - Edit `config/environments/dev.json` — at minimum set `portalUrl` to the site under test.
   - Fill in `.env` for any secrets referenced via `{ "envSecret": "NAME" }`.
   - Ask for a test: e.g. "Test https://example.com — the signup form."
5. If the script reports every file as `[skipped]` (already present), say so plainly rather than
   implying fresh setup happened — the user may be re-running this after already configuring
   things, and shouldn't be told work occurred that didn't.

## What gets created

| Path | From | Purpose |
|---|---|---|
| `config/project.json` | `config/project.json.example` | `defaultEnvironment`, KB settings, login mode |
| `config/environments/dev.json` | `config/environments/dev.json.example` | Target `portalUrl`, test `users`, `db`/`api` blocks |
| `.env` | `.env.example` | Secrets only, referenced by name from the JSON files |
| `.gitignore` entries | appended, not overwritten | `.env`, `.env.*`, `!.env.example`, `executions/*`, `!executions/README.md` |

## Rules

- **Never overwrite an existing file.** If `config/project.json` already exists, leave it
  untouched and report `[skipped]` — the script enforces this, but don't work around it by
  writing the file yourself if asked to "redo" init; explain that the user should edit the
  existing file directly, or delete it first if they explicitly want a clean scaffold.
- **Never invent config values.** Leave placeholders (`https://example.com`, sample user
  handles) exactly as shipped in the `.example` templates — the user fills in real values.
- **Never run this inside the agentex-copilot plugin's own repository** — it scaffolds a
  *consumer* project's config, not the plugin's.
