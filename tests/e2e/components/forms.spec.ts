import { expect, test } from '@playwright/test';

import { expectOut, openFixture } from '../helpers';

test.describe('TextInput + FormField', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'text-input');
  });

  test('label, required and description reach the input', async ({ page }) => {
    const input = page.getByRole('textbox', { name: 'Full name' });
    await expect(input).toHaveAttribute('required', '');
    await expect(input).toHaveAccessibleDescription('As printed on the report.');
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText('text', { exact: true })).toBeVisible();
  });

  test('typing reports the text', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Full name' }).fill('Ada Lovelace');
    await expectOut(page, 'name', 'Ada Lovelace');
  });

  test('error marks the input invalid, is announced and joins the description', async ({ page }) => {
    await page.getByRole('checkbox', { name: 'Show error' }).check();
    const input = page.getByRole('textbox', { name: 'Full name' });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('As printed on the report. Name is required.');
    await expect(page.getByRole('alert')).toHaveText('Name is required.');

    await page.getByRole('checkbox', { name: 'Show error' }).uncheck();
    await expect(input).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('multiline input keeps new lines', async ({ page }) => {
    const notes = page.getByRole('textbox', { name: 'Notes' });
    await notes.fill('');
    await notes.pressSequentially('a');
    await notes.press('Enter');
    await notes.pressSequentially('b');
    await expectOut(page, 'notes', 'a\nb');
  });

  test('disabled field cannot be edited', async ({ page }) => {
    await expect(page.getByRole('textbox', { name: 'Locked' })).toBeDisabled();
  });
});

test.describe('NumberInput', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'number-input');
  });

  test('exposes a spinbutton with range and description', async ({ page }) => {
    const input = page.getByRole('spinbutton', { name: 'Length' });
    await expect(input).toHaveAttribute('aria-valuemin', '0');
    await expect(input).toHaveAttribute('aria-valuemax', '100');
    await expect(input).toHaveAttribute('aria-valuenow', '1');
    await expect(input).toHaveAccessibleDescription('0 to 100 ft');
  });

  test('emits numbers, never strings or NaN', async ({ page }) => {
    const input = page.getByRole('spinbutton', { name: 'Length' });
    await input.fill('12.5');
    await expectOut(page, 'value', 12.5);
    await input.fill('');
    await expectOut(page, 'value', null);
    await input.pressSequentially('abc');
    await expect(input).toHaveValue('');
    await expectOut(page, 'value', null);
  });

  test('does not call onChange when blur leaves the value unchanged', async ({ page }) => {
    const input = page.getByRole('spinbutton', { name: 'Length' });
    await input.focus();
    await input.blur();
    await expectOut(page, 'calls', 0);
    await input.fill('3');
    await input.blur();
    await expectOut(page, 'calls', 1);
  });

  test('follows value changes made by the app', async ({ page }) => {
    const input = page.getByRole('spinbutton', { name: 'Length' });
    await page.getByRole('button', { name: 'Load 42.5' }).click();
    await expect(input).toHaveValue('42.5');
    await page.getByRole('button', { name: 'Clear from app' }).click();
    await expect(input).toHaveValue('');
    await expect(input).not.toHaveAttribute('aria-valuenow');
  });

  test('Shift+Arrow steps 10x and clamps to the range', async ({ page }) => {
    const input = page.getByRole('spinbutton', { name: 'Length' });
    await input.press('ArrowUp');
    await expectOut(page, 'value', 1.5);
    await input.press('Shift+ArrowDown');
    await expectOut(page, 'value', 0);
    await expect(input).toHaveValue('0');
  });

  test('precision limits typed decimals and pads on blur', async ({ page }) => {
    const price = page.getByRole('spinbutton', { name: 'Price' });
    await price.pressSequentially('1.239');
    await expect(price).toHaveValue('1.23');
    await expectOut(page, 'price', 1.23);
    await price.fill('5');
    await price.press('Enter');
    await expect(price).toHaveValue('5.00');
    await expectOut(page, 'price', 5);
  });

  test('read-only ignores arrow keys; disabled cannot be focused for editing', async ({ page }) => {
    const ro = page.getByRole('spinbutton', { name: 'Read only' });
    await ro.press('ArrowUp');
    await expect(ro).toHaveValue('5');
    await expect(page.getByRole('spinbutton', { name: 'Disabled number' })).toBeDisabled();
  });
});

