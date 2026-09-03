# Interactive HTML Report

After a run, AgenTeX can render `run-summary.json` as
`executions/execu_<timestamp>/extent-report.html`.

The standalone dashboard shows outcome totals and expandable scenario details, including evidence
paths, steps, and defects. Open it locally in a browser; no server is required.

Dashboard generation is enabled by default through `playwright.dashboard` in
`config/project.json`. See [`skills/extent-report/SKILL.md`](../skills/extent-report/SKILL.md)
and its [run-summary schema](../skills/extent-report/references/run-summary-schema.md).
