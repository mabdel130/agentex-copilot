# Getting Started

New to GitHub Copilot agent mode itself? Get comfortable typing a request and approving an
action in your editor's Copilot chat before continuing — this page assumes that part.

## 1. Install the plugin

**Have the Copilot CLI?** Sign in first if needed — running `copilot` prompts
`Please use /login to sign in to use Copilot` the first time; run `/login` and follow the
browser flow. Then:

```bash
copilot plugin install mabdel130/agentex-copilot
```

**Don't have it (VS Code Copilot Chat only)?** Run this from the project you want to test
instead:

```bash
npx github:mabdel130/agentex-copilot --target .
```

Full detail on both paths, and why two paths exist: [DEPLOYMENT.md](../DEPLOYMENT.md).

## 2. Install the browser driver

In the project you want to test:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## 3. Scaffold the project

If you used the fallback installer in step 1, this is already done. If you used the CLI
install, just ask Copilot:

```
Set up AgenTeX for this project.
```

This activates the bundled `init-test` skill ([`skills/init-test/SKILL.md`](../skills/init-test/SKILL.md)),
which mirrors upstream AgenTeX's `/init-test` command — it creates a starting
`config/project.json`, a sample `config/environments/dev.json`, a secrets-only `.env`, and a
`test/` folder, all idempotent (safe to re-run, never overwrites). Add your own test specs
under `test/` (any structure works — group stateful scenarios into the same file).

## 4. Set permissions

Grant Copilot agent mode terminal access for Playwright (and `curl`/`sqlcmd` if you use
`api:`/`db:` steps), and deny reads of `.env`. See
[DEPLOYMENT.md, "Grant tool permissions"](../DEPLOYMENT.md#grant-tool-permissions).

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
├── bugs/bug-list.md       # a merged list of every defect found
└── ...                    # screenshots and logs backing up every result
```

## Quick reference

- Install: `copilot plugin install mabdel130/agentex-copilot` (or the fallback in step 1)
- Browser driver: `npm install -D @playwright/test && npx playwright install chromium`
- Scaffold: ask Copilot "Set up AgenTeX for this project" (see step 3 above)
- Run: describe what to test, in plain language

## Next steps

- [`docs/ai/architecture.md`](./ai/architecture.md) — sequential vs. parallel modes, how the
  orchestrator and executor agents compose.
- [`docs/IMPLEMENTATION_GUIDE.md`](./IMPLEMENTATION_GUIDE.md) — the three config files
  (`config/project.json`, `config/environments/<env>.json`, `.env`) and secret handling.
- [`docs/ai/security-policy.md`](./ai/security-policy.md) — what this plugin's agents can't do.
- [`skills/README.md`](../skills/README.md) — the full QA capability reference.
