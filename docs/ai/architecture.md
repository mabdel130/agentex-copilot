# Architecture — How the Plugin Is Composed

## Repo map

```text
plugin.json          Copilot plugin manifest (name, agents/ path, skills/ path)
AGENTS.md            Entrypoint instructions + non-negotiable rules
agents/              test-orchestrator.agent.md, qa-executor.agent.md
docs/                user-facing docs; docs/ai/ is the machine-facing policy set
config/              project.json.example, environments/dev.json.example
skills/              capability reference (README.md) for functionality beyond the core loop
```

## Two agents, one loop

- **`test-orchestrator`** — the agent the user talks to. Resolves the target environment,
  plans scenarios, decides sequential vs. parallel mode, dispatches `qa-executor` agents in
  parallel mode, and merges results into `report.md` / `extent-report.html`.
- **`qa-executor`** — dispatched by the orchestrator, never invoked directly. Runs exactly one
  test spec file to completion in its own isolated Playwright browser session and returns a
  structured defect report; it does not decide mode or merge results.

This mirrors the upstream Claude Code plugin's `browser-testing` skill + `qa-executor` subagent
split, made explicit as two addressable Copilot agents (see
[`docs/CONVERSION_REPORT.md`](../CONVERSION_REPORT.md) for why).

## Environment resolution (both agents follow this order)

1. **Explicit** — user said "run on uat" / spec has `env: uat` → `config/environments/uat.json`.
2. **Default** — `defaultEnvironment` in `config/project.json` → that file.
3. **Legacy** — neither exists → the URL given directly; no defaults/users available.

Naming an environment with no matching file is always an **error** — list the files in
`config/environments/` and stop. Never fall back silently.

## Execution output layout

Every run writes into one timestamped folder inside the **consumer's** project:

```text
executions/execu_<YYYY-MM-DD_HH-MM-SS>/
├── report.md
├── browser-sessions/<session>/{logs,screenshots}/
└── bugs/{bug-list.md, screenshots/}
```

- The orchestrator owns `report.md` and `bugs/`.
- Each executor owns only its own `browser-sessions/<session>/{logs,screenshots}`.
- Sequential mode uses a single session named `default`.

## Modes

| Mode | Trigger | Behavior |
|---|---|---|
| **Sequential** (default) | Any request that doesn't ask for parallel/regression/autonomous | Orchestrator itself drives the browser, pausing for approval at UNDERSTAND → PLAN → EXECUTE (per scenario) → REPORT checkpoints. |
| **Parallel** | Explicit ask for parallel / fast / regression / autonomous | Orchestrator dispatches one `qa-executor` per spec file, all in one batch, then merges — no per-checkpoint pausing, still bounded by the autonomy boundary in [`security-policy.md`](./security-policy.md). |

## Deterministic vs. judgment work

Where the upstream plugin uses small Node scripts for security-sensitive mechanics (catalog
lookups, DDL bans, auth header resolution — see `docs/CONVERSION_REPORT.md`'s known gaps), this
port documents the same *behavioral contract* directly in the agent files and
`docs/ai/security-policy.md` until those runner scripts are ported. Treat the contract as
binding even before the enforcing code exists: an agent must still refuse an uncataloged
`api:`/`db:` request on its own judgment.

## Where to go next

- [`docs/ai/security-policy.md`](./security-policy.md) — what agents can't do, ever.
- [`docs/ai/testing-policy.md`](./testing-policy.md) — how to judge PASS/FAIL and severity.
- [`docs/IMPLEMENTATION_GUIDE.md`](../IMPLEMENTATION_GUIDE.md) — wiring this into a real project.
