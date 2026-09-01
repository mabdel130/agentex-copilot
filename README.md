# AgenTeX for GitHub Copilot

**A detailed guide to running evidence-backed web QA with GitHub Copilot.**

Describe the feature you want to test in plain language. AgenTeX plans the scenarios, drives a
real browser with Playwright, captures evidence, and creates a consolidated defect report. It is
designed for exploratory testing, feature validation, and regression checks; it does not replace
your unit or integration test suite.

[![Version](https://img.shields.io/badge/version-2.6.5-blue.svg)](./CHANGELOG.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![GitHub Copilot CLI Plugin](https://img.shields.io/badge/GitHub%20Copilot%20CLI-plugin-8957e5.svg?logo=githubcopilot&logoColor=white)](https://docs.github.com/en/copilot/concepts/agents/about-plugins)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium%2FFirefox%2FWebKit-2EAD33.svg?logo=playwright&logoColor=white)](https://playwright.dev)

> AgenTeX is a GitHub Copilot-oriented port of
> [AgenTeX](https://github.com/MhmdElGazzar/agentex) v0.19.0.

---

## Contents

1. [What AgenTeX does](#what-agentex-does)
2. [Before you begin](#before-you-begin)
3. [Install AgenTeX](#install-agentex)
4. [Prepare the project to test](#prepare-the-project-to-test)
5. [Configure the test environment](#configure-the-test-environment)
6. [Run your first test](#run-your-first-test)
7. [Choose sequential or parallel execution](#choose-sequential-or-parallel-execution)
8. [Review the results](#review-the-results)
9. [Use optional integrations](#use-optional-integrations)
10. [Safety rules](#safety-rules)
11. [Troubleshooting](#troubleshooting)

## What AgenTeX does

When you ask Copilot to test a feature, AgenTeX:

1. Converts your request into clear scenarios, including relevant positive, negative, and edge
   cases.
2. Lets you approve the plan before it starts in the default sequential mode.
3. Opens the application in a real Playwright browser session and performs the planned steps.
4. Captures screenshots plus console and network logs for every scenario.
5. Produces a report with passed, failed, and blocked scenarios, along with reproducible defect
   details.

The invoking Copilot session handles browser work because it has the terminal, browser, and
file permissions required to capture evidence. Two bundled agent files define the workflow:

| Agent | Purpose |
|---|---|
| [`test-orchestrator`](./agents/test-orchestrator.agent.md) | The workflow the invoking session follows to resolve the environment, plan scenarios, execute them, and assemble the final report. |
| [`qa-executor`](./agents/qa-executor.agent.md) | The per-spec execution role followed in an isolated browser session; it is not dispatched as a custom agent. |

## Before you begin

You need:

- **Node.js 18 or later** (`node --version`)
- A GitHub account with access to **GitHub Copilot**
- Either the **GitHub Copilot CLI** or **VS Code Copilot Chat in agent mode**
- The source folder of the application you want to test
- A safe test environment and disposable test data

Do not use production customer accounts, real payment cards, or personal data. Configure test
accounts specifically for QA.

## Install AgenTeX

Choose **one** installation path. The Copilot CLI plugin path is recommended.

### Option A: GitHub Copilot CLI plugin

#### 1. Install and sign in to Copilot CLI

Skip this step if `copilot --version` already works.

```bash
npm install -g @github/copilot
copilot
```

At the first launch, Copilot may prompt you to run `/login`. Run that command in the Copilot
session and finish the browser sign-in flow. Exit the session when authentication completes.

#### 2. Install the plugin

```bash
copilot plugin install mabdel130/agentex-copilot
```

Verify that Copilot sees it:

```bash
copilot plugin list
```

To update an installed plugin later:

```bash
copilot plugin update mabdel130/agentex-copilot
```

Alternatively, install it through the repository's marketplace:

```bash
copilot plugin marketplace add mabdel130/agentex-copilot
copilot plugin install agentex-copilot@agentex-copilot
```

### Option B: VS Code Copilot Chat fallback

Use this path when you do not use the standalone Copilot CLI. From the root of the application
you want to test, run:

```bash
npx github:mabdel130/agentex-copilot --target .
```

The fallback installer creates the Copilot instructions, agent files, starter configuration, and
test folders inside the target project. Re-running it updates plugin-owned files under
`.github/agentex/` while preserving the target project's instructions and configuration.

## Prepare the project to test

Perform the following steps from the **application project**, not from this plugin repository.

### 1. Install Playwright Agent CLI and a browser

```bash
npm install -D @playwright/cli@latest
```

Then install the browser engine you will use with `npx playwright-cli install-browser <browser>`:
`chromium`, `chrome`, `firefox`, `webkit`, or `msedge`. Agent CLI defaults to headless; request
`headed` when you need to observe the run.

### 2. Create AgenTeX configuration

If you used the VS Code fallback installer, this configuration was created already. With the
Copilot CLI plugin, open Copilot from the application project:

```bash
copilot
```

Then send this message:

```text
Set up AgenTeX for this project.
```

The `init-test` skill creates missing configuration and starter assets without replacing your
existing files:

```text
your-project/
├── config/
│   ├── project.json
│   └── environments/
│       └── dev.json
├── integration/
│   ├── sample_api.json
│   └── sample_db.json
├── test/
│   └── suite1/
├── .env
└── executions/
```

Starter files under `test/suite1/` are examples. Adapt or replace them with scenarios for your
application.

### 3. Allow the required Copilot tools

Copilot's tool-approval and directory-trust prompts are a deliberate security boundary, so the
plugin can't grant itself filesystem/shell/browser access — you approve it once per machine. The
fastest way is to launch with pre-approved/denied flags:

```bash
copilot \
  --allow-tool="shell(npx playwright-cli*)" \
  --allow-tool="shell(node*)" \
  --allow-tool="shell(npm install*)" \
  --deny-tool="shell(rm -rf*)" \
  --deny-tool="shell(git push*)"
```

See [`DEPLOYMENT.md`](./DEPLOYMENT.md#7-grant-tool-permissions) for the full flag list (including
the optional Azure DevOps commands) and for
[`config/copilot-permissions-config.example.json`](./config/copilot-permissions-config.example.json),
a template you can merge into `~/.copilot/permissions-config.json` to persist these approvals
instead of passing flags every session.

Do not grant blanket access to secrets. In particular, keep `.env` values private and do not
approve actions that display them in terminal output.

## Configure the test environment

AgenTeX separates project settings, environment values, and secrets so sensitive values are not
placed in committed JSON files.

| File | Use it for |
|---|---|
| `config/project.json` | Default environment, login mode, and optional project-wide integrations |
| `config/environments/<name>.json` | URL, test users, and environment-specific API/database connection references |
| `.env` | Secret values only |

### 1. Set the project defaults

Edit `config/project.json`:

```json
{
  "name": "my-project",
  "defaultEnvironment": "dev",
  "kb": {
    "baseUrl": "",
    "project": ""
  },
  "login": {
    "mode": "session"
  },
  "playwright": {
    "browser": "chromium",
    "mode": "headless",
    "persistent": false,
    "dashboard": true
  }
}
```

Set `defaultEnvironment` to the filename you will use under `config/environments/`. For example,
`"dev"` selects `config/environments/dev.json`.

`playwright` is optional. Use it to choose the default browser, headless/headed launch mode,
isolated persistent profile, and whether to create `extent-report.html`. A request can override
any setting: for example, “Run the checkout regression headed in Firefox without a dashboard.”

### 2. Set the URL and disposable test users

Edit `config/environments/dev.json` and replace example values:

```json
{
  "portalUrl": "https://dev.example.com",
  "defaults": {
    "otp": "0000",
    "password": "Test@1234"
  },
  "users": {
    "valid_user": {
      "phone": "0550000001",
      "role": "customer"
    }
  }
}
```

Use only accounts that are created and approved for testing. Add another environment file such as
`staging.json` when you test a different deployment, then request that environment by name in
your test prompt.

### 3. Put secrets in `.env`

Never put passwords, tokens, or connection secrets directly in JSON. Store them in `.env`:

```dotenv
SQLCMDPASSWORD=replace-with-test-database-password
API_TOKEN=replace-with-test-api-token
```

Reference a secret from configuration by its environment-variable name:

```json
{
  "password": {
    "envSecret": "SQLCMDPASSWORD"
  }
}
```

Keep `.env` ignored by Git. The scaffold appends the relevant `.gitignore` entries automatically.

## Run your first test

From the application project, start Copilot if needed:

```bash
copilot
```

Describe the target, feature, and expected coverage. For example:

```text
Test https://example.com — the signup form. Cover a successful signup,
an empty submission, and an invalid email address.
```

For an environment configured in `config/environments/dev.json`, you can instead say:

```text
Test the signup flow in the dev environment using valid_user. Check successful signup,
required fields, and invalid email validation.
```

The orchestrator returns a proposed list of scenarios. In sequential mode, review the plan and
approve it before execution begins. It then reports each scenario and finishes with the consolidated
report.

### Writing effective test requests

Include the information that affects behavior:

| Include | Example |
|---|---|
| Feature or user journey | “Test password reset from the sign-in page.” |
| Environment | “Run this on staging.” |
| User or role | “Use the configured admin test user.” |
| Coverage | “Include happy path, missing fields, expired link, and invalid token.” |
| Expected result | “A valid reset should return the user to sign-in with a success message.” |

Avoid ambiguous requests such as “test the site.” If an environment, required test user, or
scope is missing, AgenTeX asks rather than inventing details.

## Choose sequential or parallel execution

### Sequential mode: guided testing

Sequential mode is the default. AgenTeX proposes scenarios, waits for approval, and runs them
one at a time with checkpoints. Use it for:

- New or changing features
- Exploratory testing
- Work that needs your review between scenarios
- Requests described directly in chat

Example:

```text
Test checkout on the dev environment. Start with the cart and delivery-address flow,
then test an invalid postal code. Run this sequentially.
```

### Parallel mode: regression execution

Parallel mode runs independent test specification files concurrently in isolated browser sessions.
It does not pause between scenarios. Use it for a prepared regression suite:

```text
Run a parallel regression against staging using the specs in test/regression/.
```

Group dependent, stateful scenarios in the same specification file. Parallel runs are most useful
when each spec can safely use its own session and test data.

## Review the results

Every run creates a timestamped folder:

```text
executions/execu_2026-08-26_11-00-53/
├── report.md
├── run-summary.json
├── extent-report.html     # present when dashboard is enabled
├── browser-sessions/
│   └── <unique-session>/
│       ├── screenshots/
│       └── logs/
└── bugs/
    ├── bug-list.md
    └── screenshots/
```

| Artifact | What to review |
|---|---|
| `report.md` | Overall run summary, scenario outcomes, and defect descriptions |
| `extent-report.html` | Interactive dashboard with scenario details |
| `run-summary.json` | Machine-readable run result for other tooling |
| `bugs/bug-list.md` | Merged list of reported defects |
| `browser-sessions/**/screenshots` | Visual evidence for each scenario |
| `browser-sessions/**/logs` | Browser console and network evidence |

Open `report.md` first. For a failure, use the defect entry's steps, expected versus actual
behavior, screenshot, and logs to reproduce and diagnose it.

## Use optional integrations

The browser-testing workflow is available immediately. The following features need additional
configuration only when you use them.

| Need | How to ask | Required setup |
|---|---|---|
| API verification | “Verify via the API that the created order is visible.” | Define the exact request in an `integration/*_api.json` catalog. |
| Database verification | “Check the database record after submitting the form.” | Define the exact query in an `integration/*_db.json` catalog and configure its connection. |
| Knowledge-base context | “Ask the knowledge base what status this order should receive.” | Configure the `kb` block in `config/project.json`. |
| UI/design comparison | “Compare the profile page with the approved Figma design.” | Configure Figma access or provide a screenshot baseline. |
| Azure DevOps test work | “Create test cases for this user story.” | Add the Azure project configuration and `AZURE_PAT` in `.env`. |
| Azure DevOps bug filing | “File the confirmed defects as Azure DevOps bugs.” | Configure Azure access; AgenTeX asks before writing to the board. |

API and database execution is intentionally **catalog-only**. Define the approved API requests
and read-only database queries beforehand; AgenTeX does not compose arbitrary HTTP requests or
SQL during a run. See the [skills reference](./skills/README.md) for each capability's detailed
contract.

## Safety rules

AgenTeX follows these rules on every run:

- It **never modifies application source code**; it writes only test artifacts under
  `executions/`.
- It uses **disposable test data only**. Do not test real signup, checkout, payment, or customer
  journeys with live personal data.
- It never prints a value referenced as `{ "envSecret": "NAME" }`.
- API and database actions must be pre-approved in the project's integration catalog.
- Destructive database statements, including `DROP`, `TRUNCATE`, and `ALTER`, are refused.
- If required scope, environment, or test-user information is unknown, it asks in sequential
  mode or marks the work **BLOCKED** in parallel mode.

Read the full [security policy](./docs/ai/security-policy.md) and
[testing policy](./docs/ai/testing-policy.md) before connecting a shared test environment.

## Troubleshooting

| Problem | Resolution |
|---|---|
| Copilot prompts for login | Start `copilot`, run `/login`, and complete the browser authorization flow. |
| `copilot plugin install` cannot find the repository | Confirm that Copilot CLI is authenticated and that it can access GitHub. |
| Browser cannot launch | Re-run `npx playwright-cli install-browser chromium` from the application project. |
| AgenTeX cannot find an environment | Ensure `defaultEnvironment` matches a file in `config/environments/`, or state the environment name explicitly in the request. |
| Copilot asks what to test | Provide the feature, target environment, test user or role, and desired cases. |
| A secret appears in a log | Stop the run, rotate the exposed value, and report the issue. Secret values must never be printed. |
| Parallel sessions interfere with each other | Keep stateful scenarios together in one spec and use isolated accounts or test data per spec. |

## More documentation

- [Getting started](./docs/getting-started.md) — condensed first-run walkthrough
- [Deployment guide](./DEPLOYMENT.md) — plugin installation, fallback setup, permissions, and CI notes
- [Implementation guide](./docs/IMPLEMENTATION_GUIDE.md) — multi-environment project setup
- [Upstream synchronization](./docs/UPSTREAM_SYNC.md) — weekly upstream change notifications and porting workflow
- [QA capability reference](./skills/README.md) — all bundled skills and their triggers
- [Architecture](./docs/ai/architecture.md) — orchestrator/executor workflow
- [Security policy](./docs/ai/security-policy.md) — data, secrets, API, and database rules

## Contributing and license

Open issues and pull requests in the
[GitHub repository](https://github.com/mabdel130/agentex-copilot).

Licensed under [MIT](./LICENSE).
