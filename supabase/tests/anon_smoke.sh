#!/usr/bin/env bash
#
# Anon-key smoke test for public lead intake.
#
# Verifies, against a live Supabase REST endpoint:
#   1. The submit_public_lead RPC accepts a valid anon payload and returns 200.
#   2. The same payload sent as a direct table INSERT to /rest/v1/lead_submissions
#      is rejected with 401/403/404 (anon must not have direct write access).
#
# Required env:
#   SUPABASE_URL   — e.g. http://127.0.0.1:54321 (local) or https://<ref>.supabase.co (linked)
#   SUPABASE_ANON_KEY — anon JWT for the same project
#
# Exits non-zero on any assertion failure so it can gate CI.

set -euo pipefail

: "${SUPABASE_URL:?SUPABASE_URL env var is required}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY env var is required}"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
die() { echo "anon-smoke: FAIL — $*" >&2; exit 1; }
ok()  { echo "anon-smoke: ok — $*"; }

# ---------------------------------------------------------------------------
# 1. RPC accepts a valid payload
# ---------------------------------------------------------------------------
RPC_PAYLOAD='{
  "payload": {
    "first_name": "CIAnon",
    "last_name":  "SmokeTest",
    "email":      "ci-anon-smoke@example.test",
    "phone":      "+15555550000",
    "source_page": "/",
    "source_cta":  "ci_anon_smoke",
    "form_data":   { "ci": true }
  }
}'

rpc_response=$(curl -sS -o /tmp/anon_rpc_body.json -w '%{http_code}' \
  -X POST "${SUPABASE_URL%/}/rest/v1/rpc/submit_public_lead" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d "$RPC_PAYLOAD")

if [ "$rpc_response" != "200" ] && [ "$rpc_response" != "201" ]; then
  echo "--- response body ---" >&2
  cat /tmp/anon_rpc_body.json >&2 || true
  echo >&2
  die "expected 200/201 from submit_public_lead, got $rpc_response"
fi

# Body should contain a UUID id field
if ! grep -qE '"id"\s*:\s*"[0-9a-f]{8}-[0-9a-f]{4}-' /tmp/anon_rpc_body.json; then
  echo "--- response body ---" >&2
  cat /tmp/anon_rpc_body.json >&2
  echo >&2
  die "submit_public_lead returned $rpc_response but no UUID id in body"
fi
ok "submit_public_lead 200 with id"

# ---------------------------------------------------------------------------
# 2. Direct table INSERT must be denied
# ---------------------------------------------------------------------------
DIRECT_PAYLOAD='{
  "first_name": "CIAnon",
  "last_name":  "SmokeTestDirect",
  "email":      "ci-anon-smoke-direct@example.test",
  "phone":      "+15555550001"
}'

direct_response=$(curl -sS -o /tmp/anon_direct_body.json -w '%{http_code}' \
  -X POST "${SUPABASE_URL%/}/rest/v1/lead_submissions" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d "$DIRECT_PAYLOAD")

case "$direct_response" in
  401|403|404)
    ok "direct anon INSERT denied ($direct_response)"
    ;;
  2*)
    echo "--- response body ---" >&2
    cat /tmp/anon_direct_body.json >&2
    echo >&2
    die "direct anon INSERT into lead_submissions succeeded ($direct_response). Anon must not have direct write access."
    ;;
  *)
    echo "--- response body ---" >&2
    cat /tmp/anon_direct_body.json >&2
    echo >&2
    die "direct anon INSERT returned unexpected status $direct_response"
    ;;
esac

# ---------------------------------------------------------------------------
# 3. Anon must not read CRM reporting views or org-reconcile backups.
#    These were SECURITY DEFINER / RLS-off leaks on the live project.
# ---------------------------------------------------------------------------
assert_anon_denied_or_empty() {
  local path="$1"
  local code
  code=$(curl -sS -o /tmp/anon_read_body.json -w '%{http_code}' \
    -X GET "${SUPABASE_URL%/}/rest/v1/${path}?select=*&limit=1" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

  case "$code" in
    401|403|404)
      ok "anon GET ${path} denied ($code)"
      ;;
    200|206)
      if grep -qE '^\[\]$' /tmp/anon_read_body.json; then
        ok "anon GET ${path} empty ($code)"
      else
        echo "--- response body ---" >&2
        cat /tmp/anon_read_body.json >&2
        echo >&2
        die "anon GET ${path} returned rows ($code). Must not leak via PostgREST."
      fi
      ;;
    *)
      echo "--- response body ---" >&2
      cat /tmp/anon_read_body.json >&2 || true
      echo >&2
      die "anon GET ${path} returned unexpected status $code"
      ;;
  esac
}

assert_anon_denied_or_empty "crm_v_pipeline_movement"
assert_anon_denied_or_empty "crm_v_application_dropoff"
assert_anon_denied_or_empty "crm_v_conversion_by_source"
assert_anon_denied_or_empty "_backup_org_reconcile_20260701_lead_submissions"
assert_anon_denied_or_empty "_backup_org_reconcile_20260701_advisor_profiles"

echo "anon-smoke: all assertions passed."
