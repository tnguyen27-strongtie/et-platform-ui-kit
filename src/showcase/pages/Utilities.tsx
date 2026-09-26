import { useState } from 'react';

import {
  clamp,
  colorCssVars,
  DataTable,
  decimalsOf,
  formatNumber,
  FormField,
  isEmptyFilter,
  isInRange,
  isPartialNumber,
  matchesNumberRange,
  matchesSearch,
  matchesText,
  normalizeText,
  parseNumber,
  resolveColors,
  roundTo,
  stepNumber,
  TextInput,
} from '../../index';
import { Code, DemoGrid, DemoPage, DemoSection } from '../layout';

function ResultTable({ label, rows }: { label: string; rows: Array<[string, unknown]> }) {
  return (
    <DataTable aria-label={label}>
      <DataTable.Body>
        {rows.map(([call, result]) => (
          <DataTable.Row key={call}>
            <DataTable.Cell>
              <code>{call}</code>
            </DataTable.Cell>
            <DataTable.Cell>
              <code>{result === undefined ? 'undefined' : JSON.stringify(result)}</code>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable.Body>
    </DataTable>
  );
}

const sampleRow = ['SDWS22400', 'Wood to wood', 'Bê tông cốt thép', '1,450 lbs'];

export function Utilities() {
  const [text, setText] = useState('0,1234');
  const [value, setValue] = useState('Bê tông cốt thép');
  const [query, setQuery] = useState('be tong');
  const [search, setSearch] = useState('wood 1,450');
  const [brand, setBrand] = useState('#1f5f99');

  const parsed = parseNumber(text);
  const n = typeof parsed === 'number' ? parsed : null;
  const validHex = /^#[0-9a-f]{6}$/i.test(brand);
  const resolved = resolveColors(validHex ? { brand } : undefined);

  return (
    <DemoPage title="Utilities" description="Helpers apps can reuse for validation, search and theming. Type in the fields to try them.">
      <DemoSection
        id="number-helpers"
        title="Number helpers"
        description="The logic behind NumberInput. Use them to validate or round values in calculations the same way the inputs do."
        code={`parseNumber('1,5')          // 1.5 (null for '', undefined for '-')
roundTo(1.005, 2)            // 1.01 (no binary drift)
stepNumber(0.2, 0.1)         // 0.3
isInRange(4, { min: 1.5, max: 3.5 })  // false`}
      >
        <FormField label="Input text" htmlFor="util-number" description="Try 1,5 · -0 · 1e3 · . · 0.1">
          <TextInput value={text} onChange={(e) => setText(e.target.value)} />
        </FormField>
        <ResultTable
          label="Number helper results"
          rows={[
            [`isPartialNumber(${JSON.stringify(text)})`, isPartialNumber(text)],
            [`parseNumber(${JSON.stringify(text)})`, parsed],
            ['roundTo(value, 2)', n === null ? '—' : roundTo(n, 2)],
            ['formatNumber(value, 2)', formatNumber(n, 2)],
            ['stepNumber(value, 0.1)', stepNumber(n, 0.1)],
            ['decimalsOf(value)', n === null ? '—' : decimalsOf(n)],
            ['clamp(value, 0, 1)', n === null ? '—' : clamp(n, 0, 1)],
            ['isInRange(value, { min: 0, max: 1 })', n === null ? '—' : isInRange(n, { min: 0, max: 1 })],
          ]}
        />
      </DemoSection>

      <DemoSection
        id="search-helpers"
        title="Search and filter helpers"
        description="The matching used by GridView filters and search: case- and accent-insensitive (Vietnamese đ included), every search word must appear somewhere in the row."
        code={`matchesText('Bê tông', 'be tong')                  // true
matchesSearch(['SDWS22400', 'Wood'], 'wood sdws')    // true
matchesNumberRange(1450, { min: 1000 })             // true`}
      >
        <DemoGrid>
          <FormField label="Value" htmlFor="util-value">
            <TextInput value={value} onChange={(e) => setValue(e.target.value)} />
          </FormField>
          <FormField label="Query" htmlFor="util-query">
            <TextInput value={query} onChange={(e) => setQuery(e.target.value)} />
          </FormField>
        </DemoGrid>
        <FormField label="Row search" htmlFor="util-search" description={`Row: ${sampleRow.join(' · ')}`}>
          <TextInput value={search} onChange={(e) => setSearch(e.target.value)} />
        </FormField>
        <ResultTable
          label="Search helper results"
          rows={[
            ['normalizeText(value)', normalizeText(value)],
            ['matchesText(value, query)', matchesText(value, query)],
            ['matchesSearch(row, search)', matchesSearch(sampleRow, search)],
            ['matchesNumberRange(1450, { min: 1000 })', matchesNumberRange(1450, { min: 1000 })],
            ["isEmptyFilter('  ')", isEmptyFilter('  ')],
          ]}
        />
      </DemoSection>

      <DemoSection
        id="theme-helpers"
        title="Theme helpers"
        description="resolveColors derives the full palette from a brand color (what PlatformThemeProvider colors does). Use it where you need real hex values, e.g. chart colors."
        code={`const palette = resolveColors({ brand: '#1f5f99' });
palette.brandHover   // derived shade
colorCssVars(palette) // { '--color-brand': '#1f5f99', … }
createPlatformTheme({ density: 'expanded', colors: { brand } })   // MUI theme for tests/Storybook
cn('px-2', isActive && 'bg-brand')                                  // class merge (clsx + tailwind-merge)`}
      >
        <FormField label="Brand color" htmlFor="util-brand" error={validHex ? undefined : 'Use a 6-digit hex color, e.g. #1f5f99.'}>
          <TextInput value={brand} onChange={(e) => setBrand(e.target.value)} addonBefore={<span className="size-4 rounded-sm" style={{ background: validHex ? brand : 'transparent' }} />} />
        </FormField>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {(['brand', 'brandHover', 'brandActive', 'brandDark', 'brandSubtle', 'brandSelected', 'focusRing', 'accent', 'selection', 'scrollbarThumb'] as const).map((role) => (
            <div key={role} className="flex items-center gap-2 text-xs">
              <span className="size-8 shrink-0 rounded-sm border border-border" style={{ background: resolved[role] }} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-bold">{role}</span>
                <span className="truncate font-mono text-text-muted">{resolved[role]}</span>
              </span>
            </div>
          ))}
        </div>
        <details className="text-xs">
          <summary className="cursor-pointer text-text-muted">colorCssVars(palette)</summary>
          <Code>{JSON.stringify(colorCssVars(resolved), null, 2)}</Code>
        </details>
      </DemoSection>
    </DemoPage>
  );
}
