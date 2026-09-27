import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { defaultColors } from '../../src/tokens/tokens.ts';
import {
  COLOR_ROLES,
  contrastRatio,
  isValidColor,
  normalizeThemeConfig,
  parseRgb,
  parseThemeConfig,
  themeConfigToJson,
  themeConfigToTs,
} from '../../src/theme/themeConfig.ts';

describe('COLOR_ROLES', () => {
  it('lists exactly the roles of defaultColors', () => {
    assert.deepEqual([...COLOR_ROLES].sort(), Object.keys(defaultColors).sort());
  });
});

describe('isValidColor', () => {
  it('accepts hex, rgb and hsl', () => {
    for (const c of ['#fff', '#1f5f99', '#1f5f99cc', 'rgb(31, 95, 153)', 'rgba(0,0,0,.5)', 'rgb(31 95 153 / 50%)', 'hsl(210, 67%, 36%)']) {
      assert.ok(isValidColor(c), c);
    }
  });
  it('rejects names, var() and junk', () => {
    for (const c of ['blue', 'var(--x)', '#12', '#ggg', '', 12, null]) assert.ok(!isValidColor(c), String(c));
  });
});

describe('parseThemeConfig', () => {
  it('accepts a valid theme and keeps only known parts', () => {
    const r = parseThemeConfig('{"version":1,"name":" Demo ","colors":{"brand":"#1f5f99","nope":"#000"},"density":"expanded","extra":1}');
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.deepEqual(r.config, { version: 1, name: 'Demo', colors: { brand: '#1f5f99' }, density: 'expanded' });
    assert.deepEqual(r.warnings, ['Unknown key "extra" ignored.', 'Unknown color role "nope" ignored.']);
  });
  it('reports invalid JSON, values and versions as errors', () => {
    assert.equal(parseThemeConfig('{bad').ok, false);
    assert.equal(parseThemeConfig('[]').ok, false);
    const r = parseThemeConfig({ version: 2, colors: { brand: 'blue' }, density: 'huge' });
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.equal(r.errors.length, 3);
    assert.match(r.errors.join('\n'), /colors\.brand/);
  });
});

describe('export', () => {
  it('writes only what changed', () => {
    assert.deepEqual(normalizeThemeConfig({ colors: { brand: '#111111', danger: '' }, density: 'standard', name: '' }), {
      version: 1,
      colors: { brand: '#111111' },
    });
    assert.equal(themeConfigToJson({}), '{\n  "version": 1\n}\n');
  });
  it('produces a theme.config.ts that round-trips', () => {
    const ts = themeConfigToTs({ name: 'Demo', colors: { brand: '#1f5f99' } });
    assert.match(ts, /import \{ definePlatformTheme \} from '@platform\/ui';/);
    assert.match(ts, /colors: \{\n\s+brand: "#1f5f99"/);
    const json = ts.slice(ts.indexOf('(') + 1, ts.lastIndexOf(')')).replace(/(\w+):/g, '"$1":');
    assert.deepEqual(JSON.parse(json), { version: 1, name: 'Demo', colors: { brand: '#1f5f99' } });
  });
});

describe('contrastRatio', () => {
  it('matches WCAG reference values', () => {
    assert.equal(contrastRatio('#000', '#fff'), 21);
    assert.equal(contrastRatio('#fff', '#fff'), 1);
    assert.equal(contrastRatio('#767676', '#ffffff'), 4.54);
    assert.equal(contrastRatio('rgb(118, 118, 118)', '#fff'), 4.54);
    assert.equal(contrastRatio('var(--x)', '#fff'), null);
  });
  it('parses short hex and rgba', () => {
    assert.deepEqual(parseRgb('#abc'), [170, 187, 204]);
    assert.deepEqual(parseRgb('rgba(1, 2, 3, 0.5)'), [1, 2, 3]);
  });
});
