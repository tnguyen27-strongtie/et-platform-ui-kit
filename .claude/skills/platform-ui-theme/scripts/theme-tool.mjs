#!/usr/bin/env node
/**
 * Checks a theme draft (JSON) against the installed @platform/ui kit and writes the theme files.
 *
 *   node theme-tool.mjs <draft.json>                        check only (exit 1 on errors)
 *   node theme-tool.mjs <draft.json> --write src/theme.config.ts [--json public/theme.json] [--css preview.css]
 *   node theme-tool.mjs --list                              print roles, defaults and built-in appearances
 *
 * Options: --strict (contrast failures are errors), --force (overwrite existing files).
 *
 * Draft format:
 *   {
 *     "name": "Acme Calculator",
 *     "colors": { "brand": "#0a66c2" },                 // any color role; hex, rgb(), hsl()
 *     "density": "standard",                            // or "expanded"
 *     "appearance": "glass"                             // a built-in name, or:
 *     "appearance": { "name": "acme-glass", "base": "glass", "label": "Acme Glass", "description": "…",
 *                     "colors": {…}, "shape": {…}, "shadows": {…}, "material": {…},
 *                     "fontFamily": "…", "workspaceGap": "0.5rem", "reducedTransparency": {…} }
 *   }
 *
 * No dependencies: it loads the kit's React-free modules (tokens, appearance, themeConfig) from
 * node_modules/@platform/ui/dist, or from src/ when run inside the kit repository.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// ---------- Arguments ----------
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const draftPath = args.find((a, i) => !a.startsWith('--') && !['--write', '--json', '--css'].includes(args[i - 1]));

// ---------- Load the kit ----------
function findKit() {
  let dir = process.cwd();
  for (;;) {
    const dist = join(dir, 'node_modules/@platform/ui/dist');
    if (existsSync(join(dist, 'tokens/tokens.js'))) {
      return { where: dist, tokens: join(dist, 'tokens/tokens.js'), appearance: join(dist, 'theme/appearance.js'), config: join(dist, 'theme/themeConfig.js') };
    }
    const src = join(dir, 'src');
    if (existsSync(join(src, 'tokens/tokens.ts')) && existsSync(join(src, 'theme/themeConfig.ts'))) {
      return { where: src, tokens: join(src, 'tokens/tokens.ts'), appearance: join(src, 'theme/appearance.ts'), config: join(src, 'theme/themeConfig.ts') };
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const kitPaths = findKit();
if (!kitPaths) fail('Could not find @platform/ui (node_modules/@platform/ui/dist or the kit\'s src/). Run from the app or kit directory.');
if (!existsSync(kitPaths.appearance)) {
  fail(`This @platform/ui version has no appearances (${kitPaths.appearance} is missing). Upgrade the kit, or make a colors-only theme with the Theme builder.`);
}
const load = (p) => import(pathToFileURL(p).href);
const [tokens, appearanceModule, configModule] = await Promise.all([load(kitPaths.tokens), load(kitPaths.appearance), load(kitPaths.config)]);
const { defaultColors, defaultShape, shadows: defaultShadows, defaultMaterial } = tokens;
const { APPEARANCES, APPEARANCE_NAMES } = appearanceModule;
const { isValidColor, contrastRatio, parseRgb } = configModule;

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

// ---------- --list ----------
if (flag('--list')) {
  const table = (title, obj) => {
    console.log(`\n${title}`);
    for (const [k, v] of Object.entries(obj)) console.log(`  ${k.padEnd(20)} ${v}`);
  };
  console.log(`Kit: ${kitPaths.where}`);
  table('Color roles (defaults)', defaultColors);
  table('shape (radius by role)', defaultShape);
  table('shadows', defaultShadows);
  table('material', defaultMaterial);
  console.log(`\nBuilt-in appearances: ${APPEARANCE_NAMES.join(', ')}`);
  for (const name of APPEARANCE_NAMES) console.log(`\n--- ${name} ---\n${JSON.stringify(APPEARANCES[name], null, 2)}`);
  process.exit(0);
}

if (!draftPath) fail('Usage: node theme-tool.mjs <draft.json> [--write src/theme.config.ts] [--json theme.json] [--css preview.css] [--strict] [--force] | --list');

let draft;
try {
  draft = JSON.parse(readFileSync(draftPath, 'utf8'));
} catch (e) {
  fail(`Cannot read ${draftPath}: ${e.message}`);
}

// ---------- Validation ----------
const errors = [];
const warnings = [];
const notes = [];

const TOP_KEYS = ['$comment', 'name', 'colors', 'density', 'appearance'];
const APPEARANCE_KEYS = ['name', 'base', 'label', 'description', 'colors', 'shape', 'shadows', 'material', 'fontFamily', 'workspaceGap', 'reducedTransparency'];
const LENGTH = /^(0|-?\d*\.?\d+(px|rem|em|%)|(calc|min|max|clamp|var)\(.+\))$/;
const BUNDLED_OR_SYSTEM = /^(['"]?(Inter Variable|Inter|system-ui|-apple-system|BlinkMacSystemFont|Segoe UI Variable|Segoe UI|SF Pro Text|SF Pro Display|Roboto|Helvetica Neue|Arial|sans-serif|serif|monospace|ui-sans-serif|ui-monospace|ui-rounded)['"]?)$/i;

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

for (const key of Object.keys(draft)) if (!TOP_KEYS.includes(key)) errors.push(`Unknown key "${key}".`);
if (draft.name !== undefined && (typeof draft.name !== 'string' || !draft.name.trim())) errors.push('"name" must be a non-empty string.');
if (draft.density !== undefined && !['standard', 'expanded'].includes(draft.density)) errors.push('"density" must be "standard" or "expanded".');

function checkColors(colors, where) {
  if (colors === undefined) return;
  if (!isObject(colors)) return errors.push(`${where} must be an object of role → color.`);
  for (const [role, value] of Object.entries(colors)) {
    if (!(role in defaultColors)) errors.push(`${where}.${role}: unknown color role (see --list).`);
    else if (!isValidColor(value)) errors.push(`${where}.${role}: "${value}" is not a color (use #rrggbb, rgb() or hsl(); no names, no var()).`);
  }
}

function checkRoleMap(map, defaults, where, check) {
  if (map === undefined) return;
  if (!isObject(map)) return errors.push(`${where} must be an object.`);
  for (const [role, value] of Object.entries(map)) {
    if (!(role in defaults)) errors.push(`${where}.${role}: unknown role. Known: ${Object.keys(defaults).join(', ')}.`);
    else if (typeof value !== 'string' || !value.trim()) errors.push(`${where}.${role}: must be a non-empty CSS string.`);
    else check?.(role, value.trim());
  }
}

checkColors(draft.colors, 'colors');

/** Appearance object fully merged over its base, like defineAppearance(). */
let appearance;
if (draft.appearance === undefined) {
  appearance = APPEARANCES.classic;
} else if (typeof draft.appearance === 'string') {
  if (!APPEARANCE_NAMES.includes(draft.appearance)) errors.push(`"appearance": "${draft.appearance}" is not built in (${APPEARANCE_NAMES.join(', ')}). Use an object for a custom one.`);
  appearance = APPEARANCES[draft.appearance] ?? APPEARANCES.classic;
} else if (isObject(draft.appearance)) {
  const a = draft.appearance;
  for (const key of Object.keys(a)) if (!APPEARANCE_KEYS.includes(key)) errors.push(`appearance.${key}: unknown key. Known: ${APPEARANCE_KEYS.join(', ')}.`);
  if (typeof a.name !== 'string' || !/^[a-z][a-z0-9-]*$/.test(a.name)) errors.push('appearance.name must be lowercase kebab-case, e.g. "acme-glass" (it becomes <body data-appearance>).');
  else if (APPEARANCE_NAMES.includes(a.name)) errors.push(`appearance.name "${a.name}" is a built-in name; pick your own.`);
  const base = a.base ?? 'classic';
  if (!APPEARANCE_NAMES.includes(base)) errors.push(`appearance.base "${base}" must be one of ${APPEARANCE_NAMES.join(', ')}.`);
  checkColors(a.colors, 'appearance.colors');
  checkRoleMap(a.shape, defaultShape, 'appearance.shape', (role, v) => {
    if (!LENGTH.test(v)) errors.push(`appearance.shape.${role}: "${v}" is not a CSS length (0, 12px, 0.75rem, 9999px…).`);
  });
  checkRoleMap(a.shadows, defaultShadows, 'appearance.shadows', (role, v) => {
    if (v !== 'none' && !/\d/.test(v)) errors.push(`appearance.shadows.${role}: "${v}" does not look like a box-shadow.`);
  });
  checkRoleMap(a.material, defaultMaterial, 'appearance.material', (role, v) => {
    if ((role === 'filter' || role === 'scrimFilter') && v !== 'none' && !/^([a-z-]+\([^)]*\)\s*)+$/.test(v)) {
      errors.push(`appearance.material.${role}: "${v}" is not a backdrop-filter (e.g. "blur(20px) saturate(160%)" or "none").`);
    }
  });
  checkRoleMap(a.reducedTransparency, defaultMaterial, 'appearance.reducedTransparency');
  if (a.workspaceGap !== undefined && !LENGTH.test(String(a.workspaceGap))) errors.push(`appearance.workspaceGap: "${a.workspaceGap}" is not a CSS length.`);
  if (a.fontFamily !== undefined) {
    if (typeof a.fontFamily !== 'string' || !a.fontFamily.trim()) errors.push('appearance.fontFamily must be a font stack string.');
    else {
      const first = a.fontFamily.split(',')[0].trim();
      if (!BUNDLED_OR_SYSTEM.test(first)) {
        warnings.push(`appearance.fontFamily starts with ${first}: the kit bundles only Inter. The app must load that font itself (e.g. an @fontsource package imported in main.tsx), or it falls back to the next family.`);
      }
    }
  }
  const baseAppearance = APPEARANCES[base] ?? APPEARANCES.classic;
  appearance = { ...baseAppearance, ...a };
  delete appearance.base;
  for (const part of ['colors', 'shape', 'shadows', 'material', 'reducedTransparency']) {
    const merged = { ...baseAppearance[part], ...a[part] };
    if (Object.keys(merged).length) appearance[part] = merged;
  }
} else {
  errors.push('"appearance" must be a built-in name or an object.');
  appearance = APPEARANCES.classic;
}

