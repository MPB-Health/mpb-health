# Migration Archive

This directory contains all migrations applied before the 2026-01-01 baseline reset,
plus one superseded file from 2026.

## Contents

| Category | Count |
|----------|-------|
| Pre-2026 schema migrations (2025-02-17 → 2025-12-31) | 87 files |
| Superseded / malformed 2026 file | 1 file |
| **Total** | **88 files** |

## Status

**Applied to production.** Every file here has been applied to `dtmnkzllidaiqyheguhl`
(MPB Health Advisor Portal) via `supabase_migrations.schema_migrations`.

**Not replayed on `supabase db reset`.** The canonical starting point for new
environments is `../20260101000000_baseline_schema.sql`.

## The Superseded File

`20260317_create_clear_must_change_password_rpc.sql`

- Malformed timestamp (8 digits, not 14) — would confuse the Supabase CLI
- Superseded by `../20260325100000_clear_must_change_password_rpc.sql`
- Function was applied to production via `apply_migration` on 2026-03-18
- Safe to ignore permanently

## Do Not

- **Do not delete these files** — they are the production audit trail
- **Do not re-run these files** — production has already applied them
- **Do not move them back** — the baseline migration covers their schema

## Baseline Reference

The canonical schema baseline is `../20260101000000_baseline_schema.sql`.
Generated from production dump on 2026-03-18.
Covers all schema defined by the migrations in this archive directory.

## Timeline

- 2025-02-17: First migration (`create_advisor_videos`)
- 2025-10-27: 8-part security hardening cluster
- 2025-11-07: Member portal + admin system foundation
- 2025-12-31: Last pre-baseline migration
- 2026-01-01: **Baseline cutover** — new environments start here
