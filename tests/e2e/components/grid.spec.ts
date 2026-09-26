import { expect, type Page, test } from '@playwright/test';

import { expectOut, openFixture } from '../helpers';

const table = (page: Page) => page.getByRole('table', { name: 'Parts' });
const sortButton = (page: Page, header: string) => page.getByRole('button', { name: header, exact: true });
const headerCell = (page: Page, header: string) =>
  table(page).locator('thead tr').first().locator('th', { has: page.getByText(header, { exact: true }) });
const status = (page: Page) => page.getByRole('status').filter({ hasText: 'rows' });

/** Model names of the rendered data rows, top to bottom (the "no match" row is not a data row). */
const models = (page: Page) =>
  table(page)
    .locator('tbody tr.grid-row')
    .evaluateAll((rows) => rows.map((r) => (r.querySelector('td') as HTMLElement).innerText.split('\n')[0]));

/** Header labels left to right (the empty filler column is skipped). */
const headers = (page: Page) =>
  table(page)
    .locator('thead tr')
    .first()
    .locator('th')
    .evaluateAll((ths) => ths.map((th) => th.querySelector('.grid-sort span, span.font-bold')?.textContent ?? '').filter(Boolean));

const openColumnMenu = (page: Page, header: string) => page.getByRole('button', { name: `Column options: ${header}` }).click();

test.beforeEach(async ({ page }) => {
  await openFixture(page, 'grid');
});

test.describe('rendering', () => {
  test('renders headers, rows, count and cell types', async ({ page }) => {
    await expect(status(page)).toHaveText('6 rows');
    await expect.poll(() => headers(page)).toEqual(['Model', 'Material', 'Capacity', 'Qty', 'Status', 'Datasheet', 'Open']);
    await expect.poll(() => models(page)).toEqual(['SDWS22400', 'SDWC15600', 'SD9112', 'THD50400', 'SDS25300', 'M12']);

    // Number: formatted, right aligned; empty value shown as a dash.
    const firstRow = table(page).locator('tbody tr').first();
    await expect(firstRow.getByText('1,450 lbs')).toHaveCSS('text-align', 'right');
    await expect(table(page).locator('tbody tr', { hasText: 'THD50400' }).getByLabel('empty')).toHaveText('—');
    // Image + text, custom cell.
    await expect(firstRow.getByRole('img', { name: 'SDWS22400 photo' })).toHaveAttribute('loading', 'lazy');
    await expect(page.getByTestId('status-p1')).toHaveText('OK');
  });

  test('external links open safely in a new tab and say so', async ({ page }) => {
    const link = table(page).getByRole('link', { name: /SDWS22400\.pdf/ });
    await expect(link).toHaveAttribute('href', 'https://example.com/SDWS22400.pdf');
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAccessibleName('SDWS22400.pdf (opens in a new tab)');
  });

  test('status rows are highlighted', async ({ page }) => {
    const fails = table(page).locator('tbody tr', { hasText: 'SDS25300' });
    const ok = table(page).locator('tbody tr', { hasText: 'SD9112' });
    await expect(fails).toHaveAttribute('data-highlight', 'danger');
    await expect(table(page).locator('tbody tr', { hasText: 'SDWC15600' })).toHaveAttribute('data-highlight', 'warning');
    const bg = (row: typeof ok) => row.locator('td').first().evaluate((el) => getComputedStyle(el).backgroundImage + getComputedStyle(el).backgroundColor);
    expect(await bg(fails)).not.toEqual(await bg(ok));
  });
});

