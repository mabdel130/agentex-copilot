# Using GitHub Copilot

Open a terminal in the application project and start `copilot`. Describe the test goal in normal
language, including the target environment, user role, expected behavior, and coverage.

```text
Test checkout on staging using the configured customer user.
Cover a valid cardless order and an invalid postal code.
```

Copilot selects the relevant AgenTeX skill from the request. Browser testing is sequential by
default: review and approve the proposed scenarios before browser actions begin. Use an explicit
request such as "run a parallel regression" only for independent, prepared specs.

Approve terminal and browser actions only when they target the intended QA project. Do not
approve commands that reveal `.env` values. See [Getting started](./getting-started.md) for setup.
