import { expect, type Page, test } from '@playwright/test';

import { expectOut, openFixture } from '../helpers';

test.describe('Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'tabs');
  });

  test('tabs and panels are linked for assistive tech', async ({ page }) => {
    await expect(page.getByRole('tablist', { name: 'Calculator views' })).toBeVisible();
    const tab = page.getByRole('tab', { name: 'Inputs' });
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    const panelId = await tab.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    const panel = page.locator(`[id="${panelId}"]`);
    await expect(panel).toHaveAttribute('role', 'tabpanel');
    await expect(panel).toHaveAttribute('aria-labelledby', (await tab.getAttribute('id'))!);
    await expect(page.getByRole('tabpanel', { name: 'Inputs' })).toBeVisible();
  });

  test('click switches the panel', async ({ page }) => {
    await page.getByRole('tab', { name: 'Results' }).click();
    await expectOut(page, 'tab', 'results');
    await expect(page.getByRole('tabpanel', { name: 'Results' })).toHaveText('Results panel');
    await expect(page.getByRole('tab', { name: 'Inputs' })).toHaveAttribute('aria-selected', 'false');
  });

  test('arrow keys, Home and End move focus and skip disabled tabs', async ({ page }) => {
    await page.getByRole('tab', { name: 'Inputs' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Results' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Notes' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(page.getByRole('tab', { name: 'Inputs' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: 'Notes' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expectOut(page, 'tab', 'notes');
    await expect(page.getByRole('tab', { name: 'Report' })).toBeDisabled();
  });

  test('keepMounted panel keeps its state while hidden', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Kept input' }).fill('typed value');
    await page.getByRole('tab', { name: 'Results' }).click();
    await expect(page.getByRole('textbox', { name: 'Kept input' })).toBeHidden();
    await page.getByRole('tab', { name: 'Inputs' }).click();
    await expect(page.getByRole('textbox', { name: 'Kept input' })).toHaveValue('typed value');
  });
});

test.describe('Accordion', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'accordion');
  });

  test('header button toggles the region with click, Enter and Space', async ({ page }) => {
    const header = page.getByRole('button', { name: 'Uncontrolled section' });
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Uncontrolled body')).toBeHidden();
    await header.click();
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Uncontrolled body')).toBeVisible();
    await header.press('Enter');
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await header.press(' ');
    await expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  test('header sits inside a heading and controls its region', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Uncontrolled section', level: 3 })).toBeVisible();
    const header = page.getByRole('button', { name: 'Uncontrolled section' });
    const regionId = await header.getAttribute('aria-controls');
    // Exactly one element per id (no duplicate ids), and it is the labelled region.
    const region = page.locator(`[id="${regionId}"]`);
    await expect(region).toHaveCount(1);
    await expect(region).toHaveAttribute('role', 'region');
    await expect(region).toHaveAttribute('aria-labelledby', (await header.getAttribute('id'))!);
  });

  test('controlled accordion reports booleans and follows its prop', async ({ page }) => {
    const header = page.getByRole('button', { name: 'Controlled section', exact: true });
    await header.click();
    await header.click();
    await expectOut(page, 'events', [true, false]);
    await expect(header).toHaveAttribute('aria-expanded', 'false');
  });

  test('expand/collapse all drives the whole group', async ({ page }) => {
    const a = page.getByRole('button', { name: 'Group A' });
    const b = page.getByRole('button', { name: 'Group B' });
    await page.getByRole('button', { name: 'Collapse all sections' }).click();
    await expect(a).toHaveAttribute('aria-expanded', 'false');
    await expect(b).toHaveAttribute('aria-expanded', 'false');
    await page.getByRole('button', { name: 'Expand all sections' }).click();
    await expect(a).toHaveAttribute('aria-expanded', 'true');
    await expect(b).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('DropdownMenu', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'menu');
  });

  test('menu button exposes its popup state', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Actions' });
    await expect(button).toHaveAttribute('aria-haspopup', 'menu');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    // The open menu is modal: the rest of the page is hidden from assistive tech meanwhile.
    await expect(page.getByRole('button', { name: 'Actions', includeHidden: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('menu', { name: 'Actions' })).toBeVisible();
  });

  test('keyboard: open, skip disabled item, select, focus returns', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Actions' });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expectOut(page, 'picked', ['delete']);
    await expect(page.getByRole('menu')).toBeHidden();
    await expect(button).toBeFocused();
  });

  test('Escape closes without selecting', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Actions' });
    await button.click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toBeHidden();
    await expect(button).toBeFocused();
    await expectOut(page, 'picked', []);
  });

  test('disabled item does nothing', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();
    const dup = page.getByRole('menuitem', { name: 'Duplicate' });
    await expect(dup).toHaveAttribute('aria-disabled', 'true');
    await dup.click({ force: true });
    await expectOut(page, 'picked', []);
  });
});

test.describe('Menu sizing', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'menu');
  });

  // offsetWidth: layout width, unaffected by the scale() of the opening animation.
  const menuWidth = (page: Page) => page.getByRole('menu').evaluate((el) => (el.closest('.MuiPaper-root') as HTMLElement).offsetWidth);

  test('short menus use the standard minimum width (160px)', async ({ page }) => {
    await page.getByRole('button', { name: 'Actions' }).click();
    expect(await menuWidth(page)).toBe(160);
    const item = page.getByRole('menuitem', { name: 'Edit' });
    expect(await item.evaluate((el) => (el as HTMLElement).offsetHeight)).toBeGreaterThanOrEqual(36);
  });

  test('long labels cap the menu at 320px and wrap instead of being cut off', async ({ page }) => {
    await page.getByRole('button', { name: 'Export' }).click();
    expect(await menuWidth(page)).toBe(320);
    const long = page.getByRole('menuitem', { name: /Export the full calculation report/ });
    expect(await long.evaluate((el) => (el as HTMLElement).offsetHeight)).toBeGreaterThan(36);
    expect(await long.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await expect(long).toContainText('as a PDF document');
  });

  test('menu items are 48px tall on touch screens @mobile', async ({ page, hasTouch }) => {
    test.skip(!hasTouch, 'touch-only rule (pointer: coarse)');
    await page.getByRole('button', { name: 'Actions' }).click();
    const item = page.getByRole('menuitem', { name: 'Edit' });
    expect(await item.evaluate((el) => (el as HTMLElement).offsetHeight)).toBeGreaterThanOrEqual(48);
  });

  test('all action menus share the same width range', async ({ page }) => {
    await page.getByRole('button', { name: 'File' }).click();
    const width = await menuWidth(page);
    expect(width).toBeGreaterThanOrEqual(160);
    expect(width).toBeLessThanOrEqual(320);
  });
});

test.describe('TopNav + NavMenu', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'menu');
  });

  test('nav menu opens, runs the item and closes', async ({ page }) => {
    const file = page.getByRole('button', { name: 'File' });
    await expect(page.getByRole('navigation')).toContainText('File');
    await file.click();
    await expect(page.getByRole('button', { name: 'File', includeHidden: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('menuitem', { name: 'Open project' })).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('menuitem', { name: 'New project' }).click();
    await expectOut(page, 'picked', ['nav:new']);
    await expect(page.getByRole('menu')).toBeHidden();
    await expect(file).toHaveAttribute('aria-expanded', 'false');
  });
});
