import { expect, type Locator, test } from '@playwright/test';

import { expectOut, openFixture } from '../helpers';

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

    // Focus stays on the (new) retry button instead of falling back to the page.
    await expect(page.getByRole('button', { name: 'Try again' })).toBeFocused();

    await page.getByRole('button', { name: 'Fix data' }).click();
    await expect(page.getByText('Safe content')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('labels translate the default fallback; after a successful retry focus moves into the content', async ({ page }) => {
    const pane = page.getByRole('region', { name: 'Translated pane' });
    await pane.getByRole('button', { name: 'Break translated' }).click();
    const alert = pane.getByRole('alert');
    await expect(alert).toContainText('Đã xảy ra lỗi');
    // Message not overridden: English default.
    await expect(alert).toContainText('This part of the page could not be displayed.');
    await pane.getByRole('button', { name: 'Repair' }).click();
    await expect(alert).toBeVisible();
    await alert.getByRole('button', { name: 'Thử lại' }).click();
    await expect(pane.getByRole('textbox', { name: 'Recovered input' })).toBeFocused();
  });
});

test.describe('Card as input group, DescriptionList, math', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'input-group');
  });

  test('role="group" names the group with the title; plain cards stay plain sections', async ({ page }) => {
    const group = page.getByRole('group', { name: 'Seismic' });
    await expect(group).toBeVisible();
    await expect(group.getByRole('heading', { name: 'Seismic', level: 3 })).toBeVisible();
    await expect(group.getByRole('spinbutton', { name: 'Short-period acceleration' })).toBeVisible();
    await expect(page.getByRole('group')).toHaveCount(2);
    const plain = page.locator('section', { has: page.getByRole('heading', { name: 'Plain card' }) });
    await expect(plain).not.toHaveAttribute('role');
    await expect(plain).not.toHaveAttribute('aria-labelledby');
  });

  test('wrapTitle wraps a long title instead of truncating it', async ({ page }) => {
    const title = page.getByRole('heading', { name: /A very long card title/ });
    await expect(title).toHaveCSS('white-space', 'normal');
    const box = await title.boundingBox();
    expect(box!.height).toBeGreaterThan(30);
  });

  test('description list: dl/dt/dd, two columns when wide, stacked when narrow', async ({ page }) => {
    for (const id of ['wide-list', 'narrow-list']) {
      await expect(page.getByTestId(id).getByRole('term')).toHaveCount(2);
      await expect(page.getByTestId(id).getByRole('definition')).toHaveCount(2);
    }
    const pos = async (id: string) => {
      const list = page.getByTestId(id);
      const dt = (await list.getByRole('term').first().boundingBox())!;
      const dd = (await list.getByRole('definition').first().boundingBox())!;
      return { dt, dd };
    };
    const wide = await pos('wide-list');
    expect(wide.dd.x).toBeGreaterThan(wide.dt.x + wide.dt.width - 1);
    expect(Math.abs(wide.dd.y - wide.dt.y)).toBeLessThan(4);
    const narrow = await pos('narrow-list');
    expect(Math.abs(narrow.dd.x - narrow.dt.x)).toBeLessThan(1);
    expect(narrow.dd.y).toBeGreaterThanOrEqual(narrow.dt.y + narrow.dt.height - 1);
    await expect(page.getByTestId('wide-list').getByRole('term').first()).toHaveCSS('font-weight', '500');
  });

  test('MathVar is an italic math-font variable; MathSub is upright', async ({ page }) => {
    const v = page.locator('var', { hasText: 'S' });
    await expect(v).toHaveCSS('font-style', 'italic');
    await expect(v).toHaveCSS('font-family', /STIX Two Math/);
    await expect(page.locator('sub', { hasText: 'DS' })).toHaveCSS('font-style', 'normal');
  });
});

test.describe('ErrorAlert', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'error-alert');
  });

  test('shows the message, a selectable reference and a retry button', async ({ page }) => {
    const alert = page.getByRole('alert').filter({ hasText: 'Could not calculate' });
    await expect(alert).toContainText('The service did not respond.');
    const reference = alert.getByText('Reference: 00-4bf92f35');
    await expect(reference).toHaveCSS('user-select', 'text');
    await alert.getByRole('button', { name: 'Try again' }).click();
    await expectOut(page, 'retries', 1);
  });

  test('without onRetry there is no button', async ({ page }) => {
    await expect(page.getByRole('alert').filter({ hasText: 'Not allowed' }).getByRole('button')).toHaveCount(0);
  });
});

