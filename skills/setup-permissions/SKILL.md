---
name: setup-permissions
description: >
  Install, preview, update, or remove AgenTeX's user-level "agentex" launcher for GitHub
  Copilot CLI. Use when the user wants reusable Playwright permissions across projects,
  fewer repeated Copilot tool prompts, a global AgenTeX command, or asks to trust AgenTeX
  commands in every project. The launcher keeps directory trust project-specific and never
  enables allow-all, unrestricted writes, secrets, or destructive commands.
---

# Setup Permissions — install the safe global launcher

Use the plugin-root script `scripts/install-global-launcher.js`; do not hand-edit the user's
shell profile or Copilot permission files.

## Install or update

1. Preview the exact user-level files first:
   ```bash
   node <plugin-root>/scripts/install-global-launcher.js --dry-run
   ```
2. If the user already explicitly asked to install or update the launcher, run:
   ```bash
   node <plugin-root>/scripts/install-global-launcher.js
   ```
   Otherwise, show the preview and ask before writing outside the current repository.
3. Explain that the installed command supports:
   ```bash
   agentex
   agentex --with-azure
   agentex --dry-run
   agentex --uninstall
   ```
4. Make clear that each new project still requires Copilot's directory-trust choice. The
   launcher only supplies narrow tool allow rules and destructive-command deny rules.

## Existing launcher conflict

The installer refuses to overwrite an existing `agentex` command that it does not own. If it
reports this conflict, show the path and stop. Use `--force` only after the user has reviewed
that exact file and explicitly approved replacing it.

## Uninstall

Run either:

```bash
agentex --uninstall
```

or:

```bash
node <plugin-root>/scripts/install-global-launcher.js --uninstall
```

## Security rules

- Never replace this workflow with `/allow-all`.
- Never add persistent write approval, secret-file access, unrestricted network access, or
  destructive commands.
- Azure rules remain opt-in through `agentex --with-azure`.
- Directory trust remains a separate per-project decision controlled by Copilot CLI.
