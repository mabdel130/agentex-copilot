# Ask the Knowledge Base

Use a knowledge-base question only when you explicitly need contextual guidance during a test.

```text
Ask the KB what order status a successful checkout should receive.
```

Or include a spec step:

```text
kb: What status should this order have after payment?
```

The response is advisory context, never pass/fail evidence. AgenTeX does not query the KB unless
the user or spec explicitly requests it. Configure the `kb` block in `config/project.json`; see
[`skills/ask-kb/SKILL.md`](../skills/ask-kb/SKILL.md).
