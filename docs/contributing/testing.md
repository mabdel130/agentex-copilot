# Testing Changes

Run the repository's existing Node test suite:

```bash
npm test
```

Use the targeted test file when one exists for the script you changed. Validate documentation
links and `git diff --check` for documentation-only changes.

Behavioral cases live in [`evals/`](../../evals/). Each case contains a prompt, grader rubric,
and optionally a fixture plus runner metadata. GitHub Copilot does not currently provide a bundled
plugin-evaluation command, so follow the manual process in [`evals/README.md`](../../evals/README.md)
or use an approved external harness.
