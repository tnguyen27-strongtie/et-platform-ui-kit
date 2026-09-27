import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  decimalsOf,
  formatDisplayNumber,
  formatFraction,
  formatNumber,
  isInRange,
  isPartialNumber,
  parseNumber,
  roundTo,
  stepNumber,
} from '../../src/utils/number.ts';

describe('isPartialNumber', () => {
  it('accepts text that can still become a number', () => {
    for (const t of ['', '-', '1', '12.', '12,5', '.5', '-0.25', '007']) assert.ok(isPartialNumber(t), t);
  });
  it('rejects letters, exponents, separators and spaces', () => {
    for (const t of ['e', '1e3', '1.2.3', '1,2,3', '1 000', '--1', '1-', '+1', 'abc', 'NaN', 'Infinity']) {
      assert.ok(!isPartialNumber(t), t);
    }
  });
  it('rejects a minus sign when min >= 0', () => {
    assert.ok(!isPartialNumber('-', { min: 0 }));
    assert.ok(isPartialNumber('-', { min: -5 }));
  });
  it('limits decimals to precision', () => {
    assert.ok(isPartialNumber('1.25', { precision: 2 }));
    assert.ok(!isPartialNumber('1.255', { precision: 2 }));
    assert.ok(!isPartialNumber('1.', { precision: 0 }));
    assert.ok(isPartialNumber('12', { precision: 0 }));
  });
});

describe('parseNumber', () => {
  it('returns null for empty and undefined for incomplete text', () => {
    assert.equal(parseNumber(''), null);
    assert.equal(parseNumber('  '), null);
    for (const t of ['-', '.', '-.', 'abc', '1e3']) assert.equal(parseNumber(t), undefined, t);
  });
  it('parses both decimal separators', () => {
    assert.equal(parseNumber('1.5'), 1.5);
    assert.equal(parseNumber('1,5'), 1.5);
    assert.equal(parseNumber('12.'), 12);
    assert.equal(parseNumber('.5'), 0.5);
  });
  it('never returns -0', () => {
    assert.ok(Object.is(parseNumber('-0'), 0));
    assert.ok(Object.is(parseNumber('-0.0'), 0));
  });
});

describe('roundTo', () => {
  it('rounds half away from zero without binary artefacts', () => {
    assert.equal(roundTo(1.005, 2), 1.01);
    assert.equal(roundTo(0.1 + 0.2, 10), 0.3);
    assert.equal(roundTo(2.5, 0), 3);
    assert.equal(roundTo(-2.5, 0), -3);
    assert.equal(roundTo(1.23456, 3), 1.235);
    assert.equal(roundTo(1e-7, 8), 1e-7);
    assert.ok(Object.is(roundTo(-0.0001, 2), 0));
  });
});

describe('decimalsOf', () => {
  it('counts written decimals', () => {
    assert.equal(decimalsOf(1), 0);
    assert.equal(decimalsOf(0.1), 1);
    assert.equal(decimalsOf(1.25), 2);
    assert.equal(decimalsOf(123.4), 1);
    assert.equal(decimalsOf(1e-7), 7);
  });
});

describe('stepNumber', () => {
  it('does not drift with decimal steps', () => {
    let v: number | null = 0;
    for (let i = 0; i < 3; i++) v = stepNumber(v, 0.1);
    assert.equal(v, 0.3);
    assert.equal(stepNumber(1.1, 0.2), 1.3);
  });
  it('clamps to the range', () => {
    assert.equal(stepNumber(9.5, 1, { max: 10 }), 10);
    assert.equal(stepNumber(0.5, -1, { min: 0 }), 0);
  });
  it('starts an empty field at 0 or the nearest bound', () => {
    assert.equal(stepNumber(null, 1), 0);
    assert.equal(stepNumber(null, 1, { min: 1.5 }), 1.5);
    assert.equal(stepNumber(null, -1, { max: -2 }), -2);
  });
  it('respects precision', () => {
    assert.equal(stepNumber(1, 0.125, { precision: 2 }), 1.13);
  });
});

describe('formatNumber', () => {
  it('formats for display', () => {
    assert.equal(formatNumber(null), '');
    assert.equal(formatNumber(1.5), '1.5');
    assert.equal(formatNumber(1.005, 2), '1.01');
    assert.equal(formatNumber(2, 3), '2.000');
    assert.equal(formatNumber(1e-7), '0.0000001');
    assert.ok(isPartialNumber(formatNumber(1e-7)));
  });
});

describe('isInRange', () => {
  it('is inclusive and ignores missing bounds', () => {
    assert.ok(isInRange(1.5, { min: 1.5, max: 3.5 }));
    assert.ok(!isInRange(4, { min: 1.5, max: 3.5 }));
    assert.ok(isInRange(-1e9, {}));
  });
});

describe('formatFraction', () => {
  it('writes mixed numbers reduced to lowest terms', () => {
    assert.equal(formatFraction(0), '0');
    assert.equal(formatFraction(0.4375), '7/16');
    assert.equal(formatFraction(1.5), '1 1/2');
    assert.equal(formatFraction(2), '2');
    assert.equal(formatFraction(0.03125), '1/32');
  });
  it('rounds to the nearest 1/denominator and carries into the whole part', () => {
    assert.equal(formatFraction(0.99), '1');
    assert.equal(formatFraction(1.999), '2');
    assert.equal(formatFraction(0.01), '0');
    assert.equal(formatFraction(0.3, { denominator: 8 }), '1/4');
  });
  it('handles negative values', () => {
    assert.equal(formatFraction(-0.5), '-1/2');
    assert.equal(formatFraction(-1.5), '-1 1/2');
    assert.equal(formatFraction(-2), '-2');
    assert.equal(formatFraction(-0.99), '-1');
    assert.equal(formatFraction(-0.001), '0');
  });
  it('appends the unit and accepts any denominator', () => {
    assert.equal(formatFraction(0.4375, { unit: '"' }), '7/16"');
    assert.equal(formatFraction(1.5, { unit: '"' }), '1 1/2"');
    assert.equal(formatFraction(2 / 3, { denominator: 3, unit: ' in' }), '2/3 in');
    assert.equal(formatFraction(0.5, { denominator: 10 }), '1/2');
  });
  it('returns an empty string for missing or non-finite values', () => {
    assert.equal(formatFraction(null), '');
    assert.equal(formatFraction(Number.NaN), '');
    assert.equal(formatFraction(Infinity), '');
  });
  it('rejects a denominator that is not a positive integer', () => {
    assert.throws(() => formatFraction(1, { denominator: 0 }), RangeError);
    assert.throws(() => formatFraction(1, { denominator: 2.5 }), RangeError);
  });
});

describe('formatDisplayNumber', () => {
  it('groups thousands and drops trailing zeros by default', () => {
    assert.equal(formatDisplayNumber(1234.5), '1,234.5');
    assert.equal(formatDisplayNumber(0.1 + 0.2), '0.3');
  });
  it('uses fixed decimals with precision, rounding half away from zero', () => {
    assert.equal(formatDisplayNumber(1.005, { precision: 2 }), '1.01');
    assert.equal(formatDisplayNumber(2, { precision: 1 }), '2.0');
    assert.equal(formatDisplayNumber(-0.001, { precision: 2 }), '0.00');
  });
  it('follows the locale separators', () => {
    assert.equal(formatDisplayNumber(1234.5, { locale: 'de-DE', precision: 1 }), '1.234,5');
  });
  it('returns an empty string for missing or non-finite values', () => {
    assert.equal(formatDisplayNumber(null), '');
    assert.equal(formatDisplayNumber(Number.NaN), '');
  });
});
