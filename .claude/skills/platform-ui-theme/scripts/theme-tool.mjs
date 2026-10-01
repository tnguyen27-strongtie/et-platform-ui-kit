#!/usr/bin/env node
/**
 * Checks a theme draft (JSON) against the installed @platform/ui kit and writes the theme files.
 *
 *   node theme-tool.mjs <draft.json>                        check only (exit 1 on errors)
 *   node theme-tool.mjs <draft.json> --write src/theme.config.ts [--json public/theme.json]
 *   node theme-tool.mjs <draft.json> --css preview.css [--scheme dark]   preview stylesheet
 *   node theme-tool.mjs --list                              print roles, defaults and built-in appearances
 *
 * Options: --strict (contrast failures the theme causes are errors), --force (overwrite files),
 * --dark (also check the dark scheme when the draft does not use it).
 *
 * Draft format:
 *   {
 *     "name": "Acme Calculator",
 *     "colors": { "brand": "#0a66c2" },                 // light scheme roles; hex, rgb(), hsl()
 *     "darkColors": { "brand": "#6cb0ff" },             // optional dark scheme roles
 *     "colorScheme": "system",                          // "light" (default), "dark" or "system"
 *     "density": "standard",                            // or "expanded"
 *     "appearance": "glass"                             // a built-in name, or:
 *     "appearance": { "name": "acme-glass", "base": "glass", "label": "Acme Glass", "description": "…",
 *                     "colors": {…}, "shape": {…}, "radius": {…}, "shadows": {…}, "material": {…},
 *                     "fontFamily": "…", "workspaceGap": "0.5rem", "reducedTransparency": {…},
 *                     "dark": { "colors": {…}, "shadows": {…}, "material": {…} } }
 *   }
 *
 * No dependencies: it runs the kit's own React-free modules (tokens, appearance, themeConfig, colors)
 * from node_modules/@platform/ui/dist, or from dist/ inside the kit repository (run `npm run build` first),
 * so colors resolve and the preview CSS is built exactly as PlatformThemeProvider does it.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// ---------- Arguments ----------
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const VALUE_OPTIONS = ['--write', '--json', '--css', '--scheme'];
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const draftPath = args.find((a, i) => !a.startsWith('--') && !VALUE_OPTIONS.includes(args[i - 1]));

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

// ---------- Load the kit ----------
function findKit() {
  let dir = process.cwd();
  for (;;) {
    const installed = join(dir, 'node_modules/@platform/ui/dist');
    if (existsSync(join(installed, 'tokens/tokens.js'))) return installed;
    const pkg = join(dir, 'package.json');
    if (existsSync(pkg) && JSON.parse(readFileSync(pkg, 'utf8')).name === '@platform/ui') {
      if (!existsSync(join(dir, 'dist/theme/colors.js'))) fail('Inside the kit repository: run `npm run build` first (the tool uses dist/).');
      return join(dir, 'dist');
    }
    const parent = dirname(dir);
    if (parent === dir) fail("Could not find @platform/ui (node_modules/@platform/ui/dist). Run from the app's directory.");
    dir = parent;
  }
}

const kit = findKit();
const load = (p) => import(pathToFileURL(join(kit, p)).href);
if (!existsSync(join(kit, 'theme/appearance.js'))) fail('This @platform/ui version has no appearances. Upgrade the kit, or make a colors-only theme with the Theme builder.');
const [tokens, appearanceModule, configModule, colorsModule] = await Promise.all([
  load('tokens/tokens.js'),
  load('theme/appearance.js'),
  load('theme/themeConfig.js'),
  load('theme/colors.js'),
]);
if (!colorsModule.resolveSchemeColors || !colorsModule.themeCss) fail('This @platform/ui version has no color schemes (dark mode). Upgrade the kit.');
const { defaultColors, defaultShape, shadows: defaultShadows, defaultMaterial, defaultDarkMaterial, radius: radiusSteps } = tokens;
const { APPEARANCES, APPEARANCE_NAMES, defineAppearance } = appearanceModule;
const { isValidColor, contrastRatio, parseRgb } = configModule;
const { resolveSchemeColors, themeCss } = colorsModule;

// ---------- --list ----------
if (flag('--list')) {
  const table = (title, obj) => {
    console.log(`\n${title}`);
    for (const [k, v] of Object.entries(obj)) console.log(`  ${k.padEnd(20)} ${v}`);
  };
  console.log(`Kit: ${kit}`);
  table('Color roles, light (defaults)', defaultColors);
  table('Color roles, dark (defaults)', tokens.defaultDarkColors);
  table('shape (radius by role)', defaultShape);
  table('radius steps (rounded-sm…xl)', { sm: radiusSteps.sm, md: radiusSteps.md, lg: radiusSteps.lg, xl: radiusSteps.xl });
  table('shadows', defaultShadows);
  table('shadows, dark scheme overrides', tokens.defaultDarkShadows);
  table('material', defaultMaterial);
  table('material, dark scheme overrides', defaultDarkMaterial);
  console.log(`\nBuilt-in appearances: ${APPEARANCE_NAMES.join(', ')}`);
  for (const name of APPEARANCE_NAMES) console.log(`\n--- ${name} ---\n${JSON.stringify(APPEARANCES[name], null, 2)}`);
  process.exit(0);
}

if (!draftPath) fail('Usage: node theme-tool.mjs <draft.json> [--write src/theme.config.ts] [--json theme.json] [--css preview.css [--scheme dark]] [--strict] [--dark] [--force] | --list');

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

const TOP_KEYS = ['$comment', 'name', 'colors', 'darkColors', 'colorScheme', 'density', 'appearance'];
const APPEARANCE_KEYS = ['name', 'base', 'label', 'description', 'colors', 'shape', 'radius', 'shadows', 'material', 'fontFamily', 'workspaceGap', 'reducedTransparency', 'dark'];
const RADIUS_STEPS = { sm: 1, md: 1, lg: 1, xl: 1 };
const LENGTH = /^(0|-?\d*\.?\d+(px|rem|em|%)|(calc|min|max|clamp|var)\(.+\))$/;
const BUNDLED_OR_SYSTEM =
  /^(['"]?(Inter Variable|Inter|system-ui|-apple-system|BlinkMacSystemFont|Segoe UI Variable|Segoe UI|SF Pro Text|SF Pro Display|Roboto|Helvetica Neue|Helvetica|Arial|sans-serif|serif|monospace|ui-sans-serif|ui-monospace|ui-rounded)['"]?)$/i;

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

for (const key of Object.keys(draft)) if (!TOP_KEYS.includes(key)) errors.push(`Unknown key "${key}".`);
if (draft.name !== undefined && (typeof draft.name !== 'string' || !draft.name.trim())) errors.push('"name" must be a non-empty string.');
if (draft.density !== undefined && !['standard', 'expanded'].includes(draft.density)) errors.push('"density" must be "standard" or "expanded".');
if (draft.colorScheme !== undefined && !['light', 'dark', 'system'].includes(draft.colorScheme)) errors.push('"colorScheme" must be "light", "dark" or "system".');

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
const checkLength = (where) => (role, v) => {
  if (!LENGTH.test(v)) errors.push(`${where}.${role}: "${v}" is not a CSS length (0, 12px, 0.75rem, 9999px…).`);
};
const checkShadow = (where) => (role, v) => {
  if (v !== 'none' && !/\d/.test(v)) errors.push(`${where}.${role}: "${v}" does not look like a box-shadow.`);
};
const checkMaterial = (where) => (role, v) => {
  if ((role === 'filter' || role === 'scrimFilter') && v !== 'none' && !/^([a-z-]+\([^)]*\)\s*)+$/.test(v)) {
    errors.push(`${where}.${role}: "${v}" is not a backdrop-filter (e.g. "blur(20px) saturate(160%)" or "none").`);
  }
};

checkColors(draft.colors, 'colors');
checkColors(draft.darkColors, 'darkColors');

/** The appearance object as the kit will see it (built with the kit's own defineAppearance). */
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
  checkRoleMap(a.shape, defaultShape, 'appearance.shape', checkLength('appearance.shape'));
  checkRoleMap(a.radius, RADIUS_STEPS, 'appearance.radius', checkLength('appearance.radius'));
  checkRoleMap(a.shadows, defaultShadows, 'appearance.shadows', checkShadow('appearance.shadows'));
  checkRoleMap(a.material, defaultMaterial, 'appearance.material', checkMaterial('appearance.material'));
  checkRoleMap(a.reducedTransparency, defaultMaterial, 'appearance.reducedTransparency');
  if (a.dark !== undefined) {
    if (!isObject(a.dark)) errors.push('appearance.dark must be an object with colors, shadows, material.');
    else {
      for (const key of Object.keys(a.dark)) if (!['colors', 'shadows', 'material'].includes(key)) errors.push(`appearance.dark.${key}: unknown key (colors, shadows, material).`);
      checkColors(a.dark.colors, 'appearance.dark.colors');
      checkRoleMap(a.dark.shadows, defaultShadows, 'appearance.dark.shadows', checkShadow('appearance.dark.shadows'));
      checkRoleMap(a.dark.material, defaultMaterial, 'appearance.dark.material', checkMaterial('appearance.dark.material'));
    }
  }
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
  const own = { ...a };
  delete own.base;
  appearance = errors.length ? { ...APPEARANCES.classic, ...own } : defineAppearance(own, APPEARANCES[base] ? base : 'classic');
} else {
  errors.push('"appearance" must be a built-in name or an object.');
  appearance = APPEARANCES.classic;
}

