import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { fitTabs, nextTabAfterClose } from '../../src/components/workspace/workspaceTabsLogic.ts';

const tabs = [{ value: 'a' }, { value: 'b' }, { value: 'c' }];

describe('nextTabAfterClose', () => {
  it('keeps the selection when another tab closes', () => {
    assert.equal(nextTabAfterClose(tabs, 'a', 'b'), 'b');
    assert.equal(nextTabAfterClose(tabs, 'c', 'b'), 'b');
  });

  it('moves right from the closed selected tab, then left at the end', () => {
    assert.equal(nextTabAfterClose(tabs, 'a', 'a'), 'b');
    assert.equal(nextTabAfterClose(tabs, 'b', 'b'), 'c');
    assert.equal(nextTabAfterClose(tabs, 'c', 'c'), 'b');
  });

  it('skips disabled tabs', () => {
    const withDisabled = [{ value: 'a' }, { value: 'b' }, { value: 'c', disabled: true }];
    assert.equal(nextTabAfterClose(withDisabled, 'b', 'b'), 'a');
    assert.equal(nextTabAfterClose([{ value: 'a' }, { value: 'b', disabled: true }], 'a', 'a'), null);
  });

  it('returns null when the last tab closes', () => {
    assert.equal(nextTabAfterClose([{ value: 'a' }], 'a', 'a'), null);
  });

  it('picks a neighbour when the selection is not in the list', () => {
    assert.equal(nextTabAfterClose(tabs, 'b', 'gone'), 'c');
  });
});

describe('fitTabs', () => {
  const widths = [100, 100, 100, 100];

  it('shows every tab when they all fit', () => {
    assert.deepEqual(fitTabs(widths, 400, 0, 50), [0, 1, 2, 3]);
    assert.deepEqual(fitTabs(widths, 406, 0, 50, 2), [0, 1, 2, 3]);
    assert.deepEqual(fitTabs(widths, 405, 0, 50, 2), [0, 1, 2]);
  });

  it('leaves room for the more menu when some overflow', () => {
    // 350 - 50 = 300 for tabs: three fit.
    assert.deepEqual(fitTabs(widths, 350, 0, 50), [0, 1, 2]);
    assert.deepEqual(fitTabs(widths, 349, 0, 50), [0, 1]);
  });

  it('keeps the selected tab visible by replacing the last ones that fit', () => {
    assert.deepEqual(fitTabs(widths, 350, 3, 50), [0, 1, 3]);
    assert.deepEqual(fitTabs([100, 100, 100, 250], 350, 3, 50), [3]);
  });

  it('shows the selected tab even when it alone is too wide (it truncates)', () => {
    assert.deepEqual(fitTabs([100, 500], 200, 1, 50), [1]);
  });

  it('ignores an unknown selection', () => {
    assert.deepEqual(fitTabs(widths, 350, -1, 50), [0, 1, 2]);
  });
});
