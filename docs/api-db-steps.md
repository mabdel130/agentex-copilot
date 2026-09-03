# API and Database Steps

Browser scenarios may use `api:` and `db:` steps to verify that a UI action persisted correctly.
These steps are **catalog-only**: the exact request or query must already be defined in
`integration/*_api.json` or `integration/*_db.json`.

```text
api: shop-api.get-order(id=<created-order-id>) -> expect HTTP 200
db: shop-db.order-by-id(id=<created-order-id>) -> expect status = submitted
```

If the named entry is missing, the scenario is **BLOCKED**. AgenTeX never invents an HTTP
request, writes a query, modifies the catalog, or executes database DDL. See
[`skills/api-integration/SKILL.md`](../skills/api-integration/SKILL.md) and
[`skills/db-integration/SKILL.md`](../skills/db-integration/SKILL.md).
