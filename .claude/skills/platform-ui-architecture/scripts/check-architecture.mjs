#!/usr/bin/env node
/**
 * Checks a change to @platform/ui against the kit's architecture: layer boundaries, import cycles,
 * dependencies, public API completeness (docs, changelog, showcase, fixture), duplicated helpers
 * and file growth. The rules are described in ../references/architecture.md.
 *
 *   node check-architecture.mjs                 changes since the merge base with origin/main (or main),
 *                                               including uncommitted and untracked files
 *   node check-architecture.mjs --base <ref>    changes since <ref>
 *   node check-architecture.mjs --all           audit the whole library (known debt shows up too)
 *   node check-architecture.mjs --json          machine-readable output
 *   node check-architecture.mjs --strict        exit 1 on warnings as well as errors
 *
 * Exit code: 1 when an error is found (or a warning with --strict), 0 otherwise.
 *
 * Allow one finding on purpose with a comment on the same line or the line above:
 *   // architecture-allow: <rule-id> <reason>
 * The reason is required; the review lists every allowance so a human sees it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const ROOT = findRoot(process.cwd());
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const gitOr = (fallback, ...a) => {
  try {
    return git(...a);
  } catch {
    return fallback;
  }
};

// ---------------------------------------------------------------------------------------------
// Architecture model
// ---------------------------------------------------------------------------------------------

/** Sub-areas of src/components: feature folders built from base components. */
const AREAS = ['grid', 'workspace', 'release-notes'];

/** Layer of a library file, or null for files outside the published library. */
function layerOf(file) {
  if (file === 'src/index.ts') return 'entry';
  if (file.startsWith('src/showcase/')) return null;
  if (file.startsWith('src/tokens/')) return 'tokens';
  if (file.startsWith('src/utils/')) return 'utils';
  if (file.startsWith('src/theme/')) return 'theme';
  if (file.startsWith('src/components/')) {
    const area = file.split('/')[2];
    return AREAS.includes(area) ? `area:${area}` : 'components';
  }
  return file.startsWith('src/') ? 'unknown' : null;
}

/** Which layers each layer may import. Dependencies point one way: tokens ← utils ← theme / components ← areas ← entry. */
function mayImport(from, to) {
  if (from === to) return true;
  switch (from) {
    case 'tokens':
      return false;
    case 'utils':
      return to === 'tokens';
    case 'theme':
      return to === 'tokens' || to === 'utils';
    case 'components':
      return to === 'tokens' || to === 'utils';
    case 'entry':
      return to !== null && to !== 'unknown';
    default:
      if (from.startsWith('area:')) return to === 'tokens' || to === 'utils' || to === 'components';
      return false;
  }
}

const LAYER_HINT = {
  tokens: 'tokens.ts is the root of the graph and imports nothing from the kit.',
  utils: 'utils are React-light helpers; they may only read tokens.',
  theme: 'the theme styles MUI from tokens; it must not depend on kit components.',
  components:
    'base components use tokens, utils and other base components; they read the theme through MUI (useTheme, styleOverrides), never by importing src/theme, and never import a feature area.',
  area: 'a feature area (grid, workspace, release-notes) builds on base components, tokens and utils; it must not import another area or the theme.',
};

/** UI libraries the kit does not allow next to MUI (AGENTS.md: MUI is the only base library). */
const BANNED_PACKAGES = /^(@radix-ui\/|@headlessui\/|react-bootstrap$|bootstrap$|antd$|@ant-design\/|@chakra-ui\/|@mantine\/|lucide-react$|react-icons(\/|$)|@heroicons\/|styled-components$|@fortawesome\/|@tabler\/icons|react-select$|@emotion\/css$)/;

/** Size budgets in lines. Over the soft budget: split before adding more. */
const BUDGET = { component: 400, module: 300, theme: 800 };

// ---------------------------------------------------------------------------------------------
// Files and imports
// ---------------------------------------------------------------------------------------------

function findRoot(start) {
  let dir = resolve(start);
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'src/index.ts'))) return dir;
    dir = dirname(dir);
  }
  console.error('Run inside the @platform/ui repository (no package.json + src/index.ts found).');
  process.exit(2);
}

function walk(dir, out = []) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts')) out.push(rel);
  }
  return out;
}

