# Contributor Architecture

The repository is a Copilot QA plugin, not an application under test.

```text
plugin.json       Plugin manifest
agents/           Orchestrator and per-spec role definitions
skills/           User-facing capability contracts and helper scripts
scripts/lib/      Shared configuration and tracker libraries
config/           Consumer-project templates
test/             Starter consumer test specs
evals/            Behavioral evaluation prompts, rubrics, and fixtures
docs/             User and maintainer documentation
```

The invoking Copilot session owns environment resolution, planning, browser actions, and report
assembly. Each browser session receives a unique evidence directory. Keep deterministic validation
in scripts and policy/judgment in skill or agent instructions.

See the full [runtime architecture](../ai/architecture.md).
