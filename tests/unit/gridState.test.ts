import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  displayText,
  filterTypeOf,
  moveId,
  presetMatches,
  readValue,
  toGridViewState,
  toTableInitialState,
} from '../../src/components/grid/gridState.ts';
import type { GridColumn, GridViewState } from '../../src/components/grid/gridTypes.ts';

interface Row {
  name: string;
  load: number | null;
  note: string;
}
const row: Row = { name: 'Anchor', load: 1234.5, note: '' };

describe('readValue', () => {
  it('reads a key or a function', () => {
    assert.equal(readValue<Row>({ id: 'n', header: 'N', value: 'name' }, row), 'Anchor');
    assert.equal(readValue<Row>({ id: 'n', header: 'N', value: (r) => r.name.length }, row), 6);
  });
  it('blank strings, null and NaN become undefined so they sort last', () => {
    assert.equal(readValue<Row>({ id: 'x', header: 'X', value: 'note' }, row), undefined);
    assert.equal(readValue<Row>({ id: 'x', header: 'X', value: 'load' }, { ...row, load: null }), undefined);
    assert.equal(readValue<Row>({ id: 'x', header: 'X', value: () => Number.NaN }, row), undefined);
    assert.equal(readValue<Row>({ id: 'x', header: 'X', value: () => 0 }, row), 0);
  });
});

describe('displayText', () => {
  it('formats number columns with the locale and precision', () => {
    const col: GridColumn<Row> = { id: 'l', header: 'L', value: 'load', type: 'number' };
    assert.equal(displayText(col, row, 'en-US'), '1,234.5');
    assert.equal(displayText(col, row, 'de-DE'), '1.234,5');
    assert.equal(displayText({ ...col, precision: 2 }, row, 'en-US'), '1,234.50');
  });
  it('format wins; empty values show as empty text', () => {
    const col: GridColumn<Row> = { id: 'l', header: 'L', value: 'load', type: 'number', format: (v) => `${String(v)} lbs` };
    assert.equal(displayText(col, row, 'en-US'), '1234.5 lbs');
    assert.equal(displayText<Row>({ id: 'x', header: 'X', value: 'note' }, row, 'en-US'), '');
  });
});

describe('filterTypeOf', () => {
  it('defaults by column type; explicit filter wins', () => {
    assert.equal(filterTypeOf<Row>({ id: 'a', header: 'A', value: 'name' }), 'text');
    assert.equal(filterTypeOf<Row>({ id: 'a', header: 'A', value: 'load', type: 'number' }), 'number');
    assert.equal(filterTypeOf<Row>({ id: 'a', header: 'A', value: 'name', filter: 'select' }), 'select');
    assert.equal(filterTypeOf<Row>({ id: 'a', header: 'A', value: 'name', filter: false }), false);
  });
});

describe('state round trip', () => {
  const saved: GridViewState = {
    sort: [{ id: 'load', desc: true }],
    filters: { name: 'anc', load: { min: 100 } },
    search: 'steel',
    columnOrder: ['load', 'name', 'note'],
    pinned: { start: ['name'], end: [] },
    hidden: ['note'],
    filtersVisible: false,
  };

  it('a saved state passed back as initialState is reported unchanged', () => {
    const table = toTableInitialState(saved, ['name', 'load', 'note']);
    assert.deepEqual(toGridViewState(table, saved.search, saved.filtersVisible), saved);
  });

  it('no initialState: column order from the columns, nothing sorted, filtered, pinned or hidden', () => {
    const table = toTableInitialState(undefined, ['name', 'load']);
    assert.deepEqual(toGridViewState(table, '', true), {
      sort: [],
      filters: {},
      search: '',
      columnOrder: ['name', 'load'],
      pinned: { start: [], end: [] },
      hidden: [],
      filtersVisible: true,
    });
  });

  it('an empty saved column order falls back to the columns', () => {
    assert.deepEqual(toTableInitialState({ columnOrder: [] }, ['a', 'b']).columnOrder, ['a', 'b']);
  });

  it('only columns set to false count as hidden', () => {
    const table = { ...toTableInitialState(undefined, ['a', 'b']), columnVisibility: { a: true, b: false } };
    assert.deepEqual(toGridViewState(table, '', true).hidden, ['b']);
  });
});

describe('moveId', () => {
  it('moves before or after the target', () => {
    assert.deepEqual(moveId(['a', 'b', 'c'], 'a', 'c', true), ['b', 'c', 'a']);
    assert.deepEqual(moveId(['a', 'b', 'c'], 'c', 'a', false), ['c', 'a', 'b']);
    assert.deepEqual(moveId(['a', 'b', 'c'], 'b', 'a', true), ['a', 'b', 'c']);
  });
  it('leaves the list unchanged when the target is missing', () => {
    const list = ['a', 'b'];
    assert.equal(moveId(list, 'a', 'x', true), list);
  });
});

describe('presetMatches', () => {
  const preset = { id: 'p', label: 'P', filters: { material: ['Wood'], load: { min: 1 } }, search: 'screw' };
  it('ignores filter order', () => {
    assert.ok(presetMatches(preset, { load: { min: 1 }, material: ['Wood'] }, 'screw'));
  });
  it('needs the same filters and search', () => {
    assert.ok(!presetMatches(preset, { material: ['Wood'] }, 'screw'));
    assert.ok(!presetMatches(preset, { load: { min: 1 }, material: ['Wood'] }, ''));
    assert.ok(presetMatches({ id: 'e', label: 'E' }, {}, ''));
  });
});
