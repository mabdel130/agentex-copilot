---
name: init-test
description: >
  Scaffold AgenTeX's QA-testing configuration in the current project: config/project.json,
  config/environments/dev.json, a secrets-only .env, an integration/ catalog with sample
  api/db entries, and starter test/suite1/ specs (only when the project has no specs of its
  own yet). Use this skill when the user wants to set up, initialize, or scaffold AgenTeX/QA
  testing in a new project, or asks things like "init test", "set up agentex here", "scaffold
  the QA config", or "get this project ready for testing". Idempotent — never overwrites a
  file that already exists, so it's also safe to re-run after a partial setup.
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
4. Ask whether they'd like to fill in the project config through the **Setup Wizard** (a local
   browser UI) instead of editing the JSON files by hand:
   ```bash
   node <this skill's directory>/scripts/wizard/server.js
   ```
   Run it from the project root (or pass the path as the first argument). It:
   - Starts a server bound to `127.0.0.1` only, on port `7373` by default (`--port=NNNN` to
     change it, `--no-open` to skip auto-opening a browser tab).
   - Opens `http://127.0.0.1:7373/setup` — a short multi-step form: project basics, the target
     environment/portal URL, test users, and optional DB/API/knowledge-base integration.
   - Writes `config/project.json` and `config/environments/<env>.json` in this plugin's normal
     shape on save, and any secret values the user types (DB password, API token, KB key) go
     straight into a local `.env` file — never echoed back to the page, never printed to a
     terminal or this chat. See [`docs/setup-wizard.md`](../../docs/setup-wizard.md).
   - Shuts itself down automatically once the user saves and closes the tab.
   - Refuses to run against the plugin's own repo (same guard as `init.js`).
   This is optional — if the user prefers, skip it and let them edit the JSON files directly.
5. After scaffolding (and the wizard, if used), tell the user the concrete next steps, in order:
   - Install Playwright Agent CLI and a browser: `npm install -D @playwright/cli@latest && npx playwright-cli install-browser chromium`
   - If they skipped the wizard: edit `config/environments/dev.json` — at minimum set
     `portalUrl` to the site under test — and fill in `.env` for any secrets referenced via
     `{ "envSecret": "NAME" }`.
   - Replace the samples in `integration/` with the project's real API/DB catalog entries (if
     `api:`/`db:` steps are needed) — see [`../api-integration/SKILL.md`](../api-integration/SKILL.md)
     and [`../db-integration/SKILL.md`](../db-integration/SKILL.md).
   - If `test/suite1/` was seeded, tell the user those are editable examples to adapt to their
     app, not a real test suite yet.
   - Ask for a test: e.g. "Test https://example.com — the signup form."
6. If the script reports every file as `[skipped]` (already present), say so plainly rather than
   implying fresh setup happened — the user may be re-running this after already configuring
   things, and shouldn't be told work occurred that didn't. The wizard remains available any
   time to review or update an existing config — it prefills from whatever is already on disk.

## What gets created

| Path | From | Purpose |
|---|---|---|
| `config/project.json` | `config/project.json.example` | `defaultEnvironment`, KB settings, login mode |
| `config/environments/dev.json` | `config/environments/dev.json.example` | Target `portalUrl`, test `users`, `db`/`api` blocks |
| `.env` | `.env.example` | Secrets only, referenced by name from the JSON files |
| `integration/sample_api.json` | `../api-integration/templates/sample_api.json` | Example cataloged API entries for `api:` steps |
| `integration/sample_db.json` | `../db-integration/templates/sample_db.json` | Example cataloged DB entries for `db:` steps |
| `test/README.md`, `test/suite1/*.md` | this plugin's `test/` folder | Starter specs — **only seeded if `test/` doesn't already exist or is empty**; a project with its own specs under `test/` is left completely untouched |
| `.gitignore` entries | appended, not overwritten | `.env`, `.env.*`, `!.env.example`, `executions/*`, `!executions/README.md`, `test/.auth/` |

`scripts/wizard/server.js` (+ `engine.js`, `ui.html`) is the optional Setup Wizard from step 4
above — it doesn't scaffold new files itself, it fills in the values of the files `init.js`
already created.

## Rules

- **Never overwrite an existing file.** If `config/project.json` already exists, leave it
  untouched and report `[skipped]` — the script enforces this, but don't work around it by
  writing the file yourself if asked to "redo" init; explain that the user should edit the
  existing file directly, or delete it first if they explicitly want a clean scaffold.
- **Never invent config values.** Leave placeholders (`https://example.com`, sample user
  handles) exactly as shipped in the `.example` templates — the user fills in real values.
- **Never run this inside the agentex-copilot plugin's own repository** — it scaffolds a
  *consumer* project's config, not the plugin's. The Setup Wizard server enforces the same
  guard independently.
- **Never print, log, or relay a secret value typed into the Setup Wizard.** It writes secrets
  straight to the consumer project's local `.env` file over `127.0.0.1` — this chat session
  never sees them. See [`docs/ai/security-policy.md`](../../docs/ai/security-policy.md).
