# Structured ledger PostgreSQL cutover

## Status

The PostgreSQL repository is implemented behind an explicit feature flag. The default remains the legacy JSON ledger until an operator deliberately enables cutover. The server imports the legacy history into PostgreSQL before declaring the application database ready, verifies the complete global chain, and refuses to downgrade to JSON after PostgreSQL history exists.

This is a controlled migration, not permission to run it against production without a verified backup and a reviewed change window.

## Required preparation

1. Take a database backup and a separate immutable copy of the legacy `data/db.json` file.
2. Record the legacy ledger entry count and run the existing Phase 1 ledger-integrity check.
3. Confirm the deployed PostgreSQL role can create the `structured_ledger_entries` table, index, trigger function, and append-only trigger. If schema ownership is managed externally, provision these objects with the database owner before application cutover.
4. Run the dedicated PostgreSQL integration suite against an isolated disposable database by setting `HAL_LEDGER_TEST_DATABASE_URL`. Never point that variable at production.
5. Confirm the PR's CI is green on the exact head commit.

## Enable cutover

Set this environment variable on the HAL application:

```env
HAL_STRUCTURED_LEDGER_POSTGRES_ENABLED=true
```

On startup, HAL will:

- bootstrap the PostgreSQL ledger table and append-only trigger;
- read the complete legacy ledger in global sequence order;
- validate the legacy sequence, previous-hash links, payload hashes, and entry hashes;
- acquire the global PostgreSQL advisory transaction lock;
- insert only missing legacy entries, after proving existing PostgreSQL history is an exact prefix;
- verify the complete PostgreSQL chain before the application becomes ready.

The reconciliation is transactional and insert-only. A mismatch, malformed source chain, unavailable database, or incomplete schema aborts initialization; it does not overwrite or delete either copy.

## After cutover

Keep `HAL_STRUCTURED_LEDGER_POSTGRES_ENABLED=true` permanently. Once PostgreSQL has ledger history, startup refuses to continue in legacy JSON mode. This prevents a configuration mistake from silently splitting the chain across two stores.

Check startup logs for:

```
[HAL PostgreSQL] Structured ledger cutover verified: ... total global entries.
[HAL PostgreSQL] Application database schema is ready.
```

Then verify the Phase 1 ledger status and inspect recent entries. Compare the PostgreSQL total and latest hash with the cutover log. Do not delete the legacy JSON backup until the wider persistence migration and recovery plan are approved.

## Rollback

Do not simply turn the feature flag off after cutover. PostgreSQL may contain entries written after the legacy snapshot, and switching back would lose those entries from the active chain. If cutover fails before readiness, preserve both stores and logs, leave the flag enabled while investigating, and restore from verified backups only under an explicit recovery procedure.
