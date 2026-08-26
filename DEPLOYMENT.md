# Deployment

How to actually get AgenTeX's behavior running against a real project with **real GitHub
Copilot**. There is no `copilot plugin install` command and no plugin marketplace — Copilot
doesn't have a plugin-manifest system. What it *does* support, and what this guide uses, is:

| Mechanism | Read by | Purpose |
|---|---|---|
| `AGENTS.md` at your repo root (or nearest ancestor) | Copilot's coding agent (and Claude Code, Codex, etc.) | Entrypoint instructions an agent reads before acting |
| `.github/copilot-instructions.md` | GitHub Copilot Chat, every request in that repo | Always-applied repo-wide custom instructions |
| `.github/instructions/*.instructions.md` (optional) | Copilot Chat, scoped by `applyTo` glob | Path-specific instructions |

"Installing" this plugin means **vendoring** `AGENTS.md`, `agents/`, and `docs/ai/` into the
project you want tested, and pointing `.github/copilot-instructions.md` at them. This is the
same approach validated end-to-end in this repo's own `demo-project/` (see
[`docs/CONVERSION_REPORT.md`](./docs/CONVERSION_REPORT.md#correction-v210) for why).

## 1. Copy the agent files into your project

From a clone of this repo, into the root of the project you want to test:

```bash
# from your target project's root
mkdir -p .github/agentex
cp -r /path/to/agentex-copilot/agents          .github/agentex/agents
cp -r /path/to/agentex-copilot/docs/ai         .github/agentex/ai-docs
cp    /path/to/agentex-copilot/AGENTS.md       ./AGENTS.md
```

If your project already has its own `AGENTS.md`, merge the two rather than overwriting — keep
your project-specific instructions and append a pointer into `.github/agentex/agents/`.

## 2. Add repo-wide Copilot Chat instructions

Create `.github/copilot-instructions.md` in your project:

```markdown
# Repository custom instructions for GitHub Copilot

This project has AgenTeX QA-testing behavior installed. Before responding to any request to
test, check, verify, or find defects in this application's behavior:

1. Read `AGENTS.md` at the repository root.
2. Read `.github/agentex/agents/test-orchestrator.agent.md` for how to plan and run the test.
3. Read `.github/agentex/ai-docs/security-policy.md` and `testing-policy.md` before judging
   PASS/FAIL or touching any secret/config value.

Never modify application source code as part of a testing request — only write test artifacts
under `executions/`. Never use real personal data or complete a real signup/login/checkout.
```

This file is read automatically for **every** Copilot Chat request in the repo, not just when
you happen to mention testing — that's what makes it reliable rather than something you have
to remember to paste in each time.

## 3. Install the browser driver

In the project you want to test:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## 4. Scaffold configuration

Copy the templates and fill them in:

```bash
mkdir -p config/environments
cp /path/to/agentex-copilot/config/project.json.example              config/project.json
cp /path/to/agentex-copilot/config/environments/dev.json.example     config/environments/dev.json
cp /path/to/agentex-copilot/.env.example                             .env
```

Edit:
- `config/project.json` — `defaultEnvironment`, KB settings, login mode.
- `config/environments/dev.json` — target `portalUrl`, test `users`, `db`/`api` blocks.
- `.env` — the actual secret values referenced by `{ "envSecret": "NAME" }` in the JSON files.

`.env` is gitignored by default (copy this repo's [`.gitignore`](./.gitignore) entries too if
your project doesn't already exclude `.env`) — never commit it.

## 5. Grant tool permissions

Copilot agent mode needs permission to run a terminal (for Playwright / `sqlcmd` / `curl`) and
read/write files under `executions/`. Configure this per your Copilot agent-mode/tool-approval
settings — allow Playwright commands outright, and deny reads of `.env` and any destructive
terminal commands.

## 6. Run your first test

Open the project in an editor with GitHub Copilot Chat in **agent mode** (e.g. VS Code) and ask,
in plain language:

```
Test https://example.com — the signup form: happy path plus empty and bad-email cases.
```

Copilot picks up `.github/copilot-instructions.md` automatically, follows it to `AGENTS.md`,
then to `.github/agentex/agents/test-orchestrator.agent.md` for how to plan and run the test.

## 7. Review results

Every run writes to `executions/execu_<timestamp>/`:

```
executions/execu_<timestamp>/
├── report.md              # the final summary
├── bugs/bug-list.md       # merged defect list
└── ...                    # screenshots and logs per session
```

## CI/CD (optional)

To run AgenTeX unattended (e.g. nightly regression), invoke Copilot's coding agent from a CI
job against a headless browser target, in **parallel mode**, pointing at your `test/` spec
directory. Treat a non-zero defect count as a build signal, not a hard failure, unless your
team decides otherwise — AgenTeX reports defects, it does not gate merges by default.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Copilot doesn't seem to know about AgenTeX at all | `.github/copilot-instructions.md` missing or not committed | Confirm the file exists at that exact path and is tracked by git — Copilot Chat reads it from the repo, not your local uncommitted scratch files. |
| "environment has no file" | `defaultEnvironment` or requested env doesn't match a file in `config/environments/` | Create the matching `<env>.json` or fix the name — never falls back silently. |
| Secrets appearing in logs | A step tried to print an `envSecret` value directly | This is a bug — file an issue; agents must resolve secrets only at point of use. |
| Browser session collisions in parallel mode | Two sessions sharing the same session id | Each spec file must get its own session id from the orchestrator. |
