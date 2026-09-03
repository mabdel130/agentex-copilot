# Browser Testing

Ask Copilot to test a feature, target, and coverage:

```text
Test product search in the dev environment. Cover a matching term,
no results, and special characters.
```

In sequential mode, AgenTeX proposes scenarios, waits for approval, runs each one in an isolated
Playwright session, and captures screenshots plus console/network logs. Use it for exploratory or
new work.

For a prepared regression suite, use:

```text
Run a parallel regression against staging using test/regression/.
```

Parallel specs must be independent and use isolated QA accounts or test data. Every run writes a
report and evidence under `executions/execu_<timestamp>/`. Browser behavior and evidence rules
are defined in [`skills/browser-testing/SKILL.md`](../skills/browser-testing/SKILL.md).
