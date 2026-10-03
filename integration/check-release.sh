#!/usr/bin/env bash
# Integration check of a release: pack (unless a tarball is given), verify the tarball, try it in
# the PoC app, then in every real app listed in integration/apps.txt that exists on this machine.
# Usage: integration/check-release.sh [path/to/platform-ui-x.y.z.tgz]
# Exit code: 0 when nothing failed with the release (apps that were NOT CHECKED or missing are
# listed in the summary but do not fail it), 1 when something failed, 64 wrong arguments.
set -uo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root" || exit 1
if [[ $# -ge 1 ]]; then
  if [[ ! -f "$1" ]]; then
    echo "usage: integration/check-release.sh [existing tarball]" >&2
    exit 64
  fi
  tgz="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
else
  mkdir -p pack
  file="$(npm pack --pack-destination pack --silent | tail -1)" || exit 1
  tgz="$root/pack/$file"
fi
echo "release tarball: $tgz"

summary=""
any_failed=0
run() {
  local label="$1" code; shift
  # </dev/null: no step may read the rest of apps.txt from stdin.
  "$@" </dev/null
  code=$?
  case $code in
    0) summary="$summary  passed       $label"$'\n' ;;
    2) summary="$summary  NOT CHECKED  $label (does not install on its own; fix the app)"$'\n' ;;
    *) summary="$summary  FAILED       $label"$'\n'; any_failed=1 ;;
  esac
}

run "tarball contents" scripts/verify-pack.sh "$tgz"
run "PoC app" integration/check-poc.sh "$tgz"
while IFS= read -r line <&3; do
  app="${line%%#*}"
  app="${app#"${app%%[![:space:]]*}"}"   # trim leading spaces
  app="${app%"${app##*[![:space:]]}"}"   # trim trailing spaces
  [[ -z "$app" ]] && continue
  if [[ -d "$root/$app" ]]; then
    run "$app" integration/check-app.sh "$root/$app" "$tgz"
  else
    summary="$summary  missing      $app (not checked out next to the kit)"$'\n'
  fi
done 3< integration/apps.txt

echo
echo "== integration summary for $(basename "$tgz")"
printf '%s' "$summary"
exit "$any_failed"
