import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  isEmptyFilter,
  matchesNumberRange,
  matchesSearch,
  matchesSelect,
  matchesText,
  normalizeText,
} from '../../src/components/grid/gridFilters.ts';

describe('normalizeText', () => {
  it('ignores case, accents and Vietnamese đ', () => {
    assert.equal(normalizeText('Bê Tông'), 'be tong');
    assert.equal(normalizeText('Đường'), 'duong');
    assert.equal(normalizeText('Café'), 'cafe');
    assert.equal(normalizeText(null), '');
    assert.equal(normalizeText(12.5), '12.5');
  });
});

describe('matchesText', () => {
  it('is a case- and accent-insensitive contains', () => {
    assert.ok(matchesText('Bê tông cốt thép', 'be tong'));
    assert.ok(matchesText('SDWS22400', 'ws224'));
    assert.ok(!matchesText('Steel', 'wood'));
    assert.ok(matchesText('anything', ''));
    assert.ok(matchesText(undefined, '  '));
    assert.ok(!matchesText(undefined, 'x'));
  });
});

describe('matchesNumberRange', () => {
  it('is inclusive and supports open bounds', () => {
    assert.ok(matchesNumberRange(5, { min: 5, max: 10 }));
    assert.ok(matchesNumberRange(10, { min: 5, max: 10 }));
    assert.ok(!matchesNumberRange(10.01, { min: 5, max: 10 }));
    assert.ok(matchesNumberRange(1e9, { min: 5 }));
    assert.ok(matchesNumberRange(-3, { max: 0 }));
  });
  it('an empty range matches all; missing values never match an active range', () => {
    assert.ok(matchesNumberRange(undefined, {}));
    assert.ok(matchesNumberRange(undefined, { min: null, max: null }));
    assert.ok(!matchesNumberRange(undefined, { min: 0 }));
    assert.ok(!matchesNumberRange('7', { min: 0 }));
    assert.ok(!matchesNumberRange(Number.NaN, { min: 0 }));
  });
});

describe('matchesSelect', () => {
  it('keeps value types (1 is not "1")', () => {
    assert.ok(matchesSelect(1, [1, 2]));
    assert.ok(!matchesSelect('1', [1, 2]));
    assert.ok(matchesSelect(false, [false]));
    assert.ok(matchesSelect('x', []));
  });
});

describe('isEmptyFilter', () => {
  it('recognizes filters that filter nothing', () => {
    for (const v of [undefined, null, '', '   ', [], {}, { min: null, max: undefined }]) assert.ok(isEmptyFilter(v), JSON.stringify(v));
    for (const v of ['a', [1], { min: 0 }, { max: 3 }]) assert.ok(!isEmptyFilter(v), JSON.stringify(v));
  });
});

describe('matchesSearch', () => {
  it('requires every term somewhere in the row', () => {
    const row = ['SDWS22400', 'Wood to wood', 1450];
    assert.ok(matchesSearch(row, 'wood 1450'));
    assert.ok(matchesSearch(row, '  WOOD  '));
    assert.ok(!matchesSearch(row, 'wood steel'));
    assert.ok(matchesSearch(row, ''));
    assert.ok(matchesSearch(['Bê tông'], 'be tong'));
  });
});