test.describe('Select', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'select');
  });

  test('shows the placeholder and is labelled and described by its field', async ({ page }) => {
    const select = page.getByRole('combobox', { name: 'Size' });
    await expect(select).toHaveText('Pick a size');
    await expect(select).toHaveAccessibleDescription('Nominal size');
    await expect(page.getByRole('combobox', { name: 'Standalone select' })).toBeVisible();
  });

  test('keyboard: open, move (skipping disabled), select, focus returns', async ({ page }) => {
    const select = page.getByRole('combobox', { name: 'Size' });
    await select.focus();
    await page.keyboard.press('ArrowDown');
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await expect(page.getByRole('option', { name: 'Small' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('option', { name: 'Extra large' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(listbox).toBeHidden();
    await expectOut(page, 'size', 4);
    await expect(select).toHaveText('Extra large');
    await expect(select).toBeFocused();
  });

  test('keeps the value type of the options (number, not string)', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Size' }).click();
    await page.getByRole('option', { name: 'Medium' }).click();
    await expect(page.getByTestId('size')).toHaveText('2');
  });

  test('disabled option cannot be chosen', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Size' }).click();
    const large = page.getByRole('option', { name: 'Large', exact: true });
    await expect(large).toHaveAttribute('aria-disabled', 'true');
    await large.click({ force: true });
    await expectOut(page, 'size', '');
  });

  test('Escape closes without changing the value', async ({ page }) => {
    const select = page.getByRole('combobox', { name: 'Size' });
    await select.click();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();
    await expectOut(page, 'size', '');
    await expect(select).toBeFocused();
  });

  test('dropdown matches the field width, not the action-menu limits', async ({ page }) => {
    const select = page.getByRole('combobox', { name: 'Size' });
    const fieldWidth = await select.evaluate((el) => (el.parentElement as HTMLElement).offsetWidth);
    expect(fieldWidth).toBeGreaterThan(320);
    await select.click();
    // offsetWidth: layout width, unaffected by the scale() of the opening animation.
    const menuWidth = await page.getByRole('listbox').evaluate((el) => (el.closest('.MuiPaper-root') as HTMLElement).offsetWidth);
    expect(menuWidth).toBe(fieldWidth);
  });

  test('multiple: stays open while picking and reports an array', async ({ page }) => {
    const select = page.getByRole('combobox', { name: 'Materials' });
    await select.click();
    await page.getByRole('option', { name: 'Wood' }).click();
    await page.getByRole('option', { name: 'Concrete' }).click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await expectOut(page, 'materials', ['wood', 'concrete']);
    await page.getByRole('option', { name: 'Wood' }).click();
    await expectOut(page, 'materials', ['concrete']);
    await page.keyboard.press('Escape');
    await expect(select).toHaveText('Concrete');
  });
});

test.describe('Combobox', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'combobox');
  });

  test('filters while typing and selects with the keyboard', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Fruit' });
    await input.pressSequentially('ban');
    await expect(page.getByRole('option')).toHaveText(['Banana']);
    await input.press('ArrowDown');
    await input.press('Enter');
    await expectOut(page, 'fruit', 'banana');
    await expect(input).toHaveValue('Banana');
    await expect(page.getByRole('listbox')).toBeHidden();
  });

  test('shows the no-options text', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Fruit' }).pressSequentially('zzz');
    await expect(page.getByText('Nothing found')).toBeVisible();
  });

  test('disabled option cannot be chosen', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Fruit' }).pressSequentially('cher');
    const cherry = page.getByRole('option', { name: 'Cherry' });
    await expect(cherry).toHaveAttribute('aria-disabled', 'true');
    await cherry.click({ force: true });
    await expectOut(page, 'fruit', null);
  });

  test('options with rich labels are searchable through searchText', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Fruit' });
    await input.pressSequentially('drag');
    await page.getByRole('option', { name: 'Dragon fruit' }).click();
    await expectOut(page, 'fruit', 'dragon');
    await expect(input).toHaveValue('Dragon fruit');
  });

  test('clear button resets to null', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Fruit' });
    await input.pressSequentially('app');
    await page.getByRole('option', { name: 'Apple' }).click();
    await expectOut(page, 'fruit', 'apple');
    await input.hover();
    await page.getByRole('button', { name: 'Clear' }).click();
    await expectOut(page, 'fruit', null);
    await expect(input).toHaveValue('');
  });

  test('Escape closes the list', async ({ page }) => {
    const input = page.getByRole('combobox', { name: 'Fruit' });
    await input.click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await input.press('Escape');
    await expect(page.getByRole('listbox')).toBeHidden();
  });
});

