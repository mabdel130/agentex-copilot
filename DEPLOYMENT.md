# Deployment

How to install and configure AgenTeX for real GitHub Copilot use.

> If you're coming from an earlier version of this doc: it used to claim Copilot had no plugin
> system at all. That was wrong. GitHub Copilot CLI plugins are real and documented at
> [docs.github.com/en/copilot/concepts/agents/about-plugins](https://docs.github.com/en/copilot/concepts/agents/about-plugins).
> See [`docs/CONVERSION_REPORT.md`](./docs/CONVERSION_REPORT.md#correction-v220) for the full
> story of what was wrong and why.

## Primary path: install via the Copilot CLI, step by step

### 1. Install the Copilot CLI (if you don't have it)

```bash
npm install -g @github/copilot
copilot --version
```

### 2. Sign in

```bash
copilot
```

If you're not authenticated yet, `copilot` will prompt:

```
Please use /login to sign in to use Copilot
```

Run `/login` inside that session and follow the device-login prompt in your browser. Once
signed in, `/exit` (or Ctrl+C) to leave the interactive session.

### 3. Install the plugin (once per machine)

```bash
copilot plugin install mabdel130/agentex-copilot
```

This installs `plugin.json`, `agents/*.agent.md`, and all 13 skills under `skills/` into your
per-user Copilot plugin store (`~/.copilot/installed-plugins/`), making the `test-orchestrator`
and `qa-executor` agents — plus `init-test`, `api-integration`, `db-integration`, `ask-kb`,
`ui-check`, `define-flow`, `optimize-login`, `extent-report`, and the Azure DevOps skills —
available to Copilot CLI across your projects. No per-project setup step required for the
agents/skills themselves.

Verify:

```bash
copilot plugin list
```

Manage it with the usual commands:

```bash
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
│       ├── skills/browser-testing/        # Playwright reference + portable run helpers
│       └── ai-docs/                      # security-policy.md, testing-policy.md, architecture.md
├── config/project.json
└── config/environments/dev.json
```

See [`scripts/install.js`](./scripts/install.js) for exactly what it does — it's a plain,
dependency-free Node script, nothing hidden.

## Either path: continue setup

### 4. Go to the project you want to test

```bash
cd /path/to/your-project
```

### 5. Install the browser driver in that project

```bash
npm install -D @playwright/test
npx playwright install chromium
```

### 6. Scaffold config

**CLI install** — from the project you want to test, ask Copilot to run the bundled
[`init-test` skill](./skills/init-test/SKILL.md) (mirrors upstream AgenTeX's `/init-test`
command):

```bash
copilot
```
```
Set up AgenTeX for this project.
```

Copilot activates the `init-test` skill, which creates `config/project.json`,
`config/environments/dev.json`, `.env`, and a `test/` folder — idempotent, never overwrites
anything already there.

**Fallback installer** — this already happened as part of `npx github:mabdel130/agentex-copilot`.

Either way, then edit:
- `config/project.json` — `defaultEnvironment`, KB settings, login mode.
- `config/environments/dev.json` — target `portalUrl`, test `users`, `db`/`api` blocks.
- `.env` — the actual secret values referenced by `{ "envSecret": "NAME" }` in the JSON files.

`.env` is gitignored by default — never commit it.

### 7. Grant tool permissions

Copilot agent mode needs permission to run a terminal (for Playwright / `sqlcmd` / `curl`) and
read/write files under `executions/`. Both agent files here deliberately omit a `tools:`
restriction in frontmatter — per GitHub's docs, that means "all available tools," which is what
browser-driven testing needs. Configure your Copilot tool-approval settings to allow Playwright
commands outright, and deny reads of `.env` and any destructive terminal commands.

### 8. Run your first test

Still in the `copilot` session (or in Copilot Chat, agent mode, if you used the fallback
installer), ask in plain language:

```
Test https://example.com — the signup form: happy path plus empty and bad-email cases.
```

The `test-orchestrator` agent restates the plan, waits for your approval, opens a real browser,
runs each scenario, and writes results.

### 9. Review results

Every run writes to `executions/execu_<timestamp>/`:

```
executions/execu_<timestamp>/
├── report.md              # the final summary
├── run-summary.json       # durable machine-readable run record
├── extent-report.html     # interactive dashboard
├── bugs/bug-list.md       # merged defect list
└── ...                    # screenshots and logs per session
```

### 10. Use the other skills as needed

These trigger automatically when relevant, or ask for them directly:

| Ask for... | Triggers |
|---|---|
| "test this URL", "run a browser regression", or "test this form" | `browser-testing` → `test-orchestrator` |
| "verify via the API that..." / a spec with `api:` steps | `api-integration` |
| "check the database for..." / `db:` steps | `db-integration` |
| "ask the knowledge base how X works" | `ask-kb` |
| "compare this page to the Figma design" | `ui-check` |
| "let's define this flow together, step by step" | `define-flow` |
| Repeated logins slowing a run down | `optimize-login` (usually invoked automatically) |
| "generate the HTML report" | `extent-report` |
| "estimate QA effort for these sprint stories" | `task-estimation` |
| "create test cases for story #1234" | `test-design` |
| "file these as Azure DevOps bugs" | `bug-report-azure` |
| Reach an Azure resource directly | `azure-integration` |

The Azure DevOps skills (`task-estimation`, `test-design`, `bug-report-azure`,
`azure-integration`) additionally need an `azure` block in `config/project.json`
(org/project/team) and `AZURE_PAT` in `.env` — `init-test` doesn't scaffold these since
they're optional; add them manually when you need those skills. `ui-check` similarly needs a
`figma` block + `FIGMA_TOKEN` only for Figma-sourced baselines (screenshot baselines need no
config at all).

## CI/CD (optional)

To run AgenTeX unattended (e.g. nightly regression), invoke Copilot from a CI job against a
headless browser target, in **parallel mode**, pointing at your `test/` spec directory. Treat a
non-zero defect count as a build signal, not a hard failure, unless your team decides
otherwise — AgenTeX reports defects, it does not gate merges by default.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Please use /login to sign in to use Copilot` | Not authenticated yet | Run `/login` inside the `copilot` session and complete the device-login flow in your browser (step 2 above). |
| `copilot plugin install` fails to find the repo | Repo is private, or `copilot` isn't authenticated to GitHub | Confirm `copilot` is logged in and has access; `mabdel130/agentex-copilot` is public. |
| Copilot Chat doesn't seem to know about AgenTeX (fallback path) | `.github/copilot-instructions.md` missing or not committed | Confirm the file exists at that exact path and is tracked by git. |
| "environment has no file" | `defaultEnvironment` or requested env doesn't match a file in `config/environments/` | Create the matching `<env>.json` or fix the name — never falls back silently. |
| Secrets appearing in logs | A step tried to print an `envSecret` value directly | This is a bug — file an issue; agents must resolve secrets only at point of use. |
| Browser session collisions in parallel mode | Two sessions sharing the same session id | Each spec file must get its own session id from the orchestrator. |
