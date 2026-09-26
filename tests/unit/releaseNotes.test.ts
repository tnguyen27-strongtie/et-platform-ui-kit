import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  compareVersions,
  formatReleaseDate,
  isUnseen,
  parseReleaseDate,
  sortReleases,
} from '../../src/components/release-notes/releaseNotesUtils.ts';

describe('compareVersions', () => {
  it('compares numerically, not as text', () => {
    assert.ok(compareVersions('2.10.0', '2.9.1') > 0);
    assert.ok(compareVersions('1.8.0', '2.0.0') < 0);
    assert.equal(compareVersions('2.1', '2.1.0'), 0);
    assert.equal(compareVersions('v2.5.0', '2.5.0'), 0);
  });
  it('puts pre-releases before their release', () => {
    assert.ok(compareVersions('2.5.0-beta.1', '2.5.0') < 0);
    assert.ok(compareVersions('2.5.0-beta.10', '2.5.0-beta.2') > 0);
  });
});

describe('parseReleaseDate / formatReleaseDate', () => {
  it('reads YYYY-MM-DD as a local date (no UTC day shift)', () => {
    const d = parseReleaseDate('2026-09-03')!;
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 8);
    assert.equal(d.getDate(), 3);
    assert.equal(formatReleaseDate('2026-09-03'), 'September 3, 2026');
  });
  it('formats in other locales and keeps unparseable text', () => {
    assert.equal(formatReleaseDate('2026-09-03', 'de-DE'), '3. September 2026');
    assert.equal(formatReleaseDate('Q3 2026'), 'Q3 2026');
    assert.equal(parseReleaseDate('not a date'), null);
  });
});

describe('sortReleases', () => {
  it('orders newest first by version', () => {
    const sorted = sortReleases([{ version: '2.9.0' }, { version: '2.10.0' }, { version: '1.8.0' }, { version: '2.10.0-rc.1' }]);
    assert.deepEqual(
      sorted.map((r) => r.version),
      ['2.10.0', '2.10.0-rc.1', '2.9.0', '1.8.0'],
    );
  });
});

describe('isUnseen', () => {
  it('flags versions newer than the last seen one', () => {
    assert.ok(isUnseen('2.5.0', '2.4.0'));
    assert.ok(!isUnseen('2.4.0', '2.4.0'));
    assert.ok(!isUnseen('2.3.0', '2.4.0'));
    assert.ok(isUnseen('2.3.0', null));
  });
});
