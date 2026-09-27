#!/usr/bin/env bash
# Copies brand logos from the Blueprint repo into public/images/.
# Fonts are no longer copied: the kit ships Inter (open source) through @fontsource-variable/inter.
# Usage: scripts/copy-assets.sh [path-to-et-blueprint]
set -euo pipefail

SRC="${1:-../et-blueprint}/libs/shared/src/assets"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public"

if [ ! -d "$SRC" ]; then
  echo "Blueprint assets not found at $SRC" >&2
  exit 1
fi

mkdir -p "$DEST/images"

for f in sst-logo-noborder-color.svg sst-logo-black-orange.svg sst-logo-noborder-fff.svg; do
  cp "$SRC/images/$f" "$DEST/images/"
done

echo "Copied logos to $DEST/images"
