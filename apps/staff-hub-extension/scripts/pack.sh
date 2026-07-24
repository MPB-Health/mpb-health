#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
mkdir -p "$DIST"
ZIP="$DIST/staff-hub-extension.zip"
rm -f "$ZIP"
(
  cd "$ROOT"
  zip -r "$ZIP" \
    manifest.json \
    background.js \
    sidepanel.html \
    sidepanel.css \
    icons \
    README.md \
    -x "*.DS_Store" "dist/*" "scripts/*"
)
echo "Wrote $ZIP"
