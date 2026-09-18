# Configuration

AgenTeX separates project defaults, environment data, and secrets.

| File | Contains |
|---|---|
| `config/project.json` | Default environment, login mode, and Playwright defaults. |
| `config/environments/<env>.json` | Target URL, disposable users, and integration references. |
| `.env` | Passwords, tokens, and connection secrets only. |

Create the starter files by asking Copilot: `Set up AgenTeX for this project.`

Prefer a form to hand-editing JSON? Run the optional [Setup Wizard](./setup-wizard.md) — a
local browser UI offered as a step of `init-test`.

Set `defaultEnvironment` to a matching file in `config/environments/`. Refer to secrets by name,
not value:

```json
{ "password": { "envSecret": "QA_PASSWORD" } }
```

Never commit `.env`, real customer data, or saved browser login state. The full configuration
example is in [`config/project.json.example`](../config/project.json.example).

`playwright.workers` (default `4`, max `16`) bounds parallel-mode concurrency for
`run_parallel.js`; `playwright.dashboard: false` skips only the optional HTML report. See
[Performance](./performance.md) for tuning guidance.
