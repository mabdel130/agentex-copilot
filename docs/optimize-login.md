# Optimize Login

Optimize-login records an authenticated QA browser state once, then loads it for later scenarios
instead of repeating a slow login flow.

```text
Optimize login for the configured admin QA user.
```

Saved state is kept in `test/.auth/` and is ignored by Git because it may contain active session
tokens. Only configured disposable QA accounts may be used. Expired sessions require a fresh,
approved login; AgenTeX does not bypass captchas or one-time-code controls. See
[`skills/optimize-login/SKILL.md`](../skills/optimize-login/SKILL.md).
