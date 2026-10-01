#!/usr/bin/env node
/**
 * Previews a theme. Two modes:
 *
 * 1. Real provider (preferred): renders a sampler page (a calculator workspace and a component
 *    gallery) with PlatformThemeProvider and the theme file, served by the project's own Vite, so
 *    fonts, the MUI palette and the dark scheme are exactly what the app gets.
 *
 *    node preview.mjs --theme src/theme.config.ts --serve              open it in a browser (Ctrl+C stops and cleans up)
 *    node preview.mjs --theme src/theme.config.ts --out theme-preview  screenshots, light and dark [--mobile]
 *
 * 2. Injected CSS: before/after screenshots of any running page (the app's own screens) with the
 *    variables from `theme-tool.mjs <draft> --css preview.css [--scheme dark]` injected. Colors MUI
 *    computes from its palette keep the old values in this mode.
 *
 *    node preview.mjs --url http://localhost:5173 --css preview.css --out shots \
 *      [--paths "/,/#/forms"] [--appearance acme-glass] [--scheme dark] [--mobile] [--clear-storage]
 *
 * The sampler lives in theme-preview-<port>.tmp/ while it runs and is removed afterwards.
 * Run from the project root (the app, or the kit repository). Needs Vite in the project for mode 1
 * and Playwright (`playwright` or `@playwright/test`) for screenshots.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(name);
const fail = (message) => {
  console.error(`✖ ${message}`);
  process.exit(1);
};

const root = process.cwd();
const require = createRequire(join(root, 'package.json'));
const out = resolve(option('--out', 'theme-preview'));
const slug = (p) => p.replace(/^[/#?]+/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
const viewports = [{ tag: '', viewport: { width: 1400, height: 900 } }];
if (flag('--mobile')) viewports.push({ tag: '-mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function loadChromium() {
  for (const pkg of ['playwright', '@playwright/test']) {
    try {
      const mod = await import(pathToFileURL(require.resolve(pkg)).href);
      // CommonJS entry: named exports may only be on `default`.
      const chromium = mod.chromium ?? mod.default?.chromium;
      if (chromium) return chromium;
    } catch {
      // try the next package
    }
  }
  return null;
}

/** Opens every target in each viewport and hands the page to `capture`; returns page errors. */
async function shoot(chromium, targets, capture) {
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const problems = [];
  for (const { tag, ...contextOptions } of viewports) {
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    page.on('pageerror', (e) => problems.push(`${page.url()}: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && problems.push(`${page.url()}: ${m.text()}`));
    for (const t of targets) {
      await page.goto(t.url, { waitUntil: 'networkidle' });
      await capture(page, t, tag);
    }
    await context.close();
  }
  await browser.close();
  return problems;
}

// ---------- Mode 1: real provider ----------
const themeFile = option('--theme');
if (themeFile) {
  const themePath = resolve(themeFile);
  if (!existsSync(themePath)) fail(`${themeFile} not found. Write it first: theme-tool.mjs <draft.json> --write ${themeFile}`);
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const inKit = pkg.name === '@platform/ui';
  const viteBin = join(root, 'node_modules/.bin/vite');
  if (!existsSync(viteBin)) fail('Vite is not installed in this project (node_modules/.bin/vite). Use the --css mode instead.');

  const freePort = () =>
    new Promise((res) => {
      const s = createServer().listen(0, () => {
        const p = s.address().port;
        s.close(() => res(p));
      });
    });
  const port = Number(option('--port', 0)) || (await freePort());
  // One folder per run (named after the port), so parallel previews never share or delete each other's files.
  const dirName = `theme-preview-${port}.tmp`;
  const dir = join(root, dirName);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  // In the kit repository '@platform/ui' is the package itself: use the sources, and copy the theme
  // file with its import pointed at them. In an app, import the theme file where it is (live edits).
  let themeImport;
  if (inKit) {
    writeFileSync(join(dir, 'theme.ts'), readFileSync(themePath, 'utf8').replaceAll("'@platform/ui'", "'../src/index'"));
    themeImport = './theme';
  } else {
    themeImport = relative(dir, themePath).replace(/\\/g, '/').replace(/\.(t|j)sx?$/, '');
    if (!themeImport.startsWith('.')) themeImport = `./${themeImport}`;
  }
  const template = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../templates/sampler.tsx'), 'utf8');
  writeFileSync(
    join(dir, 'main.tsx'),
    template
      .replace("'__KIT_CSS__'", inKit ? "'../src/theme/theme.css'" : "'@platform/ui/theme.css'")
      .replace("'__KIT__'", inKit ? "'../src/index'" : "'@platform/ui'")
      .replace("'__THEME__'", `'${themeImport}'`),
  );
  writeFileSync(
    join(dir, 'index.html'),
    '<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Theme preview</title></head>\n<body><div id="root"></div><script type="module" src="./main.tsx"></script></body>\n</html>\n',
  );

  const server = spawn(viteBin, ['--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  server.stdout.on('data', (d) => (log += d));
  server.stderr.on('data', (d) => (log += d));
  const stop = () => {
    server.kill();
    rmSync(dir, { recursive: true, force: true });
  };
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => {
      stop();
      process.exit(0);
    });
  }

  const base = `http://localhost:${port}/${dirName}/index.html`;
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    await new Promise((r) => setTimeout(r, 500));
    up = await fetch(base).then(
      (r) => r.ok,
      () => false,
    );
  }
  if (!up) {
    stop();
    fail(`Vite did not start:\n${log}`);
  }

  if (flag('--serve')) {
    console.log("Theme preview (real provider), served by this project's Vite:\n");
    console.log(`  Workspace, light:   ${base}?scheme=light#workspace`);
    console.log(`  Workspace, dark:    ${base}?scheme=dark#workspace`);
    console.log(`  Components:         ${base}?scheme=light#components`);
    console.log(`\nSwitch page and scheme in the top bar.${inKit ? ' The kit repository uses a copy of the theme file: rerun after editing it.' : ' Edits to the theme file reload the page.'}`);
    console.log(`Ctrl+C stops the server and removes ${dirName}/.`);
    await new Promise(() => undefined);
  }

  const chromium = await loadChromium();
  if (!chromium) {
    stop();
    fail('Playwright is not installed here, so no screenshots. Rerun with --serve and open the page in a browser.');
  }
  const targets = ['light', 'dark'].flatMap((scheme) =>
    ['workspace', 'components'].map((page) => ({ url: `${base}?scheme=${scheme}#${page}`, name: `${page}-${scheme}` })),
  );
  const problems = await shoot(chromium, targets, async (page, t, tag) => {
    await page.waitForTimeout(700);
    await page.screenshot({ path: join(out, `${t.name}${tag}.png`) });
    console.log(`✓ ${t.name}${tag}.png`);
  });
  stop();
  for (const p of problems) console.log(`⚠ page error: ${p}`);
  console.log(`Screenshots in ${out}`);
  process.exit(0);
}

// ---------- Mode 2: injected CSS ----------
const url = option('--url');
const cssPath = option('--css');
if (!url || !cssPath) {
  console.error(
    'Usage:\n  node preview.mjs --theme src/theme.config.ts [--serve | --out dir] [--mobile]\n  node preview.mjs --url <app url> --css <preview.css> [--out dir] [--paths "/,/#/forms"] [--appearance name] [--scheme dark] [--mobile] [--clear-storage]',
  );
  process.exit(1);
}
if (!existsSync(cssPath)) fail(`${cssPath} not found. Create it with theme-tool.mjs <draft.json> --css ${cssPath}`);
const css = readFileSync(cssPath, 'utf8');
const paths = option('--paths', '/').split(',').map((p) => p.trim()).filter(Boolean);
const appearanceName = option('--appearance');
const scheme = option('--scheme');

const chromium = await loadChromium();
if (!chromium) {
  fail('Playwright is not installed here. Install it for the preview (npm install -D playwright && npx playwright install chromium), or review the theme by hand in the running app.');
}
const targets = paths.map((p, i) => ({ url: new URL(p, url).href, name: `${String(i + 1).padStart(2, '0')}-${slug(p)}` }));
const problems = await shoot(chromium, targets, async (page, t, tag) => {
  if (flag('--clear-storage')) {
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
  }
  await page.screenshot({ path: join(out, `${t.name}${tag}-before.png`) });
  await page.addStyleTag({ content: css });
  if (appearanceName) await page.evaluate((n) => (document.body.dataset.appearance = n), appearanceName);
  // Tailwind dark: variants and app CSS key off <html data-color-scheme>.
  if (scheme) await page.evaluate((s) => (document.documentElement.dataset.colorScheme = s), scheme);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(out, `${t.name}${tag}-after.png`) });
  console.log(`✓ ${t.url} → ${t.name}${tag}-{before,after}.png`);
});
for (const p of problems) console.log(`⚠ page error: ${p}`);
console.log(`Screenshots in ${out}`);