// ---------- Resolve colors for each scheme the theme uses ----------
const appColors = isObject(draft.colors) ? draft.colors : {};
const appDarkColors = isObject(draft.darkColors) ? draft.darkColors : {};
const usesDark = ['dark', 'system'].includes(draft.colorScheme) || Object.keys(appDarkColors).length > 0 || Boolean(appearance.dark) || flag('--dark');
const schemes = [...(draft.colorScheme === 'dark' ? [] : ['light']), ...(usesDark ? ['dark'] : [])];
const resolveFor = (scheme) => resolveSchemeColors(scheme, { colors: appColors, darkColors: appDarkColors, appearance });

const BRAND_DERIVED = ['brand', 'brandHover', 'brandActive', 'brandDark', 'brandSubtle', 'brandSelected', 'focusRing', 'accent', 'selection', 'scrollbarThumb', 'textOnBrand'];
/** Who set a role in a scheme: this theme (or its brand), the appearance, or the kit defaults. */
function source(scheme, role) {
  const given = scheme === 'dark' ? appDarkColors : appColors;
  const fromAppearance = scheme === 'dark' ? appearance.dark?.colors ?? {} : appearance.colors ?? {};
  if (role in given) return 'theme';
  const brandFrom = scheme === 'dark' ? given.brand ?? fromAppearance.brand ?? appColors.brand : given.brand;
  if (brandFrom && BRAND_DERIVED.includes(role)) return 'theme';
  if (role in fromAppearance) return 'appearance';
  return 'kit';
}