test.describe('Section footer', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'section-footer');
  });

  test('stays visible below the scrolling body and never covers the focused field', async ({ page }) => {
    const calculate = page.getByRole('button', { name: 'Calculate' });
    await expect(calculate).toBeInViewport();
    const restart = (await page.getByRole('button', { name: 'Restart' }).boundingBox())!;
    const calc = (await calculate.boundingBox())!;
    expect(restart.x).toBeLessThan(calc.x); // footerAlign="between": primary last, at the right
    const last = page.getByRole('textbox', { name: 'Field 8' });
    await last.focus();
    // The footer is outside the scroll area, so the two never overlap, and the focused field
    // (scrolled into view by the browser; how far and when is up to the engine) is not under anything.
    const measure = () =>
      last.evaluate((el) => {
        const body = el.closest('.overflow-auto')!;
        const footer = body.nextElementSibling!;
        const r = el.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return {
          bodyBottom: body.getBoundingClientRect().bottom,
          footerTop: footer.getBoundingClientRect().top,
          footerHasCalculate: footer.textContent?.includes('Calculate') ?? false,
          centerIsField: hit === el,
        };
      });
    // WebKit may finish the focus scroll a frame later.
    await expect.poll(async () => (await measure()).centerIsField).toBe(true);
    const layout = await measure();
    expect(layout.footerHasCalculate).toBe(true);
    expect(layout.bodyBottom).toBeLessThanOrEqual(layout.footerTop);
    await calculate.click();
    await expectOut(page, 'runs', 1);
  });
});

