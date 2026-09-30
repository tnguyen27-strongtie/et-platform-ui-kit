import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { defineAppearance, glassAppearance } from '../../src/theme/appearance.ts';
import { adaptBrandForDark, alpha, brandShades, contrast, darken, lighten, mix, parseColor, readableOn, resolveRoleColors } from '../../src/theme/colorMath.ts';
import { normalizeThemeConfig, parseThemeConfig } from '../../src/theme/themeConfig.ts';
import { darkTrueGray, defaultColors, defaultDarkColors, scales } from '../../src/tokens/tokens.ts';

const defaults = { light: defaultColors as Record<string, string>, dark: defaultDarkColors as Record<string, string> };
const ratio = (fg: string, bg: string) => contrast(fg, bg) ?? 0;

describe('lighten / darken / alpha match MUI', () => {
  // Outputs of @mui/material/styles for the same inputs (the helpers the kit used before).
  const cases: Array<[string, string, string, string, string, string, string, string]> = [
    ['#a8671d', 'rgb(181, 125, 62)', 'rgb(126, 77, 21)', 'rgb(100, 61, 17)', 'rgb(248, 244, 239)', 'rgb(237, 224, 209)', 'rgb(211, 179, 142)', 'rgba(168, 103, 29, 0.5)'],
    ['#1f5f99', 'rgb(64, 119, 168)', 'rgb(23, 71, 114)', 'rgb(18, 57, 91)', 'rgb(239, 243, 247)', 'rgb(210, 223, 234)', 'rgb(143, 175, 204)', 'rgba(31, 95, 153, 0.5)'],
    ['#ffd400', 'rgb(255, 218, 38)', 'rgb(191, 159, 0)', 'rgb(153, 127, 0)', 'rgb(255, 251, 237)', 'rgb(255, 246, 204)', 'rgb(255, 233, 127)', 'rgba(255, 212, 0, 0.5)'],
    ['rgb(31, 95, 153)', 'rgb(64, 119, 168)', 'rgb(23, 71, 114)', 'rgb(18, 57, 91)', 'rgb(239, 243, 247)', 'rgb(210, 223, 234)', 'rgb(143, 175, 204)', 'rgba(31, 95, 153, 0.5)'],
  ];
  for (const [c, l15, d25, d40, l93, l80, l50, a50] of cases) {
    it(c, () => {
      assert.deepEqual(
        [lighten(c, 0.15), darken(c, 0.25), darken(c, 0.4), lighten(c, 0.93), lighten(c, 0.8), lighten(c, 0.5), alpha(c, 0.5)],
        [l15, d25, d40, l93, l80, l50, a50],
      );
    });
  }
  it('leaves unparseable colors alone', () => {
    assert.equal(lighten('var(--x)', 0.2), 'var(--x)');
    assert.equal(parseColor('blue'), null);
  });
});

describe('mix, contrast, readableOn', () => {
  it('blends over a base', () => {
    assert.equal(mix('#ffffff', '#000000', 0.5), 'rgb(127, 127, 127)');
    assert.equal(mix('#ff0000', '#000000', 0), 'rgb(0, 0, 0)');
  });
  it('picks the more readable text color', () => {
    assert.equal(readableOn('#ffd400'), '#1d1d1d');
    assert.equal(readableOn('#1f5f99'), '#ffffff');
    assert.ok(Math.abs(ratio('#000000', '#ffffff') - 21) < 0.01);
  });
});

describe('light scheme resolution (unchanged behavior)', () => {
  it('derives brand shades and lets given roles win', () => {
    const r = resolveRoleColors('light', { colors: { brand: '#1f5f99', danger: '#c62828' } }, defaults);
    assert.equal(r.brandHover, 'rgb(64, 119, 168)');
    assert.equal(r.danger, '#c62828');
    assert.equal(r.surface, defaultColors.surface);
  });
  it('without config returns the defaults', () => {
    assert.deepEqual(resolveRoleColors('light', {}, defaults), defaultColors);
  });
});

