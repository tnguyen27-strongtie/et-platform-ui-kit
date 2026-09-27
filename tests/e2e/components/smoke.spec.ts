import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { collectErrors, fixtureNames, openFixture } from '../helpers';

// Every fixture must render cleanly and pass axe. The error-boundary fixture throws on
// purpose later in its own spec, but its initial render must be clean too.
for (const name of fixtureNames) {
  test(`${name}: renders without console errors and passes axe`, async ({ page }) => {
    const errors = collectErrors(page);
    await openFixture(page, name);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);

    const results = await new AxeBuilder({ page })
      // Default brand colors are a documented design decision (see README, "Not included yet").
      .disableRules(['color-contrast'])
      .analyze();
    expect(results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}