test.describe('sorting', () => {
  test('header cycles ascending, descending, off and exposes aria-sort', async ({ page }) => {
    const th = headerCell(page, 'Capacity');
    await expect(th).toHaveAttribute('aria-sort', 'none');
    await sortButton(page, 'Capacity').click();
    await expect(th).toHaveAttribute('aria-sort', 'ascending');
    await expect.poll(() => models(page)).toEqual(['SD9112', 'SDWC15600', 'SDS25300', 'SDWS22400', 'M12', 'THD50400']);
    await sortButton(page, 'Capacity').click();
    await expect(th).toHaveAttribute('aria-sort', 'descending');
    await expect.poll(async () => (await models(page))[0]).toBe('THD50400');
    await sortButton(page, 'Capacity').click();
    await expect(th).toHaveAttribute('aria-sort', 'none');
    await expect.poll(() => models(page)).toEqual(['SDWS22400', 'SDWC15600', 'SD9112', 'THD50400', 'SDS25300', 'M12']);
  });

  test('empty values stay last in both directions', async ({ page }) => {
    await sortButton(page, 'Qty').click();
    await expect.poll(async () => (await models(page)).at(-1)).toBe('THD50400');
    await sortButton(page, 'Qty').click();
    await expect.poll(async () => (await models(page)).at(-1)).toBe('THD50400');
  });

  test('Shift+click adds a secondary sort; keyboard Enter sorts', async ({ page }) => {
    await sortButton(page, 'Material').press('Enter');
    await sortButton(page, 'Capacity').click({ modifiers: ['Shift'] });
    await expect.poll(() => models(page)).toEqual(['M12', 'THD50400', 'SD9112', 'SDWC15600', 'SDS25300', 'SDWS22400']);
    await expect(headerCell(page, 'Capacity').locator('.grid-sort-index')).toHaveText('2');
    await expect.poll(async () => JSON.parse((await page.getByTestId('state').textContent())!).sort).toEqual([
      { id: 'material', desc: false },
      { id: 'capacity', desc: false },
    ]);
  });

  test('column menu sorts too', async ({ page }) => {
    await openColumnMenu(page, 'Capacity');
    await page.getByRole('menuitem', { name: 'Sort descending' }).click();
    await expect(headerCell(page, 'Capacity')).toHaveAttribute('aria-sort', 'descending');
  });
});

test.describe('column filters', () => {
  test('text filter narrows rows and updates the count', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Filter Model' }).fill('sdw');
    await expect.poll(() => models(page)).toEqual(['SDWS22400', 'SDWC15600']);
    await expect(status(page)).toHaveText('2 of 6 rows');
  });

  test('number range filter is inclusive', async ({ page }) => {
    await page.getByRole('spinbutton', { name: 'Capacity minimum' }).fill('1210');
    await page.getByRole('spinbutton', { name: 'Capacity maximum' }).fill('2480');
    await expect.poll(() => models(page)).toEqual(['SDWS22400', 'SDS25300', 'M12']);
  });

  test('select filter offers the distinct values and keeps several', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Filter Material' }).click();
    await expect(page.getByRole('option')).toHaveText(['Concrete', 'Steel', 'Wood']);
    await page.getByRole('option', { name: 'Steel' }).click();
    await page.getByRole('option', { name: 'Concrete' }).click();
    await page.keyboard.press('Escape');
    await expect.poll(() => models(page)).toEqual(['SD9112', 'THD50400', 'M12']);
  });

  test('no match shows a message with a way out', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Filter Model' }).fill('zzz');
    await expect(table(page)).toContainText('No rows match the current search and filters.');
    await table(page).getByRole('button', { name: 'Clear filters' }).click();
    await expect(status(page)).toHaveText('6 rows');
    await expect(page.getByRole('searchbox', { name: 'Filter Model' })).toHaveValue('');
  });
});

test.describe('filter row toggle', () => {
  const toggle = (page: Page) => page.getByRole('button', { name: /^Filters/ });
  const modelFilter = (page: Page) => page.getByRole('searchbox', { name: 'Filter Model' });

  test('Filters button shows and hides the filter row', async ({ page }) => {
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
    await expect(modelFilter(page)).toBeVisible();
    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(modelFilter(page)).toHaveCount(0);
    await expect(page.getByRole('spinbutton', { name: 'Capacity minimum' })).toHaveCount(0);
    await expect.poll(async () => JSON.parse((await page.getByTestId('state').textContent())!).filtersVisible).toBe(false);
    await toggle(page).click();
    await expect(modelFilter(page)).toBeVisible();
  });

  test('hidden filters stay applied, counted on the button, and come back unchanged', async ({ page }) => {
    await modelFilter(page).fill('sdw');
    await expect(toggle(page)).toHaveAccessibleName('Filters 1 active');
    await toggle(page).click();
    await expect.poll(() => models(page)).toEqual(['SDWS22400', 'SDWC15600']);
    await expect(status(page)).toHaveText('2 of 6 rows');
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
    await toggle(page).click();
    await expect(modelFilter(page)).toHaveValue('sdw');
  });

  test('presets and Clear filters update the count while the row is hidden', async ({ page }) => {
    await toggle(page).click();
    await page.getByRole('button', { name: 'Wood only' }).click();
    await expect(toggle(page)).toHaveAccessibleName('Filters 1 active');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(toggle(page)).toHaveAccessibleName('Filters');
    await expect(status(page)).toHaveText('6 rows');
  });
});

