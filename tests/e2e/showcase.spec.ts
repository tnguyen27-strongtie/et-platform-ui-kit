/// <reference types="node" />
import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { catalog } from '../../src/showcase/catalog';
import { collectErrors, tabKey } from './helpers';

// ---------- Coverage: every public export is demonstrated somewhere ----------

test('every kit export appears in a showcase demo', () => {
  const index = readFileSync(new URL('../../src/index.ts', import.meta.url), 'utf8');
  const exported = [...index.matchAll(/export\s*\{([^}]*)\}/g)]
    .flatMap((m) => m[1]!.split(','))
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith('type '))
    .map((part) => part.split(/\s+as\s+/).pop()!.trim());
  const demonstrated = new Set(catalog.flatMap((p) => p.sections.flatMap((s) => s.exports)));
  expect(exported.filter((name) => !demonstrated.has(name))).toEqual([]);
});

// ---------- Every page and section ----------

for (const { page: pageId, title, sections } of catalog) {
  test(`${title} page: all demos render, no console errors, passes axe`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`/#/${pageId}`);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    for (const section of sections) {
      await expect(page.locator(`[id="${section.id}"]`).getByRole('heading', { level: 2, name: section.title })).toBeVisible();
    }
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);

    const results = await new AxeBuilder({ page })
      // Default brand colors are a documented design decision (README, "Not included yet").
      .disableRules(['color-contrast'])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('overview links to every demo', async ({ page }) => {
  await page.goto('/');
  const total = catalog.reduce((n, p) => n + p.sections.length, 0);
  await expect(page.getByRole('main').locator('a[href*="/"]')).toHaveCount(total + catalog.length);
});

test('sidebar opens a page and scrolls to the section below the sticky bar', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Components' });
  await nav.getByRole('link', { name: 'GridView' }).click();
  await expect(page).toHaveURL(/#\/data\/grid-view$/);
  await expect(nav.getByRole('link', { name: 'Data display' })).toHaveAttribute('aria-current', 'page');
  const heading = page.locator('#grid-view').getByRole('heading', { name: 'GridView' });
  await expect(heading).toBeInViewport();
  // Not hidden under the sticky top bar.
  const top = (await heading.boundingBox())!.y;
  expect(top).toBeGreaterThan(54);
  await expect(page.locator('header').first()).toBeInViewport();
});

test('mobile: page picker replaces the sidebar, no sideways scrolling @mobile', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 1000) >= 768, 'mobile layout only');
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Components' })).toBeHidden();
  await page.getByRole('combobox', { name: 'Go to page' }).click();
  await page.getByRole('option', { name: 'Forms' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Forms' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
});

for (const hash of ['#workspace', '#workspace-columns']) {
  test(`full-screen workspace ${hash} renders without console errors @mobile`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`/${hash}`);
    await expect(page.getByRole('tab').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

// ---------- Global settings ----------

test('brand color applies to MUI styles and Tailwind classes at runtime', async ({ page }) => {
  await page.goto('/#/actions');
  const primary = page.locator('#button').getByRole('button', { name: 'Calculate', exact: true }).first();
  await expect(primary).toHaveCSS('background-color', 'rgb(168, 103, 29)');
  await page.getByRole('combobox', { name: 'Brand color' }).click();
  await page.getByRole('option', { name: 'Blue' }).click();
  await expect(primary).toHaveCSS('background-color', 'rgb(31, 95, 153)');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-brand').trim())).toBe('#1f5f99');
  // Tailwind class bound to a role color (TopNav bottom border uses border-accent).
  await expect(page.locator('header').first()).toHaveCSS('border-bottom-color', 'rgb(31, 95, 153)');
  // Foundations shows the derived palette for the selected brand.
  await page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: 'Colors' }).click();
  await expect(page.locator('#colors')).toContainText('#1f5f99');
});

test('text size switch changes the body density', async ({ page }) => {
  await page.goto('/#/foundations/typography');
  await expect(page.locator('body')).toHaveCSS('font-size', '14px');
  await page.getByRole('switch', { name: 'Expanded text' }).click();
  await expect(page.locator('body')).toHaveCSS('font-size', '16px');
});

