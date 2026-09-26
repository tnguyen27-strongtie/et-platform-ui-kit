/// <reference types="node" />
import { readFileSync } from 'node:fs';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { catalog } from '../../src/showcase/catalog';
import { collectErrors } from './helpers';

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
      // FD brand colors are a documented design decision (README, "Chưa có trong kit").
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

  test('keyboard focus is visible on checkbox and switch', async ({ page }) => {
    for (const [role, name] of [
      ['checkbox', 'Show notes'],
      ['switch', 'Metric units'],
    ] as const) {
      const control = page.getByRole(role, { name });
      await control.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');
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