// Same pairs as the showcase Theme builder.
const pairs = [
  ['Primary button text', 'textOnBrand', 'brand', 4.5],
  ['Body text', 'text', 'surface', 4.5],
  ['Muted text', 'textMuted', 'surface', 4.5],
  ['Muted text on app background', 'textMuted', 'surfaceApp', 4.5],
  ['Links', 'link', 'surface', 4.5],
  ['Error messages', 'danger', 'surface', 4.5],
  ['Danger button text', 'textOnColor', 'danger', 4.5],
  ['Warning alert text', 'warningText', 'surface', 4.5],
  ['Selected option', 'text', 'brandSelected', 4.5],
  ['Focus ring, checked controls', 'brand', 'surface', 3],
  ['Input border', 'borderInput', 'surface', 3],
];
const sourceNote = {
  theme: ' Set by this theme: fix it here.',
  appearance: ' Comes from the appearance colors: override the role in the theme if the product must meet AA.',
  kit: ' Kit default, not introduced by this theme.',
};
const contrastBy = {};
for (const scheme of schemes) {
  const resolved = resolveFor(scheme);
  contrastBy[scheme] = pairs.map(([label, fg, bg, min]) => {
    const ratio = contrastRatio(resolved[fg], resolved[bg]);
    const origins = [source(scheme, fg), source(scheme, bg)];
    const src = origins.includes('theme') ? 'theme' : origins.includes('appearance') ? 'appearance' : 'kit';
    return { label, fg, bg, min, ratio, pass: ratio !== null && ratio >= min, source: src };
  });
  for (const c of contrastBy[scheme]) {
    if (c.pass || c.ratio === null) continue;
    const msg = `[${scheme}] Contrast "${c.label}" (${c.fg} on ${c.bg}) is ${c.ratio}:1, needs ${c.min}:1.${sourceNote[c.source]}`;
    if (flag('--strict') && c.source !== 'kit') errors.push(msg);
    else warnings.push(msg);
  }
}

