# Performance

AgenTeX runs have two cost centers: **browser/mechanical time** (launching browsers, logging in,
driving pages) and **agentic/LLM time** (the Copilot session reasoning about what to do next).
Speeding up a run means cutting both, without skipping a required checkpoint, evidence capture,
or safety rule.

## 1. Prefer the fast-path runner over turn-by-turn driving

The Playwright Agent CLI fallback issues one command — and one LLM turn — per browser action.
`skills/browser-testing/scripts/run_parallel.js` instead executes a whole manifest of
scenarios (`goto`, `click`, `fill`, `press`, `assertVisible`, `assertCount`) as one deterministic
script run across bounded, isolated browser contexts. This is the single biggest lever: it turns
many small LLM-mediated round trips into one code execution, cutting both latency and token
cost (the "do it in code, not another LLM call" principle). Use it whenever a spec's steps stay
inside that action vocabulary; fall back to the Agent CLI only for interactive exploration,
API/DB steps, or anything the manifest can't express.

## 2. Reuse the login instead of paying for it every scenario

Login is usually the most expensive, least interesting part of a run. Apply the
[`optimize-login`](./optimize-login.md) skill: script the login once, save `storageState`, and
resume it in later browser contexts (`login.mode: "session"` in `config/project.json`). Only
re-drive a live login when the saved session fails its landmark check. On a real project this
took login from ~197s of agentic driving per scenario down to ~38s once, then ~8s per later run.

## 3. Tune `playwright.workers` to the run

`config/project.json` → `playwright.workers` (default `4`) sets how many specs `run_parallel.js`
executes concurrently, up to its validation ceiling of `16`. Raise it when you have several
independent specs and CPU/RAM headroom; lower it on a resource-constrained machine or when
higher concurrency causes flakiness. A request can override the default for one run (e.g. "run
with 8 workers").

## 4. Skip the dashboard for routine runs

`playwright.dashboard: false` skips `extent-report.html` generation only — `report.md`,
`run-summary.json`, screenshots, and logs are still produced. Use it for routine or CI-style
runs where nobody opens the interactive report, and turn it back on when you need the visual
dashboard.

## 5. Keep the Copilot session's context lean

Latency and cost both scale with how much context is re-sent on every turn:

- Read only the spec files and config needed for the active run — avoid re-reading files already
  in context.
- Start a new Copilot session (`/new`) when you move to an unrelated suite or project instead of
  carrying an old run's full history forward.
- Use `/compact` to shrink a long-running session's history instead of letting it grow
  unbounded across many runs; `/context` shows current usage.
- Rely on `AGENTS.md` and the bundled skill/agent files as the project map, instead of having the
  agent re-discover structure by exploring the repository each run.

## 6. Don't change models or reasoning effort mid-run

Switching models, changing reasoning effort, or changing the enabled tool/MCP set mid-session
invalidates the prompt cache, so the full context gets re-sent and re-billed as fresh input
tokens. Pick a model (or use Copilot auto model selection) once per run and keep it for
planning, execution, and reporting. Reach for a stronger reasoning model when *planning*
scenarios (ambiguity, edge-case coverage); a lighter/faster model is often sufficient once the
plan is approved and execution is mostly mechanical step-following.

## 7. Group stateful scenarios, split independent ones

Scenarios that share state must stay in one spec file (required for correctness — parallel specs
run in separate isolated contexts). Scenarios that don't depend on each other should live in
separate spec files instead of one large one, since each spec file is `run_parallel.js`'s unit
of concurrency — more independent specs means more of the run actually happens in parallel.

## What performance work must never do

- Skip a sequential-mode checkpoint or approval.
- Skip required evidence (screenshots, console/network logs) for a scenario.
- Use a shared/default browser session for parallel specs.
- Weaken any rule in the [security policy](./ai/security-policy.md) or
  [testing policy](./ai/testing-policy.md) to save time.

## References

- LangChain, ["How do I speed up my agent?"](https://www.langchain.com/blog/how-do-i-speed-up-my-agent)
  — bottleneck-first diagnosis, fewer LLM calls, parallel LLM calls, faster/lighter models, less
  context per call.
- GitHub Docs, ["Optimizing your AI usage to maximize efficiency and reduce cost"](https://docs.github.com/en/copilot/tutorials/optimize-ai-usage)
  — right-sized models, lean context, cache preservation, research/plan/implement phasing.
