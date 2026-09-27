# Templates

Copy-and-adapt snippets for each step of the component workflow. They follow the patterns already used in the repo; when in doubt, open the closest existing file (named in each section) and match it.

- [Display component](#display-component)
- [Form control](#form-control)
- [Export](#export)
- [Showcase demo and catalog entry](#showcase-demo-and-catalog-entry)
- [Fixture](#fixture)
- [E2E spec](#e2e-spec)
- [Unit test](#unit-test)
- [Docs entry](#docs-entry)
- [Changelog entry](#changelog-entry)

## Display component

Closest examples: `src/components/Card.tsx`, `src/components/EmptyState.tsx`.

```tsx
import { type ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface StatBadgeProps {
  /** Short caption above the value, e.g. "Capacity". */
  label: ReactNode;
  /** The value, already formatted by the app. */
  value: ReactNode;
  /** Colors the value by status. Default 'neutral'. */
  tone?: 'neutral' | 'success' | 'danger';
  className?: string;
}

const toneClass = { neutral: 'text-text', success: 'text-success-strong', danger: 'text-danger' } as const;

/** Compact label + value pair for result summaries. */
export function StatBadge({ label, value, tone = 'neutral', className }: StatBadgeProps) {
  return (
    <div className={cn('flex flex-col gap-0.5 rounded-sm border border-border-strong bg-surface px-2 py-1', className)}>
      <span className="text-xs text-text-muted">{label}</span>
      <span className={cn('text-sm font-bold', toneClass[tone])}>{value}</span>
    </div>
  );
}
```

## Form control

Closest examples: `src/components/Select.tsx`, `src/components/Combobox.tsx`, `src/components/NumberInput.tsx`.

```tsx
import { useFormField } from './FormField';

export interface UnitToggleProps<V extends string> {
  value: V;
  options: Array<{ value: V; label: string }>;
  /** Receives the option value, not an event. */
  onChange: (value: V) => void;
  disabled?: boolean;
  /** Accessible name when not inside a FormField. */
  'aria-label'?: string;
}

export function UnitToggle<V extends string>({ value, options, onChange, disabled, 'aria-label': ariaLabel }: UnitToggleProps<V>) {
  const field = useFormField(); // null outside a FormField
  return (
    <div
      role="radiogroup"
      id={field?.id}
      aria-labelledby={field?.labelId}
      aria-label={field ? undefined : ariaLabel}
      aria-describedby={field?.describedBy}
      aria-invalid={field?.invalid || undefined}
    >
      {/* … options rendered as radios, disabled={disabled ?? field?.disabled} … */}
    </div>
  );
}
```

## Export

`src/index.ts`, next to related exports, alphabetical inside the braces:

```ts
export { StatBadge, type StatBadgeProps } from './components/StatBadge';
```

## Showcase demo and catalog entry

Page: `src/showcase/pages/DataDisplay.tsx` (pick the page that matches the component's group).

```tsx
<DemoSection
  id="stat-badge"
  title="StatBadge"
  description="Label + value pair for result summaries. tone colors the value by status."
  code={`<StatBadge label="Capacity" value="1,450 lbs" tone="success" />`}
>
  <div className="flex gap-2">
    <StatBadge label="Capacity" value="1,450 lbs" />
    <StatBadge label="Utilization" value="82%" tone="success" />
    <StatBadge label="Check" value="Fails" tone="danger" />
  </div>
</DemoSection>
```

`src/showcase/catalog.ts`, in the same page's `sections`:

```ts
{ id: 'stat-badge', title: 'StatBadge', exports: ['StatBadge'] },
```

`id` and `title` must match the `DemoSection` exactly; `exports` lists runtime exports only (not types).

## Fixture

`tests/e2e/harness/fixtures.tsx`. `Out` prints JSON so a spec can tell `2` from `"2"`.

```tsx
function UnitToggleFixture() {
  const [unit, setUnit] = useState<'in' | 'mm'>('in');
  return (
    <>
      <FormField label="Units" htmlFor="units" description="Used for every input">
        <UnitToggle value={unit} onChange={setUnit} options={[{ value: 'in', label: 'Inches' }, { value: 'mm', label: 'Millimeters' }]} />
      </FormField>
      <UnitToggle aria-label="Standalone units" value="in" onChange={() => undefined} options={[{ value: 'in', label: 'Inches' }]} disabled />
      <Out id="unit" value={unit} />
    </>
  );
}

// in the fixtures map:
'unit-toggle': UnitToggleFixture,
```

And in `tests/e2e/helpers.ts`, add `'unit-toggle'` to `fixtureNames`.

## E2E spec

`tests/e2e/components/forms.spec.ts` (or the matching group file).

```ts
test.describe('UnitToggle', () => {
  test.beforeEach(async ({ page }) => {
    await openFixture(page, 'unit-toggle');
  });

  test('is named and described by its FormField', async ({ page }) => {
    const group = page.getByRole('radiogroup', { name: 'Units' });
    await expect(group).toHaveAccessibleDescription('Used for every input');
  });

  test('mouse and keyboard select an option and report the value', async ({ page }) => {
    await page.getByRole('radio', { name: 'Millimeters' }).click();
    await expectOut(page, 'unit', 'mm');
    await page.keyboard.press('ArrowLeft');
    await expectOut(page, 'unit', 'in');
  });

  test('disabled toggle ignores input', async ({ page }) => {
    await expect(page.getByRole('radiogroup', { name: 'Standalone units' }).getByRole('radio').first()).toBeDisabled();
  });
});
```

Query by role and accessible name. Avoid CSS selectors unless you are asserting a style (`toHaveCSS`).

## Unit test

`tests/unit/<topic>.test.ts`, run by `node --test` with type stripping, so imports keep the `.ts` extension.

```ts
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { roundTo } from '../../src/utils/number.ts';

describe('roundTo', () => {
  it('rounds half away from zero without binary artifacts', () => {
    assert.equal(roundTo(1.005, 2), 1.01);
    assert.equal(roundTo(-2.5, 0), -3);
  });
});
```

## Docs entry

`docs/components.md`, in the matching group, same shape as the neighbors:

````md
### StatBadge

```tsx
<StatBadge label="Capacity" value="1,450 lbs" tone="success" />
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `ReactNode` | | Caption above the value |
| `value` | `ReactNode` | | Formatted value |
| `tone` | `'neutral' \| 'success' \| 'danger'` | `'neutral'` | Colors the value by status |
| `className` | `string` | | |
````

Escape `|` inside table cells as `\|`. Also add the component to the group list at the top of the page.

## Changelog entry

`CHANGELOG.md`, at the top:

```md
## [Unreleased]

### Added

- `StatBadge`: label + value pair for result summaries.
```