// ---------- Resolve colors (same order as the kit: defaults, appearance, derived from brand, app) ----------
const mix = (color, target, amount) => {
  const rgb = parseRgb(color);
  if (!rgb) return color;
  const out = rgb.map((c) => Math.round(target === 'white' ? c + (255 - c) * amount : c * (1 - amount)));
  return `#${out.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
};
const shades = (brand) =>
  brand && isValidColor(brand)
    ? {
        brandHover: mix(brand, 'white', 0.15),
        brandActive: mix(brand, 'black', 0.25),
        brandDark: mix(brand, 'black', 0.4),
        brandSubtle: mix(brand, 'white', 0.93),
        brandSelected: mix(brand, 'white', 0.8),
        focusRing: mix(brand, 'white', 0.5),
        accent: brand,
        selection: brand,
      }
    : {};
const appColors = isObject(draft.colors) ? draft.colors : {};
const baseColors = appearance.colors ?? {};
const resolved = { ...defaultColors, ...shades(baseColors.brand), ...baseColors, ...shades(appColors.brand), ...appColors };
const origin = (role) => (role in appColors ? 'theme' : role in baseColors ? 'appearance' : appColors.brand && role in shades(appColors.brand) ? 'derived' : 'default');

// ---------- Contrast (same pairs as the showcase Theme builder) ----------
const pairs = [
  ['Primary button text', 'textOnBrand', 'brand', 4.5],
  ['Body text', 'text', 'surface', 4.5],
  ['Muted text', 'textMuted', 'surface', 4.5],
  ['Muted text on app background', 'textMuted', 'surfaceApp', 4.5],
  ['Links', 'link', 'surface', 4.5],
  ['Error messages', 'danger', 'surface', 4.5],
  ['Danger button text', '#ffffff', 'danger', 4.5],
  ['Warning alert text', 'warningText', 'surface', 4.5],
  ['Selected option', 'text', 'brandSelected', 4.5],
  ['Focus ring, checked controls', 'brand', 'surface', 3],
  ['Input border', 'borderInput', 'surface', 3],
];
const contrast = pairs.map(([label, fg, bg, min]) => {
  const f = fg in resolved ? resolved[fg] : fg;
  const b = bg in resolved ? resolved[bg] : bg;
  const ratio = contrastRatio(f, b);
  const origins = [fg, bg].filter((r) => r in resolved).map(origin);
  // Who set the failing colors: this theme (or its brand), the appearance preset, or the kit.
  const source = origins.some((o) => o === 'theme' || o === 'derived') ? 'theme' : origins.includes('appearance') ? 'appearance' : 'kit';
  return { label, fg, bg, min, ratio, pass: ratio !== null && ratio >= min, source };
});
const sourceNote = { theme: ' Set by this theme: fix it here.', appearance: ' Comes from the appearance colors: override the role in appearance.colors or colors.', kit: ' Kit default, not introduced by this theme.' };
for (const c of contrast) {
  if (c.pass || c.ratio === null) continue;
  const msg = `Contrast "${c.label}" (${c.fg} on ${c.bg}) is ${c.ratio}:1, needs ${c.min}:1.${sourceNote[c.source]}`;
  if (flag('--strict') && c.source !== 'kit') errors.push(msg);
  else warnings.push(msg);
}

// ---------- Style sanity ----------
const material = { ...defaultMaterial, ...appearance.material };
const translucent = (v) => /transparent|rgba\([^)]*,\s*0?\.\d+\s*\)|\/\s*0?\.\d+|hsla\(/.test(v);
const blurs = material.filter !== 'none';
const see = ['panel', 'overlay', 'nav', 'control', 'header'].filter((r) => translucent(material[r]));
if (blurs && !see.length) warnings.push('material.filter blurs, but no panel/overlay/nav/control background is translucent: the blur is invisible and costs performance.');
if (see.length && !blurs) notes.push(`Translucent ${see.join(', ')} without a backdrop blur: content behind shows through sharply. Intended?`);
const missingReduced = see.filter((r) => !appearance.reducedTransparency?.[r]);
if (missingReduced.length) warnings.push(`No reducedTransparency value for translucent ${missingReduced.join(', ')}: users who ask the system for less transparency still get see-through surfaces. Add solid values (e.g. "var(--color-surface)").`);
if (blurs && !appearance.reducedTransparency?.filter) warnings.push('Add reducedTransparency.filter: "none".');
const lum = (c) => {
  const rgb = parseRgb(c);
  return rgb ? (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 : 1;
};
if (lum(resolved.surface) < 0.4 || lum(resolved.surfaceApp) < 0.4) {
  warnings.push('Dark surfaces: the kit has no dark mode yet; some component styles use fixed black or white (default button text, tooltip text, switch thumb). Expect spots that do not adapt; a dark theme needs kit changes (platform-ui-component).');
}
/** Splits a CSS list on top-level commas (not the ones inside gradient()/color-mix()). */
const topLevelLayers = (value) => {
  const layers = [''];
  let depth = 0;
  for (const ch of value) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) layers.push('');
    else layers[layers.length - 1] += ch;
  }
  return layers.map((l) => l.trim());
};
const appLayers = topLevelLayers(material.app);
if (/gradient\(/.test(material.app) && /gradient\(/.test(appLayers.at(-1))) {
  notes.push('material.app has no solid color layer at the end; add var(--color-surface-app) as the last layer so the page never shows the browser default.');
}

if (option('--json') && isObject(draft.appearance)) {
  errors.push('--json: theme.json files accept built-in appearance names only. Use --write for a custom appearance (nothing was written).');
}

// ---------- Report ----------
console.log(`Kit: ${kitPaths.where}`);
console.log(`Theme: ${draft.name ?? '(no name)'} · appearance: ${appearance.name}${isObject(draft.appearance) ? ` (custom, base ${draft.appearance.base ?? 'classic'})` : ''} · density: ${draft.density ?? 'standard'}`);
console.log('\nContrast (WCAG 2.1 AA)');
for (const c of contrast) {
  const mark = c.ratio === null ? '·' : c.pass ? '✓' : '✗';
  console.log(`  ${mark} ${c.label.padEnd(30)} ${c.ratio === null ? 'n/a (not a plain color)' : `${c.ratio.toFixed(2)}:1`.padEnd(8)} needs ${c.min}:1`);
}
for (const n of notes) console.log(`\nℹ ${n}`);
for (const w of warnings) console.log(`\n⚠ ${w}`);
for (const e of errors) console.log(`\n✖ ${e}`);
if (errors.length) {
  console.log(`\n${errors.length} error(s): nothing written.`);
  process.exit(1);
}
console.log('\nDraft is valid.');

// ---------- Writers ----------
function writeOut(path, text) {
  const target = resolve(path);
  if (existsSync(target) && !flag('--force')) fail(`${path} exists. Read it, then rerun with --force to replace it.`);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, text);
  console.log(`Wrote ${path}`);
}

const ts = (value, indent = 0) => {
  const pad = ' '.repeat(indent);
  if (isObject(value)) {
    const entries = Object.entries(value).map(([k, v]) => `${pad}  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${ts(v, indent + 2)},`);
    return entries.length ? `{\n${entries.join('\n')}\n${pad}}` : '{}';
  }
  return typeof value === 'string' ? `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'` : JSON.stringify(value);
};
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

