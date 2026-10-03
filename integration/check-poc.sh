#!/usr/bin/env bash
# Installs a release tarball into the PoC app the way an app does, then checks that the app still
# type-checks, builds, loads the kit's fonts, uses every export and passes its user journeys.
# Usage: integration/check-poc.sh path/to/platform-ui-x.y.z.tgz [playwright args, e.g. --project desktop]
# Exit code: 0 passed, 1 a step failed, 64 wrong arguments. Works with macOS's bash 3.2.
# Needs Playwright browsers once: cd integration/poc-app && npx playwright install chromium webkit
set -uo pipefail

if [[ $# -lt 1 || ! -f "$1" ]]; then
  echo "usage: integration/check-poc.sh <existing tarball> [playwright args]" >&2
  exit 64
fi
tgz="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
shift
expected="$(tar -xOzf "$tgz" package/package.json | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version")" || {
  echo "cannot read package/package.json from $tgz" >&2
  exit 64
}
cd "$(dirname "$0")/poc-app" || exit 1

failures=""
step() {
  local name="$1"; shift
  echo; echo "== $name"
  if "$@"; then echo "-- ok: $name"; else echo "-- FAILED: $name"; failures="$failures; $name"; fi
}

mkdir -p vendor
# Stop here if the copy fails: an old vendor/platform-ui.tgz would be tested instead.
cp "$tgz" vendor/platform-ui.tgz || exit 1
# A clean install every time: peers resolve to the newest versions the kit's ranges allow, like a new app.
rm -rf node_modules package-lock.json
step "install" npm install --no-audit --no-fund
step "installed version is $expected" node -e "const v = require('./node_modules/@platform/ui/package.json').version; console.log('@platform/ui@' + v); process.exit(v === process.argv[1] ? 0 : 1)" "$expected"
step "peer dependencies" npm ls --depth=0
step "typecheck (strict, library types included)" npx tsc -p tsconfig.json
step "export coverage" node scripts/coverage.mjs
step "build" npx vite build
# Fonts come from the kit's @fontsource dependencies at the app's build time (docs/getting-started.md).
step "fonts in the build" bash -c 'ls dist/assets | grep -q "^inter-.*\.woff2$" && ls dist/assets | grep -q "^stix-two-math-.*\.woff2$"'
step "user journeys (Playwright)" npx playwright test "$@"

echo
if [[ -n "$failures" ]]; then
  echo "PoC: FAILED (${failures#; })"
  exit 1
fi
echo "PoC: passed ($expected)"
