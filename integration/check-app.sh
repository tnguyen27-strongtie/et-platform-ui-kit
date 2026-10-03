#!/usr/bin/env bash
# Tries a release tarball in a copy of a real app: install, then the app's own typecheck, lint,
# unit tests and build. The app's folder is never changed; the copy is deleted afterwards.
#   KEEP=1      keeps the copy and prints its path, for debugging.
#   BASELINE=1  first runs the same scripts with the kit version the app already uses, to tell
#               failures the release causes from ones the app already had.
# Usage: integration/check-app.sh path/to/app path/to/platform-ui-x.y.z.tgz
# Exit code: 0 passed, 1 failed with the release, 2 not checked (the app does not install even
# without the release: fix the app), 64 wrong arguments. Works with macOS's bash 3.2.
set -uo pipefail

if [[ $# -ne 2 || ! -d "$1" || ! -f "$2" ]]; then
  echo "usage: integration/check-app.sh <existing app dir> <existing tarball>" >&2
  exit 64
fi
app="$(cd "$1" && pwd)"
tgz="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
name="$(basename "$(dirname "$app")")/$(basename "$app")"
work="$(mktemp -d)"
if [[ "${KEEP:-}" == 1 ]]; then
  echo "keeping the copy in $work"
else
  trap 'rm -rf "$work"' EXIT
fi

echo "== copy $app"
rsync -a --exclude node_modules --exclude dist --exclude .git --exclude test-results --exclude playwright-report "$app/" "$work/app/" || exit 1
cd "$work/app" || exit 1

failures=""
step() {
  local label="$1"; shift
  echo; echo "== $label"
  if "$@"; then echo "-- ok: $label"; else echo "-- FAILED: $label"; failures="$failures; $label"; fi
}

run_scripts() {
  local label="$1" script
  for script in typecheck lint test build; do
    if node -e "process.exit(require('./package.json').scripts?.[process.argv[1]] ? 0 : 1)" "$script"; then
      step "$label npm run $script" npm run "$script"
    else
      echo; echo "== npm run $script: no such script, skipped"
    fi
  done
}

before="$(node -p "require('./package.json').dependencies?.['@platform/ui'] ?? 'not a dependency'")"
echo "app depends on @platform/ui: $before"
step "install the app as it is" bash -c 'if [[ -f package-lock.json ]]; then npm ci --no-audit --no-fund; else npm install --no-audit --no-fund; fi'
if [[ -n "$failures" ]]; then
  echo
  echo "$name: NOT CHECKED - the app does not install with its current kit version either (see the npm error above)"
  exit 2
fi

baseline_failures=""
if [[ "${BASELINE:-}" == 1 ]]; then
  run_scripts "baseline ($before):"
  baseline_failures="$failures"
  failures=""
fi
step "install the release" npm install --no-audit --no-fund "$tgz"
run_scripts "release:"
if [[ -n "$baseline_failures" ]]; then
  echo; echo "already failing before the release: ${baseline_failures#; }"
fi

echo
if [[ -n "$failures" ]]; then
  echo "$name: FAILED (${failures#; })"
  exit 1
fi
echo "$name: passed"
