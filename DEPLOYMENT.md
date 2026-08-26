# Deployment

How to install and configure AgenTeX for GitHub Copilot in a consuming project.

## 1. Add the plugin to your project

Clone or add this repository as a submodule / plugin reference in the project you want to
test, following your organization's GitHub Copilot extension/plugin installation flow. At
minimum, Copilot needs to be able to read:

- `AGENTS.md` (the entrypoint instructions)
- `agents/*.agent.md` (the two agent definitions)
- `docs/ai/*.md` (policy files Copilot should honor)

If your Copilot setup supports a plugin manifest, point it at [`plugin.json`](./plugin.json).

## 2. Install the browser driver

In the project you want to test:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## 3. Scaffold configuration

Copy the templates and fill them in:

```bash
mkdir -p config/environments
cp config/project.json.example config/project.json
cp config/environments/dev.json.example config/environments/dev.json
cp .env.example .env
```

Edit:
- `config/project.json` — `defaultEnvironment`, KB settings, login mode.
- `config/environments/dev.json` — target `portalUrl`, test `users`, `db`/`api` blocks.
- `.env` — the actual secret values referenced by `{ "envSecret": "NAME" }` in the JSON files.

`.env` is gitignored by default — never commit it.

## 4. Grant tool permissions

Copilot agent mode needs permission to run a terminal (for Playwright / `sqlcmd` / `curl`) and
read/write files under `executions/`. Configure this per your Copilot agent-mode settings —
allow the Playwright CLI commands outright, and deny reads of `.env` and any destructive
terminal commands.

## 5. Run your first test

Ask Copilot, in chat / agent mode:

```
Test https://example.com — the signup form: happy path plus empty and bad-email cases.
```

Or use the orchestrator directly by name if your Copilot setup supports agent selection:
`test-orchestrator`.

## 6. Review results

Every run writes to `executions/execu_<timestamp>/`:

```
executions/execu_<timestamp>/
├── report.md              # the final summary
├── extent-report.html     # interactive dashboard
├── bugs/bug-list.md       # merged defect list
└── ...                    # screenshots and logs
```

## CI/CD (optional)

To run AgenTeX unattended (e.g. nightly regression), invoke Copilot in agent mode from a CI
job against a headless browser target, in **parallel mode**, pointing at your `test/` spec
directory. Treat a non-zero defect count as a build signal, not a hard failure, unless your
team decides otherwise — AgenTeX reports defects, it does not gate merges by default.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "environment has no file" | `defaultEnvironment` or requested env doesn't match a file in `config/environments/` | Create the matching `<env>.json` or fix the name — never falls back silently. |
| Secrets appearing in logs | A step tried to print an `envSecret` value directly | This is a bug — file an issue; agents must resolve secrets only at point of use. |
| Browser session collisions in parallel mode | Two sessions sharing the same session id | Each spec file must get its own session id from the orchestrator. |
