# Define Flow

Use define-flow when a scenario is too new or complex to write accurately in advance.

```text
Define a checkout test flow on the dev environment.
```

Copilot examines the live page, proposes one next step, executes it, and lets you assert the
observed result before continuing. It saves the completed flow as a normal test specification.
Values produced by the application are recorded symbolically so a later run can resolve fresh
values.

Use disposable data only. A definition session does not write execution evidence; an optional
later browser-testing run does. See [`skills/define-flow/SKILL.md`](../skills/define-flow/SKILL.md).
