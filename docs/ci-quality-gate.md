# CI Quality Gate

This plugin does not ship the upstream Claude-specific CI runner. Do not substitute `copilot` for
the upstream `claude` command: authentication, plugin loading, and output contracts differ.

You may run prepared browser testing in a controlled Copilot CLI environment only after verifying
that the chosen non-interactive Copilot invocation is supported by your organization. Keep the
workflow read-only outside `executions/`, use only QA environments, and set `AGENTEX_CI=1` to
refuse Azure DevOps tracker writes.

For the compatibility rationale, see
[`docs/COPILOT_EQUIVALENTS.md`](./COPILOT_EQUIVALENTS.md). A dedicated CI integration should
define its own invocation, authentication, timeouts, verdict contract, and artifact retention.
