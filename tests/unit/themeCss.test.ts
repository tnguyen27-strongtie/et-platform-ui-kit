import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { classicAppearance, defineAppearance, glassAppearance } from '../../src/theme/appearance.ts';
import { appearanceCssVars, themeCss } from '../../src/theme/colors.ts';
import { darkTrueGray, defaultColors, defaultDarkColors, defaultDarkMaterial, scales } from '../../src/tokens/tokens.ts';

/** The declarations of the first `selector{…}` block, as a map. */
function block(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector}{`);
  assert.ok(start >= 0, `no ${selector} block in ${css.slice(0, 120)}…`);
  const body = css.slice(start + selector.length + 1, css.indexOf('}', start));
  return Object.fromEntries(
    body
      .split(';')
      .filter(Boolean)
      .map((d) => [d.slice(0, d.indexOf(':')), d.slice(d.indexOf(':') + 1)]),
  );
}

const CANVAS = "[data-surface='canvas']";
const REDUCED = '@media (prefers-reduced-transparency: reduce)';

describe('themeCss', () => {
  it('light Classic: kit colors on :root, no dark-only or Glass-only parts', () => {
    const css = themeCss({ appearance: classicAppearance });
    const root = block(css, ':root');
    assert.equal(root['color-scheme'], 'light');
    assert.equal(root['--color-brand'], defaultColors.brand);
    assert.equal(root['--color-text'], defaultColors.text);
    assert.ok(!css.includes(CANVAS));
    assert.ok(!css.includes(REDUCED));
  });

  it('app colors override the kit colors', () => {
    const root = block(themeCss({ appearance: classicAppearance, colors: { brand: '#1565c0' } }), ':root');
    assert.equal(root['--color-brand'], '#1565c0');
  });

  it('dark: dark role colors and a reversed neutral scale', () => {
    const root = block(themeCss({ scheme: 'dark', appearance: classicAppearance }), ':root');
    assert.equal(root['color-scheme'], 'dark');
    assert.equal(root['--color-text'], defaultDarkColors.text);
    assert.equal(root['--color-surface'], defaultDarkColors.surface);
    for (const [step, value] of Object.entries(darkTrueGray)) assert.equal(root[`--color-true-gray-${step}`], value);
  });

  it('dark with the default white canvas: canvas content keeps the light colors', () => {
    const canvas = block(themeCss({ scheme: 'dark', appearance: classicAppearance }), CANVAS);
    assert.equal(canvas['color-scheme'], 'light');
    assert.equal(canvas['--color-text'], defaultColors.text);
    assert.equal(canvas['--color-true-gray-10'], scales.trueGray[10]);
    assert.equal(canvas.color, 'var(--color-text)');
  });

  it('dark with a dark canvas, or one contrast() cannot read: no canvas override', () => {
    const darkCanvas = defineAppearance({ name: 'dark-canvas', material: { canvas: '#202020' } });
    assert.ok(!themeCss({ scheme: 'dark', appearance: darkCanvas }).includes(CANVAS));
    const varCanvas = defineAppearance({ name: 'var-canvas', material: { canvas: 'var(--my-canvas)' } });
    assert.ok(!themeCss({ scheme: 'dark', appearance: varCanvas }).includes(CANVAS));
  });

  it('a light canvas in the light scheme needs no override', () => {
    assert.ok(!themeCss({ scheme: 'light', appearance: classicAppearance }).includes(CANVAS));
  });

  it('Glass: solid materials for users who reduce transparency', () => {
    const css = themeCss({ appearance: glassAppearance });
    const start = css.indexOf(REDUCED);
    assert.ok(start >= 0);
    const reduced = block(css.slice(start), ':root');
    for (const [role, value] of Object.entries(glassAppearance.reducedTransparency ?? {})) {
      assert.equal(reduced[`--material-${role.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`], value, role);
    }
  });
});

describe('appearanceCssVars', () => {
  it('Classic in light uses the kit defaults', () => {
    const vars = appearanceCssVars(classicAppearance);
    assert.equal(vars['--material-canvas'], '#ffffff');
    assert.ok(vars['--font-sans']);
    assert.ok(vars['--workspace-gap']);
  });

  it('dark applies the kit dark materials, then the appearance dark part', () => {
    const dark = appearanceCssVars(classicAppearance, 'dark');
    for (const [role, value] of Object.entries(defaultDarkMaterial)) {
      assert.equal(dark[`--material-${role.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`], value, role);
    }
    const custom = defineAppearance({ name: 'x', material: { panel: 'red' }, dark: { material: { panel: 'blue' } } });
    assert.equal(appearanceCssVars(custom, 'light')['--material-panel'], 'red');
    assert.equal(appearanceCssVars(custom, 'dark')['--material-panel'], 'blue');
  });
});
