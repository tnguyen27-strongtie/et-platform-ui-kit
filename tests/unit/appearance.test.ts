import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  APPEARANCE_NAMES,
  APPEARANCES,
  classicAppearance,
  defineAppearance,
  glassAppearance,
  isAppearanceName,
  resolveAppearance,
} from '../../src/theme/appearance.ts';
import { normalizeThemeConfig, parseThemeConfig, themeConfigToTs } from '../../src/theme/themeConfig.ts';
import { defaultMaterial, defaultShape, shadows } from '../../src/tokens/tokens.ts';

describe('built-in appearances', () => {
  it('Classic changes nothing: every token keeps its default', () => {
    assert.deepEqual(Object.keys(classicAppearance).sort(), ['description', 'label', 'name']);
  });
  it('only use known roles', () => {
    for (const a of Object.values(APPEARANCES)) {
      for (const role of Object.keys(a.shape ?? {})) assert.ok(role in defaultShape, `${a.name} shape.${role}`);
      for (const role of Object.keys(a.shadows ?? {})) assert.ok(role in shadows, `${a.name} shadows.${role}`);
      for (const role of Object.keys({ ...a.material, ...a.reducedTransparency })) assert.ok(role in defaultMaterial, `${a.name} material.${role}`);
    }
  });
  it('are keyed by their own name', () => {
    for (const [key, a] of Object.entries(APPEARANCES)) assert.equal(a.name, key);
    assert.deepEqual(APPEARANCE_NAMES, ['classic', 'glass']);
  });
  it('Glass makes every translucent material solid under reduced transparency', () => {
    const translucent = Object.entries(glassAppearance.material ?? {}).filter(([role, v]) => role !== 'app' && role !== 'splitter' && /transparent|blur/.test(v));
    for (const [role] of translucent) assert.ok(glassAppearance.reducedTransparency?.[role as keyof typeof defaultMaterial], role);
  });
});

describe('resolveAppearance', () => {
  it('maps names, objects, unknown and missing values', () => {
    assert.equal(resolveAppearance('glass'), glassAppearance);
    assert.equal(resolveAppearance(undefined), classicAppearance);
    assert.equal(resolveAppearance('nope' as never), classicAppearance);
    const custom = { name: 'custom' };
    assert.equal(resolveAppearance(custom), custom);
    assert.ok(isAppearanceName('glass'));
    assert.ok(!isAppearanceName('toString'));
  });
});

describe('defineAppearance', () => {
  it('merges each part key by key over the base', () => {
    const a = defineAppearance({ name: 'x', shape: { control: '0.75rem' }, material: { filter: 'blur(4px)' } }, 'glass');
    assert.equal(a.name, 'x');
    assert.equal(a.shape?.control, '0.75rem');
    assert.equal(a.shape?.dialog, glassAppearance.shape?.dialog);
    assert.equal(a.material?.filter, 'blur(4px)');
    assert.equal(a.material?.panel, glassAppearance.material?.panel);
    assert.equal(a.fontFamily, glassAppearance.fontFamily);
  });
  it('builds on Classic by default and leaves out empty parts', () => {
    assert.deepEqual(defineAppearance({ name: 'y', shape: { panel: '0' } }), { ...classicAppearance, name: 'y', shape: { panel: '0' } });
  });
});

describe('theme file appearance', () => {
  it('accepts built-in names and rejects others', () => {
    const ok = parseThemeConfig('{"appearance":"glass"}');
    assert.equal(ok.ok, true);
    if (ok.ok) assert.equal(ok.config.appearance, 'glass');
    const bad = parseThemeConfig({ appearance: 'neon' });
    assert.equal(bad.ok, false);
    if (!bad.ok) assert.match(bad.errors[0]!, /"appearance" must be one of "classic", "glass"/);
  });
  it('accepts every built-in appearance (keeps the file list in sync)', () => {
    for (const name of APPEARANCE_NAMES) assert.equal(parseThemeConfig({ appearance: name }).ok, true, name);
  });
  it('exports only a non-default appearance', () => {
    assert.deepEqual(normalizeThemeConfig({ appearance: 'classic' }), { version: 1 });
    assert.deepEqual(normalizeThemeConfig({ appearance: 'glass' }), { version: 1, appearance: 'glass' });
    assert.match(themeConfigToTs({ appearance: 'glass' }), /appearance: "glass"/);
  });
});