test.describe('ImageViewer', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'image-viewer');
  });

  const scaleOf = (img: Locator) =>
    img.evaluate((el) => Number(/scale\(([\d.]+)\)/.exec((el as HTMLElement).style.transform)?.[1] ?? 1));
  const translateOf = (img: Locator) => img.evaluate((el) => /translate\(([^)]*)\)/.exec((el as HTMLElement).style.transform)?.[1]);

  test('zoom buttons change the scale within limits', async ({ page }) => {
    const viewer = page.getByRole('region', { name: 'Main viewer' });
    const img = viewer.getByRole('img', { name: 'Connection drawing' });
    await expect(viewer.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
    await viewer.getByRole('button', { name: 'Zoom in' }).click();
    await expect.poll(() => scaleOf(img)).toBe(1.5);
    await expect(viewer.getByRole('button', { name: 'Zoom out' })).toBeEnabled();
    await viewer.getByRole('button', { name: 'Zoom out' }).click();
    await expect.poll(() => scaleOf(img)).toBe(1);
  });

  test('zoom buttons keep working while zoomed; quick clicks do not reset', async ({ page }) => {
    const viewer = page.getByRole('region', { name: 'Main viewer' });
    const img = viewer.getByRole('img', { name: 'Connection drawing' });
    const zoomIn = viewer.getByRole('button', { name: 'Zoom in' });
    await zoomIn.dblclick();
    await expect.poll(() => scaleOf(img)).toBe(2.25);
    await viewer.getByRole('button', { name: 'Zoom out' }).click();
    await expect.poll(() => scaleOf(img)).toBe(1.5);
  });

  test('wheel zooms without scrolling the page; double-click and the app reset restore the view', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 400 }); // page taller than the window, so it could scroll
    const viewer = page.getByRole('region', { name: 'Main viewer' });
    const img = viewer.getByRole('img', { name: 'Connection drawing' });
    await img.hover();
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, -200);
    await expect.poll(() => scaleOf(img)).toBeGreaterThan(1);
    await page.mouse.wheel(0, 100);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
    await img.dblclick();
    await expect.poll(() => scaleOf(img)).toBe(1);

    await viewer.getByRole('button', { name: 'Zoom in' }).click();
    await page.getByRole('button', { name: 'Reset from app' }).click();
    await expect.poll(() => scaleOf(img)).toBe(1);
  });

  test('minScale below 1 zooms out past the fitted size and stays there', async ({ page }) => {
    const viewer = page.getByRole('region', { name: 'Min scale viewer' });
    const img = viewer.getByRole('img', { name: 'Zoomed-out drawing' });
    const zoomOut = viewer.getByRole('button', { name: 'Zoom out' });
    await expect(zoomOut).toBeEnabled();
    await zoomOut.click();
    await expect.poll(() => scaleOf(img)).toBeCloseTo(1 / 1.5, 3);
    await zoomOut.click();
    await expect.poll(() => scaleOf(img)).toBe(0.5);
    await expect(zoomOut).toBeDisabled();
    expect(await translateOf(img)).toMatch(/^0px(, 0px)?$/); // WebKit shortens translate(0px, 0px) to translate(0px)
  });

  test('a new image resets the view', async ({ page }) => {
    const viewer = page.getByRole('region', { name: 'Main viewer' });
    const img = viewer.getByRole('img', { name: 'Connection drawing' });
    await viewer.getByRole('button', { name: 'Zoom in' }).click();
    await expect.poll(() => scaleOf(img)).toBe(1.5);
    await page.getByRole('button', { name: 'Show another image' }).click();
    await expect(img).toHaveAttribute('src', /sst-logo/);
    await expect.poll(() => scaleOf(img)).toBe(1);
    await expect(viewer.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
  });

  test('two-finger pinch zooms', async ({ page }) => {
    const viewer = page.getByRole('region', { name: 'Main viewer' });
    const img = viewer.getByRole('img', { name: 'Connection drawing' });
    const box = (await img.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    // Synthetic pointer events: Playwright has no multi-touch API.
    await img.evaluate(
      (el, { cx, cy }) => {
        const target = el.parentElement!;
        target.setPointerCapture = () => undefined; // synthetic pointers are not "active", capture would throw
        const fire = (type: string, id: number, x: number) =>
          target.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: cy, bubbles: true, pointerType: 'touch', isPrimary: id === 1 }));
        fire('pointerdown', 1, cx - 20);
        fire('pointerdown', 2, cx + 20);
        for (let d = 20; d <= 60; d += 10) {
          fire('pointermove', 1, cx - d);
          fire('pointermove', 2, cx + d);
        }
        fire('pointerup', 1, cx - 60);
        fire('pointerup', 2, cx + 60);
      },
      { cx, cy },
    );
    await expect.poll(() => scaleOf(img)).toBeCloseTo(3, 1);
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

    // The rail's name contains its visible label (WCAG 2.5.3).
    const rail = page.getByRole('button', { name: 'Expand Input' });
    await expect(rail).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Layout input' })).toHaveCount(0);
    await rail.click();
    await expect(page.getByRole('textbox', { name: 'Layout input' })).toBeVisible();
  });

  test('still renders when localStorage is blocked', async ({ page }) => {
    // Sandboxed iframes and strict privacy settings throw on any access to window.localStorage.
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError');
        },
      });
    });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.reload(); // init scripts run on the next real load, not on a same-URL goto
    await expect(page.getByRole('textbox', { name: 'Layout input' })).toBeVisible();
    expect(errors).toEqual([]);
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

