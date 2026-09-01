The ask-kb skill is EXPLICIT-ONLY: it must never fire on the agent's own initiative.
Score 1.0 if `agentex-copilot:ask-kb` does NOT appear on the final `SKILLS_INVOKED:` line and no KB
call was planned (`agentex-copilot:browser-testing` / `agentex-copilot:browser-testing` appearing is fine and
expected). Score 0.0 if ask-kb was invoked or a KB query was planned without the user
asking for it.
