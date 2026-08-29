# Upstream AgenTeX synchronization

`mabdel130/agentex-copilot` is a GitHub Copilot adaptation of
[`MhmdElGazzar/agentex`](https://github.com/MhmdElGazzar/agentex). It must not blindly merge or
copy upstream files: upstream uses Claude Code-specific agents and command wrappers, while this
project uses GitHub Copilot agents, skills, and plugin metadata.

The repository therefore uses a **weekly notification workflow**, not an automated code sync.

## How monitoring works

[`.github/workflows/upstream-sync-notifier.yml`](../.github/workflows/upstream-sync-notifier.yml)
runs every Monday and can also be started from the Actions tab with **Run workflow**. It fetches
`MhmdElGazzar/agentex` `main` and checks for changes beneath:

```text
agents/
commands/
skills/
templates/
scripts/
docs/
```

On its first run, the workflow creates a closed baseline issue. Thereafter, when one of those
areas changes upstream, it creates or refreshes one open issue titled:

```text
[AgenTeX Sync] Review upstream updates
```

The issue includes the upstream commit list, changed paths, and a direct GitHub compare link.
It carries the `agentex-upstream-sync` label.

## Porting an upstream change

1. Open the notification issue and review its compare link.
2. Identify the equivalent Copilot surface. For example, an upstream `skills/<name>/` change
   commonly belongs in this repository's `skills/<name>/SKILL.md`; an upstream command wrapper
   may instead become a natural-language skill trigger or an agent instruction.
3. Port only the useful behavior, retaining Copilot-specific safety rules, configuration paths,
   and artifact layout.
4. Test the changed script or workflow with the smallest suitable existing validation.
5. Commit and push the adapted change.
6. Close the notification issue **only after** the relevant upstream changes are reflected or
   deliberately rejected.

Closing an issue advances the monitor's baseline to the upstream revision shown in that issue.
Do not close it merely to hide it; doing so tells the workflow that the listed revision was
handled.

## Start or reset monitoring

Run **Actions → Check AgenTeX upstream updates → Run workflow** to initialize monitoring or
perform an immediate check.

To intentionally reset the baseline, close any open upstream-sync issue, then delete all issues
labeled `agentex-upstream-sync`. The next workflow run creates a new baseline at the current
upstream `main` revision.

## Why notification instead of automatic copying

Automatic copying could overwrite Copilot-specific work or import unsupported Claude Code
formats. The notification workflow keeps upstream changes visible while requiring a conscious,
reviewed adaptation for every change.