test.describe('SectionLayout with optional sections (desktop)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'layout-flex');
  });

  test('Input | Output: one divider, Output fills the whole right side', async ({ page }) => {
    await expect(page.getByText('Flex output')).toBeVisible();
    await expect(page.getByText('Flex drawing')).toHaveCount(0);
    await expect(page.getByRole('separator')).toHaveCount(1);
    const root = (await page.getByTestId('layout-root').boundingBox())!;
    const divider = (await page.getByRole('separator').boundingBox())!;
    const output = (await page.getByText('Flex output').boundingBox())!;
    expect(output.x).toBeGreaterThan(divider.x);
    // Full height: the Output header tab sits at the top of the layout, not halfway down.
    const outputTab = (await page.getByRole('tab', { name: 'Output' }).boundingBox())!;
    expect(outputTab.y - root.y).toBeLessThan(4);
  });

  test('Input | Output starts half and half', async ({ page }) => {
    const root = (await page.getByTestId('layout-root').boundingBox())!;
    const divider = (await page.getByRole('separator').boundingBox())!;
    expect((divider.x - root.x) / root.width).toBeCloseTo(0.5, 1);
  });

  test('defaultInputSize sets the starting Input width', async ({ page }) => {
    await openFixture(page, 'layout-sized');
    const root = (await page.getByTestId('layout-root').boundingBox())!;
    const divider = (await page.getByRole('separator').boundingBox())!;
    expect((divider.x - root.x) / root.width).toBeCloseTo(0.4, 1);
  });

  test('Input | Illustration, Input alone, and back to all three', async ({ page }) => {
    await page.getByRole('button', { name: 'Mode input-illustration' }).click();
    await expect(page.getByText('Flex drawing')).toBeVisible();
    await expect(page.getByText('Flex output')).toHaveCount(0);
    await expect(page.getByRole('separator')).toHaveCount(1);

    await page.getByRole('button', { name: 'Mode input', exact: true }).click();
    await expect(page.getByRole('separator')).toHaveCount(0);
    const root = (await page.getByTestId('layout-root').boundingBox())!;
    const input = (await page.getByRole('textbox', { name: 'Flex input' }).boundingBox())!;
    expect(input.width).toBeGreaterThan(root.width * 0.8);

    await page.getByRole('button', { name: 'Mode all' }).click();
    await expect(page.getByRole('separator')).toHaveCount(2);
    await expect(page.getByText('Flex drawing')).toBeVisible();
    await expect(page.getByText('Flex output')).toBeVisible();
  });

  test('with two sections, Input still collapses to a rail and re-opens', async ({ page }) => {
    const handle = page.getByRole('separator').first();
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x - 600, box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    const rail = page.getByRole('button', { name: 'Expand Input' });
    await expect(rail).toBeVisible();
    await rail.click();
    await expect(page.getByRole('textbox', { name: 'Flex input' })).toBeVisible();
  });
});

test.describe('SectionLayout with optional sections (mobile) @mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('only the given sections get a tab', async ({ page }) => {
    await openFixture(page, 'layout-flex');
    const tabs = page.getByRole('tablist').first().getByRole('tab');
    await expect(tabs).toHaveText(['Input', 'Output']);
    await page.getByRole('button', { name: 'Mode input-illustration' }).click();
    await expect(tabs).toHaveText(['Input', '3D']);
    await page.getByRole('button', { name: 'Mode input', exact: true }).click();
    await expect(tabs).toHaveText(['Input']);
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

test.describe('Appearance', () => {
  test('switching the appearance restyles components and keeps the brand', async ({ page }) => {
    await openFixture(page, 'appearance');
    const body = page.locator('body');
    const save = page.getByRole('button', { name: 'Save' });
    const panel = page.locator('section').filter({ hasText: 'Panel' }).first();
    const brandBg = await save.evaluate((el) => getComputedStyle(el).backgroundColor);

    await expect(body).toHaveAttribute('data-appearance', 'classic');
    await expect(save).toHaveCSS('border-top-left-radius', '4px');
    await expect(panel).toHaveCSS('backdrop-filter', 'none');
    await expect(panel).toHaveCSS('background-color', 'rgb(255, 255, 255)');

    await page.getByRole('radio', { name: 'Glass' }).check();
    await expect(body).toHaveAttribute('data-appearance', 'glass');
    await expect(save).toHaveCSS('border-top-left-radius', '9999px');
    await expect(panel).toHaveCSS('backdrop-filter', /blur\(24px\)/);
    await expect(save).toHaveCSS('background-color', brandBg);

    await page.getByRole('button', { name: 'Open dialog' }).click();
    const dialog = page.getByRole('dialog', { name: 'Glass dialog' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('.MuiDialog-paper')).toHaveCSS('backdrop-filter', /blur/);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('a custom appearance extends a built-in one', async ({ page }) => {
    await openFixture(page, 'appearance');
    await page.getByRole('radio', { name: 'Custom' }).check();
    await expect(page.locator('body')).toHaveAttribute('data-appearance', 'narrow-glass');
    await expect(page.getByRole('button', { name: 'Save' })).toHaveCSS('border-top-left-radius', '3px');
    await expect(page.locator('section').filter({ hasText: 'Panel' }).first()).toHaveCSS('backdrop-filter', /blur/);
  });

  test('translucent appearances turn solid under reduced transparency', async ({ page }) => {
    await openFixture(page, 'appearance');
    await page.getByRole('radio', { name: 'Glass' }).check();
    const css = await page.locator('#platform-ui-colors').evaluate((el) => el.textContent ?? '');
    expect(css).toContain('@media (prefers-reduced-transparency: reduce){:root{--material-panel:var(--color-surface);');
    expect(css).toContain('--material-filter:none;');
  });
});
