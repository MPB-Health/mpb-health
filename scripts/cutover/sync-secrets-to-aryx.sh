#!/usr/bin/env bash
# ============================================================================
# Install provider OAuth/webhook secrets on the ARYX Supabase project from
# .env.cutover. Idempotent — safe to re-run.
#
# Reads from `.env.cutover` (git-ignored), writes via `supabase secrets set`.
# Each secret is set independently so a failure on one doesn't abort the rest.
#
# Usage:
#   bash scripts/cutover/sync-secrets-to-aryx.sh         # report only (dry run)
#   bash scripts/cutover/sync-secrets-to-aryx.sh --apply # install secrets
# ============================================================================
set -euo pipefail

ARYX_REF=knelbprqqbjggqfqvfmc
ENV_FILE=".env.cutover"
APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

if [[ ! -f "$ENV_FILE" ]]; then
  echo "✗ $ENV_FILE not found. Copy from .env.cutover.template and fill values."
  exit 1
fi

# Source the env file so we can refer to vars
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Map of "var name in .env.cutover" → "secret name on ARYX"
# (Empty 'aryx_name' means the same name. Most are 1:1 except Graph
# variables which legacy/edge-fn used MS_OAUTH_* names.)
SECRETS=(
  # Mail OAuth
  "MS_GRAPH_CLIENT_ID:MS_OAUTH_CLIENT_ID"
  "MS_GRAPH_CLIENT_SECRET:MS_OAUTH_CLIENT_SECRET"
  "MS_GRAPH_TENANT_ID:MS_GRAPH_TENANT_ID"
  "MS_OAUTH_REDIRECT_URI:MS_OAUTH_REDIRECT_URI"
  "MS_WEBHOOK_SECRET:MS_WEBHOOK_SECRET"
  "GOOGLE_OAUTH_CLIENT_ID:GOOGLE_OAUTH_CLIENT_ID"
  "GOOGLE_OAUTH_CLIENT_SECRET:GOOGLE_OAUTH_CLIENT_SECRET"
  "GOOGLE_OAUTH_REDIRECT_URI:GOOGLE_OAUTH_REDIRECT_URI"
  "GMAIL_PUBSUB_TOPIC:GMAIL_PUBSUB_TOPIC"
  "GOTO_CONNECT_API_KEY:GOTO_CONNECT_API_KEY"
  "MAIL_TOKEN_ENCRYPTION_KEY:MAIL_TOKEN_ENCRYPTION_KEY"
  "CRM_CALENDLY_WEBHOOK_SIGNING_KEY:CRM_CALENDLY_WEBHOOK_SIGNING_KEY"
)

echo "== Provider secrets sync → ARYX ($ARYX_REF) =="
echo "Mode: $([[ $APPLY == 1 ]] && echo APPLY || echo DRY-RUN)"
echo

set_count=0
skip_count=0
fail_count=0

for pair in "${SECRETS[@]}"; do
  src="${pair%%:*}"
  dest="${pair#*:}"
  val="${!src:-}"
  if [[ -z "$val" ]]; then
    printf "  · %-32s — not set in %s, skipping\n" "$dest" "$ENV_FILE"
    skip_count=$((skip_count+1))
    continue
  fi

  # Mask everything but length + last 4 chars
  masked="…(${#val} chars, ends '${val: -4}')"

  if [[ $APPLY == 1 ]]; then
    if supabase secrets set "$dest=$val" --project-ref "$ARYX_REF" >/dev/null 2>&1; then
      printf "  ✓ %-32s installed %s\n" "$dest" "$masked"
      set_count=$((set_count+1))
    else
      printf "  ✗ %-32s FAILED  %s\n" "$dest" "$masked"
      fail_count=$((fail_count+1))
    fi
  else
    printf "  ↺ %-32s would install %s\n" "$dest" "$masked"
    set_count=$((set_count+1))
  fi
done

echo
echo "== Summary =="
echo "  set:     $set_count"
echo "  skipped: $skip_count"
[[ $fail_count -gt 0 ]] && echo "  FAILED:  $fail_count"
[[ $APPLY == 0 ]] && echo
[[ $APPLY == 0 ]] && echo "Run with --apply to install."
exit $fail_count