test.describe('master search and presets', () => {
  const search = (page: Page) => page.getByRole('searchbox', { name: 'Search Parts' });

  test('every term must match, in any column', async ({ page }) => {
    await search(page).fill('wood 1,450');
    await expect.poll(() => models(page)).toEqual(['SDWS22400']);
    await search(page).fill('wood steel');
    await expect.poll(() => models(page)).toEqual([]);
  });

  test('ignores case and Vietnamese accents', async ({ page }) => {
    await search(page).fill('CONCRETE');
    await expect.poll(() => models(page)).toEqual(['THD50400', 'M12']);
  });

  test('only looks at the configured columns', async ({ page }) => {
    // "Status" and "Description" are not in search.columns.
    await search(page).fill('fails');
    await expect.poll(() => models(page)).toEqual([]);
    await search(page).fill('bê tông');
    await expect.poll(() => models(page)).toEqual([]);
  });

  test('Escape and the clear button empty the search', async ({ page }) => {
    await search(page).fill('wood');
    await search(page).press('Escape');
    await expect(search(page)).toHaveValue('');
    await search(page).fill('wood');
    await page.getByRole('button', { name: 'Clear search' }).click();
    await expect(search(page)).toHaveValue('');
    await expect(status(page)).toHaveText('6 rows');
  });

  test('preset applies its filters and search; clicking it again clears', async ({ page }) => {
    const wood = page.getByRole('button', { name: 'Wood only' });
    await wood.click();
    await expect(wood).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => models(page)).toEqual(['SDWS22400', 'SDWC15600', 'SDS25300']);
    await expect(page.getByRole('combobox', { name: 'Filter Material' })).toHaveText('Wood');

    const big = page.getByRole('button', { name: 'Big anchors' });
    await big.click();
    await expect(wood).toHaveAttribute('aria-pressed', 'false');
    await expect(big).toHaveAttribute('aria-pressed', 'true');
    await expect(search(page)).toHaveValue('concrete');
    await expect.poll(() => models(page)).toEqual(['THD50400', 'M12']);

    await big.click();
    await expect(big).toHaveAttribute('aria-pressed', 'false');
    await expect(status(page)).toHaveText('6 rows');
  });

  test('changing a filter by hand deactivates the preset', async ({ page }) => {
    await page.getByRole('button', { name: 'Wood only' }).click();
    await page.getByRole('searchbox', { name: 'Filter Model' }).fill('sds');
    await expect(page.getByRole('button', { name: 'Wood only' })).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('layout', () => {
  test('freeze and unfreeze from the column menu', async ({ page }) => {
    await openColumnMenu(page, 'Capacity');
    await page.getByRole('menuitem', { name: 'Freeze left' }).click();
    await expect.poll(() => headers(page)).toEqual(['Model', 'Capacity', 'Material', 'Qty', 'Status', 'Datasheet', 'Open']);
    await expect(headerCell(page, 'Capacity')).toHaveCSS('position', 'sticky');
    await expect(headerCell(page, 'Capacity').getByLabel('Frozen')).toBeVisible();

    await openColumnMenu(page, 'Open');
    await page.getByRole('menuitem', { name: 'Freeze right' }).click();
    await expect.poll(async () => (await headers(page)).at(-1)).toBe('Open');

    await openColumnMenu(page, 'Capacity');
    await page.getByRole('menuitem', { name: 'Unfreeze' }).click();
    await expect(headerCell(page, 'Capacity')).not.toHaveCSS('position', 'sticky');
  });

  test('frozen columns stay in place while scrolling sideways', async ({ page }) => {
    const region = page.getByRole('region', { name: 'Parts' });
    const frozen = table(page).locator('tbody tr').first().locator('td').first();
    const before = (await frozen.boundingBox())!.x;
    await region.evaluate((el) => (el.scrollLeft = 300));
    await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    expect((await frozen.boundingBox())!.x).toBe(before);
  });

  test('move left/right from the menu, within the same region', async ({ page }) => {
    await openColumnMenu(page, 'Material');
    await expect(page.getByRole('menuitem', { name: 'Move left' })).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('menuitem', { name: 'Move right' }).click();
    await expect.poll(() => headers(page)).toEqual(['Model', 'Capacity', 'Material', 'Qty', 'Status', 'Datasheet', 'Open']);
    await expect.poll(async () => JSON.parse((await page.getByTestId('state').textContent())!).columnOrder.slice(0, 3)).toEqual([
      'model',
      'capacity',
      'material',
    ]);
  });

  test('drag a header onto another to reorder', async ({ page }) => {
    await headerCell(page, 'Qty').hover();
    await headerCell(page, 'Qty').locator('.grid-drag').dragTo(headerCell(page, 'Material'), { targetPosition: { x: 4, y: 10 } });
    await expect.poll(() => headers(page)).toEqual(['Model', 'Qty', 'Material', 'Capacity', 'Status', 'Datasheet', 'Open']);
  });

  test('hide from the column menu, show again from Columns, reset layout', async ({ page }) => {
    await openColumnMenu(page, 'Status');
    await page.getByRole('menuitem', { name: 'Hide column' }).click();
    await expect.poll(() => headers(page)).not.toContain('Status');

    await page.getByRole('button', { name: 'Columns' }).click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Status' })).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByRole('menuitemcheckbox', { name: 'Open' })).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('menuitemcheckbox', { name: 'Status' }).click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Status' })).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Escape');
    await expect.poll(() => headers(page)).toContain('Status');

    await openColumnMenu(page, 'Material');
    await page.getByRole('menuitem', { name: 'Move right' }).click();
    await page.getByRole('button', { name: 'Columns' }).click();
    await page.getByRole('menuitem', { name: 'Reset layout' }).click();
    await expect.poll(() => headers(page)).toEqual(['Model', 'Material', 'Capacity', 'Qty', 'Status', 'Datasheet', 'Open']);
  });

  test('headers stay visible while scrolling rows', async ({ page }) => {
    const region = page.getByRole('region', { name: 'Parts' });
    await region.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect(sortButton(page, 'Capacity')).toBeInViewport();
    await expect(headerCell(page, 'Capacity')).toBeInViewport();
  });
});