// ---------- Style sanity ----------
const translucent = (v) => /transparent|rgba\([^)]*,\s*0?\.\d+\s*\)|\/\s*0?\.\d+|hsla\(/.test(v);
for (const scheme of schemes) {
  const material = { ...defaultMaterial, ...appearance.material, ...(scheme === 'dark' ? { ...defaultDarkMaterial, ...appearance.dark?.material } : {}) };
  const blurs = material.filter !== 'none';
  const see = ['panel', 'overlay', 'nav', 'control', 'header'].filter((r) => translucent(material[r]));
  if (blurs && !see.length) warnings.push(`[${scheme}] material.filter blurs, but no panel/overlay/nav/control background is translucent: the blur is invisible and costs performance.`);
  if (see.length && !blurs) notes.push(`[${scheme}] Translucent ${see.join(', ')} without a backdrop blur: content behind shows through sharply. Intended?`);
  const missing = see.filter((r) => !appearance.reducedTransparency?.[r]);
  if (missing.length) warnings.push(`[${scheme}] No reducedTransparency value for translucent ${missing.join(', ')}: users who ask the system for less transparency still get see-through surfaces. Add solid values (e.g. "var(--color-surface)").`);
  if (blurs && !appearance.reducedTransparency?.filter) warnings.push(`[${scheme}] Add reducedTransparency.filter: "none".`);
}
const lum = (c) => {
  const rgb = parseRgb(c ?? '');
  return rgb ? (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255 : 1;
};
if (lum(appColors.surface) < 0.4 || lum(appColors.surfaceApp) < 0.4) {
  warnings.push('"colors" has dark surfaces. For a dark theme use "colorScheme": "dark" (or "system") with "darkColors": the kit then switches MUI, the neutral scale and every component to dark.');
}
if (!usesDark) notes.push('Dark scheme not checked (colorScheme is light). Add --dark to check how the theme looks in dark mode.');

// ---------- Report ----------
const appearanceLabel = isObject(draft.appearance) ? `${appearance.name} (custom, base ${draft.appearance.base ?? 'classic'})` : appearance.name;
console.log(`Kit: ${kit}`);
console.log(`Theme: ${draft.name ?? '(no name)'} · appearance: ${appearanceLabel} · color scheme: ${draft.colorScheme ?? 'light'} · density: ${draft.density ?? 'standard'}`);
for (const scheme of schemes) {
  console.log(`\nContrast, ${scheme} scheme (WCAG 2.1 AA)`);
  for (const c of contrastBy[scheme]) {
    const mark = c.ratio === null ? '·' : c.pass ? '✓' : '✗';
    console.log(`  ${mark} ${c.label.padEnd(30)} ${c.ratio === null ? 'n/a (not a plain color)' : `${c.ratio.toFixed(2)}:1`.padEnd(8)} needs ${c.min}:1`);
  }
}
for (const n of notes) console.log(`\nℹ ${n}`);
for (const w of warnings) console.log(`\n⚠ ${w}`);
if (option('--json') && isObject(draft.appearance)) {
  errors.push('--json: theme.json files accept built-in appearance names only. Use --write for a custom appearance.');
}
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

const themeFields = { version: 1 };
if (draft.name) themeFields.name = draft.name.trim();
if (Object.keys(appColors).length) themeFields.colors = appColors;
if (Object.keys(appDarkColors).length) themeFields.darkColors = appDarkColors;
if (draft.colorScheme && draft.colorScheme !== 'light') themeFields.colorScheme = draft.colorScheme;
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

// Preview stylesheet: exactly what the provider injects, with higher specificity (html:root) so it
// wins when injected into a running app or the showcase without code changes.
const cssPath = option('--css');
if (cssPath) {
  const scheme = option('--scheme') ?? (draft.colorScheme === 'dark' ? 'dark' : 'light');
  if (!['light', 'dark'].includes(scheme)) fail('--scheme must be light or dark.');
  const css = themeCss({ scheme, colors: appColors, darkColors: appDarkColors, appearance }).replaceAll(':root{', 'html:root{');
  writeOut(cssPath, `/* Preview of "${draft.name ?? appearance.name}" (${appearance.name}, ${scheme}). Generated by theme-tool.mjs; not for production. */\n${css}\n`);
}
