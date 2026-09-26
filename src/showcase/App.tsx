import { type ReactNode, useState } from 'react';

import {
  Accordion,
  Alert,
  Button,
  Card,
  Checkbox,
  Combobox,
  ConfirmDialog,
  DataTable,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  type Density,
  DropdownMenu,
  EmptyState,
  FormField,
  type GridColumn,
  type GridPreset,
  GridView,
  LoadingIndicator,
  NavMenu,
  notify,
  NumberInput,
  OptionCardGroup,
  PlatformThemeProvider,
  RadioGroup,
  scales,
  Select,
  Spinner,
  Switch,
  Tab,
  TabPanel,
  Tabs,
  TextInput,
  ToastHost,
  Tooltip,
  TopNav,
} from '../index';
import { WorkspaceDemo } from './WorkspaceDemo';

/** Showcase panel, built from the kit's own Card so the demo shows its real spacing. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card title={title} titleAs="h2" padding="md">
      <div className="flex flex-col gap-3">{children}</div>
    </Card>
  );
}

interface Fastener {
  id: string;
  model: string;
  description: string;
  material: 'Wood' | 'Steel' | 'Concrete';
  capacity: number;
  qty: number | null;
  status: 'OK' | 'Check' | 'Fails';
  image: string;
}

const fasteners: Fastener[] = [
  { id: 'f1', model: 'SDWS22400', description: 'Timber screw, 0.22 x 4"', material: 'Wood', capacity: 1450, qty: 4, status: 'OK', image: '/images/sample-drawing.svg' },
  { id: 'f2', model: 'SDWC15600', description: 'Truss screw, 0.15 x 6"', material: 'Wood', capacity: 980, qty: 6, status: 'Check', image: '/images/sample-drawing.svg' },
  { id: 'f3', model: 'SD9112', description: 'Connector screw #9 x 1.5"', material: 'Steel', capacity: 610, qty: 10, status: 'OK', image: '/images/sample-drawing.svg' },
  { id: 'f4', model: 'Titen HD THD50400', description: 'Heavy-duty concrete anchor', material: 'Concrete', capacity: 3120, qty: 2, status: 'OK', image: '/images/sample-drawing.svg' },
  { id: 'f5', model: 'SDS25300', description: 'Strong-Drive SDS screw', material: 'Wood', capacity: 1210, qty: null, status: 'Fails', image: '/images/sample-drawing.svg' },
  { id: 'f6', model: 'Bu lông bê tông M12', description: 'Neo bê tông cốt thép', material: 'Concrete', capacity: 2480, qty: 8, status: 'OK', image: '/images/sample-drawing.svg' },
];

const fastenerColumns: GridColumn<Fastener>[] = [
  {
    id: 'model',
    header: 'Model',
    value: 'model',
    type: 'image',
    width: 220,
    image: { src: (r) => r.image, subtext: (r) => r.description },
  },
  { id: 'material', header: 'Material', value: 'material', filter: 'select', width: 140 },
  { id: 'capacity', header: 'Capacity', value: 'capacity', type: 'number', format: (v) => (v == null ? '' : `${(v as number).toLocaleString('en-US')} lbs`), width: 140 },
  { id: 'qty', header: 'Qty', value: 'qty', type: 'number', width: 110 },
  { id: 'status', header: 'Status', value: 'status', filter: 'select', width: 120 },
  {
    id: 'datasheet',
    header: 'Datasheet',
    value: (r) => `${r.model}.pdf`,
    type: 'link',
    link: { href: (r) => `https://example.com/datasheets/${encodeURIComponent(r.model)}.pdf`, external: true },
    sortable: false,
    filter: false,
    width: 200,
  },
  {
    id: 'details',
    header: 'Details',
    value: () => 'View',
    type: 'link',
    link: { onClick: (r) => notify.info(`Details for ${r.model}`) },
    sortable: false,
    filter: false,
    searchable: false,
    width: 130,
  },
];

const fastenerPresets: GridPreset[] = [
  { id: 'high', label: 'Capacity ≥ 1,000 lbs', filters: { capacity: { min: 1000 } } },
  { id: 'wood', label: 'Wood only', filters: { material: ['Wood'] } },
  { id: 'attention', label: 'Needs attention', filters: { status: ['Check', 'Fails'] } },
];

/** Demo brand presets: the whole kit follows PlatformThemeProvider `colors`. */
const brandPresets = [
  { value: 'fd', label: 'FD orange (default)', colors: undefined },
  { value: 'blue', label: 'Blue', colors: { brand: '#1f5f99' } },
  { value: 'green', label: 'Green', colors: { brand: '#2e7d32' } },
  { value: 'purple', label: 'Purple', colors: { brand: '#6a3d9a' } },
];

