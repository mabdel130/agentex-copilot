# Getting Started

New to GitHub Copilot agent mode itself? Get comfortable typing a request and approving an
action in your editor's Copilot chat before continuing — this page assumes that part.

## 1. Install the plugin

Pick exactly one path:
- **Copilot CLI installed** → use the plugin install path below.
- **VS Code Copilot Chat only** → skip to the fallback path below.

**Have the Copilot CLI?** Sign in first if needed — running `copilot` prompts
`Please use /login to sign in to use Copilot` the first time; run `/login` and follow the
browser flow. Then:

```bash
copilot plugin marketplace add mabdel130/agentex-copilot
copilot plugin install agentex-copilot@agentex-copilot
```

**Don't have it (VS Code Copilot Chat only)?** Run this from the project you want to test
instead:

```bash
npx github:mabdel130/agentex-copilot --target .
```

Full detail on both paths, and why two paths exist: [DEPLOYMENT.md](../DEPLOYMENT.md).

### Fastest happy path

If you just want the shortest route to a first run:

1. Install AgenTeX using one path above.
2. In the project you want to test, run `npm install -D @playwright/test @playwright/cli@latest`
   and `npx playwright install chromium`.
3. If you used the CLI install path, ask Copilot: `Set up AgenTeX for this project.`
4. Ask Copilot: `Test https://example.com — the signup form: happy path plus empty and bad-email cases.`

## 2. Install Playwright Agent CLI and a browser

In the project you want to test:

```bash
npm install -D @playwright/cli@latest
npx playwright-cli install-browser chromium
```

Replace `chromium` with `chrome`, `firefox`, `webkit`, or `msedge` when that is the browser
you plan to test.

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

Here's what happens: the invoking Copilot session follows the `test-orchestrator` workflow,
restates what it's about to test, and proposes a numbered list of scenarios — this is a
checkpoint, nothing runs yet until you approve. Once you do, it opens a real browser and works
through each scenario one at a time, pausing after each one so you can see the result before it
continues. When it's done, everything lands in a new timestamped folder:

```
executions/execu_<timestamp>/
├── report.md              # the final summary — what passed, what failed
├── run-summary.json       # durable input for the interactive report
├── extent-report.html     # interactive execution dashboard
├── bugs/bug-list.md       # a merged list of every defect found
└── ...                    # screenshots and logs backing up every result
```

## Quick reference

- Install: `copilot plugin marketplace add mabdel130/agentex-copilot`, then
  `copilot plugin install agentex-copilot@agentex-copilot` (or use the fallback in step 1)
- Browser driver: `npm install -D @playwright/test @playwright/cli@latest && npx playwright install chromium`
- Scaffold: ask Copilot "Set up AgenTeX for this project" (see step 3 above)
- Run: describe what to test in plain language; the `browser-testing` skill runs the
  test-orchestrator workflow in the invoking session

## Next steps

- [`docs/ai/architecture.md`](./ai/architecture.md) — sequential vs. parallel modes, how the
  orchestrator and executor agents compose.
- [`docs/IMPLEMENTATION_GUIDE.md`](./IMPLEMENTATION_GUIDE.md) — the three config files
  (`config/project.json`, `config/environments/<env>.json`, `.env`) and secret handling.
- [`docs/ai/security-policy.md`](./ai/security-policy.md) — what this plugin's agents can't do.
- [`skills/README.md`](../skills/README.md) — the full QA capability reference.
