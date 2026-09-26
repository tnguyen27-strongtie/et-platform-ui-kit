import { expect, type Locator, test } from '@playwright/test';

import { openFixture } from '../helpers';

test.describe('Alert, Card, DataTable, status indicators', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'display');
  });

  test('errors are alerts; other severities are polite status messages', async ({ page }) => {
    await expect(page.getByRole('alert')).toHaveCount(1);
    await expect(page.getByRole('alert')).toContainText('Invalid input');
    for (const text of ['No results.', 'Saved.', 'Tip.']) {
      await expect(page.getByRole('status').filter({ hasText: text })).toHaveCount(1);
    }
  });

  test('card has a heading, subtitle and footer', async ({ page }) => {
    const card = page.locator('section', { has: page.getByRole('heading', { name: 'Results', level: 3 }) });
    await expect(card.getByText('per bolt')).toBeVisible();
    await expect(card.locator('footer')).toHaveText('Total 3');
  });

  test('table exposes headers and rows; its scroll area is keyboard reachable', async ({ page }) => {
    const table = page.getByRole('table', { name: 'Capacity by model' });
    await expect(table.getByRole('columnheader')).toHaveText(['Model', 'Capacity']);
    await expect(table.getByRole('row')).toHaveCount(7);

    const region = page.getByRole('region', { name: 'Capacity by model' });
    await region.focus();
    await expect(region).toBeFocused();
    await page.keyboard.press('PageDown');
    await expect.poll(() => region.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    // Sticky header stays visible while scrolling.
    await expect(table.getByRole('columnheader', { name: 'Model' })).toBeInViewport();
    await expect(table.getByRole('columnheader', { name: 'Model' })).toHaveCSS('position', 'sticky');
  });

  test('empty state, spinner and loading overlay are announced', async ({ page }) => {
    await expect(page.getByRole('status').filter({ hasText: 'No results yet' })).toContainText('Fill in the inputs.');
    await expect(page.getByRole('progressbar', { name: 'Loading results' })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Updating' })).toBeVisible();
  });
});

test.describe('ErrorBoundary', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'error-boundary');
  });

  test('a crash is contained, reported, and recovers when the data changes', async ({ page }) => {
    await expect(page.getByText('Safe content')).toBeVisible();
    await page.getByRole('button', { name: 'Break it' }).click();

    await expect(page.getByRole('alert')).toContainText('Something went wrong');
    await expect(page.getByText('Sibling content')).toBeVisible();
    await expect(page.getByTestId('errors')).toContainText('Boom');

    // Retrying with the same bad data fails again instead of hiding the problem.
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('alert')).toContainText('Something went wrong');

    await page.getByRole('button', { name: 'Fix data' }).click();
    await expect(page.getByText('Safe content')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

test.describe('ImageViewer', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'image-viewer');
  });

  const scaleOf = (img: Locator) =>
    img.evaluate((el) => Number(/scale\(([\d.]+)\)/.exec((el as HTMLElement).style.transform)?.[1] ?? 1));

  test('zoom buttons change the scale within limits', async ({ page }) => {
    const img = page.getByRole('img', { name: 'Connection drawing' });
    await expect(page.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    await page.getByRole('button', { name: 'Zoom in' }).click();
    await expect.poll(() => scaleOf(img)).toBe(1.5);
    await expect(page.getByRole('button', { name: 'Zoom out' })).toBeEnabled();
    await page.getByRole('button', { name: 'Zoom out' }).click();
    await expect.poll(() => scaleOf(img)).toBe(1);
  });

  test('zoom buttons keep working while zoomed; quick clicks do not reset', async ({ page }) => {
    const img = page.getByRole('img', { name: 'Connection drawing' });
    const zoomIn = page.getByRole('button', { name: 'Zoom in' });
    await zoomIn.dblclick();
    await expect.poll(() => scaleOf(img)).toBe(2.25);
    await page.getByRole('button', { name: 'Zoom out' }).click();
    await expect.poll(() => scaleOf(img)).toBe(1.5);
  });

  test('wheel zooms; double-click and the app reset restore the view', async ({ page }) => {
    const img = page.getByRole('img', { name: 'Connection drawing' });
    await img.hover();
    await page.mouse.wheel(0, -200);
    await expect.poll(() => scaleOf(img)).toBeGreaterThan(1);
    await img.dblclick();
    await expect.poll(() => scaleOf(img)).toBe(1);

    await page.getByRole('button', { name: 'Zoom in' }).click();
    await page.getByRole('button', { name: 'Reset from app' }).click();
    await expect.poll(() => scaleOf(img)).toBe(1);
  });
});

test.describe('SectionLayout (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'layout');
  });

  test('shows the three sections with resize handles', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Layout input' })).toBeVisible();
    await expect(page.getByText('Drawing here')).toBeVisible();
    await expect(page.getByText('Output here')).toBeVisible();
    await expect(page.getByRole('separator')).toHaveCount(2);
  });

  test('dragging Input below its minimum collapses it to a rail that re-opens', async ({ page }) => {
    const handle = page.getByRole('separator').first();
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x - 600, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();

    const rail = page.getByRole('button', { name: 'Expand panel' });
    await expect(rail).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Layout input' })).toHaveCount(0);
    await rail.click();
    await expect(page.getByRole('textbox', { name: 'Layout input' })).toBeVisible();
  });
});

test.describe('SectionLayout (mobile) @mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('one section at a time; Input keeps what was typed while hidden', async ({ page }) => {
    await openFixture(page, 'layout');
    // The layout's own tab bar (sections inside may render their own header tabs).
    const tabs = page.getByRole('tablist').first().getByRole('tab');
    await expect(tabs).toHaveText(['Input', '3D', 'Output']);
    await page.getByRole('textbox', { name: 'Layout input' }).fill('12');
    await tabs.filter({ hasText: 'Output' }).click();
    await expect(page.getByText('Output here')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Layout input' })).toBeHidden();
    await tabs.filter({ hasText: 'Input' }).click();
    await expect(page.getByRole('textbox', { name: 'Layout input' })).toHaveValue('12');
  });
});

test.describe('Density', () => {
  test('switching density changes the body text size', async ({ page }) => {
    await openFixture(page, 'density');
    const body = page.locator('body');
    await expect(body).toHaveClass(/density-standard/);
    await expect(body).toHaveCSS('font-size', '14px');
    await page.getByRole('switch', { name: 'Expanded text' }).click();
    await expect(body).toHaveClass(/density-expanded/);
    await expect(body).toHaveCSS('font-size', '16px');
    await expect(body).not.toHaveClass(/density-standard/);
  });
});