const read = (file) => (existsSync(join(ROOT, file)) ? readFileSync(join(ROOT, file), 'utf8') : null);
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/** Static imports, re-exports, side-effect imports and dynamic imports, with line numbers. */
function importsOf(text) {
  const found = [];
  const patterns = [
    /^[ \t]*(import|export)\b(\s+type\b)?[^;'"`]*?\bfrom\s+['"]([^'"]+)['"]/gm,
    /^[ \t]*import\s+['"]([^'"]+)['"]/gm,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const [i, re] of patterns.entries()) {
    for (const m of text.matchAll(re)) {
      const spec = i === 0 ? m[3] : m[1];
      found.push({ spec, typeOnly: i === 0 && Boolean(m[2]), line: lineOf(text, m.index) });
    }
  }
  return found;
}

function resolveRelative(fromFile, spec) {
  const base = join(dirname(fromFile), spec);
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`];
  const hit = candidates.find((c) => existsSync(join(ROOT, c)) && statSync(join(ROOT, c)).isFile());
  return hit ?? base;
}

const packageName = (spec) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);

// ---------------------------------------------------------------------------------------------
// Scope: which files this run judges
// ---------------------------------------------------------------------------------------------

const ALL = flag('--all');
let base = option('--base');
if (!ALL && !base) {
  const target = gitOr('', 'rev-parse', '--verify', '--quiet', 'origin/main') ? 'origin/main' : 'main';
  base = gitOr('HEAD', 'merge-base', 'HEAD', target);
}

const changed = new Map(); // file -> 'A' | 'M' | 'D'
if (!ALL) {
  for (const row of gitOr('', 'diff', '--name-status', '--find-renames', base).split('\n').filter(Boolean)) {
    const [status, ...paths] = row.split('\t');
    changed.set(paths.at(-1), status[0] === 'R' ? 'A' : status[0]);
  }
  for (const file of gitOr('', 'ls-files', '--others', '--exclude-standard').split('\n').filter(Boolean)) changed.set(file, 'A');
}
const inScope = (file) => ALL || changed.has(file);
const baseText = (file) => (ALL ? null : gitOr(null, 'show', `${base}:${file}`));

/** Lines added in this change (for "is it in the changelog" checks). */
function addedText(file) {
  if (ALL) return read(file) ?? '';
  if (changed.get(file) === 'A') return read(file) ?? '';
  return gitOr('', 'diff', '--unified=0', base, '--', file)
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .join('\n');
}

// ---------------------------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------------------------

const findings = [];
const allowances = [];

function report(rule, severity, file, line, message, fix) {
  const text = file ? read(file) : null;
  if (text && line) {
    const lines = text.split('\n');
    const nearby = `${lines[line - 2] ?? ''}\n${lines[line - 1] ?? ''}`;
    const allow = nearby.match(new RegExp(`architecture-allow:[ \\t]*${rule}\\b[ \\t]*([^\\n]*)`));
    if (allow) {
      const reason = allow[1].replace(/\*\/\s*$/, '').trim();
      if (reason) {
        allowances.push({ rule, file, line, reason });
        return;
      }
      message += ' (architecture-allow found without a reason; add one)';
    }
  }
  findings.push({ rule, severity, file, line, message, fix });
}

// ---------------------------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------------------------

const pkg = JSON.parse(read('package.json'));
const allowedDeps = new Set([...Object.keys(pkg.peerDependencies ?? {}), ...Object.keys(pkg.dependencies ?? {})]);
const libFiles = walk('src').filter((f) => layerOf(f) !== null);
const graph = new Map(); // lib file -> runtime-imported lib files

for (const file of libFiles) {
  const text = read(file);
  const from = layerOf(file);
  const edges = [];
  graph.set(file, edges);
  const judged = inScope(file);

  if (judged && from === 'unknown')
    report('placement', 'error', file, 1, `New top-level folder in src/. Library code lives in tokens/, utils/, theme/ or components/ (see the placement table).`);

  for (const imp of importsOf(text)) {
    if (imp.spec.startsWith('.')) {
      const target = resolveRelative(file, imp.spec);
      const to = layerOf(target);
      if (!imp.typeOnly && /\.(ts|tsx)$/.test(target)) edges.push({ target, line: imp.line });
      if (!judged) continue;
      if (to === null) {
        report('layer', 'error', file, imp.line, `Library code imports ${target}, which is not published (showcase, tests or scripts).`, 'Move the shared code into src/utils or the component, and import it from there in the showcase.');
      } else if (!mayImport(from, to) && !target.endsWith('.css')) {
        const key = from.startsWith('area:') ? 'area' : from;
        report('layer', 'error', file, imp.line, `${from} → ${to} (${target}) breaks the dependency direction: ${LAYER_HINT[key] ?? ''}`,
          to.startsWith('area:') || to === 'theme' ? 'Move the shared piece down a layer (a base component, utils or tokens), or pass it in as a prop.' : undefined);
      }
      continue;
    }

    if (!judged) continue;
    const name = packageName(imp.spec);
    if (imp.spec.startsWith('node:') || ['fs', 'path', 'child_process', 'os', 'url'].includes(name)) {
      report('dependency', 'error', file, imp.line, `Node built-in "${imp.spec}" in browser library code.`);
    } else if (BANNED_PACKAGES.test(imp.spec)) {
      report('dependency', 'error', file, imp.line, `"${imp.spec}" is another UI/icon library. MUI is the only base library; icons come from @mui/icons-material.`);
    } else if (name === '@platform/ui') {
      report('layer', 'error', file, imp.line, 'The kit imports itself by package name; use a relative import.');
    } else if (!allowedDeps.has(name)) {
      report('dependency', 'error', file, imp.line, `"${name}" is not a dependency or peer dependency. The library build externalizes every import, so apps would fail to resolve it.`, 'Build it from MUI and existing deps, or add the dependency with a justification (see "Adding a dependency").');
    } else if (imp.spec === '@mui/material' && !imp.typeOnly) {
      report('mui-import', 'warn', file, imp.line, 'Barrel import from "@mui/material". The kit imports per component ("@mui/material/Button") or from "@mui/material/styles".');
    } else if (imp.spec === '@mui/icons-material') {
      report('mui-import', 'error', file, imp.line, 'Barrel import from "@mui/icons-material" pulls every icon; import one icon per path ("@mui/icons-material/Close").');
    } else if ((name === 'clsx' || name === 'tailwind-merge') && file !== 'src/utils/cn.ts') {
      report('reuse', 'warn', file, imp.line, `Direct ${name} import. Combine classes with cn() from utils/cn so app classNames override correctly.`);
    }
  }

  if (!judged) continue;
  const lines = text.split('\n');
  lines.forEach((l, i) => {
    const line = i + 1;
    if (/^\s*(\/\/|\/?\*)/.test(l)) return;
    if (/\b(localStorage|sessionStorage)\b/.test(l) && file !== 'src/utils/storage.ts')
      report('reuse', 'warn', file, line, 'Direct Web Storage access. Use readStorage/writeStorage from utils/storage (raw access throws in sandboxed iframes and private mode).');
    if (/\balpha\(\s*colors\./.test(l))
      report('tokens', 'error', file, line, 'MUI alpha() cannot read colors.* (CSS variables). Use color-mix(in srgb, ${colors.x} 15%, transparent).');
    if (/\],?\s*$/.test(l) && /\[[^\]]*JSON\.stringify\(/.test(l) && /use(Effect|Memo|Callback|LayoutEffect)/.test(lines.slice(Math.max(0, i - 8), i + 1).join('\n')))
      report('reuse', 'warn', file, line, 'JSON.stringify in hook dependencies. Use useStableValue from utils/useStableValue for inline-object props.');
    if (/^export default\b/.test(l.trim()))
      report('api-shape', 'warn', file, line, 'Default export. The kit uses named exports only, re-exported from src/index.ts.');
  });

  // Growth: files over budget must not grow further; new files must start within budget.
  const budget = file === 'src/theme/createPlatformTheme.ts' || file === 'src/tokens/tokens.ts' ? BUDGET.theme : file.endsWith('.tsx') ? BUDGET.component : BUDGET.module;
  const now = lines.length;
  const before = baseText(file)?.split('\n').length ?? 0;
  if (now > budget && (ALL || now > before)) {
    const grew = ALL ? '' : before ? ` (+${now - before} in this change)` : ' (new file)';
    report('size', ALL ? 'info' : 'warn', file, 1, `${now} lines, over the ${budget}-line budget${grew}.`,
      'Split before adding: pure logic → a React-free module with unit tests (like grid/gridFilters.ts); sub-parts → their own file in the same folder (like grid/GridCells.tsx).');
  }
}

// Import cycles (runtime imports only; type-only cycles are harmless).
{
  const state = new Map();
  const stack = [];
  const seen = new Set();
  const visit = (file) => {
    state.set(file, 1);
    stack.push(file);
    for (const { target } of graph.get(file) ?? []) {
      if (!graph.has(target)) continue;
      if (state.get(target) === 1) {
        const cycle = stack.slice(stack.indexOf(target));
        const key = [...cycle].sort().join('|');
        if (!seen.has(key) && cycle.some(inScope)) {
          seen.add(key);
          report('cycle', 'error', cycle[0], 1, `Import cycle: ${[...cycle, target].join(' → ')}`, 'Move the shared part into a lower module both can import.');
        }
      } else if (!state.get(target)) visit(target);
    }
    stack.pop();
    state.set(file, 2);
  };
  for (const file of graph.keys()) if (!state.get(file)) visit(file);
}

// Orphans: a library module nothing imports is dead code or a missing export.
{
  const imported = new Set([...graph.values()].flat().map((e) => e.target));
  for (const text of libFiles.map(read)) for (const imp of importsOf(text)) if (imp.typeOnly && imp.spec.startsWith('.')) imported.add(imp.spec);
  for (const file of libFiles) {
    if (!inScope(file) || file === 'src/index.ts' || imported.has(file)) continue;
    const reachedByType = libFiles.some((f) => importsOf(read(f)).some((i) => i.spec.startsWith('.') && resolveRelative(f, i.spec) === file));
    if (!reachedByType) report('orphan', 'warn', file, 1, 'Nothing in the library imports this file: export it from src/index.ts or remove it.');
  }
}

// Public API: every new export is shown, tested, documented and logged.
function exportNames(text) {
  const names = new Map(); // name -> isType
  if (!text) return names;
  for (const m of text.matchAll(/^export\s+(type\s+)?\{([^}]*)\}\s*from/gm)) {
    for (const raw of m[2].split(',')) {
      const part = raw.trim();
      if (!part) continue;
      const isType = Boolean(m[1]) || part.startsWith('type ');
      const name = part.replace(/^type\s+/, '').split(/\s+as\s+/).at(-1).trim();
      names.set(name, isType);
    }
  }
  return names;
}

const indexNow = exportNames(read('src/index.ts'));
const indexBefore = ALL ? new Map() : exportNames(baseText('src/index.ts'));
const newExports = [...indexNow].filter(([n]) => ALL || !indexBefore.has(n));
const removedExports = ALL ? [] : [...indexBefore.keys()].filter((n) => !indexNow.has(n));

if (!ALL || flag('--api')) {
  const docs = readdirSync(join(ROOT, 'docs')).filter((f) => f.endsWith('.md')).map((f) => read(`docs/${f}`)).join('\n');
  const catalog = read('src/showcase/catalog.ts') ?? '';
  const fixtures = read('tests/e2e/harness/fixtures.tsx') ?? '';
  const changelogAdded = addedText('CHANGELOG.md');
  const indexLine = (name) => {
    const text = read('src/index.ts');
    const i = text.search(new RegExp(`\\b${name}\\b`));
    return i >= 0 ? lineOf(text, i) : 1;
  };
  const mentions = (hay, name) => new RegExp(`\\b${name}\\b`).test(hay);

  for (const [name, isType] of newExports) {
    const line = indexLine(name);
    if (!isType && !mentions(catalog, name)) report('api-complete', 'error', 'src/index.ts', line, `New export ${name} has no showcase demo in src/showcase/catalog.ts (showcase.spec.ts fails).`);
    if (!mentions(docs, name)) report('api-complete', isType ? 'warn' : 'error', 'src/index.ts', line, `New export ${name} is not documented in docs/.`);
    if (!mentions(changelogAdded, name)) report('api-complete', isType ? 'warn' : 'error', 'src/index.ts', line, `New export ${name} is not mentioned in this change's CHANGELOG.md entry.`);
    if (!isType && /^[A-Z]/.test(name) && !/^[A-Z0-9_]+$/.test(name) && !mentions(fixtures, name))
      report('api-complete', 'warn', 'src/index.ts', line, `New component ${name} has no fixture in tests/e2e/harness/fixtures.tsx (no axe or behavior coverage).`);
  }
  for (const name of removedExports)
    report('api-break', 'error', 'src/index.ts', 1, `Export ${name} was removed: a breaking change for apps. Keep it (deprecated) or plan a major release with a "Removed" changelog entry.`);
  if (newExports.length > 8 && !ALL)
    report('api-surface', 'warn', 'src/index.ts', 1, `${newExports.length} new public exports in one change. Keep internals private; export only what apps call.`);
}

