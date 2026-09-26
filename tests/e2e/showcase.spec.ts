import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

const consoleErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('renders without console errors @mobile', async ({ page }) => {
  const errors = consoleErrors(page);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Buttons' })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const hash of ['#workspace', '#workspace-columns']) {
  test(`workspace ${hash} renders without console errors @mobile`, async ({ page }) => {
    const errors = consoleErrors(page);
    await page.goto(`/${hash}`);
    await page.reload();
    await expect(page.getByRole('tab').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('has no serious accessibility violations', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    // FD brand colors (muted text on gray, orange on white) are a design decision tracked separately.
    .disableRules(['color-contrast'])
    .analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
});

test.describe('NumberInput', () => {
  test('only accepts numeric text and emits numbers', async ({ page }) => {
    const input = page.getByRole('spinbutton', { name: 'Member thickness' });
    await input.fill('');
    await input.pressSequentially('2a,5e');
    await expect(input).toHaveValue('2,5');
    await expect(page.getByText('thickness = 2.5,')).toBeVisible();
  });

  test('steps with arrow keys without float drift and clamps to max', async ({ page }) => {
    const input = page.getByRole('spinbutton', { name: 'Spacing (clamped on blur)' });
    await input.fill('0.1');
    await input.press('ArrowUp');
    await input.press('ArrowUp');
    await expect(input).toHaveValue('0.3');
    await input.press('Shift+ArrowUp');
    await expect(input).toHaveValue('1');
    await expect(input).toHaveAttribute('aria-valuenow', '1');
  });

  test('marks out-of-range values invalid and links the error message', async ({ page }) => {
    const input = page.getByRole('spinbutton', { name: 'Member thickness' });
    await input.fill('4');
    await input.blur();
    await expect(input).toHaveValue('4.000');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription(/Must be between 1\.5 and 3\.5 in\./);
  });

  test('clamps on blur when clampBehavior="blur"', async ({ page }) => {
    const input = page.getByRole('spinbutton', { name: 'Spacing (clamped on blur)' });
    await input.fill('7');
    await input.blur();
    await expect(input).toHaveValue('1');
  });

  test('reverts incomplete text on blur and rejects "-" when min >= 0', async ({ page }) => {
    const thickness = page.getByRole('spinbutton', { name: 'Member thickness' });
    await thickness.fill('.');
    await thickness.blur();
    await expect(thickness).toHaveValue('4.000');

    const count = page.getByRole('spinbutton', { name: 'Fastener count (integer)' });
    await count.fill('');
    await count.pressSequentially('-2.5');
    await expect(count).toHaveValue('25');
  });
});

test.describe('Forms', () => {
  test('labels and descriptions reach every control', async ({ page }) => {
    await expect(page.getByRole('combobox', { name: 'Connection type' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Product (searchable)' })).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: 'Country' })).toBeVisible();
    const project = page.getByRole('textbox', { name: 'Project name' });
    await expect(project).toHaveAttribute('aria-invalid', 'true');
    await expect(project).toHaveAttribute('required', '');
    await expect(project).toHaveAccessibleDescription('Project name is required.');
    await expect(page.getByRole('textbox', { name: 'Disabled' })).toBeDisabled();
  });
});

test.describe('Buttons', () => {
  test('keyboard focus is visible on checkbox, switch and button', async ({ page }) => {
    for (const name of ['Show notes', 'Metric units']) {
      const control = page.getByRole(name === 'Show notes' ? 'checkbox' : 'switch', { name });
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

  test('disabled primary button is faded, not darker', async ({ page }) => {
    const disabled = page.getByRole('button', { name: 'Disabled', exact: true });
    const enabled = page.getByRole('button', { name: 'Calculate', exact: true }).first();
    const style = (l: typeof disabled) => l.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, opacity: getComputedStyle(el).opacity }));
    const [d, e] = [await style(disabled), await style(enabled)];
    expect(d.bg).toBe(e.bg);
    expect(Number(d.opacity)).toBeLessThan(0.5);
  });

  test('loading button blocks repeated clicks', async ({ page }) => {
    const button = page.getByRole('button', { name: /Calculate \(loading\)/ });
    await button.click();
    await expect(button).toBeDisabled();
    await expect(button).toBeEnabled({ timeout: 3000 });
  });
});

test.describe('Dialogs', () => {
  test('destructive confirm focuses Cancel and ignores backdrop clicks', async ({ page }) => {
    await page.getByRole('button', { name: 'Reset inputs' }).click();
    const dialog = page.getByRole('alertdialog', { name: 'Reset all inputs?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.mouse.click(5, 300);
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('button', { name: 'Reset inputs' })).toBeFocused();
  });
});

test.describe('Theme', () => {
  test('brand color config applies to MUI styles and Tailwind classes at runtime', async ({ page }) => {
    const primary = page.getByRole('button', { name: 'Calculate', exact: true }).first();
    await expect(primary).toHaveCSS('background-color', 'rgb(168, 103, 29)');
    await page.getByRole('combobox', { name: 'Brand color' }).click();
    await page.getByRole('option', { name: 'Blue' }).click();
    await expect(primary).toHaveCSS('background-color', 'rgb(31, 95, 153)');
    const brandVar = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-brand').trim());
    expect(brandVar).toBe('#1f5f99');
    // Tailwind class bound to a role color (TopNav bottom border uses border-accent).
    await expect(page.locator('header').first()).toHaveCSS('border-bottom-color', 'rgb(31, 95, 153)');
  });
});

test.describe('Accordion group', () => {
  test('header button collapses and expands every input section', async ({ page }) => {
    await page.goto('/#workspace');
    await page.reload();
    const headers = page.getByRole('button', { name: /Connection type|Load properties|Member properties/ });
    await expect(headers).toHaveCount(3);
    for (const h of await headers.all()) await expect(h).toHaveAttribute('aria-expanded', 'true');

    await page.getByRole('button', { name: 'Collapse all sections' }).click();
    for (const h of await headers.all()) await expect(h).toHaveAttribute('aria-expanded', 'false');

    // Opening one section by hand keeps the button in "collapse" mode.
    await headers.first().click();
    await expect(headers.first()).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('button', { name: 'Collapse all sections' })).toBeVisible();

    await page.getByRole('button', { name: 'Collapse all sections' }).click();
    await page.getByRole('button', { name: 'Expand all sections' }).click();
    for (const h of await headers.all()) await expect(h).toHaveAttribute('aria-expanded', 'true');
  });
});

test.describe('Card', () => {
  test('title is bold on a highlighted header and body padding is 8px by default', async ({ page }) => {
    const card = page.locator('section', { has: page.getByRole('heading', { name: 'Fastener capacity' }) }).last();
    const title = card.getByRole('heading', { name: 'Fastener capacity' });
    await expect(title).toHaveCSS('font-weight', '700');
    await expect(card.locator('header')).toHaveCSS('background-color', 'rgb(250, 250, 250)');
    await expect(card.locator('header + div')).toHaveCSS('padding', '8px');
  });
});
