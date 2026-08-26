# Implementation Guide

Step-by-step instructions for wiring AgenTeX into a real project once the plugin files are in
place. This is the "day 2" doc — [`getting-started.md`](./getting-started.md) gets you to a
first run; this page covers doing it properly for a real codebase.

## 1. Decide your environments

Every real project has at least a `dev`/`qa` target and usually more (`uat`, `staging`,
`live`). Create one `config/environments/<name>.json` per target, starting from
[`config/environments/dev.json.example`](../config/environments/dev.json.example):

```bash
cp config/environments/dev.json.example config/environments/qa.json
cp config/environments/dev.json.example config/environments/uat.json
```

Set `defaultEnvironment` in `config/project.json` to whichever one should run when a request
doesn't name one explicitly. Naming an environment with no matching file is always an error —
there is no silent fallback.

## 2. Populate test users

Under `users` in each environment file, key accounts by a descriptive handle rather than by
credentials — `valid_user`, `expired_user`, `locked_user`. Specs then refer to these by name
("login as expired_user"), which keeps the spec readable and the actual credentials swappable
per environment without touching the spec files.

Any field that holds a real secret (a password that isn't a shared, team-known QA throwaway)
must be `{ "envSecret": "NAME" }`, never a literal value.

## 3. Wire up integrations (optional)

If your specs need to verify state via an API call or a database row, create an
`integration/` folder at your project root with one catalog file per API or DB target
(`*_api.json` / `*_db.json`). Each entry is a named, fully-parameterized request or query — the
agent will run only entries that exist in this catalog, and refuses DDL even if someone
mistakenly catalogs it. See [`docs/ai/security-policy.md`](./ai/security-policy.md) for the
exact contract.

## 4. Write real specs

Replace or extend the sample specs with ones for your actual application. Guidelines:
- One file per feature area; keep stateful, order-dependent scenarios in the same file (they
  run sequentially within one session, even in parallel mode).
- Prefer scenario language a human tester would write: "given/when/then" or plain numbered
  steps both work — the executor agent reads intent, not a fixed DSL.
- Never encode real customer data into a spec. Use the `users`/`defaults` from the environment
  file instead.

## 5. Choose your default mode

- Small, exploratory testing sessions → sequential (the default) — you approve each step.
- Regression suites, CI runs, "test everything" asks → explicitly request parallel mode.

## 6. Review and act on results

`report.md` and `extent-report.html` are the two artifacts to check after every run.
`bugs/bug-list.md` is meant to be pasted into your own issue tracker — AgenTeX does not file
issues on your behalf; see [`skills/README.md`](../skills/README.md) for what is and isn't
automated.

## 7. Keep the plugin docs in sync with your project

If you add environments, integrations, or a new test convention, note it in your own project's
README rather than editing this plugin's files — this repo is the shared plugin, your project
holds the project-specific detail.
