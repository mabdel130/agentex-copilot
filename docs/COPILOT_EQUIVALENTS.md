# Upstream AgenTeX compatibility in GitHub Copilot

This plugin selectively adapts AgenTeX features from
[MhmdElGazzar/agentex](https://github.com/MhmdElGazzar/agentex). A source file is not copied
when it requires Claude Code at runtime or is upstream-maintainer infrastructure. This page
identifies the GitHub Copilot CLI equivalent for each such component.

| Upstream component | Why it is not copied directly | GitHub Copilot CLI equivalent |
|---|---|---|
| `.claude-plugin/plugin.json` | Claude manifest location and metadata | Root [`plugin.json`](../plugin.json), loaded by `copilot plugin install`. |
| `commands/*.md` | Upstream wrappers assume Claude command argument syntax and its browser-testing skill | Invoke the matching installed skill by natural language: `ask-kb`, `define-flow`, `test-design`, `task-estimation`, `init-test`, or use the `test-orchestrator` agent for test execution. Copilot supports a `commands` manifest path, but GitHub's plugin authoring documentation does not define a portable command-file format, so unverified Claude wrappers are not installed. |
| `skills/browser-testing/` | The upstream orchestration and CI scripts launch `claude` headless sessions | [`skills/browser-testing/SKILL.md`](../skills/browser-testing/SKILL.md) is the Copilot entry point and delegates execution to [`agents/test-orchestrator.agent.md`](../agents/test-orchestrator.agent.md) and [`agents/qa-executor.agent.md`](../agents/qa-executor.agent.md). |
| Browser-testing CI gate and templates | `ci_gate.js` starts Claude CLI and consumes its Claude-specific verdict contract | Run the test-orchestrator in a controlled Copilot CLI session or create a dedicated CI integration after confirming a supported non-interactive Copilot invocation. Do not rename a `claude` command to `copilot`: authentication, plugin loading, and output contracts differ. |
| Setup wizard | The upstream local web server was designed for the Claude command workflow | The `init-test` skill writes the same project config and starter test assets idempotently. |
| `migrate.js` and `scripts/migrations/` | They migrate upstream's historical Claude configuration shapes | This plugin has one `config/` schema. Add a Copilot-specific migration only when that schema changes incompatibly. |
| `self_update.js` and `update-agentex` | The upstream runner invokes `claude plugin update` | Use `copilot plugin update agentex-copilot`, `copilot plugin update --all`, or the interactive `/plugin` dashboard update action. |
| `evals/` and `scripts/release-gate/` | Upstream internal test and release-maintainer fixtures, not installed plugin behavior | Validate this plugin using its own focused tests and `copilot plugin install ./` during development. |
| `scripts/wizard/` | Supports only the upstream wizard | `init-test` plus `config/project.json` and `config/environments/<env>.json` are the supported Copilot configuration path. |

Portable upstream enhancements are adapted when they do not require Claude Code. For example,
this release ports the durable `run-summary.json` contract and enriched HTML report renderer.
