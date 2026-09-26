import { type ReactNode, useState } from 'react';

import {
  Accordion,
  Alert,
  Button,
  Checkbox,
  Combobox,
  DataTable,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  type Density,
  FormField,
  LoadingIndicator,
  NavMenu,
  notify,
  OptionCardGroup,
  PlatformThemeProvider,
  RadioGroup,
  scales,
  Select,
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-sm bg-white p-4 shadow-popover">
      <h2 className="text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

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
  const [country, setCountry] = useState<string | number | boolean | null>('USA');
  const [card, setCard] = useState<string | null>('single');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState<'components' | 'rows' | 'columns'>(() =>
    location.hash === '#workspace' ? 'rows' : location.hash === '#workspace-columns' ? 'columns' : 'components',
  );

  return (
    <PlatformThemeProvider density={density}>
      <TopNav
        logo={<span className="text-lg font-bold text-pumpkin-orange-50">Platform</span>}
        right={
          <Switch
            label="Expanded text"
            checked={density === 'expanded'}
            onChange={(on) => setDensity(on ? 'expanded' : 'standard')}
          />
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
      <main className="mx-auto grid max-w-6xl gap-4 p-4 md:grid-cols-2">
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
        </Section>

        <Section title="Form fields">
          <FormField label="Design load" htmlFor="load" help="Factored load applied to the connection.">
            <TextInput id="load" value={load} onChange={(e) => setLoad(e.target.value)} addonAfter="lbs" />
          </FormField>
          <FormField label="Member thickness" htmlFor="thickness" required error="Value must be between 1.5 and 3.5 in.">
            <TextInput id="thickness" defaultValue="4" error addonAfter="in" />
          </FormField>
          <FormField label="Disabled" htmlFor="disabled">
            <TextInput id="disabled" defaultValue="Locked value" disabled />
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
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

      <ToastHost />
    </PlatformThemeProvider>
  );
}
