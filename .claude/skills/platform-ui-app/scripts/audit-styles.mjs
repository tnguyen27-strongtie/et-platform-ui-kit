#!/usr/bin/env node
/**
 * Finds app styles that do not follow the @platform/ui theme (appearance, brand, dark scheme):
 * fixed white/black, hex colors, Tailwind's default palette, scale colors that ignore the brand,
 * raw radius/shadow token values. Safe cases can be fixed automatically.
 *
 *   node audit-styles.mjs [dir…]          report (default dir: src)
 *   node audit-styles.mjs src --fix       also apply the safe replacements (marked "fix")
 *   node audit-styles.mjs src --json      machine-readable output
 *   node audit-styles.mjs src --strict    exit 1 when anything is found (CI)
 *
 * Silence a line on purpose with a comment containing `platform-ui-audit-ignore` (e.g. a logo that
 * must stay white). Theme files (theme.config.*, *.generated.*) are skipped: hex values belong there.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const dirs = args.filter((a) => !a.startsWith('--'));
if (!dirs.length) dirs.push('src');

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.scss', '.html', '.vue', '.svelte']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', '.git', '.next', 'out', 'test-results', 'playwright-report']);
const SKIP_FILE = /(^|\/)(theme\.config\.[cm]?[jt]s|.*\.generated\.[a-z]+|.*\.d\.ts)$/;

const TW_PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|rose';
const PREFIX = '(?:bg|text|border(?:-[trblxy])?|ring|outline|fill|stroke|divide|decoration|from|via|to|placeholder|caret|accent)';
// Tailwind class tokens may carry variants (hover:, md:, dark:) and an opacity (/60).
const cls = (body) => new RegExp(`(?<![\\w-])((?:[a-z0-9-]+:)*)(${body})(?![\\w-])`, 'g');

/**
 * Rules. `fix` returns the replacement for a match (only for replacements that keep the meaning in
 * the default light Classic theme). Severity: error = never follows the theme; warn = usually a
 * problem; info = check by hand.
 */
