import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { deepEqual } from '../../src/utils/useStableValue.ts';

describe('deepEqual', () => {
  it('compares plain objects and arrays by content', () => {
    assert.equal(deepEqual({ a: [1, { b: 'x' }] }, { a: [1, { b: 'x' }] }), true);
    assert.equal(deepEqual(['a', 'b'], ['a', 'b']), true);
    assert.equal(deepEqual({ a: 1 }, { a: 2 }), false);
    assert.equal(deepEqual({ a: 1 }, { a: 1, b: undefined }), false);
    assert.equal(deepEqual(['a'], { 0: 'a' }), false);
  });

  it('compares functions and class instances by identity', () => {
    const fn = () => 1;
    assert.equal(deepEqual({ fn }, { fn }), true);
    assert.equal(deepEqual({ fn }, { fn: () => 1 }), false);
    assert.equal(deepEqual(new Date(0), new Date(0)), false);
  });

  it('handles NaN, null and primitives', () => {
    assert.equal(deepEqual(NaN, NaN), true);
    assert.equal(deepEqual(null, {}), false);
    assert.equal(deepEqual(undefined, undefined), true);
  });
});
