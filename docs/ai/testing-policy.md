# Testing Policy

How agents in this plugin should judge PASS/FAIL, severity, and evidence. Read alongside
[`security-policy.md`](./security-policy.md), which covers what agents must never do; this
page covers how to judge what they do.

## Scenario coverage

Plan scenarios in three buckets, in this order of priority: **happy path** (the feature working
as intended), **edge cases** (boundary values, empty/max-length input, slow network), and
**negative cases** (invalid input, unauthorized access, expected error states). A plan that
skips negative cases is incomplete.

## PASS/FAIL judgment

- A scenario is **FAIL** if the observed behavior differs from the stated (or reasonably
  inferred) expected behavior — including console errors or failed network calls that don't
  visibly break the UI. Do not wave off a console error because "the page still looked fine."
- Before trusting a "success" indicator (a toast, a checkmark, a redirect), verify it's actually
  rendered/visible — not just present as static markup that happens to be hidden.
- `kb:` step results are advisory only and never fold into the PASS/FAIL tally (see
  [`security-policy.md`](./security-policy.md#the-knowledge-base-is-advisory-only)).
- An `api:`/`db:` step that comes back BLOCKED (missing catalog entry, missing param, missing
  env value) is reported verbatim as BLOCKED — it is not a FAIL, and it must not be silently
  skipped either.

## Defect reporting format

Every defect gets:

- **Title** — concise, action-oriented (e.g. "Signup form accepts email with no @").
- **Steps to reproduce** — numbered, deterministic; another person should get the same result.
- **Expected** vs **Actual**.
- **Severity** — Critical / High / Medium / Low (see below).
- **Evidence** — screenshot filename(s) plus any relevant console/network log excerpt.

## Severity guide

| Severity | Meaning |
|---|---|
| **Critical** | Blocks the core flow entirely, or causes data loss/corruption, or a security exposure. |
| **High** | The flow is broken for a common path but a workaround exists, or the wrong data is shown/saved. |
| **Medium** | Incorrect behavior on an edge case or secondary path; doesn't block the main flow. |
| **Low** | Cosmetic, copy, or minor UX issue with no functional impact. |

## Evidence discipline

- Capture a screenshot for **every** scenario, PASS and FAIL alike — a PASS without evidence is
  not verifiable later.
- Save logs/screenshots only under the executor's own session directory
  (`browser-sessions/<session>/{logs,screenshots}`) — see
  [`architecture.md`](./architecture.md#execution-output-layout).
- When merging results (parallel mode), the orchestrator copies only the screenshots each
  executor explicitly flagged as bug evidence into `bugs/screenshots/` — it does not
  re-derive evidence from raw session folders.

## Reporting tally

End every run's output with a one-line tally: `<n> pass / <m> fail, <k> defects`. This is what
a human skims first — get it right and keep it consistent across sequential and parallel mode.

## When a run's scope is ambiguous

Ask once, before starting, rather than guessing and re-running. If ambiguity surfaces mid-run
in sequential mode, stop at the next checkpoint and ask; in parallel mode, report it as BLOCKED
for that scenario and continue with the rest of the batch.
