---
name: update-plugin
description: >
  Check whether the agentex-copilot plugin itself is up to date, then migrate the current
  project's AgenTeX scaffold (config/, .env, integration/) forward to match the installed
  plugin version, using a versioned migration registry and a git-clean-tree safety gate. Use
  this skill when the user asks to update AgenTeX, migrate their project's AgenTeX config,
  check for agentex-copilot updates, or upgrade after installing a newer plugin version. The
  Copilot-native equivalent of upstream AgenTeX's `/update-agentex` command.
---

# Update Plugin — check for updates, migrate project config

Mirrors upstream [AgenTeX](https://github.com/MhmdElGazzar/agentex)'s `/update-agentex`
command and its `self_update.js` + `migrate.js` engine, adapted for GitHub Copilot CLI's own
plugin-update mechanism and this port's own (currently single) config schema. See
[`../../docs/CONVERSION_REPORT.md`](../../docs/CONVERSION_REPORT.md#closing-the-command-equivalent-gaps)
for why this was ported as a scaffolded, mostly-no-op engine rather than a translation of
upstream's Claude-specific migration history.

## Steps

1. **Plugin freshness — before any project migration.** GitHub Copilot CLI plugin updates are
   the CLI's own responsibility, not this skill's — there is no supported API for a skill to
   query or pull a newer plugin version itself. Tell the user to run one of:
   - `copilot plugin update agentex-copilot`
   - `copilot plugin update --all`
   - the interactive `/plugin` dashboard's update action

   Then continue to step 2 regardless of whether they update now — the migration below runs
   against whatever plugin version is currently installed.

2. **Run the migration engine** from the project root (not from inside the agentex-copilot
   plugin's own repo):
   ```bash
   node <this skill's directory>/scripts/migrate.js
   ```
   (Resolve "this skill's directory" as the folder containing this `SKILL.md`.)

   It reads the project's `.agentex/version.json` stamp (written automatically by the
   `init-test` skill's scaffolding, so a freshly-initialized project is already current; a
   project that predates this stamp carries none), compares it to the installed plugin's
   `plugin.json` version, and runs any pending entries from `scripts/migrations/` in ascending
   version order. **As of this writing there are zero registered migrations** — this port has
   had one `config/` shape since v2.0.0 — so a normal run just reports "already up to date" and
   writes the stamp.

3. **Relay the script's output plainly.** It prints one `[migrated]` / `[manual]` / `[failed]`
   / `[ok]` / `[withheld]` line per action plus a summary — read it and explain it to the user,
   don't re-describe it in different words. Never print secret values (this script only ever
   touches file existence/version data, never `.env` contents).

4. **If it aborts (exit 2), explain the reason and stop** — do not attempt the migration by
   hand:
   - *dirty working tree* → ask the user to commit or stash first; git is the rollback
     mechanism, so a clean starting point is non-negotiable.
   - *not a git repository* → suggest `git init` plus an initial commit, then re-run.
   - *stamp newer than the installed plugin* → the project was migrated by a newer
     agentex-copilot than is currently installed; the user should update the plugin (step 1)
     rather than downgrade the project.
   - "already up to date" is success, not an abort — just tell the user.

5. **If any `[manual]` line appears** (once migrations exist), describe the exact hand-move its
   message asks for — never guess or make the change yourself without the user's confirmation.

6. **Suggest the follow-up:** verify the project's config still works with a normal test run
   (see the `browser-testing` skill), then commit `.agentex/version.json` alongside any other
   migration output as one commit.

## Extending the migration registry

If this port's `config/`, `.env`, or `integration/` schema ever changes in a way that would
break an existing consumer project's files, add a migration under `scripts/migrations/` (see
that folder's `README.md` for the exact shape) and register it in `scripts/index.js`. Until
then, this skill's job is limited to the freshness reminder and a no-op-but-tested stamping
pass.

## Rules

- **Never invoke a `copilot plugin` command on the user's behalf without asking first** — plugin
  updates are the user's decision; this skill only informs and reminds.
- **Never run `scripts/migrate.js` inside the agentex-copilot plugin's own repository** — it
  operates on a *consumer* project's files, not the plugin's own.
- **Never bypass the clean-git-tree gate.** It is the only rollback mechanism this engine has.
- **Never write or infer a version stamp when any migration reported `manual` or `failed`** —
  the engine already withholds it; don't work around that if asked to "force" a stamp.