test('math formulas load the bundled math font for every glyph', async ({ page }) => {
  await page.goto('/#/foundations/math');
  const formula = page.locator('#math math').first();
  await expect(formula).toBeVisible();
  expect(await formula.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?STIX Two Math"?/);
  expect(await page.locator('#math .font-math').first().evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?STIX Two Math"?/);
  // No unicode-range: operators and Greek letters come from the same face, not a fallback.
  const faces = await page.evaluate(async () => {
    const loaded = await document.fonts.load('16px "STIX Two Math"', '∑√σ≤');
    return loaded.map((f) => ({ family: f.family, status: f.status, unicodeRange: f.unicodeRange }));
  });
  expect(faces).toEqual([{ family: 'STIX Two Math', status: 'loaded', unicodeRange: 'U+0-10FFFF' }]);
});

test('math calculator demo substitutes the inputs into the formula', async ({ page }) => {
  await page.goto('/#/foundations/math');
  const result = page.locator('#math output');
  await expect(result).toContainText('2,160');
  const span = page.getByRole('spinbutton', { name: 'Span L' });
  await span.fill('10');
  await span.blur();
  await expect(result).toContainText('1,500');
  await span.fill('');
  await span.blur();
  await expect(result).toContainText('–');
});

// ---------- Demos that exist only in the showcase ----------

test.describe('Forms page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/forms');
  });

  test('labels, hints and errors reach every control', async ({ page }) => {
    await expect(page.getByRole('combobox', { name: 'Connection type' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Product (searchable)' })).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: 'Country (row)' })).toBeVisible();
    const required = page.getByRole('textbox', { name: 'Required with error' });
    await expect(required).toHaveAttribute('aria-invalid', 'true');
    await expect(required).toHaveAttribute('required', '');
    await expect(required).toHaveAccessibleDescription('Project name is required.');
    await expect(page.getByRole('textbox', { name: 'Disabled' })).toBeDisabled();
    // Custom control wired through useFormField.
    await expect(page.getByRole('slider', { name: 'Custom control (useFormField)' })).toHaveAccessibleDescription('Native range input wired to the field.');
  });

  test('NumberInput: clamps on blur when clampBehavior="blur"', async ({ page }) => {
    const input = page.getByRole('spinbutton', { name: 'Spacing (clamped on blur)' });
    await input.fill('7');
    await input.blur();
    await expect(input).toHaveValue('1');
  });

  test('NumberInput: out-of-range value is flagged with the field error', async ({ page }) => {
    const input = page.getByRole('spinbutton', { name: 'Member thickness' });
    await input.fill('4');
    await input.blur();
    await expect(input).toHaveValue('4.000');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription(/Must be between 1\.5 and 3\.5 in\./);
  });

  test('indeterminate parent checkbox follows its children', async ({ page }) => {
    const all = page.getByRole('checkbox', { name: 'All members' });
    // Native indeterminate state (announced as "mixed"), not a conflicting aria-checked.
    await expect(all).toBeChecked({ indeterminate: true });
    await expect(all).not.toHaveAttribute('aria-checked');
    await page.getByRole('checkbox', { name: 'Main member' }).check();
    await expect(all).toBeChecked();
    await all.uncheck();
    await expect(page.getByRole('checkbox', { name: 'Side member' })).not.toBeChecked();
  });

  test('keyboard focus is visible on checkbox and switch', async ({ page, browserName }) => {
    for (const [role, name] of [
      ['checkbox', 'Show notes'],
      ['switch', 'Metric units'],
    ] as const) {
      const control = page.getByRole(role, { name });
      await control.focus();
      await page.keyboard.press(tabKey(browserName, true));
      await page.keyboard.press(tabKey(browserName));
      const outlined = await control.evaluate((el) => {
        const root = el.closest('.MuiCheckbox-root, .MuiSwitch-root');
        const target = root?.classList.contains('MuiSwitch-root') ? root.querySelector('.MuiSwitch-track') : root;
        return target ? getComputedStyle(target).outlineStyle : 'none';
      });
      expect(outlined, name).toBe('solid');
    }
  });
});

test('Actions page: disabled primary button is faded, not darker', async ({ page }) => {
  await page.goto('/#/actions');
  const section = page.locator('#button');
  const enabled = section.getByRole('button', { name: 'Calculate', exact: true }).first();
  const disabled = section.getByRole('button', { name: 'primary', exact: true });
  await expect(disabled).toBeDisabled();
  const style = (l: typeof enabled) => l.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, opacity: getComputedStyle(el).opacity }));
  const [d, e] = [await style(disabled), await style(enabled)];
  expect(d.bg).toBe(e.bg);
  expect(Number(d.opacity)).toBeLessThan(0.5);
});

