# Repository custom instructions for GitHub Copilot

This project has AgenTeX QA-testing behavior installed. Before responding to any request to
test, check, verify, or find defects in this application's behavior:

1. Read `AGENTS.md` at the repository root.
2. Read `.github/agentex/skills/browser-testing/SKILL.md` for browser setup and evidence rules.
3. Read `.github/agentex/agents/test-orchestrator.agent.md` for how to plan and run the test
   yourself in this Copilot session. Do not delegate browser work to a custom agent runtime.
4. Read `.github/agentex/ai-docs/security-policy.md` and `testing-policy.md` before judging
   PASS/FAIL or touching any secret/config value.

Never modify application source code as part of a testing request — only write test artifacts
under `executions/`. Never use real personal data or complete a real signup/login/checkout.
