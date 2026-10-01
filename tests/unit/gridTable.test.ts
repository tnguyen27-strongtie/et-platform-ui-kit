import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { toColumnDefs } from '../../src/components/grid/gridTable.ts';
import type { GridColumn } from '../../src/components/grid/gridTypes.ts';

interface Row {
  name: string;
  load: number;
}

/** Reads one option of a column definition (ColumnDef is a union that does not index by string). */
const opt = (def: object | undefined, key: string): unknown => (def as Record<string, unknown>)[key];

describe('toColumnDefs', () => {
  const [text, number, fixed] = toColumnDefs<Row>([
    { id: 'name', header: 'Name', value: 'name' },
    { id: 'load', header: 'Load', value: 'load', type: 'number' },
    { id: 'fixed', header: 'Fixed', value: 'name', width: 90, sortable: false, filter: false, hideable: false },
  ] satisfies GridColumn<Row>[]);

  it('defaults widths and sorting by column type; empty values sort last', () => {
    assert.equal(opt(text, 'size'), 160);
    assert.equal(opt(number, 'size'), 120);
    assert.equal(opt(text, 'sortFn'), 'alphanumeric');
    assert.equal(opt(number, 'sortFn'), 'basic');
    assert.equal(opt(text, 'sortUndefined'), 'last');
  });

  it('turns column options into table options', () => {
    assert.equal(opt(fixed, 'size'), 90);
    assert.equal(opt(fixed, 'enableSorting'), false);
    assert.equal(opt(fixed, 'enableColumnFilter'), false);
    assert.equal(opt(fixed, 'enableHiding'), false);
    assert.equal(opt(text, 'enableColumnFilter'), true);
  });

  it('reads cell values through readValue (blank becomes undefined)', () => {
    const read = opt(text, 'accessorFn') as (row: Row) => unknown;
    assert.equal(read({ name: 'Anchor', load: 1 }), 'Anchor');
    assert.equal(read({ name: '', load: 1 }), undefined);
  });

  it('number columns filter by range, text columns by text', () => {
    const range = opt(number, 'filterFn') as (row: { getValue: () => unknown }, id: string, value: unknown) => boolean;
    const textFn = opt(text, 'filterFn') as (row: { getValue: () => unknown }, id: string, value: unknown) => boolean;
    assert.equal(range({ getValue: () => 5 }, 'load', { min: 1, max: 10 }), true);
    assert.equal(range({ getValue: () => 50 }, 'load', { min: 1, max: 10 }), false);
    assert.equal(textFn({ getValue: () => 'Anchor' }, 'name', 'anc'), true);
  });
});
