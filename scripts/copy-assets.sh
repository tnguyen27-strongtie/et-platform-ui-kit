#!/usr/bin/env bash
# Copies brand assets (fonts, logos) from the Blueprint repo into public/.
# Usage: scripts/copy-assets.sh [path-to-et-blueprint]
set -euo pipefail

SRC="${1:-../et-blueprint}/libs/shared/src/assets"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public"

if [ ! -d "$SRC" ]; then
  echo "Blueprint assets not found at $SRC" >&2
  exit 1
fi

mkdir -p "$DEST/fonts" "$DEST/images"

for f in Lt Roman Md Bd Hv; do
  cp "$SRC/fonts/HelveticaNeueLTStd-$f.otf" "$DEST/fonts/"
done

for f in sst-logo-noborder-color.svg sst-logo-black-orange.svg sst-logo-noborder-fff.svg; do
  cp "$SRC/images/$f" "$DEST/images/"
done

echo "Copied fonts and logos to $DEST"