test('Overlays page: destructive confirm focuses Cancel and ignores backdrop clicks', async ({ page }) => {
  await page.goto('/#/overlays/confirm-dialog');
  const opener = page.getByRole('button', { name: 'Reset inputs (destructive)' });
  await opener.click();
  const dialog = page.getByRole('alertdialog', { name: 'Reset all inputs?' });
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.mouse.click(5, 300);
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test('Feedback page: ErrorBoundary contains a crash and recovers with new data', async ({ page }) => {
  await page.goto('/#/feedback/error-boundary');
  const section = page.locator('#error-boundary');
  await section.getByRole('button', { name: 'Break the panel' }).click();
  await expect(section.getByRole('alert')).toContainText('Something went wrong');
  await expect(page.getByRole('heading', { level: 1, name: 'Feedback' })).toBeVisible();
  await section.getByRole('button', { name: 'Load fixed data' }).click();
  await expect(section.getByText('Result panel rendered normally.')).toBeVisible();
});

test('Data page: card title is bold on a highlighted header with 8px body padding', async ({ page }) => {
  await page.goto('/#/data/card');
  const card = page.locator('section', { has: page.getByRole('heading', { name: 'Fastener capacity' }) }).last();
  await expect(card.getByRole('heading', { name: 'Fastener capacity' })).toHaveCSS('font-weight', '700');
  await expect(card.locator('header')).toHaveCSS('background-color', 'rgb(250, 250, 250)');
  await expect(card.locator('header + div')).toHaveCSS('padding', '8px');
});

test('full-screen workspace: collapse-all drives every input section', async ({ page }) => {
  await page.goto('/#workspace');
  const headers = page.getByRole('button', { name: /Connection type|Load properties|Member properties/ });
  await expect(headers).toHaveCount(3);
  await page.getByRole('button', { name: 'Collapse all sections' }).click();
  for (const h of await headers.all()) await expect(h).toHaveAttribute('aria-expanded', 'false');
  await headers.first().click();
  await expect(page.getByRole('button', { name: 'Collapse all sections' })).toBeVisible();
  await page.getByRole('button', { name: 'Collapse all sections' }).click();
  await page.getByRole('button', { name: 'Expand all sections' }).click();
  for (const h of await headers.all()) await expect(h).toHaveAttribute('aria-expanded', 'true');
});

// ---------- Theme builder ----------

test.describe('Theme builder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#/theme');
  });

  const brandField = (page: import('@playwright/test').Page) => page.getByRole('textbox', { name: 'brand', exact: true });
  const exported = (page: import('@playwright/test').Page) => page.locator('#export pre').first();
  const previewButton = (page: import('@playwright/test').Page) => page.locator('#brand').getByRole('button', { name: 'Calculate' });

  test('brand color applies everywhere, derives shades, and exports only what changed', async ({ page }) => {
    await brandField(page).fill('#1f5f99');
    await expect(previewButton(page)).toHaveCSS('background-color', 'rgb(31, 95, 153)');
    await expect(page.getByRole('combobox', { name: 'Brand color' })).toHaveText('Blue');
    await expect(page.locator('#roles')).toContainText('Derived from brand');
    await expect(exported(page)).toHaveText(JSON.stringify({ version: 1, colors: { brand: '#1f5f99' } }, null, 2));
    // Another page uses the same theme.
    await page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: 'Button', exact: true }).click();
    await expect(page.locator('#button').getByRole('button', { name: 'Calculate', exact: true }).first()).toHaveCSS('background-color', 'rgb(31, 95, 153)');
  });

  test('an invalid color is flagged and never applied', async ({ page }) => {
    await brandField(page).fill('blue-ish');
    await expect(brandField(page)).toHaveAttribute('aria-invalid', 'true');
    await expect(brandField(page)).toHaveAccessibleDescription(/Use #rrggbb/);
    await expect(previewButton(page)).toHaveCSS('background-color', 'rgb(168, 103, 29)');
  });

  test('any role can be overridden and reset', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Show all roles (advanced)' }).check();
    const danger = page.getByRole('textbox', { name: 'danger', exact: true });
    await danger.fill('#9b1c1c');
    await expect(exported(page)).toContainText('"danger": "#9b1c1c"');
    await page.getByRole('button', { name: 'Reset danger' }).click();
    await expect(danger).toHaveValue('');
    await expect(exported(page)).not.toContainText('danger');
  });

  test('contrast check re-evaluates as colors change', async ({ page }) => {
    const links = page.getByTestId('contrast-Links');
    await expect(links).toContainText('Fail');
    await page.getByRole('checkbox', { name: 'Show all roles (advanced)' }).check();
    await page.getByRole('textbox', { name: 'link', exact: true }).fill('#0b5cad');
    await expect(links).toContainText('Pass');
  });

  test('text size is part of the theme', async ({ page }) => {
    await page.getByRole('radio', { name: 'Expanded (16px)' }).check();
    await expect(page.locator('body')).toHaveCSS('font-size', '16px');
    await expect(exported(page)).toContainText('"density": "expanded"');
  });

  test('the theme survives a reload; Reset returns to kit defaults', async ({ page }) => {
    await brandField(page).fill('#2e7d32');
    await page.reload();
    await expect(brandField(page)).toHaveValue('#2e7d32');
    await expect(previewButton(page)).toHaveCSS('background-color', 'rgb(46, 125, 50)');
    await page.getByRole('button', { name: 'Reset to kit defaults' }).click();
    await expect(exported(page)).toHaveText('{\n  "version": 1\n}');
    await expect(previewButton(page)).toHaveCSS('background-color', 'rgb(168, 103, 29)');
  });

  test('TypeScript export and download', async ({ page }) => {
    await brandField(page).fill('#6a3d9a');
    await page.getByRole('tab', { name: 'theme.config.ts' }).click();
    await expect(page.locator('#export pre').filter({ hasText: 'definePlatformTheme' })).toContainText("import { definePlatformTheme } from '@platform/ui';");
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download theme.config.ts' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('theme.config.ts');
  });

  test('import: errors are reported and nothing changes; valid files apply with warnings', async ({ page }) => {
    const input = page.getByRole('textbox', { name: 'Paste a theme.json' });
    await input.fill('{"colors":{"brand":"not-a-color"}}');
    await page.getByRole('button', { name: 'Apply pasted theme' }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Theme not applied' })).toContainText('colors.brand');
    await expect(previewButton(page)).toHaveCSS('background-color', 'rgb(168, 103, 29)');

    await input.fill('{"version":1,"name":"Acme","colors":{"brand":"#1f5f99","sparkle":"#fff"}}');
    await page.getByRole('button', { name: 'Apply pasted theme' }).click();
    await expect(previewButton(page)).toHaveCSS('background-color', 'rgb(31, 95, 153)');
    await expect(page.getByRole('textbox', { name: 'Theme name' })).toHaveValue('Acme');
    await expect(page.locator('#export')).toContainText('Unknown color role "sparkle" ignored.');
  });

  test('import from a file round-trips an exported theme', async ({ page }) => {
    await page.getByTestId('theme-file').setInputFiles({
      name: 'theme.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ version: 1, colors: { brand: '#2e7d32' }, density: 'expanded' })),
    });
    await expect(previewButton(page)).toHaveCSS('background-color', 'rgb(46, 125, 50)');
    await expect(page.getByRole('radio', { name: 'Expanded (16px)' })).toBeChecked();
    await expect(exported(page)).toHaveText(JSON.stringify({ version: 1, colors: { brand: '#2e7d32' }, density: 'expanded' }, null, 2));
  });
});

test('Showcase: the Neon Grid example theme applies, survives a reload and can be left', async ({ page }) => {
  await page.goto('/#/actions');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const primary = page.getByRole('button', { name: 'Calculate' }).first();
  await expect(primary).toHaveCSS('background-color', 'rgb(168, 103, 29)');

  await page.getByRole('combobox', { name: 'Appearance' }).click();
  await page.getByRole('option', { name: 'Neon Grid (example)' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-appearance', 'neon-grid');
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark');
  await expect(primary).toHaveCSS('background-color', 'rgb(252, 238, 10)');

  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-appearance', 'neon-grid');
  await expect(page.getByRole('combobox', { name: 'Appearance' })).toHaveText('Neon Grid (example)');

  // Leaving an example drops its colors and scheme instead of mixing them into Classic.
  await page.getByRole('combobox', { name: 'Appearance' }).click();
  await page.getByRole('option', { name: 'Classic' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-appearance', 'classic');
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'light');
  await expect(primary).toHaveCSS('background-color', 'rgb(168, 103, 29)');
});
