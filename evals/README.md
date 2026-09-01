# AgenTeX Copilot Evaluation Suite

Behavioral evaluations for the skills shipped by this GitHub Copilot plugin. The suite is
adapted from the upstream AgenTeX evaluation suite and is intentionally runner-agnostic:
GitHub Copilot CLI does not currently provide a bundled plugin-evaluation command.

## Case Families

- **trigger** verifies that a realistic request activates the appropriate
  `agentex-copilot:*` skill.
- **negative** verifies that ordinary coding requests and unrequested knowledge-base access do
  not activate plugin skills.
- **discipline** verifies hard safety and workflow rules, including catalog-only API/database
  execution, secret-safe reporting, one approval gate before tracker writes, UI-baseline
  handling, and CI behavior.

## Case Layout

Each case contains:

```text
evals/<case>/
  prompt.md          # request supplied to a fresh Copilot session
  graders/*.md        # scoring criteria
  case.yaml           # optional runner metadata and fixture setup
  fixture/            # optional isolated project fixture
```

`case.yaml` retains neutral metadata (`tags`, `runs`, `max_turns`, and
`timeout_seconds`) for an external evaluation harness. Its `scaffold_script` uses Node.js to
copy fixtures, making the fixture setup portable across Windows, macOS, and Linux.

## Running an Evaluation Manually

1. Create a fresh Copilot session with this plugin installed and, for fixture cases, copy the
   case's `fixture/` content into an empty temporary test project.
2. Submit the case's `prompt.md` without changing its checkpoint or result-footer instructions.
3. Score the resulting transcript and artifacts against every Markdown file in `graders/`.

The checkpoint convention keeps trigger and negative evaluations inexpensive: the agent must
invoke applicable skills, then stop before external actions and emit
`SKILLS_INVOKED:` plus `PLANNED_NEXT:`. Discipline cases instead require their case-specific,
parseable result footer.

## Scope

The suite covers all compatible upstream capabilities currently shipped by this plugin:
browser testing, API/database integration, knowledge-base use, UI checks, define-flow,
reporting, Azure DevOps test planning and bug filing, and CI restrictions.

Upstream `discipline-update-agentex-*` cases are deliberately excluded because this Copilot
plugin does not include the upstream self-migration engine. Plugin updates use
`copilot plugin update agentex-copilot`; see
[`docs/COPILOT_EQUIVALENTS.md`](../docs/COPILOT_EQUIVALENTS.md).
