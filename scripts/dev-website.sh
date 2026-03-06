#!/bin/bash
# Start the website dev server. Uses pnpm if available, else npm.
set -e
cd "$(dirname "$0")/.."
export PATH="$HOME/Library/pnpm:$PATH"
if command -v pnpm &>/dev/null; then
  pnpm install --no-frozen-lockfile 2>/dev/null || pnpm install
  cd apps/website && pnpm exec vite
else
  cd apps/website && npx vite
fi
