'use strict';
// Pure migration-engine logic for the update-plugin skill — no I/O here, so it's directly
// testable. `scripts/migrate.js` is the thin CLI wrapper that does the actual file/git work
// and calls into this module.
//
// Design: a consumer project stamps `.agentex/version.json` with the agentex-copilot version
// that last migrated its config/ scaffold. Each entry in `migrations/` (see that folder's
// README) declares the version it upgrades a project TO and a `migrate(targetRoot)` function.
// On each run, every migration whose `toVersion` is greater than the project's current stamp
// (and less than or equal to the installed plugin version) runs in ascending version order.
//
// There are zero registered migrations as of this plugin's first shipped version of this
// engine (2.8.0) — this port has had exactly one config/ shape since v2.0.0. The engine exists
// so that WHEN this port's config schema changes incompatibly, there is already a tested place
// to add the migration instead of inventing one under time pressure. See
// `../../../docs/CONVERSION_REPORT.md` for why upstream's own `migrate.js` was not translated
// directly (it migrates upstream's Claude-specific schema history, not this port's).

const path = require('path');

// Minimal semver-ish compare good enough for this plugin's plain `x.y.z` versions (no
// pre-release/build metadata support needed here).
function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

// Selects migrations that still need to run: stamped version < migration.toVersion <= installed
// plugin version. Returned in ascending order so history applies forward, one step at a time.
function pendingMigrations(migrations, stampedVersion, installedVersion) {
  return migrations
    .filter(
      (m) =>
        compareVersions(m.toVersion, stampedVersion) > 0 &&
        compareVersions(m.toVersion, installedVersion) <= 0
    )
    .sort((a, b) => compareVersions(a.toVersion, b.toVersion));
}

// Runs the given migrations in order against targetRoot, collecting one result entry per
// migration. A migration throwing marks that (and all later) migrations as failed/aborted
// rather than continuing over an inconsistent state.
function runMigrations(migrations, targetRoot) {
  const results = [];
  let aborted = false;
  for (const migration of migrations) {
    if (aborted) {
      results.push({ id: migration.id, toVersion: migration.toVersion, status: 'skipped' });
      continue;
    }
    try {
      const outcome = migration.migrate(targetRoot) || {};
      results.push({
        id: migration.id,
        toVersion: migration.toVersion,
        status: outcome.manual ? 'manual' : 'migrated',
        message: outcome.message || null,
      });
      if (outcome.manual) aborted = false; // manual items don't block later migrations
    } catch (err) {
      results.push({
        id: migration.id,
        toVersion: migration.toVersion,
        status: 'failed',
        message: err && err.message ? err.message : String(err),
      });
      aborted = true;
    }
  }
  return results;
}

// Decides the new stamp to write (or null to withhold it, mirroring upstream's rule that a
// stamp is only written when nothing manual/failed remains outstanding).
function nextStamp(results, installedVersion, previousStamp) {
  const blocking = results.some((r) => r.status === 'manual' || r.status === 'failed');
  if (blocking) return previousStamp;
  return installedVersion;
}

module.exports = {
  compareVersions,
  pendingMigrations,
  runMigrations,
  nextStamp,
};