const connectionOptions = [
  { value: 'wood', label: 'Wood to Wood', note: 'most common' },
  { value: 'steel', label: 'Wood to Steel' },
  { value: 'concrete', label: 'Wood to Concrete' },
  { value: 'masonry', label: 'Wood to Masonry', disabled: true },
];

export function App() {
  const [density, setDensity] = useState<Density>('standard');
  const [tab, setTab] = useState<'input' | 'output'>('input');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connection, setConnection] = useState('wood');
  const [materials, setMaterials] = useState<string[]>(['wood']);
  const [product, setProduct] = useState<string | null>(null);
  const [load, setLoad] = useState('1250');
  const [brand, setBrand] = useState('fd');
  const [thickness, setThickness] = useState<number | null>(4);
  const [spacing, setSpacing] = useState<number | null>(0.5);
  const [count, setCount] = useState<number | null>(3);
  const [calculating, setCalculating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedFastener, setSelectedFastener] = useState<string | null>('f1');
  const [country, setCountry] = useState<string | number | boolean | null>('USA');
  const [card, setCard] = useState<string | null>('single');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<'components' | 'rows' | 'columns'>(() =>
    location.hash === '#workspace' ? 'rows' : location.hash === '#workspace-columns' ? 'columns' : 'components',
  );

  return (
    <PlatformThemeProvider density={density} colors={brandPresets.find((b) => b.value === brand)?.colors}>
      <TopNav
        logo={<span className="text-lg font-bold text-accent">Platform</span>}
        right={
          <div className="flex items-center gap-4">
            <div className="w-44">
              <Select aria-label="Brand color" value={brand} options={brandPresets} onChange={setBrand} />
            </div>
            <Switch
              label="Expanded text"
              checked={density === 'expanded'}
              onChange={(on) => setDensity(on ? 'expanded' : 'standard')}
            />
          </div>
        }
      >
        <NavMenu
          label="File"
          items={[
            { id: 'new', label: 'New', onSelect: () => notify.success('New project created', 'Undo') },
            { id: 'save', label: 'Save', onSelect: () => notify.error('Save failed', 'Retry') },
            { id: 'upload', label: 'Upload', onSelect: () => undefined, disabled: true },
          ]}
        />
        <NavMenu
          label="View"
          items={[
            { id: 'components', label: 'Components', onSelect: () => setPage('components') },
            { id: 'rows', label: 'Workspace (stacked)', onSelect: () => setPage('rows') },
            { id: 'columns', label: 'Workspace (side by side)', onSelect: () => setPage('columns') },
          ]}
        />
        <NavMenu label="Print" items={[{ id: 'print', label: 'Print report', onSelect: () => window.print() }]} />
        <NavMenu label="Settings" items={[{ id: 'units', label: 'Units', onSelect: () => undefined }]} />
      </TopNav>

      {page !== 'components' ? (
        <WorkspaceDemo key={page} split={page} />
      ) : (
      <main className="mx-auto grid max-w-6xl items-start gap-4 p-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Section title="Grid view">
            <GridView
              aria-label="Fastener results"
              rows={fasteners}
              columns={fastenerColumns}
              getRowId={(r) => r.id}
              presets={fastenerPresets}
              search={{ placeholder: 'Search model, material, status…' }}
              rowHighlight={(r) => (r.status === 'Fails' ? 'danger' : r.status === 'Check' ? 'warning' : undefined)}
              selectedRowId={selectedFastener}
              onRowClick={(r) => setSelectedFastener(r.id)}
              initialState={{ pinned: { start: ['model'], end: ['details'] } }}
              maxHeight={360}
              toolbar={
                <Button size="small" onClick={() => notify.success('Exported CSV')}>
                  Export
                </Button>
              }
            />
          </Section>
        </div>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary">Calculate</Button>
            <Button variant="primaryDark">Primary dark</Button>
            <Button variant="secondary">Secondary</Button>
            <Button>Default</Button>
            <Button variant="tertiary">Tertiary</Button>
            <Button variant="text">Text</Button>
            <Button variant="textDark">Text dark</Button>
            <Button variant="fab" aria-label="Add">
              +
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="small">
              Small
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button disabled>Default disabled</Button>
            <Tooltip title="Opens the confirmation dialog">
              <Button variant="primary" onClick={() => setDialogOpen(true)}>
                Open dialog
              </Button>
            </Tooltip>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              loading={calculating}
              onClick={() => {
                setCalculating(true);
                setTimeout(() => setCalculating(false), 1500);
              }}
            >
              Calculate (loading)
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              Reset inputs
            </Button>
            <DropdownMenu
              label="Export"
              items={[
                { id: 'pdf', label: 'PDF report', onSelect: () => notify.info('Exporting PDF') },
                { id: 'csv', label: 'CSV table', onSelect: () => notify.warning('CSV has no units row') },
                { id: 'sep', divider: true },
                { id: 'del', label: 'Delete project', danger: true, onSelect: () => setConfirmOpen(true) },
              ]}
            />
            <span className="flex items-center gap-2 text-sm">
              <Spinner size={16} /> Inline spinner
            </span>
          </div>
        </Section>

        <Section title="Number inputs">
          <FormField
            label="Member thickness"
            htmlFor="num-thickness"
            required
            description="1.5 to 3.5 in. Arrow keys step 0.25 (Shift x10)."
            error={thickness === null ? 'Required.' : thickness < 1.5 || thickness > 3.5 ? 'Must be between 1.5 and 3.5 in.' : undefined}
          >
            <NumberInput value={thickness} onChange={setThickness} min={1.5} max={3.5} step={0.25} precision={3} addonAfter="in" />
          </FormField>
          <FormField label="Spacing (clamped on blur)" htmlFor="num-spacing" description="0 to 1, clamped when you leave the field.">
            <NumberInput value={spacing} onChange={setSpacing} min={0} max={1} step={0.1} clampBehavior="blur" addonAfter="ft" />
          </FormField>
          <FormField label="Fastener count (integer)" htmlFor="num-count">
            <NumberInput value={count} onChange={setCount} min={1} precision={0} />
          </FormField>
          <p className="m-0 text-xs text-text-muted">
            Values: thickness = {JSON.stringify(thickness)}, spacing = {JSON.stringify(spacing)}, count = {JSON.stringify(count)}
          </p>
        </Section>

        <Section title="Card and empty state">
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
            Default padding (8px), same as dialogs and accordions.
          </Card>
          <Card title="Results table" padding="none">
            <DataTable>
              <DataTable.Body>
                <DataTable.Row>
                  <DataTable.Cell>SDWS22400</DataTable.Cell>
                  <DataTable.Cell align="right">1,450 lbs</DataTable.Cell>
                </DataTable.Row>
              </DataTable.Body>
            </DataTable>
          </Card>
          <EmptyState title="No results yet" action={<Button variant="primary">Calculate</Button>}>
            Fill in the inputs, then run the calculation.
          </EmptyState>
        </Section>

        <Section title="Form fields">
          <FormField label="Design load" htmlFor="load" help="Factored load applied to the connection.">
            <TextInput id="load" value={load} onChange={(e) => setLoad(e.target.value)} addonAfter="lbs" />
          </FormField>
          <FormField label="Project name" htmlFor="project" required error="Project name is required.">
            <TextInput defaultValue="" placeholder="Enter a name" />
          </FormField>
          <FormField label="Notes" htmlFor="notes" description="Printed on the report.">
            <TextInput multiline minRows={2} />
          </FormField>
          <FormField label="Disabled" htmlFor="disabled" disabled>
            <TextInput defaultValue="Locked value" />
          </FormField>
        </Section>

        <Section title="Selects">
          <FormField label="Connection type" htmlFor="connection">
            <Select id="connection" value={connection} options={connectionOptions} onChange={setConnection} />
          </FormField>
          <FormField label="Materials (multiple)" htmlFor="materials">
            <Select id="materials" multiple value={materials} options={connectionOptions} onChange={setMaterials} />
          </FormField>
          <FormField label="Product (searchable)" htmlFor="product">
            <Combobox
              id="product"
              value={product}
              onChange={setProduct}
              placeholder="Search products"
              options={[
                { value: 'sd9', label: 'SD9112 Strong-Drive screw' },
                { value: 'sdws', label: 'SDWS22400 timber screw' },
                { value: 'sdwc', label: 'SDWC15600 truss screw' },
              ]}
            />
          </FormField>
        </Section>

        <Section title="Choices">
          <RadioGroup
            aria-label="Country"
            name="country"
            value={country}
            onChange={setCountry}
            options={[
              { value: 'USA', label: 'USA' },
              { value: 'Canada', label: 'Canada' },
              { value: 'EU', label: 'EU', disabled: true },
            ]}
          />
          <div className="flex flex-wrap gap-4">
            <Checkbox label="Include fasteners" defaultChecked />
            <Checkbox label="Show notes" />
            <Checkbox label="Disabled" disabled />
          </div>
          <div className="flex flex-wrap gap-4">
            <Switch label="Metric units" defaultChecked />
            <Switch label="Off" />
            <Switch label="Disabled" disabled />
          </div>
          <OptionCardGroup
            value={card}
            onChange={setCard}
            aria-label="Shear type"
            options={[
              { value: 'single', label: 'Single shear', image: <div className="h-12 w-20 rounded-sm bg-true-gray-10" /> },
              { value: 'double', label: 'Double shear', image: <div className="h-12 w-20 rounded-sm bg-true-gray-10" /> },
              { value: 'none', label: 'Unavailable', disabled: true, image: <div className="h-12 w-20 rounded-sm bg-true-gray-10" /> },
            ]}
          />
        </Section>

        <Section title="Tabs and accordion">
          <div className="flex flex-col border border-true-gray-20">
            <Tabs value={tab} onChange={setTab}>
              <Tab value="input" label="Input" />
              <Tab value="output" label="Output" />
              <Tab value="illustration" label="Illustration" disabled />
            </Tabs>
            <TabPanel value="input" current={tab} className="p-2">
              <Accordion title="Connection">Connection inputs go here.</Accordion>
              <Accordion title="Loads" defaultExpanded={false}>
                Load inputs go here.
              </Accordion>
            </TabPanel>
            <TabPanel value="output" current={tab} className="p-2">
              Output content
            </TabPanel>
          </div>
        </Section>

        <Section title="Alerts">
          <Alert severity="error" title="Validation">
            Member thickness is outside the allowed range.
          </Alert>
          <Alert severity="warning" title="No Output Results">
            There are no results based upon the input parameters.
          </Alert>
          <Alert severity="success">Calculation saved.</Alert>
        </Section>

        <Section title="Data table">
          <DataTable>
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.Cell>Model</DataTable.Cell>
                <DataTable.Cell align="right">Capacity (lbs)</DataTable.Cell>
                <DataTable.Cell align="right">Qty</DataTable.Cell>
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              {[
                ['SDWS22400', 1450, 4],
                ['SDWC15600', 980, 6],
                ['SD9112', 610, 10],
              ].map(([model, cap, qty]) => (
                <DataTable.Row key={model}>
                  <DataTable.Cell>{model}</DataTable.Cell>
                  <DataTable.Cell align="right">{cap}</DataTable.Cell>
                  <DataTable.Cell align="right">{qty}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable.Body>
          </DataTable>
        </Section>

        <Section title="Color scales">
          {Object.entries({ pumpkinOrange: scales.pumpkinOrange, trueGray: scales.trueGray, sageGreen: scales.sageGreen, blue: scales.blue }).map(
            ([name, scale]) => (
              <div key={name} className="flex flex-col gap-1">
                <span className="text-xs font-medium">{name}</span>
                <div className="flex">
                  {Object.entries(scale)
                    .filter(([k]) => k !== 'base')
                    .map(([k, v]) => (
                      <div key={k} title={`${k}: ${v}`} className="h-6 flex-1" style={{ backgroundColor: v }} />
                    ))}
                </div>
              </div>
            ),
          )}
          <Button variant="primary" onClick={() => setLoading((v) => !v)}>
            Toggle loading
          </Button>
          {loading && (
            <div className="h-80">
              <LoadingIndicator />
            </div>
          )}
        </Section>
      </main>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} dismissible="escape">
        <DialogHeader onClose={() => setDialogOpen(false)}>Save as template</DialogHeader>
        <DialogBody>
          <FormField label="Template name" htmlFor="tpl">
            <TextInput id="tpl" placeholder="My connection" />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setDialogOpen(false)}>
            Save
          </Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Reset all inputs?"
        destructive
        confirmLabel="Reset"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          setThickness(null);
          notify.success('Inputs reset', 'Undo');
        }}
      >
        Every input returns to its default value. This cannot be undone.
      </ConfirmDialog>

      <ToastHost />
    </PlatformThemeProvider>
  );
}