test.describe('Checkbox, Switch, RadioGroup', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'choice');
  });

  test('checkbox toggles by label click and Space, reporting booleans', async ({ page }) => {
    await page.getByText('Accept terms').click();
    await expectOut(page, 'accept', true);
    const box = page.getByRole('checkbox', { name: 'Accept terms' });
    await expect(box).toBeChecked();
    await box.press(' ');
    await expectOut(page, 'accept', false);
    await expect(box).not.toBeChecked();
  });

  test('switch exposes role switch and toggles', async ({ page }) => {
    const sw = page.getByRole('switch', { name: 'Metric units' });
    await expect(sw).toBeChecked();
    await sw.click();
    await expectOut(page, 'metric', false);
    await sw.press(' ');
    await expectOut(page, 'metric', true);
  });

  test('disabled checkbox does not change', async ({ page }) => {
    const box = page.getByRole('checkbox', { name: 'Locked option' });
    await expect(box).toBeDisabled();
    await page.getByText('Locked option').click({ force: true });
    await expectOut(page, 'locked', false);
  });

  test('radio group is named by its field and keeps number values', async ({ page }) => {
    const group = page.getByRole('radiogroup', { name: 'Plies' });
    await expect(group).toBeVisible();
    await expect(group).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('radio', { name: 'One ply' })).toBeChecked();
    await page.getByRole('radio', { name: 'Two plies' }).click();
    await expect(page.getByTestId('count')).toHaveText('2');
  });

  test('arrow keys move the selection and skip disabled options', async ({ page }) => {
    await page.getByRole('radio', { name: 'One ply' }).focus();
    await page.keyboard.press('ArrowRight');
    await expectOut(page, 'count', 2);
    await page.keyboard.press('ArrowRight');
    await expectOut(page, 'count', 4);
    await expect(page.getByRole('radio', { name: 'Four plies' })).toBeFocused();
    await expect(page.getByRole('radio', { name: 'Three plies' })).toBeDisabled();
  });

  test('boolean radio values stay booleans', async ({ page }) => {
    await page.getByRole('radio', { name: 'No' }).click();
    await expect(page.getByTestId('yes')).toHaveText('false');
    await page.getByRole('radio', { name: 'Yes' }).click();
    await expect(page.getByTestId('yes')).toHaveText('true');
  });
});

test.describe('OptionCardGroup', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'option-card');
  });

  test('selects one card and exposes the pressed state', async ({ page }) => {
    const single = page.getByRole('button', { name: 'Single shear' });
    const double = page.getByRole('button', { name: 'Double shear' });
    await expect(single).toHaveAttribute('aria-pressed', 'true');
    await double.click();
    await expectOut(page, 'shear', 'double');
    await expect(double).toHaveAttribute('aria-pressed', 'true');
    await expect(single).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking the selected card keeps it selected (never null)', async ({ page }) => {
    await page.getByRole('button', { name: 'Single shear' }).click();
    await expectOut(page, 'shear', 'single');
  });

  test('disabled card cannot be selected; Space selects a focused card', async ({ page }) => {
    await page.getByRole('button', { name: 'Unavailable' }).click({ force: true });
    await expectOut(page, 'shear', 'single');
    await page.getByRole('button', { name: 'Double shear' }).press(' ');
    await expectOut(page, 'shear', 'double');
  });
});
