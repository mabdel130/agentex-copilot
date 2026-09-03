# Conventions

- Name skills with lowercase hyphenated directory names matching the `name` in `SKILL.md`.
- Keep secrets in `.env` and reference them by `envSecret`; never print or commit their values.
- Do not add real customer, company, or payment data to docs, fixtures, or screenshots.
- API and database operations must resolve through the integration catalog. Never bypass it with
  raw HTTP, arbitrary SQL, or DDL.
- Put shared mechanics in shared libraries rather than duplicating code across skills.
- Use structured output from helper scripts and fail explicitly on invalid input.
- Preserve the consumer-project contract: generated execution files belong only under
  `executions/`, which is ignored by Git.

Security and testing behavior must comply with the
[security policy](../ai/security-policy.md) and [testing policy](../ai/testing-policy.md).
