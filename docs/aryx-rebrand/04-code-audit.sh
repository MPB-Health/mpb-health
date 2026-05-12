#!/usr/bin/env bash
# Code-side audit. Run BEFORE deploying Phase 0.A — any hit means application
# code reads or writes the `orgs` table directly and must be migrated to
# `organizations` (or, for the soak window, will silently read through the
# compat view and break on writes).
#
# Usage: bash docs/aryx-rebrand/04-code-audit.sh
# Returns non-zero exit if any hits found.

set -u
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EXIT=0

echo "== Direct .from('orgs') Supabase client reads"
if grep -rn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.turbo -E \
   "\.from\(['\"]orgs['\"]" apps packages 2>/dev/null; then
  EXIT=1
fi

echo
echo "== Direct .from('orgs') with WRITE methods (insert/update/delete/upsert)"
if grep -rn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.turbo -E \
   -B1 -A6 "\.from\(['\"]orgs['\"]" apps packages 2>/dev/null \
   | rg -i "insert|update|delete|upsert"; then
  EXIT=1
fi

echo
echo "== Raw SQL strings naming the orgs table"
if grep -rn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.turbo -E --glob '!*.lock*' --glob '!*.sql' \
   "(FROM|JOIN|UPDATE|INTO|REFERENCES)\s+(public\.)?orgs(\b|\s|\()" apps packages 2>/dev/null; then
  EXIT=1
fi

echo
echo "== TypeScript / Postgres type references"
if grep -rn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.turbo -E \
   "Database\[['\"]public['\"]\]\[['\"]Tables['\"]\]\[['\"]orgs['\"]" apps packages 2>/dev/null; then
  EXIT=1
fi

echo
echo "== Migration files with new FKs to orgs (should be none after Phase 0.A)"
if rg -n --glob '!archive/**' "REFERENCES\s+(public\.)?orgs\s*\(" supabase/migrations 2>/dev/null; then
  echo "  (NOTE: pre-existing migrations will match. New migrations must not add to this list.)"
fi

echo
if [ "$EXIT" -eq 0 ]; then
  echo "OK: no application-code references to 'orgs' table."
else
  echo "FAIL: code-side references to 'orgs' table found. Migrate to 'organizations' before deploy."
fi
exit $EXIT
