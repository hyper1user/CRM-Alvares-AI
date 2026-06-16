# UUID v7 Migration Plan

Status: draft for Pre-Phase B.

The goal is to make records safe for future server sync and offline creation before Phase 1 introduces real multi-device writes.

## Decision

Use UUID v7 as the canonical sync identity for records that can be created, edited, or referenced across devices.

Do not flip every SQLite primary key in one migration. SQLite primary-key replacement is high-risk because the current app, imports, exports, reports, and document generation all assume integer IDs in many places.

Instead, use a staged migration:

1. Add stable UUID columns to syncable tables.
2. Backfill existing rows.
3. Add unique indexes.
4. Update new writes to generate UUID v7.
5. Update server contracts to use UUIDs.
6. Only then decide whether local integer IDs remain internal row IDs or are replaced by UUID primary keys in a later major migration.

This keeps the desktop app stable while still removing the future sync conflict.

## Syncable Tables

These tables should get a UUID identity before server sync:

| Table | Current PK | Proposed column | Notes |
| --- | --- | --- | --- |
| `personnel` | `id integer` | `uuid text unique` | Primary domain object. Must be first. |
| `positions` | `id integer` | `uuid text unique` | Has natural `position_index`, but edits still need stable identity. |
| `subdivisions` | `id integer` | `uuid text unique` | Parent links need UUID mapping later. |
| `movements` | `id integer` | `uuid text unique` | References `personnel`. |
| `status_history` | `id integer` | `uuid text unique` | References `personnel`. |
| `rank_history` | `id integer` | `uuid text unique` | References `personnel` and `ranks`. |
| `attendance` | `id integer` | `uuid text unique` | High-volume sync table. Needs conflict policy by person/date. |
| `absences` | `id integer` | `uuid text unique` | References `personnel`. |
| `temporary_arrivals` | `id integer` | `uuid text unique` | Standalone operational records. |
| `dispositions` | `id integer` | `uuid text unique` | References `personnel`. |
| `irrecoverable_losses` | `id integer` | `uuid text unique` | References `personnel`. |
| `leave_records` | `id integer` | `uuid text unique` | References `personnel`. |
| `injury_records` | `id integer` | `uuid text unique` | References `personnel`. |
| `orders` | `id integer` | `uuid text unique` | Document/order identity. |
| `order_items` | `id integer` | `uuid text unique` | References `orders` and optionally `personnel`. |
| `document_templates` | `id integer` | `uuid text unique` | Can sync later if templates become shared. |
| `generated_documents` | `id integer` | `uuid text unique` | File sync policy must be decided first. |
| `dgv_month_meta` | `id integer` | `uuid text unique` | Has composite uniqueness; still needs row identity if synced. |
| `audit_log` | `id integer` | `uuid text unique` | Also needs `record_uuid` before cross-device audit. |

## Reference Tables

These tables are mostly dictionaries and can be migrated later or mapped by natural keys:

| Table | Current PK | Natural key |
| --- | --- | --- |
| `ranks` | `id integer` | `name` / `nato_code` |
| `status_types` | `id integer` | `code` |
| `blood_types` | `id integer` | `name` |
| `contract_types` | `id integer` | `name` + `months` |
| `education_levels` | `id integer` | `name` |
| `tcc_offices` | `id integer` | `oblast` + `code` / `name` |
| `order_issuers` | `id integer` | `name` |
| `movement_order_types` | `id integer` | `name` |
| `exclusion_reasons` | `id integer` | `name` |
| `absence_reasons` | `id integer` | `name` |
| `loss_types` | `id integer` | `name` |
| `leave_types` | `id integer` | `name` |
| `leave_type_aliases` | `id integer` | `alias` |
| `settings` | `key text` | `key` |

## Foreign-Key Follow-Up

After UUID columns exist and are backfilled, add UUID reference columns in a second migration:

| Table | Current FK | Future sync FK |
| --- | --- | --- |
| `subdivisions` | `parent_id` | `parent_uuid` |
| `positions` | `subdivision_id` | `subdivision_uuid` |
| `personnel` | `rank_id`, `contract_type_id`, `blood_type_id`, `education_level_id`, `tcc_id` | Prefer natural dictionary keys or UUIDs after dictionary policy is final. |
| `movements` | `personnel_id` | `personnel_uuid` |
| `status_history` | `personnel_id` | `personnel_uuid` |
| `rank_history` | `personnel_id`, `rank_id` | `personnel_uuid`, rank natural key or `rank_uuid` |
| `attendance` | `personnel_id` | `personnel_uuid` |
| `absences` | `personnel_id` | `personnel_uuid` |
| `dispositions` | `personnel_id` | `personnel_uuid` |
| `irrecoverable_losses` | `personnel_id` | `personnel_uuid` |
| `leave_type_aliases` | `leave_type_id` | `leave_type_uuid` |
| `leave_records` | `personnel_id` | `personnel_uuid` |
| `injury_records` | `personnel_id` | `personnel_uuid` |
| `order_items` | `order_id`, `personnel_id` | `order_uuid`, `personnel_uuid` |
| `generated_documents` | `template_id` | `template_uuid` |
| `audit_log` | `record_id` | `record_uuid` |

## Migration Shape

Recommended first migration:

```sql
ALTER TABLE personnel ADD COLUMN uuid TEXT;
UPDATE personnel SET uuid = <generated uuid v7> WHERE uuid IS NULL;
CREATE UNIQUE INDEX idx_personnel_uuid ON personnel(uuid);
```

Repeat the same pattern for the other syncable tables. SQLite cannot use a non-constant expression as a default in a portable way here, so UUID generation should happen in application migration code, not raw SQL.

## Guardrails

- Back up the local SQLite database before running the first UUID migration.
- Do not migrate primary keys and foreign keys in the same release as the first UUID backfill.
- Do not start server-side writes until UUID columns exist for `personnel`, `movements`, `status_history`, `attendance`, `orders`, and `order_items`.
- Document generation can keep using local integer IDs until the API boundary moves to UUID.
- Imports must map source rows to UUIDs once imports can create records while offline.

## Next Implementation Step

The shared UUID v7 helper now exists at `@alvares/shared/ids/uuid-v7`.

Next, add a migration that backfills `personnel.uuid` only. After that is verified on a copy of a real database, expand to the rest of the syncable tables.