const rules = [
  {
    id: 'white-surface',
    severity: 'error',
    test: cls('bg-white(?:/\\d+)?'),
    message: 'bg-white stays white in the dark scheme and ignores the surface color.',
    suggest: 'bg-surface (panels, inputs), material-panel / material-overlay (layers), bg-(--material-canvas) (drawings)',
    fix: (m) => m.replace('bg-white', 'bg-surface'),
  },
  {
    id: 'black-text',
    severity: 'error',
    test: cls('text-black(?:/\\d+)?'),
    message: 'text-black is invisible in the dark scheme.',
    suggest: 'text-text-strong (strongest text), text-text (body)',
    fix: (m) => m.replace('text-black', 'text-text-strong'),
  },
  {
    id: 'white-text',
    severity: 'warn',
    test: cls('text-white(?:/\\d+)?'),
    message: 'text-white is right only on a dark fill that stays dark in every theme.',
    suggest: 'text-text-on-brand (on bg-brand), text-text-on-color (on danger/success/neutral fills), text-surface (on bg-text)',
  },
  {
    id: 'bw-other',
    severity: 'warn',
    test: cls(`${PREFIX}-(?:white|black)(?:/\\d+)?`),
    skipIf: /(?:^|:)(?:bg-white|text-black|text-white)/,
    message: 'Fixed white or black does not follow the theme.',
    suggest: 'a role class: border-border, border-border-strong, bg-surface, text-text-strong…',
  },
  {
    id: 'tailwind-palette',
    severity: 'error',
    test: cls(`${PREFIX}-(?:${TW_PALETTE})-\\d{2,3}(?:/\\d+)?`),
    message: "Tailwind's default palette ignores the brand, the appearance and the dark scheme.",
    suggest: 'role classes: text-text-muted, bg-surface-subtle, border-border-input, text-danger, bg-brand-subtle…',
  },
  {
    id: 'brand-scale',
    severity: 'warn',
    test: cls(`${PREFIX}-(?:pumpkin-orange|sst-orange|sage-green|blue)-(?:\\d+|base)(?:/\\d+)?`),
    message: 'Scale colors are fixed: they do not follow the brand color or the dark scheme.',
    suggest: 'brand roles: bg-brand, bg-brand-subtle, bg-brand-selected, text-brand, border-accent',
  },
  {
    id: 'arbitrary-color',
    severity: 'error',
    test: cls(`${PREFIX}-\\[(?:#|rgb|hsl)[^\\]]*\\]`),
    message: 'An arbitrary color value does not follow the theme.',
    suggest: 'a role class, or bg-(--color-<role>) for a role without a class',
  },
  {
    id: 'tailwind-shadow',
    severity: 'warn',
    test: cls('shadow-(?:2xs|xs|sm|md|lg|xl|2xl|inner)'),
    skipIf: /shadow-(?:none|popover|dropdown-item|modal|button|raised|alert|panel)/,
    message: "Tailwind's default shadows do not change with the appearance or the dark scheme.",
    suggest: 'shadow-panel (resting), shadow-raised (hover), shadow-popover (floating), shadow-modal',
  },
  {
    id: 'arbitrary-radius',
    severity: 'info',
    test: cls('rounded(?:-[trbl]{1,2}|-[se]{1,2})?-\\[[^\\]]+\\]'),
    message: 'A fixed radius does not change with the appearance.',
    suggest: 'rounded-control, rounded-field, rounded-panel, rounded-overlay, rounded-dialog… or rounded-sm/md/lg/xl',
  },
  {
    id: 'hex-literal',
    severity: 'error',
    test: /(['"`])#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\1/gi,
    code: true,
    message: 'A hex color in code does not follow the theme.',
    suggest: "colors.<role> in sx/style (var(--color-…)); for a chart or canvas, resolveSchemeColors(usePlatformColorScheme(), { colors }).<role>",
  },
  {
    id: 'named-bw',
    severity: 'error',
    test: /\b(?:color|background|backgroundColor|bgcolor|borderColor|fill|stroke)\s*:\s*(['"])(?:white|black)\1/g,
    code: true,
    message: "'white' / 'black' in styles do not follow the theme.",
    suggest: 'colors.surface, colors.textStrong, colors.text',
  },
  {
    id: 'radius-token',
    severity: 'warn',
    test: /\bradius\.(?:sm|md|lg|xl)\b/g,
    code: true,
    message: 'radius.* holds fixed values; they do not change with the appearance.',
    suggest: "shape.<role> (shape.panel, shape.control, shape.field…) or 'var(--radius-sm)'",
  },
  {
    id: 'shadow-token',
    severity: 'warn',
    test: /\bshadows\.(?:popover|dropdownItem|modal|button|raised|alert|panel)\b/g,
    code: true,
    message: 'shadows.* holds the Classic light values; they do not change with the appearance or the dark scheme.',
    suggest: 'elevation.<same name> (import { elevation } from "@platform/ui")',
  },
  {
    id: 'resolve-colors',
    severity: 'info',
    test: /\bresolveColors\(/g,
    code: true,
    message: 'resolveColors returns the light scheme only.',
    suggest: 'resolveSchemeColors(usePlatformColorScheme(), { colors, darkColors, appearance }) where the app supports dark',
  },
  {
    id: 'css-fixed-color',
    severity: 'warn',
    test: /(?<![\w-])(?:color|background(?:-color)?|border(?:-[a-z]+)?-color|fill|stroke)\s*:\s*(?:#[0-9a-f]{3,8}|white|black|rgba?\([^)]*\))/gi,
    css: true,
    message: 'A fixed color in CSS does not follow the theme.',
    suggest: 'var(--color-<role>), e.g. var(--color-surface), var(--color-text), var(--color-border)',
  },
];

function* files(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) yield* files(path);
    else if (EXTENSIONS.has(extname(name)) && !SKIP_FILE.test(path)) yield path;
  }
}

const findings = [];
let fixedCount = 0;
for (const dir of dirs) {
  for (const path of files(dir)) {
    const isCss = /\.(css|scss)$/.test(path);
    const original = readFileSync(path, 'utf8');
    const lines = original.split('\n');
    let changed = false;
    lines.forEach((line, i) => {
      if (line.includes('platform-ui-audit-ignore')) return;
      for (const rule of rules) {
        if (rule.css && !isCss) continue;
        if (rule.code && isCss) continue;
        rule.test.lastIndex = 0;
        for (const m of line.matchAll(rule.test)) {
          const token = m[0];
          if (rule.skipIf?.test(token)) continue;
          const canFix = Boolean(rule.fix);
          findings.push({
            file: relative(process.cwd(), path),
            line: i + 1,
            column: m.index + 1,
            rule: rule.id,
            severity: rule.severity,
            found: token.trim(),
            message: rule.message,
            suggest: rule.suggest,
            fix: canFix ? rule.fix(token) : undefined,
          });
        }
        if (flag('--fix') && rule.fix) {
          rule.test.lastIndex = 0;
          const next = lines[i].replace(rule.test, (token) => (rule.skipIf?.test(token) ? token : rule.fix(token)));
          if (next !== lines[i]) {
            lines[i] = next;
            changed = true;
          }
        }
      }
    });
    if (changed) {
      writeFileSync(path, lines.join('\n'));
      fixedCount++;
    }
  }
}

findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);

if (flag('--json')) {
  console.log(JSON.stringify({ findings, fixedFiles: fixedCount }, null, 2));
} else {
  const byFile = Map.groupBy ? Map.groupBy(findings, (f) => f.file) : findings.reduce((m, f) => m.set(f.file, [...(m.get(f.file) ?? []), f]), new Map());
  const mark = { error: '✖', warn: '⚠', info: 'ℹ' };
  for (const [file, list] of byFile) {
    console.log(`\n${file}`);
    for (const f of list) {
      const fix = f.fix ? (flag('--fix') ? `  → fixed: ${f.fix}` : `  → fix: ${f.fix}`) : '';
      console.log(`  ${mark[f.severity]} ${f.line}:${f.column}  ${f.found}  [${f.rule}] ${f.message}${fix}`);
      if (!f.fix) console.log(`      use: ${f.suggest}`);
    }
  }
  const count = (s) => findings.filter((f) => f.severity === s).length;
  const fixable = findings.filter((f) => f.fix).length;
  console.log(
    `\n${findings.length} finding(s): ${count('error')} error, ${count('warn')} warning, ${count('info')} info` +
      (flag('--fix') ? `; fixed ${fixable} in ${fixedCount} file(s).` : fixable ? `; ${fixable} fixable with --fix.` : '.'),
  );
  if (!findings.length) console.log('Every style found follows the theme.');
}
if (flag('--strict') && findings.some((f) => f.severity !== 'info' && !(flag('--fix') && f.fix))) process.exit(1);
