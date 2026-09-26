import { expect, type Page, test } from '@playwright/test';

import { expectOut, openFixture } from '../helpers';

test.beforeEach(async ({ page }) => {
  await openFixture(page, 'release-notes');
});

const dialog = (page: Page) => page.getByRole('dialog', { name: /FD/ });
const openDialog = async (page: Page) => {
  await page.getByRole('button', { name: 'Open release notes' }).click();
  await expect(dialog(page)).toBeVisible();
};
/** Release header buttons in display order. */
const releaseHeaders = (page: Page) => dialog(page).getByRole('button', { name: /Released on/ });

test.describe('ReleaseNotesDialog', () => {
  test('shows the app name, title and intro', async ({ page }) => {
    await openDialog(page);
    await expect(dialog(page)).toHaveAccessibleName(/FD\s*Fastener Designer/);
    await expect(dialog(page)).toContainText('Fastener Designer finds fastening solutions.');
    // Dialog titles are not uppercased (regression: h6 overline style leaked into DialogTitle).
    await expect(dialog(page).getByText('Fastener Designer', { exact: true })).toHaveCSS('text-transform', 'none');
  });

  test('releases are newest first by version (2.10 after 2.9), latest open', async ({ page }) => {
    await openDialog(page);
    await expect(releaseHeaders(page)).toHaveText([/^2\.10\.0/, /^2\.9\.0/, /^2\.4\.1/]);
    await expect(releaseHeaders(page).nth(0)).toHaveAttribute('aria-expanded', 'true');
    await expect(releaseHeaders(page).nth(1)).toHaveAttribute('aria-expanded', 'false');
    await expect(releaseHeaders(page).nth(2)).toHaveAttribute('aria-expanded', 'false');
  });

  test('dates are local calendar dates (no day shift)', async ({ page }) => {
    await openDialog(page);
    await expect(releaseHeaders(page).nth(0)).toContainText('Released on September 3, 2026');
    await expect(releaseHeaders(page).nth(1)).toContainText('Released on June 18, 2026');
  });

  test('releases newer than the last seen version are marked New', async ({ page }) => {
    await openDialog(page);
    await expect(releaseHeaders(page).nth(0)).toContainText('New');
    await expect(releaseHeaders(page).nth(1)).toContainText('New');
    await expect(releaseHeaders(page).nth(2)).not.toContainText('New');
  });

  test('categories, group headings, bullets, single-line groups and links', async ({ page }) => {
    await openDialog(page);
    const latest = dialog(page).getByRole('region', { name: /^2\.10\.0/ });
    await expect(latest.getByRole('heading', { level: 4 })).toHaveText(['New Feature', 'Maintenance']);
    await expect(latest.getByRole('heading', { level: 5 })).toHaveText(['EU', 'USA']);
    await expect(latest.getByRole('list').first().getByRole('listitem')).toHaveCount(2);
    // A single item without a heading is a paragraph, not a one-bullet list.
    await expect(latest.getByText('General system improvements and bug fixes.')).toBeVisible();
    expect(await latest.getByText('General system improvements and bug fixes.').evaluate((el) => el.tagName)).toBe('P');
    await expect(latest.getByRole('link', { name: 'Explore now' })).toHaveAttribute('href', '#explore');
  });

  test('expand all / collapse all', async ({ page }) => {
    await openDialog(page);
    await dialog(page).getByRole('button', { name: 'Collapse all releases' }).click();
    for (const h of await releaseHeaders(page).all()) await expect(h).toHaveAttribute('aria-expanded', 'false');
    await dialog(page).getByRole('button', { name: 'Expand all releases' }).click();
    for (const h of await releaseHeaders(page).all()) await expect(h).toHaveAttribute('aria-expanded', 'true');
  });

  test('accordion headings have no stray browser margins', async ({ page }) => {
    await openDialog(page);
    const heading = dialog(page).locator('.MuiAccordion-heading').first();
    await expect(heading).toHaveCSS('margin-top', '0px');
    await expect(heading).toHaveCSS('margin-bottom', '0px');
  });

  test('Close button and Escape close it and return focus', async ({ page }) => {
    const opener = page.getByRole('button', { name: 'Open release notes' });
    await openDialog(page);
    await dialog(page).getByRole('button', { name: 'Close', exact: true }).last().click();
    await expect(dialog(page)).toBeHidden();
    await expect(opener).toBeFocused();
    await openDialog(page);
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toBeHidden();
  });
});

test.describe('ReleaseNotes inline', () => {
  test('texts and date follow the locale and label overrides', async ({ page }) => {
    const inline = page.getByRole('region', { name: 'Inline Vietnamese' });
    await expect(inline.getByRole('button', { name: /Phát hành ngày/ })).toContainText('2.4.1');
    await expect(inline.getByRole('button', { name: /Phát hành ngày/ })).toContainText('tháng 2');
    await expect(inline.getByRole('heading', { level: 4, name: 'Sửa lỗi' })).toBeVisible();
    // A single release has no expand/collapse-all button.
    await expect(inline.getByRole('button', { name: /all releases/ })).toHaveCount(0);
  });

  test('no releases shows the empty text', async ({ page }) => {
    await expect(page.getByRole('region', { name: 'Empty' })).toContainText('Chưa có ghi chú phát hành.');
  });
});

test.describe('useReleaseNotesSeen', () => {
  test('first visit: does not open, records the current version', async ({ page }) => {
    await page.getByRole('button', { name: 'Stored: none' }).click();
    await expectOut(page, 'should-open', false);
    await expectOut(page, 'last-seen', '2.10.0');
    await page.getByRole('button', { name: 'Remount' }).click();
    await expectOut(page, 'stored', '2.10.0');
  });

  test('after an update: opens once, keeps "last seen" for New badges until reload, then stays closed', async ({ page }) => {
    await page.getByRole('button', { name: 'Stored: 2.9.0' }).click();
    await expectOut(page, 'should-open', true);
    await expectOut(page, 'last-seen', '2.9.0');
    await page.getByRole('button', { name: 'Mark seen' }).click();
    await expectOut(page, 'should-open', false);
    await expectOut(page, 'last-seen', '2.9.0');
    await page.getByRole('button', { name: 'Remount' }).click();
    await expectOut(page, 'should-open', false);
    await expectOut(page, 'stored', '2.10.0');
  });
});
