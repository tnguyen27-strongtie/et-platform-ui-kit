#!/usr/bin/env node
// Lists the runtime exports of the installed @platform/ui that the PoC never imports, so the PoC
// keeps up with the kit: a new export that no app-like code imports is untested integration.
// Reads the installed package (what apps get), not the kit's source.
// Usage: node scripts/coverage.mjs   (exit 1 when a non-ignored export is not imported)
//
// "Used" means "imported from '@platform/ui' somewhere in src/". That is enough only because
// tsconfig.json has noUnusedLocals: an import that is never used fails the typecheck. Keep it on.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

// Exports an app does not normally call. Keep a reason for each; everything else must be imported.
const IGNORED = {
  // Theme-builder internals: the kit's own theme builder uses them; apps use a theme file.
  defineAppearance: 'theme builder', resolveAppearance: 'theme builder', appearanceCssVars: 'theme builder',
  colorCssVars: 'theme builder', resolveColors: 'theme builder', adaptBrandForDark: 'theme builder',
  contrast: 'theme builder', mix: 'theme builder', readableOn: 'theme builder', contrastRatio: 'theme builder',
  isValidColor: 'theme builder', normalizeThemeConfig: 'theme builder', parseRgb: 'theme builder',
  themeConfigToTs: 'theme builder', THEME_CONFIG_VERSION: 'theme builder', COLOR_ROLES: 'theme builder',
  APPEARANCES: 'theme builder', classicAppearance: 'theme builder', glassAppearance: 'theme builder',
  createPlatformTheme: 'custom setups without the provider',
  // Token values apps must not use directly: fixed values that ignore the appearance and dark mode
  // (apps use colors, shape, elevation and material instead; ESLint in the kit bans radius/shadows).
  scales: 'raw palette', radius: 'raw sizes, use shape', shadows: 'raw values, use elevation',
  darkTrueGray: 'raw palette', defaultColors: 'default values', defaultDarkColors: 'default values',
  defaultShape: 'default values', defaultMaterial: 'default values', defaultDarkMaterial: 'default values',
  defaultDarkShadows: 'default values',
  // CSS variable-name helpers for theme tooling; apps read the values through colors/shape/elevation/material.
  colorVar: 'variable names', shapeVar: 'variable names', shadowVar: 'variable names',
  elevationVar: 'variable names', materialVar: 'variable names',
  tokens: 'the same values grouped in one object (for scripts and charts via @platform/ui/tokens)',
};

// Every runtime export, from the package itself (types do not exist at runtime and are skipped).
const names = Object.keys(await import('@platform/ui')).filter((n) => n !== 'default');

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sources(join(dir, e.name)) : /\.tsx?$/.test(e.name) ? [readFileSync(join(dir, e.name), 'utf8')] : [],
  );
}

// Names in `import { … } from '@platform/ui'` (single or double quotes), anywhere in src/.
const imported = new Set();
for (const [, list] of sources(join(root, 'src')).join('\n').matchAll(/import\s*{([^}]*)}\s*from\s*['"]@platform\/ui['"]/g)) {
  for (const raw of list.split(',')) {
    const item = raw.trim().replace(/^type\s+/, '');
    if (item) imported.add(item.split(/\s+as\s+/)[0].trim());
  }
}

const stale = Object.keys(IGNORED).filter((n) => !names.includes(n));
const unused = names.filter((n) => !(n in IGNORED) && !imported.has(n)).sort();
const ignored = names.filter((n) => n in IGNORED).length;
console.log(`@platform/ui runtime exports: ${names.length}; imported by the PoC: ${names.length - unused.length - ignored}; ignored: ${ignored}`);
if (stale.length) console.log(`IGNORED names the package no longer exports (remove them): ${stale.join(', ')}`);
if (unused.length) {
  console.log(`not imported by the PoC (add them to a screen, or to IGNORED with a reason):\n  ${unused.join('\n  ')}`);
  process.exit(1);
}
