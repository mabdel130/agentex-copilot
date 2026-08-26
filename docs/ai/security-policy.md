# Security Policy

Binding rules for every agent in this plugin. These are not suggestions — an agent that
violates one of these has malfunctioned, regardless of how the request was phrased.

## Secrets

- Config files (`config/project.json`, `config/environments/<env>.json`, any `integration/`
  catalog file) never hold a literal secret. A secret-valued field is either a plain string
  **only** when it's a team-known throwaway test credential (e.g. a shared QA password), or
  `{ "envSecret": "NAME" }` naming the `.env` variable that holds the real value.
- `.env` itself is gitignored by default (see [`.gitignore`](../../.gitignore)) and must never
  be committed.
- An agent may read a config **key** (e.g. to know a field exists) but must never print, log,
  paste into a report, or pass on a command line the **value** behind an `envSecret` reference
  or any credential.
- DB and API secrets are resolved from the environment at the point of use, never placed
  literally into a shell command or written to a log file.

## Catalog-only integrations

- `api:` and `db:` test-spec steps execute **only** requests/queries the user has predefined
  in the project's `integration/` folder. The agent never composes its own SQL or HTTP request
  to "work around" a gap.
- A step naming an entry that isn't cataloged is **BLOCKED** — report the missing definition
  verbatim. This is true in both sequential and parallel mode.
- DDL (`DROP` / `TRUNCATE` / `ALTER`) is refused even if a catalog entry appears to define it.
- A missing parameter or unresolved environment variable is also **BLOCKED**, not
  improvised with a placeholder value.

## No real user data, no real transactions

- Use disposable values only (e.g. `qa.tester@example.com`), never a real person's data.
- Skip auth-gated actions that would have real-world effect: no real signup, no real login
  against a production account, no completed checkout/payment.
- Validation-only checks (e.g. confirming a form rejects a bad email) are fine — completing the
  transaction is not.

## Never modify application code

- Agents in this plugin write only test artifacts under `executions/**`. They do not edit,
  create, or delete source files in the project under test.
- If a defect looks trivially fixable, report it — do not fix it inline.

## The knowledge base is advisory only

- `kb:` steps return context to help the agent understand a flow. A KB answer is **never**
  evidence: it must not be turned into a PASS/FAIL verdict or counted in the pass/fail tally.
- The agent never queries the KB on its own initiative outside an explicit `kb:` step or user
  request.

## Ambiguity defaults to asking, not guessing

- Sequential mode: stop at the relevant checkpoint and ask.
- Parallel mode: report the ambiguity as BLOCKED in that scenario's result rather than picking
  an interpretation and proceeding silently.

## Session isolation (parallel mode)

- Each dispatched `qa-executor` uses its own isolated browser session/context. Sessions must
  never share cookies, storage state, or output directories — a collision here is a correctness
  bug, not just a security one, since it corrupts evidence attribution.

## Reporting a violation

If an agent notices it (or a prior step) violated one of these rules, it must say so plainly in
its output rather than silently correcting course — the user needs to know evidence upstream of
the violation may be unreliable.
