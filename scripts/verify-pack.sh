#!/usr/bin/env bash
# Checks a packed tarball before apps install it: required files present, nothing that
# belongs to the repo only (showcase, tests, public assets, font files) shipped.
# Usage: scripts/verify-pack.sh path/to/platform-ui-x.y.z.tgz
set -euo pipefail

tgz="${1:?usage: scripts/verify-pack.sh <tarball>}"
files="$(tar -tzf "$tgz" | sed 's|^package/||' | sort)"
status=0

required=(
  package.json README.md CHANGELOG.md CONTRIBUTING.md
  docs/getting-started.md docs/components.md docs/design-tokens.md
  dist/index.js dist/index.d.ts
  dist/theme/theme.css dist/theme/fonts.css dist/theme/tokens.generated.css
  dist/tokens/tokens.js dist/tokens/tokens.d.ts
)
for file in "${required[@]}"; do
  if ! grep -qxF "$file" <<<"$files"; then
    echo "missing: $file"
    status=1
  fi
done

# Fonts come from @fontsource packages at the app's build time, never from the tarball.
forbidden="$(grep -E '(^|/)(showcase|tests|public)/|\.(woff2?|ttf|otf)$' <<<"$files" || true)"
if [[ -n "$forbidden" ]]; then
  echo "must not be packed:"
  sed 's/^/  /' <<<"$forbidden"
  status=1
fi

# Packed CSS is inlined into the app's CSS, where url() resolves from the app, not the kit: a bare
# specifier (url('@fontsource/…')) stays unresolved and 404s. Font files come in through @import.
css_files=()
while IFS= read -r file; do css_files+=("package/$file"); done < <(grep -E '^dist/.*\.css$' <<<"$files")
bare_urls="$(tar -xzOf "$tgz" "${css_files[@]}" | grep -oE "url\\(['\"]?[^'\")./#][^'\")]*" | grep -vE "url\\(['\"]?(data:|https?:)" || true)"
if [[ -n "$bare_urls" ]]; then
  echo "bare url() in packed CSS (use @import of the package CSS instead):"
  sed 's/^/  /' <<<"$bare_urls"
  status=1
fi

name="$(tar -xzOf "$tgz" package/package.json | node -e 'const p = JSON.parse(require("fs").readFileSync(0, "utf8")); console.log(`${p.name}@${p.version}`)')"
if [[ $status -eq 0 ]]; then
  echo "ok: $name, $(wc -l <<<"$files" | tr -d ' ') files"
fi
exit $status
