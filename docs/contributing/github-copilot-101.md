# GitHub Copilot Plugin Concepts

A Copilot plugin uses `plugin.json` to declare its agent and skill directories.

- A **skill** is a directory containing `SKILL.md`. Its description determines when Copilot
  should use it; the body defines the workflow and may reference deterministic scripts.
- An **agent definition** supplies a role and operating rules. This plugin's invoking Copilot
  session follows `test-orchestrator` and `qa-executor`; browser work is not delegated to a
  custom-agent runtime.
- A **request** is ordinary user language. Skills are selected by intent, not upstream
  Claude-style slash-command wrapper files.

The safe execution model is: Copilot applies policy and judgment; Node scripts enforce mechanics
such as catalog lookup, report generation, and guarded Azure DevOps writes.
