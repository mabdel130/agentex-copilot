# Setup Wizard

An optional local browser UI for filling in `config/project.json` and
`config/environments/<env>.json` after `init-test` scaffolds the starter files, instead of
editing that JSON by hand. Ported (as an MVP) from upstream AgenTeX's
[`scripts/wizard/`](https://github.com/MhmdElGazzar/agentex/tree/main/scripts/wizard).

## What's in scope (MVP)

- English only (no bilingual toggle).
- One environment at a time — the wizard edits `defaultEnvironment` (or a name you choose), not
  a multi-environment manager.
- Only the fields this plugin's config already supports: project name, login mode, Playwright
  defaults (browser, launch mode, workers, dashboard), the target `portalUrl`, default OTP/
  password, a dynamic list of test users, and optional DB/API/knowledge-base blocks.
- No AI-assisted paste/file extraction, no `azure`/`figma` schema, no custom field descriptors —
  those are upstream-only features not needed for this plugin's current config shape.

## Running it

`init-test` offers this as an optional step after scaffolding. To run it directly:

```bash
node skills/init-test/scripts/wizard/server.js [projectRoot] [--port=7373] [--no-open]
```

- Binds to `127.0.0.1` only — never reachable from the network.
- Opens `http://127.0.0.1:7373/setup` in your default browser (unless `--no-open`).
- Refuses to run with `projectRoot` pointing at this plugin's own repo (same guard as
  `skills/init-test/scripts/init.js`), unless you pass `--force`.
- Shuts itself down once you save and the page tells you it's done.

## What it writes, and where

| Output | Where |
|---|---|
| Project basics, login mode, Playwright defaults | `config/project.json` |
| Portal URL, defaults, test users, optional `db`/`api` blocks | `config/environments/<env>.json` |
| Any secret value you type (DB password, API token, KB key) | `.env`, merged in place by variable name |

Secret fields (DB password, API token, KB key) are **never** written into the JSON config or
echoed back to the page — the config only ever stores `{ "envSecret": "VAR_NAME" }`, and the
plaintext value goes straight from your browser to a local `.env` file over `127.0.0.1`. This
session (and any chat transcript) never sees it. See
[`docs/ai/security-policy.md`](./ai/security-policy.md).

## Re-running

The wizard reads whatever config already exists on disk and prefills the form, so it's safe to
re-run to review or update a project you already configured — it does not require a clean slate.

## Files

| File | Purpose |
|---|---|
| `skills/init-test/scripts/wizard/engine.js` | Pure mapping/validation logic (answers → config objects). No I/O — unit tested in `checks/wizard-engine.test.js`. |
| `skills/init-test/scripts/wizard/server.js` | Zero-dependency Node HTTP server: serves the UI, validates, writes files. Small helpers unit tested in `checks/wizard-server.test.js`. |
| `skills/init-test/scripts/wizard/ui.html` | Single-file wizard page (vanilla HTML/CSS/JS, no build step). |
