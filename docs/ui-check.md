# UI Check

Use `ui-check:` steps to compare the browser page with an approved Figma frame or screenshot.

```text
ui-check: screenshot:test/baselines/checkout-desktop.png mode:reference
```

`exact` mode treats any visible mismatch as significant. `reference` mode evaluates only the
details explicitly named in the step. A missing or inaccessible baseline blocks the comparison;
AgenTeX never invents one. When the required verdict depends on product intent rather than visible
evidence, it asks for a decision instead of guessing.

See [`skills/ui-check/SKILL.md`](../skills/ui-check/SKILL.md) for supported baselines and evidence.
