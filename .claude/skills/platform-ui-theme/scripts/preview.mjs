#!/usr/bin/env node
/**
 * Before/after screenshots of a running app (or the kit showcase) with a theme preview stylesheet
 * injected, so a theme can be judged before any app code changes.
 *
 *   node preview.mjs --url http://localhost:5173 --css preview.css --out shots \
 *     [--paths "/,/#/forms,/#workspace"] [--appearance acme-glass] [--mobile] [--clear-storage]
 *
 * --css comes from `theme-tool.mjs <draft> --css preview.css`. Screenshots land in --out as
 * <n>-<path>-before.png / -after.png (and -mobile- variants with --mobile).
 * Needs Playwright (`playwright` or `@playwright/test`) installed in the current project, and
 * a browser (`npx playwright install chromium`).
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(name);

const url = option('--url');
const cssPath = option('--css');
const out = resolve(option('--out', 'theme-preview'));
const paths = option('--paths', '/').split(',').map((p) => p.trim()).filter(Boolean);
const appearanceName = option('--appearance');
if (!url || !cssPath) {
  console.error('Usage: node preview.mjs --url <app url> --css <preview.css> [--out dir] [--paths "/,/#/forms"] [--appearance name] [--mobile] [--clear-storage]');
  process.exit(1);
}
if (!existsSync(cssPath)) {
  console.error(`✖ ${cssPath} not found. Create it with theme-tool.mjs <draft.json> --css ${cssPath}`);
  process.exit(1);
}
const css = readFileSync(cssPath, 'utf8');

const require = createRequire(join(process.cwd(), 'package.json'));
let chromium;
for (const pkg of ['playwright', '@playwright/test']) {
  try {
    const mod = await import(pathToFileURL(require.resolve(pkg)).href);
    // CommonJS entry: named exports may only be on `default`.
    chromium = mod.chromium ?? mod.default?.chromium;
    if (chromium) break;
  } catch {
    // try the next package
  }
}
if (!chromium) {
  console.error('✖ Playwright is not installed here. Install it for the preview (pnpm add -D playwright && npx playwright install chromium), or review the theme by hand in the running app.');
  process.exit(1);
}

mkdirSync(out, { recursive: true });
const viewports = [{ tag: '', viewport: { width: 1400, height: 900 } }];
if (flag('--mobile')) viewports.push({ tag: '-mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

const slug = (p) => p.replace(/^[/#]+/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
const browser = await chromium.launch();
const problems = [];
for (const { tag, ...contextOptions } of viewports) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.on('pageerror', (e) => problems.push(`${page.url()}: ${e.message}`));
  for (const [i, p] of paths.entries()) {
    const target = new URL(p, url).href;
    const name = `${String(i + 1).padStart(2, '0')}-${slug(p)}${tag}`;
    await page.goto(target, { waitUntil: 'networkidle' });
    if (flag('--clear-storage')) {
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle' });
    }
    await page.screenshot({ path: join(out, `${name}-before.png`) });
    await page.addStyleTag({ content: css });
    if (appearanceName) await page.evaluate((n) => (document.body.dataset.appearance = n), appearanceName);
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(out, `${name}-after.png`) });
    console.log(`✓ ${target} → ${name}-{before,after}.png`);
  }
  await context.close();
}
await browser.close();
for (const p of problems) console.log(`⚠ page error: ${p}`);
console.log(`Screenshots in ${out}`);
