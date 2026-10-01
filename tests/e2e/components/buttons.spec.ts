import { expect, test } from '@playwright/test';

import { expectOut, openFixture } from '../helpers';

test.beforeEach(async ({ page }) => {
  await openFixture(page, 'button');
});

test('activates on click, Enter and Space', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Primary', exact: true });
  await button.click();
  await button.press('Enter');
  await button.press(' ');
  await expectOut(page, 'clicks', 3);
});

// The kit's core styling promise: an app's Tailwind classes beat MUI styles without !important,
// through CSS layer order (docs/getting-started.md, "How app classes beat MUI styles").
test('app Tailwind classes override the theme MUI styles', async ({ page }) => {
  const plain = page.getByRole('button', { name: 'Primary', exact: true });
  const styled = page.getByRole('button', { name: 'Utility classes' });
  // Baseline, so the check below cannot pass by accident.
  await expect(plain).not.toHaveCSS('padding', '0px');
  // toHaveCSS retries: MUI buttons transition padding and colors for 0.15s.
  await expect(styled).toHaveCSS('padding', '0px');
  const danger = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.className = 'bg-danger';
    document.body.append(probe);
    const color = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return color;
  });
  await expect(styled).toHaveCSS('background-color', danger);
});

test('disabled button ignores clicks and keyboard', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Disabled primary' });
  await expect(button).toBeDisabled();
  await button.click({ force: true });
  await expectOut(page, 'clicks', 0);
});

test('loading button blocks repeated clicks until the work finishes', async ({ page }) => {
  const save = page.getByRole('button', { name: 'Save' });
  await save.click();
  await expect(save).toBeDisabled();
  await save.click({ force: true });
  await save.click({ force: true });
  await expectOut(page, 'saves', 1);

  await page.getByRole('button', { name: 'Finish saving' }).click();
  await expect(save).toBeEnabled();
});

test('buttons do not submit a form unless type="submit"', async ({ page }) => {
  await page.getByRole('button', { name: 'Plain button in form' }).click();
  await expectOut(page, 'submits', 0);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expectOut(page, 'submits', 1);
  // Implicit submission: Enter in a text field submits through the submit button.
  await page.getByRole('textbox', { name: 'Search text' }).press('Enter');
  await expectOut(page, 'submits', 2);
});

test('icon button exposes its accessible name', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  await expectOut(page, 'clicks', 1);
});

test('focus ring shows for keyboard focus but not after a mouse click', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Primary', exact: true });
  await button.click();
  await expect(button).toHaveCSS('outline-style', 'none');

  await page.getByRole('button', { name: 'Delete' }).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Delete' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Delete' })).toHaveCSS('outline-style', 'solid');
});
