# Adding a Skill

1. Create `skills/<lowercase-hyphenated-name>/SKILL.md` with valid frontmatter containing the
   matching `name` and a precise trigger-oriented `description`.
2. Define the user-visible workflow, guardrails, input requirements, output/artifact behavior,
   and failure behavior in `SKILL.md`.
3. Add deterministic scripts only where agent judgment is not appropriate. Resolve paths from
   `__dirname`, validate inputs, and never expose secrets.
4. Reuse `scripts/lib/project_config.js` or the tracker library when their responsibilities
   overlap; do not create parallel configuration or Azure DevOps implementations.
5. Add behavioral coverage under `evals/` when the skill has important trigger or discipline
   requirements.
6. Update `skills/README.md`, `docs/README.md`, and relevant user documentation.
7. Run the smallest existing test command covering the changed helper scripts.

Use existing skills as the canonical examples for structure and safety requirements.