const themeFields = {};
themeFields.version = 1;
if (draft.name) themeFields.name = draft.name.trim();
if (Object.keys(appColors).length) themeFields.colors = appColors;
if (draft.density && draft.density !== 'standard') themeFields.density = draft.density;

const writePath = option('--write');
if (writePath) {
  let head = "import { definePlatformTheme } from '@platform/ui';\n\n";
  let appearanceRef;
  if (isObject(draft.appearance)) {
    const { base = 'classic', ...own } = draft.appearance;
    const constName = camel(own.name);
    head = "import { defineAppearance, definePlatformTheme } from '@platform/ui';\n\n";
    head += `/** ${own.description ?? `${own.label ?? own.name} appearance`} */\nexport const ${constName} = defineAppearance(${ts(own)}, '${base}');\n\n`;
    appearanceRef = constName;
  } else if (draft.appearance && draft.appearance !== 'classic') {
    appearanceRef = `'${draft.appearance}'`;
  }
  let body = ts(themeFields);
  if (appearanceRef) body = body.replace(/\n}$/, `\n  appearance: ${appearanceRef},\n}`);
  writeOut(writePath, `${head}export default definePlatformTheme(${body});\n`);
}

const jsonPath = option('--json');
if (jsonPath) {
  const json = { ...themeFields };
  if (draft.appearance && draft.appearance !== 'classic') json.appearance = draft.appearance;
  writeOut(jsonPath, `${JSON.stringify(json, null, 2)}\n`);
}

