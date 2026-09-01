# AgenTeX for GitHub Copilot

Use GitHub Copilot to run evidence-backed browser QA with Playwright. Describe what to test in
plain language; AgenTeX plans scenarios, drives a browser, captures evidence, and writes a
defect report.

> AgenTeX supports exploratory testing and regression checks. It does not replace unit or
> integration tests.

## Quick Start

### 1. Install

Requires Node.js 18+ and GitHub Copilot.

**Copilot CLI (recommended)**

```bash
copilot plugin install mabdel130/agentex-copilot
```

**VS Code Copilot Chat fallback**

Run this in the application project you want to test:

```bash
npx github:mabdel130/agentex-copilot --target .
```

### 2. Prepare the application project

Install Playwright and a browser:

```bash
npm install -D @playwright/test @playwright/cli@latest

```

For the Copilot CLI installation, open Copilot in the application project and ask:

```text
Set up AgenTeX for this project.
```

This creates starter configuration under `config/`, a `test/` folder, and an `.env` file for
secrets.

### 3. Run a test

Ask Copilot what you want to test:

```text
Test https://example.com — the signup form. Cover successful signup,
empty required fields, and an invalid email address.
```

Or use a configured environment:

```text
Test the signup flow in the dev environment using valid_user.
```

Sequential mode is the default: AgenTeX proposes scenarios and waits for approval. Request
**parallel regression** to run independent prepared specs concurrently.

## Configuration

| File | Purpose |
|---|---|
| `config/project.json` | Default environment and Playwright options |
| `config/environments/<name>.json` | Target URL and disposable test users |
| `.env` | Secrets only; do not commit this file |

Use only safe test environments and disposable accounts.

## Results

Each run writes evidence to:

```text
executions/execu_<timestamp>/
├── report.md
├── run-summary.json
├── extent-report.html
├── browser-sessions/
└── bugs/bug-list.md
```

Open `report.md` first for passed, failed, and blocked scenarios. Screenshots and browser logs
are stored with the run for reproduction.

## Safety

- AgenTeX never modifies the application source code.
- Use disposable test data only—never real customer, payment, or personal data.
- Keep passwords and tokens in `.env`; reference them from configuration with `envSecret`.
- API and database checks must use pre-approved integration catalog entries.

## More Information

- [Getting started](./docs/getting-started.md)
- [Architecture](./docs/ai/architecture.md)
- [Security policy](./docs/ai/security-policy.md)
- [Deployment guide](./DEPLOYMENT.md)
