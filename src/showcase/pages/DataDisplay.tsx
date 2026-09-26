import { useState } from 'react';

import {
  Button,
  Card,
  Chip,
  DataTable,
  Divider,
  GridImageCell,
  GridLinkCell,
  GridView,
  type GridViewState,
  Link,
  notify,
} from '../../index';
import { fastenerColumns, fastenerPresets, fasteners } from '../data';
import { Code, DemoGrid, DemoPage, DemoSection } from '../layout';

export function DataDisplay() {
  const [selected, setSelected] = useState<string | null>('f1');
  const [gridState, setGridState] = useState<GridViewState | null>(null);

  return (
    <DemoPage title="Data display" description="Showing results: panels, tables and the data grid.">
      <DemoSection
        id="card"
        title="Card"
        description="Groups related content under a bold title on a gray header. padding: sm (8px, default), md (12px), none (tables sit flush)."
        code={`<Card title="Fastener capacity" subtitle="per connection" actions={<Button size="small">Details</Button>} footer="Total: 1,450 lbs">…</Card>
<Card title="Results" padding="none"><DataTable>…</DataTable></Card>`}
      >
        <DemoGrid>
          <Card
            title="Fastener capacity"
            subtitle="per connection"
            actions={
              <Button size="small" variant="text">
                Details
              </Button>
            }
            footer={<span className="text-sm font-bold">Total: 1,450 lbs</span>}
          >
            padding=&quot;sm&quot; (default, 8px)
          </Card>
          <Card title="Roomier body" padding="md">
            padding=&quot;md&quot; (12px)
          </Card>
          <Card title="Results table" padding="none">
            <DataTable aria-label="Card table">
              <DataTable.Body>
                <DataTable.Row>
                  <DataTable.Cell>SDWS22400</DataTable.Cell>
                  <DataTable.Cell align="right">1,450 lbs</DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                  <DataTable.Cell>SD9112</DataTable.Cell>
                  <DataTable.Cell align="right">610 lbs</DataTable.Cell>
                </DataTable.Row>
              </DataTable.Body>
            </DataTable>
          </Card>
          <Card>Card without a header.</Card>
        </DemoGrid>
      </DemoSection>

      <DemoSection
        id="data-table"
        title="DataTable"
        description="Simple static table (report rows, token lists). maxHeight adds a sticky header and a keyboard-focusable scroll area. For sort/filter use GridView."
        code={`<DataTable aria-label="Capacities" maxHeight={200}>
  <DataTable.Head><DataTable.Row><DataTable.Cell>Model</DataTable.Cell></DataTable.Row></DataTable.Head>
  <DataTable.Body>…</DataTable.Body>
</DataTable>`}
      >
        <DataTable aria-label="Fastener capacities" maxHeight={200}>
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.Cell>Model</DataTable.Cell>
              <DataTable.Cell>Material</DataTable.Cell>
              <DataTable.Cell align="right">Capacity (lbs)</DataTable.Cell>
              <DataTable.Cell align="right">Qty</DataTable.Cell>
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            {fasteners.map((f) => (
              <DataTable.Row key={f.id}>
                <DataTable.Cell>{f.model}</DataTable.Cell>
                <DataTable.Cell>{f.material}</DataTable.Cell>
                <DataTable.Cell align="right">{f.capacity.toLocaleString('en-US')}</DataTable.Cell>
                <DataTable.Cell align="right">{f.qty ?? '—'}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable.Body>
        </DataTable>
      </DemoSection>

      <DemoSection
        id="grid-view"
        title="GridView"
        description="Result grid: click headers to sort (Shift for more), Filters toggles per-column filters, search matches every word in any column (accents ignored), preset chips, drag headers or use ⋮ to move/freeze/hide columns, rows highlighted by status, click a row to select."
      >
        <GridView
          aria-label="Fastener results"
          rows={fasteners}
          columns={fastenerColumns}
          getRowId={(r) => r.id}
          presets={fastenerPresets}
          search={{ placeholder: 'Search model, material, status…' }}
          rowHighlight={(r) => (r.status === 'Fails' ? 'danger' : r.status === 'Check' ? 'warning' : undefined)}
          selectedRowId={selected}
          onRowClick={(r) => setSelected(r.id)}
          initialState={{ pinned: { start: ['model'], end: ['details'] } }}
          onStateChange={setGridState}
          maxHeight={420}
          toolbar={
            <Button size="small" onClick={() => notify.success('Exported CSV')}>
              Export
            </Button>
          }
        />
        <details className="text-xs">
          <summary className="cursor-pointer text-text-muted">onStateChange (what an app would persist)</summary>
          <Code>{JSON.stringify(gridState, null, 2)}</Code>
        </details>
        <Code>{`<GridView aria-label="Fastener results" rows={rows} columns={columns} getRowId={(r) => r.id}
  presets={presets} rowHighlight={(r) => r.fails ? 'danger' : undefined}
  selectedRowId={id} onRowClick={(r) => setId(r.id)}
  initialState={{ pinned: { start: ['model'] } }} onStateChange={saveLayout} maxHeight={420} />

// Other languages: override any subset of defaultGridViewLabels
<GridView … labels={{
  clearFilters: 'Xóa bộ lọc',
  rowCount: (shown, total, filtered) => (filtered ? \`\${shown}/\${total} dòng\` : \`\${total} dòng\`),
}} />`}</Code>
      </DemoSection>

      <DemoSection
        id="grid-cells"
        title="Grid cells"
        description="The image and link cells GridView uses for type 'image' / 'link', usable in any table or custom cell renderer."
        code={`<GridImageCell src={url} text="SDWS22400" subtext="Timber screw" />
<GridLinkCell href={pdfUrl} external>Datasheet</GridLinkCell>
<GridLinkCell onClick={openDetails}>View</GridLinkCell>`}
      >
        <DataTable aria-label="Grid cell examples">
          <DataTable.Body>
            <DataTable.Row>
              <DataTable.Cell>GridImageCell</DataTable.Cell>
              <DataTable.Cell>
                <GridImageCell src="/images/sample-drawing.svg" text="SDWS22400" subtext="Timber screw, 0.22 x 4&quot;" />
              </DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>GridImageCell (no image)</DataTable.Cell>
              <DataTable.Cell>
                <GridImageCell text="Custom part" subtext="No photo yet" />
              </DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>GridLinkCell external</DataTable.Cell>
              <DataTable.Cell>
                <GridLinkCell href="https://example.com/datasheet.pdf" external>
                  SDWS22400.pdf
                </GridLinkCell>
              </DataTable.Cell>
            </DataTable.Row>
            <DataTable.Row>
              <DataTable.Cell>GridLinkCell action</DataTable.Cell>
              <DataTable.Cell>
                <GridLinkCell onClick={() => notify.info('Details opened')}>View details</GridLinkCell>
              </DataTable.Cell>
            </DataTable.Row>
          </DataTable.Body>
        </DataTable>
      </DemoSection>

      <DemoSection
        id="chip-link-divider"
        title="Chip, Link and Divider"
        description="MUI primitives styled by the theme. Chip for tags/status; Link for navigation (not actions: use Button); Divider to separate groups."
        code={`<Chip label="Wood" size="small" />
<Link href="/guide">Design guide</Link>
<Divider />`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Chip label="Default" size="small" />
          <Chip label="Outlined" size="small" variant="outlined" />
          <Chip label="Primary" size="small" color="primary" />
          <Chip label="Success" size="small" color="success" />
          <Chip label="Warning" size="small" color="warning" />
          <Chip label="Error" size="small" color="error" />
          <Chip label="Deletable" size="small" onDelete={() => notify.info('Chip removed')} />
          <Chip label="Clickable" size="small" clickable onClick={() => notify.info('Chip clicked')} />
        </div>
        <Divider />
        <p className="m-0 text-sm">
          Read the <Link href="https://example.com/guide">design guide</Link> or open the{' '}
          <Link href="https://example.com/catalog" target="_blank" rel="noopener noreferrer">
            product catalog
          </Link>
          .
        </p>
        <Divider>or</Divider>
        <div className="flex h-6 items-center gap-3 text-sm">
          Left
          <Divider orientation="vertical" flexItem />
          Right
        </div>
      </DemoSection>
    </DemoPage>
  );
}
