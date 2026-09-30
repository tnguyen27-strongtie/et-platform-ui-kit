import { expect, type Page } from '@playwright/test';

/** Every fixture in tests/e2e/harness/fixtures.tsx. */
export const fixtureNames = [
  'button',
  'text-input',
  'number-input',
  'select',
  'combobox',
  'choice',
  'option-card',
  'tabs',
  'accordion',
  'dialog',
  'confirm',
  'menu',
  'overlay',
  'toast',
  'display',
  'error-boundary',
  'image-viewer',
  'layout',
  'layout-flex',
  'layout-sized',
  'density',
  'appearance',
  'grid',
  'grid-labels',
  'release-notes',
  'input-group',
  'error-alert',
  'agreement',
  'section-footer',
] as const;

export type FixtureName = (typeof fixtureNames)[number];

export async function openFixture(page: Page, name: FixtureName) {
  await page.goto(`/tests/e2e/harness/index.html#${name}`);
  await expect(page.locator('main').first()).not.toContainText('Unknown fixture');
}

/**
 * Key that moves focus to the next focusable element. Safari's default Tab reaches only text
 * fields and selects; Option+Tab also reaches buttons, checkboxes and links, like Tab elsewhere.
 */
export const tabKey = (browserName: string, shift = false) =>
  `${browserName === 'webkit' ? 'Alt+' : ''}${shift ? 'Shift+' : ''}Tab`;

/** Asserts what a fixture's callback received, value and type (2 vs "2"). */
export async function expectOut(page: Page, id: string, value: unknown) {
  await expect(page.getByTestId(id)).toHaveText(JSON.stringify(value));
}

/** Collects console errors and uncaught exceptions for the rest of the test. */
export function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}