test.describe('rows', () => {
  test('click or Enter selects a row and marks it current', async ({ page }) => {
    const row = table(page).locator('tbody tr', { hasText: 'SD9112' });
    await row.click();
    await expectOut(page, 'selected', 'p3');
    await expect(row).toHaveAttribute('aria-current', 'true');

    const other = table(page).locator('tbody tr', { hasText: 'M12' });
    await other.focus();
    await page.keyboard.press('Enter');
    await expectOut(page, 'selected', 'p6');
    await expect(row).not.toHaveAttribute('aria-current', 'true');
  });

  test('links inside a row run their own action, not the row click', async ({ page }) => {
    const row = table(page).locator('tbody tr', { hasText: 'SD9112' });
    await row.getByRole('button', { name: 'Open' }).click();
    await expectOut(page, 'opened', ['p3']);
    await expectOut(page, 'selected', null);
  });
});

test.describe('labels', () => {
  test('every overridden text is used; the rest keep their defaults', async ({ page }) => {
    await openFixture(page, 'grid-labels');
    const search = page.getByRole('searchbox', { name: 'Tìm trong Vật tư' });
    await expect(search).toHaveAttribute('placeholder', 'Tìm kiếm');
    await expect(page.getByRole('status')).toHaveText('6 dòng');
    await search.fill('sdw');
    await expect(page.getByRole('status')).toHaveText('2/6 dòng');
    await expect(page.getByRole('button', { name: 'Xóa bộ lọc' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Bộ lọc/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cột', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Tùy chọn cột Tải' }).click();
    // Not overridden: English default.
    await expect(page.getByRole('menuitem', { name: 'Freeze left' })).toBeVisible();
  });
});