if (!ALL) {
  // Library code changed without a changelog entry.
  const libChanged = [...changed].some(([f, s]) => s !== 'D' && layerOf(f) && layerOf(f) !== 'unknown') || [...changed.keys()].some((f) => f.endsWith('.css') && f.startsWith('src/theme/'));
  if (libChanged && !changed.has('CHANGELOG.md'))
    report('changelog', 'warn', 'CHANGELOG.md', 1, 'Library files changed but CHANGELOG.md did not. Add an entry unless the change is invisible to apps (refactor, comments).');

  if (changed.has('src/tokens/tokens.ts') && !changed.has('src/theme/tokens.generated.css'))
    report('tokens', 'error', 'src/tokens/tokens.ts', 1, 'tokens.ts changed but tokens.generated.css did not. Run pnpm tokens and commit the result (CI fails otherwise).');
  if (changed.has('src/theme/tokens.generated.css') && !changed.has('src/tokens/tokens.ts'))
    report('tokens', 'error', 'src/theme/tokens.generated.css', 1, 'tokens.generated.css is generated. Edit tokens.ts and run pnpm tokens.');

  // New pure modules need unit tests.
  for (const [file, status] of changed) {
    if (status !== 'A' || !/^src\/(utils|components|theme)\/.*\.ts$/.test(file) || file.endsWith('.d.ts')) continue;
    const stem = file.split('/').pop().replace(/\.ts$/, '');
    const tested = existsSync(join(ROOT, 'tests/unit')) && readdirSync(join(ROOT, 'tests/unit')).some((t) => read(`tests/unit/${t}`).includes(stem));
    if (!tested) report('tests', 'warn', file, 1, `New logic module without a unit test importing it in tests/unit/.`);
  }

  // New dependencies grow every app's install and bundle.
  const pkgBefore = JSON.parse(gitOr('{}', 'show', `${base}:package.json`));
  for (const field of ['dependencies', 'peerDependencies']) {
    for (const dep of Object.keys(pkg[field] ?? {})) {
      if (!(dep in (pkgBefore[field] ?? {})))
        report('dependency', 'warn', 'package.json', 1, `New ${field === 'dependencies' ? 'dependency' : 'peer dependency'} "${dep}". Needs a justification in the review: why MUI and existing deps are not enough, bundle size, maintenance.`);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------------------------

const order = { error: 0, warn: 1, info: 2 };
findings.sort((a, b) => order[a.severity] - order[b.severity] || a.file.localeCompare(b.file) || a.line - b.line);
const count = (s) => findings.filter((f) => f.severity === s).length;
const scope = ALL ? 'whole library' : `changes since ${base.slice(0, 12)} (${changed.size} files)`;

if (flag('--json')) {
  console.log(JSON.stringify({ scope, newExports: newExports.map(([n]) => n), findings, allowances }, null, 2));
} else {
  console.log(`Architecture check: ${scope}`);
  if (!ALL && changed.size === 0) console.log('No changes found. Pass --base <ref> or --all.');
  for (const f of findings) {
    console.log(`\n${f.severity.toUpperCase().padEnd(5)} [${f.rule}] ${relative(ROOT, join(ROOT, f.file))}:${f.line}\n      ${f.message}`);
    if (f.fix) console.log(`      → ${f.fix}`);
  }
  if (allowances.length) {
    console.log('\nAllowed on purpose (mention these in the review):');
    for (const a of allowances) console.log(`  [${a.rule}] ${a.file}:${a.line} — ${a.reason}`);
  }
  console.log(`\n${count('error')} error(s), ${count('warn')} warning(s), ${count('info')} info.`);
}

process.exit(count('error') > 0 || (flag('--strict') && count('warn') > 0) ? 1 : 0);
