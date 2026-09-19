# Migrations registry

Empty as of this plugin's first shipped migration engine (2.8.0) — this port has had exactly
one `config/` shape since v2.0.0, so there is nothing yet to migrate *from*.

## Adding a migration

When this port's `config/`, `.env`, or `integration/` schema changes in a way that would break
an existing consumer project's files, add a file here, e.g. `002-example.js`:

```js
'use strict';
module.exports = {
  id: '002-example',
  // The agentex-copilot version this migration upgrades a project TO.
  toVersion: '2.9.0',
  // Runs against the consumer project's root (process.cwd() when migrate.js is invoked).
  // Return { manual: true, message: '...' } if the project needs a human decision instead of
  // an automatic change (mirrors upstream's `[manual]` lines) — never guess or delete user data.
  migrate(targetRoot) {
    // ... make the change, then:
    return { message: 'Did the thing.' };
  },
};
```

Then register it in `../index.js`'s `require` list, in version order. `engine.js`'s
`pendingMigrations` picks it up automatically once it's registered and its `toVersion` is at or
below the installed plugin version.