describe('dark scheme resolution', () => {
  it('without config returns the dark defaults', () => {
    assert.deepEqual(resolveRoleColors('dark', {}, defaults), defaultDarkColors);
  });
  it('makes a light brand readable on the dark surface and picks textOnBrand', () => {
    const r = resolveRoleColors('dark', { colors: { brand: '#1f5f99', surface: '#ffffff' } }, defaults);
    assert.ok(ratio(r.brand!, r.surface!) >= 4.5, `brand ${r.brand} on ${r.surface}`);
    assert.ok(ratio(r.textOnBrand!, r.brand!) >= 4.5);
    assert.equal(r.surface, defaultDarkColors.surface, 'light-only roles do not carry over');
    assert.ok(ratio(r.brandSubtle!, r.surface!) < 1.5, 'subtle tint stays close to the surface');
  });
  it('an explicit dark brand wins over the adapted light brand', () => {
    const r = resolveRoleColors('dark', { colors: { brand: '#1f5f99' }, darkColors: { brand: '#8ab4f8', text: '#ffffff' } }, defaults);
    assert.equal(r.brand, '#8ab4f8');
    assert.equal(r.text, '#ffffff');
  });
  it('uses appearance dark colors under the app', () => {
    const r = resolveRoleColors('dark', { appearanceDarkColors: glassAppearance.dark?.colors, darkColors: { border: '#333333' } }, defaults);
    assert.equal(r.surface, glassAppearance.dark?.colors?.surface);
    assert.equal(r.border, '#333333');
  });
  it('adaptBrandForDark keeps brands that already pass', () => {
    assert.equal(adaptBrandForDark('#e0973f', defaultDarkColors.surface), '#e0973f');
  });
  it('derives dark shades from any brand', () => {
    const s = brandShades('#6a3d9a', 'dark', defaultDarkColors.surface);
    assert.ok(s.textOnBrand && s.brandSubtle && s.focusRing);
  });
});

describe('dark defaults meet WCAG AA', () => {
  const c = defaultDarkColors;
  const pairs: Array<[string, string, string, number]> = [
    ['body text', c.text, c.surface, 4.5],
    ['muted text', c.textMuted, c.surface, 4.5],
    ['muted text on app background', c.textMuted, c.surfaceApp, 4.5],
    ['links', c.link, c.surface, 4.5],
    ['errors', c.danger, c.surface, 4.5],
    ['danger button text', c.textOnColor, c.danger, 4.5],
    ['secondary button text', c.textOnColor, c.neutral, 4.5],
    ['warning text', c.warningText, c.surface, 4.5],
    ['selected option', c.text, c.brandSelected, 4.5],
    ['primary button text', c.textOnBrand, c.brand, 4.5],
    ['strong text', c.textStrong, c.surfaceSubtle, 4.5],
    ['focus ring, checked controls', c.brand, c.surface, 3],
    ['input border', c.borderInput, c.surface, 3],
  ];
  for (const [label, fg, bg, min] of pairs) {
    it(label, () => assert.ok(ratio(fg, bg) >= min, `${fg} on ${bg}: ${ratio(fg, bg).toFixed(2)} < ${min}`));
  }
  it('the dark neutral scale is the light one reversed', () => {
    assert.equal(darkTrueGray[0], scales.trueGray[100]);
    assert.equal(darkTrueGray[30], scales.trueGray[70]);
    assert.equal(darkTrueGray.base, scales.trueGray.base);
  });
});

describe('theme files: colorScheme and darkColors', () => {
  it('parses and exports them', () => {
    const r = parseThemeConfig({ colorScheme: 'system', darkColors: { brand: '#8ab4f8', nope: '#000' } });
    assert.equal(r.ok, true);
    if (r.ok) assert.deepEqual(r.config, { colorScheme: 'system', darkColors: { brand: '#8ab4f8' } });
    assert.equal(parseThemeConfig({ colorScheme: 'dim' }).ok, false);
    assert.deepEqual(normalizeThemeConfig({ colorScheme: 'light', darkColors: { brand: '#8ab4f8' } }), { version: 1, darkColors: { brand: '#8ab4f8' } });
  });
});

describe('appearance dark and radius parts', () => {
  it('defineAppearance merges them key by key', () => {
    const a = defineAppearance({ name: 'x', radius: { sm: '0.25rem' }, dark: { colors: { surface: '#101010' } } }, 'glass');
    assert.equal(a.radius?.sm, '0.25rem');
    assert.equal(a.radius?.md, glassAppearance.radius?.md);
    assert.equal(a.dark?.colors?.surface, '#101010');
    assert.equal(a.dark?.colors?.border, glassAppearance.dark?.colors?.border);
    assert.equal(a.dark?.shadows?.modal, glassAppearance.dark?.shadows?.modal);
  });
});
