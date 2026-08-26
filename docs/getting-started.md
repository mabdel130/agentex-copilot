# Getting Started

New to GitHub Copilot agent mode itself? Get comfortable typing a request and approving an
action in your editor's Copilot chat before continuing — this page assumes that part.

## 1. Add the plugin

Add this repository to the project you want to test, following your Copilot plugin/extension
installation flow (see [DEPLOYMENT.md](../DEPLOYMENT.md) for details). At minimum, Copilot
needs to be able to read `AGENTS.md` and `agents/*.agent.md` from this repo.

## 2. Install the browser driver

In the project you want to test:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## 3. Scaffold the project

Copy the configuration templates into your project:

```bash
mkdir -p config/environments
cp config/project.json.example config/project.json
cp config/environments/dev.json.example config/environments/dev.json
cp .env.example .env
```

This gives you a starting `config/project.json`, a sample `config/environments/dev.json`, and a
secrets-only `.env` ready for you to fill in. Add your own test specs under `test/` (any
structure works — group stateful scenarios into the same file).

## 4. Set permissions

Grant Copilot agent mode terminal access for the Playwright CLI (and `curl`/`sqlcmd` if you use
`api:`/`db:` steps), and deny reads of `.env`. See [DEPLOYMENT.md](../DEPLOYMENT.md#4-grant-tool-permissions).

## 5. Run your first test

```
Test https://example.com — the signup form: happy path plus empty and bad-email cases.
```

Here's what happens: the `test-orchestrator` agent restates what it's about to test and
proposes a numbered list of scenarios — this is a checkpoint, nothing runs yet until you
approve. Once you do, it opens a real browser and works through each scenario one at a time,
pausing after each one so you can see the result before it continues. When it's done,
everything lands in a new timestamped folder:

```
executions/execu_<timestamp>/
├── report.md              # the final summary — what passed, what failed
├── extent-report.html     # an interactive dashboard version, open it in any browser
├── bugs/bug-list.md       # a merged list of every defect found
└── ...                    # screenshots and logs backing up every result
```

## Quick reference

- Add the plugin: see [DEPLOYMENT.md](../DEPLOYMENT.md)
- Browser driver: `npm install -D @playwright/test && npx playwright install chromium`
- Scaffold: copy `config/*.example` files (see step 3 above)
- Run: describe what to test, in plain language, or invoke the `test-orchestrator` agent
  directly if your Copilot setup supports agent selection

## Next steps

- [`docs/ai/architecture.md`](./ai/architecture.md) — sequential vs. parallel modes, how the
  orchestrator and executor agents compose.
- [`docs/IMPLEMENTATION_GUIDE.md`](./IMPLEMENTATION_GUIDE.md) — the three config files
  (`config/project.json`, `config/environments/<env>.json`, `.env`) and secret handling.
- [`docs/ai/security-policy.md`](./ai/security-policy.md) — what this plugin's agents can't do.
- [`skills/README.md`](../skills/README.md) — the full QA capability reference.
