import { expect, type Page, test } from '@playwright/test';

import { expectOut, openFixture } from '../helpers';

/** Clicks the backdrop well away from the dialog paper. */
const clickBackdrop = (page: Page) => page.mouse.click(8, page.viewportSize()!.height - 8);

test.describe('Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'dialog');
  });

  test('opens named by its title with focus inside, and traps Tab', async ({ page }) => {
    await page.getByRole('button', { name: 'Open any' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit template' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
  });

  test('Escape closes with its reason and returns focus to the opener', async ({ page }) => {
    const opener = page.getByRole('button', { name: 'Open any' });
    await opener.click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expectOut(page, 'reasons', ['escapeKeyDown']);
    await expect(opener).toBeFocused();
  });

  test('dismissible="any": a click outside closes', async ({ page }) => {
    await page.getByRole('button', { name: 'Open any' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await clickBackdrop(page);
    await expect(page.getByRole('dialog')).toBeHidden();
    await expectOut(page, 'reasons', ['backdropClick']);
  });

  test('dismissible="escape": a click outside does not lose the form', async ({ page }) => {
    await page.getByRole('button', { name: 'Open escape' }).click();
    await page.getByRole('textbox', { name: 'Template name' }).fill('Draft');
    await clickBackdrop(page);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Template name' })).toHaveValue('Draft');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expectOut(page, 'reasons', ['escapeKeyDown']);
  });

  test('dismissible="none": only the dialog buttons close it', async ({ page }) => {
    await page.getByRole('button', { name: 'Open none' }).click();
    await page.keyboard.press('Escape');
    await clickBackdrop(page);
    await expect(page.getByRole('dialog')).toBeVisible();
    await expectOut(page, 'reasons', []);
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expectOut(page, 'reasons', ['closeButton']);
  });
});

test.describe('ConfirmDialog', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'confirm');
  });

  test('non-destructive: confirm button is focused and described by the message', async ({ page }) => {
    await page.getByRole('button', { name: 'Save changes' }).click();
    const dialog = page.getByRole('dialog', { name: 'Save changes?' });
    await expect(dialog).toHaveAccessibleDescription('The project file will be overwritten.');
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeFocused();
  });

  test('while confirming, the dialog cannot be dismissed or confirmed twice', async ({ page }) => {
    await page.getByRole('button', { name: 'Save changes' }).click();
    const dialog = page.getByRole('dialog', { name: 'Save changes?' });
    await page.keyboard.press('Enter');
    await expectOut(page, 'confirmed', 1);
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();
    await expect(dialog.getByRole('button', { name: 'Close' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await clickBackdrop(page);
    await expect(dialog).toBeVisible();
    await expect(dialog).toBeHidden({ timeout: 3000 });
    await expectOut(page, 'confirmed', 1);
    await expectOut(page, 'cancelled', 0);
  });

  test('Cancel calls onCancel only', async ({ page }) => {
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expectOut(page, 'cancelled', 1);
    await expectOut(page, 'confirmed', 0);
  });
});

test.describe('HelpPopover', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'overlay');
  });

  test('opens on click without focusing the field, closes on Escape and returns focus', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'More information' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(page.getByText('Multiplier applied to the service load.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'More information', includeHidden: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('textbox', { name: 'Load factor', includeHidden: true })).not.toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Multiplier applied to the service load.')).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('close button closes it', async ({ page }) => {
    await page.getByRole('button', { name: 'More information' }).click();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByText('Multiplier applied to the service load.')).toBeHidden();
  });
});

test.describe('Tooltip', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'overlay');
  });

  test('shows on hover, describes (not renames) the button, hides on leave', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Calculate' });
    await button.hover();
    await expect(page.getByRole('tooltip')).toHaveText('Runs the calculation');
    await expect(button).toHaveAccessibleName('Calculate');
    await expect(button).toHaveAccessibleDescription('Runs the calculation');
    await page.mouse.move(0, 0);
    await expect(page.getByRole('tooltip')).toBeHidden();
  });

  test('shows on keyboard focus', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Load factor' }).click();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Calculate' })).toBeFocused();
    await expect(page.getByRole('tooltip')).toHaveText('Runs the calculation');
  });
});

test.describe('Toast', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'toast');
  });

  const toast = (page: Page, text: string) => page.locator('.Toastify__toast', { hasText: text });

  test('each kind is announced', async ({ page }) => {
    for (const [button, text] of [
      ['Toast success', 'Saved successfully'],
      ['Toast info', 'Heads up'],
      ['Toast warning', 'Check units'],
      ['Toast error', 'Export failed'],
    ] as const) {
      await page.getByRole('button', { name: button }).click();
      await expect(page.getByRole('alert').filter({ hasText: text })).toBeVisible();
    }
  });

  test('success closes by itself; error stays until dismissed', async ({ page }) => {
    await page.getByRole('button', { name: 'Toast success' }).click();
    await page.getByRole('button', { name: 'Toast error' }).click();
    // Error toasts have no running timer.
    await expect(toast(page, 'Export failed').getByRole('progressbar', { includeHidden: true })).toHaveAttribute('aria-hidden', 'true');
    await expect(toast(page, 'Saved successfully').getByRole('progressbar')).toHaveAttribute('aria-hidden', 'false');
    await page.mouse.move(0, 0);
    await expect(toast(page, 'Saved successfully')).toBeHidden({ timeout: 8000 });
    await expect(toast(page, 'Export failed')).toBeVisible();
  });

  test('hovering pauses the timer', async ({ page }) => {
    await page.getByRole('button', { name: 'Toast success' }).click();
    const t = toast(page, 'Saved successfully');
    await t.hover();
    await expect(t.getByRole('progressbar')).toHaveCSS('animation-play-state', 'paused');
  });

  test('close button and dismiss all remove toasts', async ({ page }) => {
    await page.getByRole('button', { name: 'Toast error' }).click();
    await toast(page, 'Export failed').getByRole('button', { name: 'close' }).click();
    await expect(toast(page, 'Export failed')).toBeHidden();

    await page.getByRole('button', { name: 'Toast error' }).click();
    await page.getByRole('button', { name: 'Toast warning' }).click();
    await page.getByRole('button', { name: 'Dismiss all' }).click();
    await expect(page.locator('.Toastify__toast')).toHaveCount(0);
  });

  test('at most 5 toasts are shown at once', async ({ page }) => {
    const burst = page.getByRole('button', { name: 'Toast burst' });
    for (let i = 0; i < 7; i++) await burst.click();
    await expect(page.locator('.Toastify__toast')).toHaveCount(5);
  });
});