// Preview stylesheet: every variable the provider would set, with higher specificity (html:root)
// so it wins when injected into a running app or the showcase without code changes.
const cssPath = option('--css');
if (cssPath) {
  const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const vars = {};
  for (const [r, v] of Object.entries(resolved)) vars[`--color-${kebab(r)}`] = v;
  for (const [r, v] of Object.entries({ ...defaultShape, ...appearance.shape })) vars[`--radius-${kebab(r)}`] = v;
  for (const [r, v] of Object.entries({ ...defaultShadows, ...appearance.shadows })) vars[`--shadow-${kebab(r)}`] = v;
  for (const [r, v] of Object.entries(material)) vars[`--material-${kebab(r)}`] = v;
  vars['--font-sans'] = appearance.fontFamily ?? tokens.typography.fontFamily.sans;
  vars['--workspace-gap'] = appearance.workspaceGap ?? tokens.layout.workspaceGap ?? '0px';
  const decl = (o) => Object.entries(o).map(([k, v]) => `  ${k}: ${v};`).join('\n');
  let css = `/* Preview of "${draft.name ?? appearance.name}" (${appearance.name}). Generated by theme-tool.mjs; not for production. */\nhtml:root {\n${decl(vars)}\n}\n`;
  const reduced = Object.fromEntries(Object.entries(appearance.reducedTransparency ?? {}).map(([r, v]) => [`--material-${kebab(r)}`, v]));
  if (Object.keys(reduced).length) css += `@media (prefers-reduced-transparency: reduce) {\n  html:root {\n${decl(reduced).replace(/^/gm, '  ')}\n  }\n}\n`;
  writeOut(cssPath, css);
}
