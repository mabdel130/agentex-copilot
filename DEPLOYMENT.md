# Deployment

How to install and configure AgenTeX for real GitHub Copilot use.

> If you're coming from an earlier version of this doc: it used to claim Copilot had no plugin
> system at all. That was wrong. GitHub Copilot CLI plugins are real and documented at
> [docs.github.com/en/copilot/concepts/agents/about-plugins](https://docs.github.com/en/copilot/concepts/agents/about-plugins).
> See [`docs/CONVERSION_REPORT.md`](./docs/CONVERSION_REPORT.md#correction-v220) for the full
> story of what was wrong and why.

## Primary path: install via the Copilot CLI

If you have the [GitHub Copilot CLI](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/overview)
(`copilot` on your PATH), this repo is a real plugin — install it directly from GitHub:

```bash
copilot plugin install mabdel130/agentex-copilot
```

This installs `plugin.json` and `agents/*.agent.md` into your per-user Copilot plugin store
(`~/.copilot/installed-plugins/`), making the `test-orchestrator` and `qa-executor` agents
available to Copilot CLI across your projects. No per-project setup step required for the
agents themselves.

Manage it with the usual commands:

```bash
copilot plugin list
copilot plugin update mabdel130/agentex-copilot
copilot plugin disable mabdel130/agentex-copilot   # or: uninstall
```

This repo also self-hosts a marketplace ([`.github/plugin/marketplace.json`](./.github/plugin/marketplace.json))
so you can install through the marketplace flow instead of a direct install, if you prefer it
or your team standardizes on marketplaces generally:

```bash
copilot plugin marketplace add mabdel130/agentex-copilot
copilot plugin install agentex-copilot@agentex-copilot
```

Both commands above install the exact same plugin — direct install and marketplace install are
equivalent here, since the marketplace only lists this one plugin, sourced from `.` (this repo's
own root).

## Fallback path: no Copilot CLI (VS Code Copilot Chat only)

If you're only using Copilot Chat inside an editor, without the standalone CLI, there's no
plugin-install mechanism to hook into — Copilot Chat instead reads two real, documented files
directly from your repo: `AGENTS.md` (agent instructions) and `.github/copilot-instructions.md`
(repo-wide custom instructions, applied on every request). The fallback installer vendors this
plugin's files into that shape:

```bash
# from the root of the project you want to test
npx github:mabdel130/agentex-copilot --target .
```

This is idempotent (safe to re-run, never overwrites a file you've already edited) and creates:

```
your-project/
├── AGENTS.md                             # entrypoint Copilot's coding agent reads
├── .github/
│   ├── copilot-instructions.md           # read by Copilot Chat on every request
│   └── agentex/
│       ├── agents/                       # test-orchestrator.agent.md, qa-executor.agent.md
│       └── ai-docs/                      # security-policy.md, testing-policy.md, architecture.md
├── config/project.json
└── config/environments/dev.json
```

See [`scripts/install.js`](./scripts/install.js) for exactly what it does — it's a plain,
dependency-free Node script, nothing hidden.

## Either path: install the browser driver

In the project you want to test:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## Either path: scaffold configuration

If you used the CLI install, copy the templates from wherever `copilot plugin list` says the
plugin was installed to (or just grab them from
[github.com/mabdel130/agentex-copilot/config](https://github.com/mabdel130/agentex-copilot/tree/main/config)).
If you used the fallback installer, this already happened for you. Either way, fill in:

```bash
mkdir -p config/environments   # if not already scaffolded
cp config/project.json.example config/project.json                       # if needed
cp config/environments/dev.json.example config/environments/dev.json     # if needed
cp .env.example .env
```

Edit:
- `config/project.json` — `defaultEnvironment`, KB settings, login mode.
- `config/environments/dev.json` — target `portalUrl`, test `users`, `db`/`api` blocks.
- `.env` — the actual secret values referenced by `{ "envSecret": "NAME" }` in the JSON files.

`.env` is gitignored by default — never commit it.

## Grant tool permissions

Copilot agent mode needs permission to run a terminal (for Playwright / `sqlcmd` / `curl`) and
read/write files under `executions/`. Both agent files here deliberately omit a `tools:`
restriction in frontmatter — per GitHub's docs, that means "all available tools," which is what
browser-driven testing needs. Configure your Copilot tool-approval settings to allow Playwright
commands outright, and deny reads of `.env` and any destructive terminal commands.

## Run your first test

Ask Copilot (CLI or Chat), in plain language:

```
Test https://example.com — the signup form: happy path plus empty and bad-email cases.
```

## Review results

Every run writes to `executions/execu_<timestamp>/`:

```
executions/execu_<timestamp>/
├── report.md              # the final summary
├── bugs/bug-list.md       # merged defect list
└── ...                    # screenshots and logs per session
```

## CI/CD (optional)

To run AgenTeX unattended (e.g. nightly regression), invoke Copilot from a CI job against a
headless browser target, in **parallel mode**, pointing at your `test/` spec directory. Treat a
non-zero defect count as a build signal, not a hard failure, unless your team decides
otherwise — AgenTeX reports defects, it does not gate merges by default.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `copilot plugin install` fails to find the repo | Repo is private, or `copilot` isn't authenticated to GitHub | Confirm `copilot` is logged in and has access; `mabdel130/agentex-copilot` is public. |
| Copilot Chat doesn't seem to know about AgenTeX (fallback path) | `.github/copilot-instructions.md` missing or not committed | Confirm the file exists at that exact path and is tracked by git. |
| "environment has no file" | `defaultEnvironment` or requested env doesn't match a file in `config/environments/` | Create the matching `<env>.json` or fix the name — never falls back silently. |
| Secrets appearing in logs | A step tried to print an `envSecret` value directly | This is a bug — file an issue; agents must resolve secrets only at point of use. |
| Browser session collisions in parallel mode | Two sessions sharing the same session id | Each spec file must get its own session id from the orchestrator. |
