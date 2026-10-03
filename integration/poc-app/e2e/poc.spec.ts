// User journeys through the PoC, run against the production build of an app that installed the
// release tarball. They check that the kit works inside an app, not each component in detail
// (the kit's own e2e suite does that).
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const errors: string[] = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'I agree' }).click();
  await expect(page.getByRole('dialog', { name: 'License agreement' })).toBeHidden();
});

test.afterEach(() => {
  expect(errors, 'console errors').toEqual([]);
});

/**
 * The kit's own rule: light-scheme color contrast is a documented gap (kit README, "Not included
 * yet"), so it is checked only in the dark scheme. Waits for transitions first, or axe measures
 * in-between colors.
 */
async function axe(page: Page, { contrast = false } = {}) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
  const builder = new AxeBuilder({ page });
  if (!contrast) builder.disableRules(['color-contrast']);
  const result = await builder.analyze();
  const serious = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

async function calculate(page: Page) {
  await page.getByRole('button', { name: 'Calculate' }).first().click();
  await expect(page.getByRole('table', { name: 'Fastener results' })).toBeVisible();
}

test('the app starts with the theme, fonts and an accessible workspace', async ({ page }) => {
  await expect(page.getByRole('tab', { name: 'Calculation 1' })).toBeVisible();
  // theme.css loaded and the provider ran
  await expect(page.locator('body')).toHaveAttribute('data-appearance', 'classic');
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'light');
  // A Tailwind role class from app code resolves to the theme's brand color
  // rgb(31, 95, 153) is #1f5f99, the brand color set in src/theme.config.ts.
  await expect(page.getByText('Connection Calculator').first()).toHaveCSS('color', 'rgb(31, 95, 153)');
  // Fonts from the kit's @fontsource dependencies are loaded in a built app
  expect(await page.evaluate(async () => (await document.fonts.ready, document.fonts.check('16px "Inter Variable"')))).toBe(true);
  // The release notes do not open on a first visit
  await expect(page.getByRole('dialog', { name: /Connection Calculator/ })).toBeHidden();
  await axe(page);
});

test('number inputs, validation and a full calculation', async ({ page }) => {
  const side = page.getByRole('spinbutton', { name: /side member/ });
  await side.fill('2,5');
  await side.blur();
  await expect(side).toHaveValue('2.500');
  await side.fill('9');
  await expect(page.getByText('Must be between 0.75 and 3.5 in.')).toBeVisible();
  await side.fill('1.5');

  await page.getByRole('combobox', { name: 'Wood species' }).fill('epicea');
  await page.getByRole('option', { name: /Épicéa/ }).click();

  await calculate(page);
  await expect(page.getByText('Calculation finished')).toBeVisible();
  const grid = page.getByRole('table', { name: 'Fastener results' });
  await page.getByPlaceholder('Search model, material…').fill('lag');
  await expect(grid.getByRole('row')).toHaveCount(1 + 1 + 2); // header, filter row, 2 lag screws
  await grid.getByRole('row', { name: /LAG50600/ }).click();
  await expect(page.getByText('Selected: LAG50600')).toBeVisible();
  await axe(page);
});

test('a failed request shows an error with retry', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Notes' }).fill('fail');
  await page.getByRole('button', { name: 'Calculate' }).first().click();
  await expect(page.getByText('The calculation failed')).toBeVisible();
  await expect(page.getByText('Reference: poc-trace-0001')).toBeVisible();
  await page.getByRole('textbox', { name: 'Notes' }).fill('');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('table', { name: 'Fastener results' })).toBeVisible();
});

test('several calculations: add, change, close with confirmation', async ({ page }) => {
  await page.getByRole('button', { name: 'New calculation' }).click();
  const second = page.getByRole('tab', { name: /Calculation 2/ });
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('spinbutton', { name: 'Rows' }).fill('3');
  await expect(second).toHaveAccessibleName(/Unsaved changes/);
  await second.press('Delete');
  const confirm = page.getByRole('alertdialog', { name: 'Close Calculation 2?' });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Close calculation' }).click();
  await expect(second).toBeHidden();
  await expect(page.getByRole('tab', { name: 'Calculation 1' })).toHaveAttribute('aria-selected', 'true');
});

test('settings switch dark mode, glass and text size across the app', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await dialog.getByRole('radio', { name: 'Dark' }).check();
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark');
  await dialog.getByRole('combobox', { name: 'Appearance' }).click();
  await page.getByRole('option', { name: 'Glass' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-appearance', 'glass');
  await dialog.getByRole('switch', { name: 'Larger text' }).check();
  await expect(page.locator('body')).toHaveClass(/density-expanded/);
  await dialog.getByRole('button', { name: 'Done' }).click();
  await calculate(page);
  await axe(page, { contrast: true });
  // Settings survive a reload
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark');
});

test('help, formulas and release notes', async ({ page }) => {
  await page.getByRole('button', { name: 'Help' }).click();
  await page.getByRole('menuitem', { name: "What's new" }).click();
  // The dialog is named by its appName, "CC" (App.tsx).
  const notes = page.getByRole('dialog', { name: /CC/ });
  await expect(notes.getByRole('heading', { name: /3\.1\.0/ })).toBeVisible();
  await notes.getByRole('button', { name: 'Close' }).last().click();

  await page.getByRole('button', { name: 'Help' }).click();
  await page.getByRole('menuitem', { name: 'Help' }).click();
  const help = page.getByRole('dialog', { name: 'Help' });
  await help.getByRole('tab', { name: 'Formulas' }).click();
  await expect(help.locator('math').first()).toBeVisible();
  await help.getByRole('tab', { name: 'Number input' }).click();
  await expect(help.getByRole('table', { name: 'Number helper results' })).toContainText('1 7/16"');
  await axe(page);
});

test('mobile shows one section at a time @mobile', async ({ page }) => {
  // The desktop section headers stay in the DOM, hidden; the mobile tab bar is the visible one.
  await expect(page.getByRole('tab', { name: 'Input' }).filter({ visible: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Output' }).filter({ visible: true }).click();
  await expect(page.getByText('No results yet')).toBeVisible();
});
