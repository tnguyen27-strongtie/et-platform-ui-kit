import SettingsIcon from '@mui/icons-material/Settings';
import { type ComponentType, useRef, useState } from 'react';

import {
  Accordion,
  AgreementDialog,
  Alert,
  Button,
  Card,
  Checkbox,
  Combobox,
  ConfirmDialog,
  DataTable,
  DescriptionList,
  Dialog,
  DialogBody,
  type DialogCloseReason,
  DialogFooter,
  DialogHeader,
  type DialogProps,
  DropdownMenu,
  EmptyState,
  ErrorAlert,
  ErrorBoundary,
  ExpandCollapseAllButton,
  FormField,
  type GridColumn,
  GridView,
  type GridViewState,
  IconButton,
  ImageViewer,
  InfoTip,
  type ImageViewerHandle,
  LoadingIndicator,
  MathSub,
  MathVar,
  NavMenu,
  notify,
  NumberInput,
  OptionCardGroup,
  PlatformThemeProvider,
  RadioGroup,
  type ReleaseNote,
  ReleaseNotes,
  ReleaseNotesDialog,
  Section,
  SectionLayout,
  Select,
  Spinner,
  Switch,
  Tab,
  TabPanel,
  Tabs,
  TextInput,
  Tooltip,
  TopNav,
  useAccordionGroup,
  useAgreementAccepted,
  useReleaseNotesSeen,
  type Density,
} from '../../../src/index';

/** Prints a callback value as JSON so specs can check both value and type. */
function Out({ id, value }: { id: string; value: unknown }) {
  return (
    <output data-testid={id} style={{ fontFamily: 'monospace', fontSize: 12 }}>
      {value === undefined ? 'undefined' : JSON.stringify(value)}
    </output>
  );
}

const useCounter = () => {
  const [n, setN] = useState(0);
  return [n, () => setN((c) => c + 1)] as const;
};

// ---------- Buttons ----------
function ButtonFixture() {
  const [clicks, click] = useCounter();
  const [submits, submit] = useCounter();
  const [saves, save] = useCounter();
  const [loading, setLoading] = useState(false);
  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="primary" onClick={click}>
          Primary
        </Button>
        <Button variant="primary" disabled onClick={click}>
          Disabled primary
        </Button>
        <Button
          variant="primary"
          loading={loading}
          onClick={() => {
            save();
            setLoading(true);
          }}
        >
          Save
        </Button>
        <Button onClick={() => setLoading(false)}>Finish saving</Button>
        <Button variant="danger" onClick={click}>
          Delete
        </Button>
        <IconButton aria-label="Settings" onClick={click}>
          <SettingsIcon />
        </IconButton>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <TextInput aria-label="Search text" fullWidth={false} />
        <Button>Plain button in form</Button>
        <Button type="submit">Submit</Button>
      </form>
      <Out id="clicks" value={clicks} />
      <Out id="saves" value={saves} />
      <Out id="submits" value={submits} />
    </>
  );
}

// ---------- Text input + FormField ----------
function TextInputFixture() {
  const [name, setName] = useState('');
  const [showError, setShowError] = useState(false);
  const [notes, setNotes] = useState('');
  return (
    <>
      <Checkbox label="Show error" checked={showError} onChange={setShowError} />
      <FormField
        label="Full name"
        htmlFor="name"
        required
        description="As printed on the report."
        error={showError ? 'Name is required.' : undefined}
      >
        <TextInput value={name} onChange={(e) => setName(e.target.value)} addonAfter="text" />
      </FormField>
      <FormField label="Notes" htmlFor="notes">
        <TextInput multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FormField>
      <FormField label="Locked" htmlFor="locked" disabled>
        <TextInput defaultValue="Cannot edit" />
      </FormField>
      <Out id="name" value={name} />
      <Out id="notes" value={notes} />
    </>
  );
}

// ---------- NumberInput ----------
function NumberInputFixture() {
  const [value, setValue] = useState<number | null>(1);
  const [calls, setCalls] = useState(0);
  const [price, setPrice] = useState<number | null>(null);
  return (
    <>
      <FormField label="Length" htmlFor="length" description="0 to 100 ft">
        <NumberInput
          value={value}
          onChange={(v) => {
            setCalls((c) => c + 1);
            setValue(v);
          }}
          min={0}
          max={100}
          step={0.5}
          addonAfter="ft"
        />
      </FormField>
      <FormField label="Price" htmlFor="price">
        <NumberInput value={price} onChange={setPrice} precision={2} />
      </FormField>
      <FormField label="Read only" htmlFor="ro">
        <NumberInput value={5} onChange={() => undefined} readOnly />
      </FormField>
      <FormField label="Disabled number" htmlFor="dis" disabled>
        <NumberInput value={7} onChange={() => undefined} />
      </FormField>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={() => setValue(null)}>Clear from app</Button>
        <Button onClick={() => setValue(42.5)}>Load 42.5</Button>
      </div>
      <Out id="value" value={value} />
      <Out id="calls" value={calls} />
      <Out id="price" value={price} />
    </>
  );
}

// ---------- Select ----------
function SelectFixture() {
  const [size, setSize] = useState<number | ''>('');
  const [materials, setMaterials] = useState<string[]>([]);
  return (
    <>
      <FormField label="Size" htmlFor="size" description="Nominal size">
        <Select<number>
          value={size}
          onChange={setSize}
          placeholder="Pick a size"
          options={[
            { value: 1, label: 'Small' },
            { value: 2, label: 'Medium' },
            { value: 3, label: 'Large', disabled: true },
            { value: 4, label: 'Extra large' },
          ]}
        />
      </FormField>
      <FormField label="Materials" htmlFor="materials">
        <Select
          multiple
          value={materials}
          onChange={setMaterials}
          options={[
            { value: 'wood', label: 'Wood' },
            { value: 'steel', label: 'Steel' },
            { value: 'concrete', label: 'Concrete' },
          ]}
        />
      </FormField>
      <Select aria-label="Standalone select" value="a" onChange={() => undefined} options={[{ value: 'a', label: 'Option A' }]} />
      <Out id="size" value={size} />
      <Out id="materials" value={materials} />
    </>
  );
}

// ---------- Combobox ----------
function ComboboxFixture() {
  const [fruit, setFruit] = useState<string | null>(null);
  return (
    <>
      <FormField label="Fruit" htmlFor="fruit">
        <Combobox
          value={fruit}
          onChange={setFruit}
          placeholder="Search fruit"
          noOptionsText="Nothing found"
          options={[
            { value: 'apple', label: 'Apple' },
            { value: 'banana', label: 'Banana' },
            { value: 'cherry', label: 'Cherry', disabled: true },
            { value: 'dragon', label: <strong>Dragon fruit</strong>, searchText: 'Dragon fruit' },
          ]}
        />
      </FormField>
      <Out id="fruit" value={fruit} />
    </>
  );
}

// ---------- Checkbox, Switch, RadioGroup ----------
function ChoiceFixture() {
  const [accept, setAccept] = useState(false);
  const [metric, setMetric] = useState(true);
  const [locked, setLocked] = useState(false);
  const [wet, setWet] = useState(false);
  const [count, setCount] = useState<number | null>(1);
  const [yes, setYes] = useState<boolean | null>(null);
  return (
    <>
      <Checkbox label="Accept terms" checked={accept} onChange={setAccept} />
      <Switch label="Metric units" checked={metric} onChange={setMetric} />
      <Checkbox label="Locked option" checked={locked} onChange={setLocked} disabled />
      <Checkbox label="Wet service" checked={wet} onChange={setWet} help="Moisture content above 19% in service." helpLabel="About wet service" />
      <FormField label="Plies" htmlFor="plies" error={count === null ? 'Pick one' : undefined}>
        <RadioGroup<number>
          name="plies"
          value={count}
          onChange={setCount}
          options={[
            { value: 1, label: 'One ply' },
            { value: 2, label: 'Two plies' },
            { value: 3, label: 'Three plies', disabled: true },
            { value: 4, label: 'Four plies' },
          ]}
        />
      </FormField>
      <RadioGroup<boolean>
        aria-label="Wet service"
        name="wet"
        value={yes}
        onChange={setYes}
        options={[
          { value: true, label: 'Yes' },
          { value: false, label: 'No' },
        ]}
      />
      <Out id="accept" value={accept} />
      <Out id="metric" value={metric} />
      <Out id="locked" value={locked} />
      <Out id="wet" value={wet} />
      <Out id="count" value={count} />
      <Out id="yes" value={yes} />
    </>
  );
}

// ---------- OptionCardGroup ----------
function OptionCardFixture() {
  const [shear, setShear] = useState<string | null>('single');
  return (
    <>
      <OptionCardGroup
        aria-label="Shear type"
        value={shear}
        onChange={setShear}
        options={[
          { value: 'single', label: 'Single shear', description: 'One shear plane between two members.' },
          { value: 'double', label: 'Double shear' },
          { value: 'none', label: 'Unavailable', disabled: true },
        ]}
      />
      <Out id="shear" value={shear} />
    </>
  );
}

// ---------- Tabs ----------
function TabsFixture() {
  const [tab, setTab] = useState('inputs');
  return (
    <div>
      <Tabs id="calc" value={tab} onChange={setTab} aria-label="Calculator views">
        <Tab value="inputs" label="Inputs" />
        <Tab value="results" label="Results" />
        <Tab value="report" label="Report" disabled />
        <Tab value="notes" label="Notes" />
      </Tabs>
      <TabPanel tabsId="calc" value="inputs" current={tab} keepMounted>
        <TextInput aria-label="Kept input" />
      </TabPanel>
      <TabPanel tabsId="calc" value="results" current={tab}>
        Results panel
      </TabPanel>
      <TabPanel tabsId="calc" value="notes" current={tab}>
        Notes panel
      </TabPanel>
      <Out id="tab" value={tab} />
    </div>
  );
}

// ---------- Accordion ----------
function AccordionFixture() {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState<boolean[]>([]);
  const group = useAccordionGroup(['a', 'b'] as const);
  const single = useAccordionGroup(['x', 'y', 'z'] as const, { exclusive: true, initial: { y: true } });
  const legacy = useAccordionGroup(['p', 'q'] as const, false, { q: true });
  return (
    <>
      <Accordion title="Uncontrolled section" defaultExpanded={false}>
        Uncontrolled body
      </Accordion>
      <Accordion
        title="Controlled section"
        expanded={open}
        onChange={(v) => {
          setOpen(v);
          setEvents((e) => [...e, v]);
        }}
      >
        Controlled body
      </Accordion>
      <Section title="Grouped" actions={<ExpandCollapseAllButton group={group} />}>
        <Accordion title="Group A" {...group.item('a')}>
          A body
        </Accordion>
        <Accordion title="Group B" {...group.item('b')}>
          B body
        </Accordion>
      </Section>
      <Accordion title="Exclusive X" {...single.item('x')}>
        X body
      </Accordion>
      <Accordion title="Exclusive Y" {...single.item('y')}>
        Y body
      </Accordion>
      <Accordion title="Exclusive Z" {...single.item('z')}>
        Z body
      </Accordion>
      <Button onClick={single.expandAll}>Expand exclusive</Button>
      <Button onClick={single.collapseAll}>Collapse exclusive</Button>
      <Accordion title="Legacy P" {...legacy.item('p')}>
        P body
      </Accordion>
      <Accordion title="Legacy Q" {...legacy.item('q')}>
        Q body
      </Accordion>
      <Out id="events" value={events} />
    </>
  );
}

// ---------- Dialog ----------
function DialogFixture() {
  const [mode, setMode] = useState<DialogProps['dismissible'] | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const close = (reason: DialogCloseReason | 'closeButton' | 'cancel') => {
    setReasons((r) => [...r, reason]);
    setMode(null);
  };
  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={() => setMode('any')}>Open any</Button>
        <Button onClick={() => setMode('escape')}>Open escape</Button>
        <Button onClick={() => setMode('none')}>Open none</Button>
      </div>
      <Dialog open={mode !== null} onClose={close} dismissible={mode ?? 'any'}>
        <DialogHeader onClose={() => close('closeButton')}>Edit template</DialogHeader>
        <DialogBody>
          <FormField label="Template name" htmlFor="tpl">
            <TextInput />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => close('cancel')}>Cancel</Button>
          <Button variant="primary">Save</Button>
        </DialogFooter>
      </Dialog>
      <Out id="reasons" value={reasons} />
    </>
  );
}

// ---------- ConfirmDialog ----------
function ConfirmFixture() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmed, confirm] = useCounter();
  const [cancelled, cancel] = useCounter();
  return (
    <>
      <Button onClick={() => setOpen(true)}>Save changes</Button>
      <ConfirmDialog
        open={open}
        title="Save changes?"
        confirmLabel="Save"
        loading={loading}
        onCancel={() => {
          cancel();
          setOpen(false);
        }}
        onConfirm={() => {
          confirm();
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            setOpen(false);
          }, 800);
        }}
      >
        The project file will be overwritten.
      </ConfirmDialog>
      <Out id="confirmed" value={confirmed} />
      <Out id="cancelled" value={cancelled} />
    </>
  );
}

// ---------- DropdownMenu + NavMenu ----------
function MenuFixture() {
  const [picked, setPicked] = useState<string[]>([]);
  const pick = (id: string) => () => setPicked((p) => [...p, id]);
  return (
    <>
      <TopNav logo={<span>Logo</span>}>
        <NavMenu
          label="File"
          items={[
            { id: 'new', label: 'New project', onSelect: pick('nav:new') },
            { id: 'open', label: 'Open project', onSelect: pick('nav:open'), disabled: true },
          ]}
        />
      </TopNav>
      <DropdownMenu
        label="Actions"
        items={[
          { id: 'edit', label: 'Edit', onSelect: pick('edit') },
          { id: 'dup', label: 'Duplicate', onSelect: pick('dup'), disabled: true },
          { id: 'sep', divider: true },
          { id: 'delete', label: 'Delete', onSelect: pick('delete'), danger: true },
        ]}
      />
      <DropdownMenu
        label="Export"
        items={[
          {
            id: 'full',
            label: 'Export the full calculation report with every load combination as a PDF document',
            onSelect: pick('export:full'),
          },
          { id: 'csv', label: 'CSV', onSelect: pick('export:csv') },
        ]}
      />
      <Out id="picked" value={picked} />
    </>
  );
}

// ---------- HelpPopover + Tooltip ----------
function OverlayFixture() {
  return (
    <>
      <FormField label="Load factor" htmlFor="lf" help="Multiplier applied to the service load.">
        <TextInput />
      </FormField>
      <Tooltip title="Runs the calculation">
        <Button variant="primary">Calculate</Button>
      </Tooltip>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Tooltip title="Settings">
          <IconButton aria-label="Open settings">
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Fill in all inputs first">
          <Button disabled>Export</Button>
        </Tooltip>
        <span>
          Capacity
          <InfoTip title="How capacity is calculated" label="About capacity">
            <p>Capacity is the lowest of the fastener, main member and side member limits.</p>
            <ul>
              <li>Fastener: withdrawal and lateral design values</li>
              <li>Members: bearing and net section</li>
            </ul>
            <p>
              See the <a href="https://example.com/guide">design guide</a> for details.
            </p>
          </InfoTip>
        </span>
        <InfoTip trigger="info" label="About load duration" placement="right">
          Load duration factor adjusts for how long the load is applied.
        </InfoTip>
        <InfoTip trigger={<Button variant="text">Why is this failing?</Button>} title="Why it fails">
          <p>The side member is thinner than the minimum penetration.</p>
        </InfoTip>
      </div>
    </>
  );
}

// ---------- Toast ----------
function ToastFixture() {
  const [n, setN] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button onClick={() => notify.success('Saved successfully')}>Toast success</Button>
      <Button onClick={() => notify.info('Heads up')}>Toast info</Button>
      <Button onClick={() => notify.warning('Check units')}>Toast warning</Button>
      <Button onClick={() => notify.error('Export failed')}>Toast error</Button>
      <Button
        onClick={() => {
          setN((c) => c + 1);
          notify.success(`Burst ${n + 1}`);
        }}
      >
        Toast burst
      </Button>
      <Button onClick={() => notify.dismiss()}>Dismiss all</Button>
    </div>
  );
}

// ---------- Display components ----------
function DisplayFixture() {
  return (
    <>
      <Alert severity="error" title="Invalid input">
        Thickness is out of range.
      </Alert>
      <Alert severity="warning">No results.</Alert>
      <Alert severity="success">Saved.</Alert>
      <Alert severity="info">Tip.</Alert>
      <Card title="Results" subtitle="per bolt" footer={<span>Total 3</span>} padding="none">
        <DataTable maxHeight={120} aria-label="Capacity by model">
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.Cell>Model</DataTable.Cell>
              <DataTable.Cell align="right">Capacity</DataTable.Cell>
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            {['A', 'B', 'C', 'D', 'E', 'F'].map((m, i) => (
              <DataTable.Row key={m}>
                <DataTable.Cell>{`Model ${m}`}</DataTable.Cell>
                <DataTable.Cell align="right">{(i + 1) * 100}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable.Body>
        </DataTable>
      </Card>
      <EmptyState title="No results yet" action={<Button>Run</Button>}>
        Fill in the inputs.
      </EmptyState>
      <Spinner label="Loading results" />
      <div style={{ height: 320 }}>
        <LoadingIndicator />
      </div>
    </>
  );
}

// ---------- ErrorBoundary ----------
function Bomb({ explode }: { explode: boolean }) {
  if (explode) throw new Error('Boom');
  return <p>Safe content</p>;
}

function ErrorBoundaryFixture() {
  const [explode, setExplode] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={() => setExplode(true)}>Break it</Button>
        <Button
          onClick={() => {
            setExplode(false);
            setResetKey((k) => k + 1);
          }}
        >
          Fix data
        </Button>
      </div>
      <ErrorBoundary resetKeys={[resetKey]} onError={(e) => setErrors((list) => [...list, e.message])}>
        <Bomb explode={explode} />
      </ErrorBoundary>
      <p>Sibling content</p>
      <Out id="errors" value={errors} />
      <TranslatedBoundary />
    </>
  );
}

function Flaky({ broken }: { broken: boolean }) {
  if (broken) throw new Error('Flaky');
  return (
    <div>
      <TextInput aria-label="Recovered input" />
    </div>
  );
}

/** Translated default fallback; "Repair" fixes the data without resetKeys, so only the retry button recovers. */
function TranslatedBoundary() {
  const [broken, setBroken] = useState(false);
  return (
    <section aria-label="Translated pane">
      <Button onClick={() => setBroken(true)}>Break translated</Button>
      <Button onClick={() => setBroken(false)}>Repair</Button>
      <ErrorBoundary labels={{ title: 'Đã xảy ra lỗi', retry: 'Thử lại' }}>
        <Flaky broken={broken} />
      </ErrorBoundary>
    </section>
  );
}

// ---------- ImageViewer ----------
function ImageViewerFixture() {
  const ref = useRef<ImageViewerHandle>(null);
  const [src, setSrc] = useState('/images/sample-drawing.svg');
  return (
    <>
      <Button onClick={() => ref.current?.reset()}>Reset from app</Button>
      <Button onClick={() => setSrc('/images/sst-logo-noborder-color.svg')}>Show another image</Button>
      <section aria-label="Main viewer" style={{ width: 400, height: 300, border: '1px solid #ccc' }}>
        <ImageViewer ref={ref} src={src} alt="Connection drawing" />
      </section>
      <section aria-label="Min scale viewer" style={{ width: 400, height: 300, border: '1px solid #ccc' }}>
        <ImageViewer src="/images/sample-drawing.svg" alt="Zoomed-out drawing" minScale={0.5} />
      </section>
    </>
  );
}

// ---------- SectionLayout ----------
function LayoutFixture() {
  return (
    <div style={{ height: 600, width: '100%' }}>
      <SectionLayout
        layoutId="harness-layout"
        input={
          <Section title="Input">
            <FormField label="Layout input" htmlFor="layout-input">
              <TextInput />
            </FormField>
          </Section>
        }
        illustration={<Section title="Illustration">Drawing here</Section>}
        output={<Section title="Output">Output here</Section>}
      />
    </div>
  );
}

// ---------- Density ----------
function DensityFixture() {
  const [density, setDensity] = useState<Density>('standard');
  return (
    <PlatformThemeProvider density={density}>
      <Switch label="Expanded text" checked={density === 'expanded'} onChange={(on) => setDensity(on ? 'expanded' : 'standard')} />
      <p>Body text</p>
    </PlatformThemeProvider>
  );
}

// ---------- GridView ----------
interface Part {
  id: string;
  model: string;
  description: string;
  material: 'Wood' | 'Steel' | 'Concrete';
  capacity: number;
  qty: number | null;
  status: 'OK' | 'Check' | 'Fails';
}

const parts: Part[] = [
  { id: 'p1', model: 'SDWS22400', description: 'Timber screw', material: 'Wood', capacity: 1450, qty: 4, status: 'OK' },
  { id: 'p2', model: 'SDWC15600', description: 'Truss screw', material: 'Wood', capacity: 980, qty: 6, status: 'Check' },
  { id: 'p3', model: 'SD9112', description: 'Connector screw', material: 'Steel', capacity: 610, qty: 10, status: 'OK' },
  { id: 'p4', model: 'THD50400', description: 'Concrete anchor', material: 'Concrete', capacity: 3120, qty: null, status: 'OK' },
  { id: 'p5', model: 'SDS25300', description: 'Strong-Drive screw', material: 'Wood', capacity: 1210, qty: 2, status: 'Fails' },
  { id: 'p6', model: 'M12', description: 'Bu lông bê tông', material: 'Concrete', capacity: 2480, qty: 8, status: 'OK' },
];

function GridFixture() {
  const [selected, setSelected] = useState<string | null>(null);
  const [opened, setOpened] = useState<string[]>([]);
  const [state, setState] = useState<GridViewState | null>(null);
  const columns: GridColumn<Part>[] = [
    { id: 'model', header: 'Model', value: 'model', type: 'image', width: 180, image: { src: () => '/images/sample-drawing.svg', alt: (r) => `${r.model} photo`, subtext: (r) => r.description } },
    { id: 'material', header: 'Material', value: 'material', filter: 'select', width: 150 },
    { id: 'capacity', header: 'Capacity', value: 'capacity', type: 'number', format: (v) => (v == null ? '' : `${(v as number).toLocaleString('en-US')} lbs`), width: 150 },
    { id: 'qty', header: 'Qty', value: 'qty', type: 'number', width: 130 },
    { id: 'status', header: 'Status', value: 'status', filter: 'select', width: 130, cell: (r) => <strong data-testid={`status-${r.id}`}>{r.status}</strong> },
    { id: 'sheet', header: 'Datasheet', value: (r) => `${r.model}.pdf`, type: 'link', link: { href: (r) => `https://example.com/${r.model}.pdf`, external: true }, filter: false, sortable: false, width: 170 },
    { id: 'open', header: 'Open', value: () => 'Open', type: 'link', link: { onClick: (r) => setOpened((o) => [...o, r.id]) }, filter: false, sortable: false, searchable: false, hideable: false, width: 110 },
  ];
  return (
    <>
      <div style={{ width: 640 }}>
        <GridView
          aria-label="Parts"
          rows={parts}
          columns={columns}
          getRowId={(r) => r.id}
          search={{ placeholder: 'Search parts', columns: ['model', 'material', 'capacity', 'sheet'] }}
          presets={[
            { id: 'wood', label: 'Wood only', filters: { material: ['Wood'] } },
            { id: 'big', label: 'Big anchors', filters: { capacity: { min: 2000 } }, search: 'concrete' },
          ]}
          rowHighlight={(r) => (r.status === 'Fails' ? 'danger' : r.status === 'Check' ? 'warning' : undefined)}
          selectedRowId={selected}
          onRowClick={(r) => setSelected(r.id)}
          onStateChange={setState}
          initialState={{ pinned: { start: ['model'], end: [] } }}
          maxHeight={260}
        />
      </div>
      <Out id="selected" value={selected} />
      <Out id="opened" value={opened} />
      <Out id="state" value={state} />
    </>
  );
}

function GridLabelsFixture() {
  const columns: GridColumn<Part>[] = [
    { id: 'model', header: 'Mã', value: 'model' },
    { id: 'capacity', header: 'Tải', value: 'capacity', type: 'number' },
  ];
  return (
    <div style={{ width: 640 }}>
      <GridView
        aria-label="Vật tư"
        rows={parts}
        columns={columns}
        getRowId={(r) => r.id}
        locale="de-DE"
        labels={{
          searchPlaceholder: 'Tìm kiếm',
          searchLabel: (grid) => `Tìm trong ${grid}`,
          rowCount: (shown, total, filtered) => (filtered ? `${shown}/${total} dòng` : `${total} dòng`),
          clearFilters: 'Xóa bộ lọc',
          filters: 'Bộ lọc',
          columns: 'Cột',
          columnOptions: (h) => `Tùy chọn cột ${h}`,
        }}
      />
    </div>
  );
}

// ---------- Release notes ----------
const releases: ReleaseNote[] = [
  { version: '2.4.1', date: '2026-02-01', sections: [{ category: 'fix', groups: [{ items: ['Fixed report rounding.'] }] }] },
  {
    version: '2.10.0',
    date: '2026-09-03',
    sections: [
      {
        category: 'feature',
        groups: [
          { title: 'EU', items: ['Added Chile as a supported country.', <>Added Multi-Ply — <a href="#explore">Explore now</a>.</>] },
          { title: 'USA', items: ['Added a results filter.'] },
        ],
      },
      { category: 'maintenance', groups: [{ items: ['General system improvements and bug fixes.'] }] },
    ],
  },
  { version: '2.9.0', date: '2026-06-18', sections: [{ category: 'improvement', groups: [{ items: ['Faster 3D loading.'] }] }] },
];

const RN_KEY = 'harness:release-notes';

function SeenProbe() {
  const seen = useReleaseNotesSeen({ currentVersion: '2.10.0', storageKey: RN_KEY });
  return (
    <>
      <Out id="should-open" value={seen.shouldOpen} />
      <Out id="last-seen" value={seen.lastSeenVersion} />
      <Button onClick={seen.markSeen}>Mark seen</Button>
    </>
  );
}

function ReleaseNotesFixture() {
  const [open, setOpen] = useState(false);
  const [probeKey, setProbeKey] = useState(0);
  const setStored = (v: string | null) => {
    if (v === null) localStorage.removeItem(RN_KEY);
    else localStorage.setItem(RN_KEY, v);
    setProbeKey((k) => k + 1);
  };
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open release notes</Button>
      <ReleaseNotesDialog
        open={open}
        onClose={() => setOpen(false)}
        appName="DC"
        appTitle="Demo Calculator"
        intro="Demo Calculator checks timber connections."
        releases={releases}
        lastSeenVersion="2.4.1"
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <Button onClick={() => setStored(null)}>Stored: none</Button>
        <Button onClick={() => setStored('2.9.0')}>Stored: 2.9.0</Button>
        <Button onClick={() => setProbeKey((k) => k + 1)}>Remount</Button>
        <Out id="stored" value={probeKey >= 0 ? localStorage.getItem(RN_KEY) : null} />
      </div>
      <SeenProbe key={probeKey} />
      <section aria-label="Inline Vietnamese">
        <ReleaseNotes
          releases={releases.slice(0, 1)}
          locale="vi-VN"
          headingLevel="h3"
          labels={{ released: (d) => `Phát hành ngày ${d}`, categories: { fix: 'Sửa lỗi' } }}
        />
      </section>
      <section aria-label="Empty">
        <ReleaseNotes releases={[]} labels={{ empty: 'Chưa có ghi chú phát hành.' }} />
      </section>
    </>
  );
}

// ---------- Card as input group, DescriptionList, math notation ----------
function InputGroupFixture() {
  const [sds, setSds] = useState<number | null>(1.2);
  const details = [
    { id: 'version', label: 'Version', value: '2.4.0' },
    { id: 'code', label: 'Design code', value: 'A long value that has to wrap onto several lines in a narrow container' },
  ];
  return (
    <>
      <Card role="group" title="Seismic" padding="md">
        <FormField label="Short-period acceleration" htmlFor="ig-sds">
          <NumberInput value={sds} onChange={setSds} />
        </FormField>
      </Card>
      <div style={{ width: 200 }}>
        <Card role="group" title="A very long card title that needs to wrap onto more lines" wrapTitle>
          Wrapped title
        </Card>
      </div>
      <Card title="Plain card">Plain body</Card>
      <div data-testid="wide-list" style={{ width: 500 }}>
        <DescriptionList items={details} />
      </div>
      <div data-testid="narrow-list" style={{ width: 240 }}>
        <DescriptionList size="sm" items={details} />
      </div>
      <p>
        Design spectral acceleration <MathVar>S</MathVar>
        <MathSub>DS</MathSub>
      </p>
    </>
  );
}

// ---------- ErrorAlert ----------
function ErrorAlertFixture() {
  const [retries, retry] = useCounter();
  return (
    <>
      <ErrorAlert title="Could not calculate" reference="Reference: 00-4bf92f35" onRetry={retry} retryLabel="Try again">
        The service did not respond.
      </ErrorAlert>
      <ErrorAlert title="Not allowed">No access.</ErrorAlert>
      <Out id="retries" value={retries} />
    </>
  );
}

// ---------- AgreementDialog ----------
const AGREEMENT_KEY = 'harness:agreement';

function AgreementFixture() {
  const agreement = useAgreementAccepted({ storageKey: AGREEMENT_KEY, version: '2' });
  const [declined, decline] = useCounter();
  const [dismissed, setDismissed] = useState(false);
  return (
    <>
      <Button onClick={() => localStorage.setItem(AGREEMENT_KEY, '1')}>Store old version</Button>
      <AgreementDialog
        open={!agreement.accepted && !dismissed}
        title="License agreement"
        note="Available in English only."
        lang="en"
        labels={{ accept: 'I agree', decline: 'I disagree' }}
        onAccept={agreement.accept}
        onDecline={() => {
          decline();
          setDismissed(true);
        }}
      >
        <p>Read carefully.</p>
        <h3>1. License</h3>
        {Array.from({ length: 30 }, (_, i) => (
          <p key={i}>Clause text {i + 1}.</p>
        ))}
      </AgreementDialog>
      <Out id="accepted" value={agreement.accepted} />
      <Out id="declined" value={declined} />
    </>
  );
}

// ---------- Section footer ----------
function SectionFooterFixture() {
  const [runs, run] = useCounter();
  return (
    <div style={{ height: 260, width: 360 }}>
      <Section
        title="Input"
        footerAlign="between"
        footer={
          <>
            <Button>Restart</Button>
            <Button variant="primary" onClick={run}>
              Calculate
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <FormField key={i} label={`Field ${i + 1}`} htmlFor={`sf-${i}`}>
              <TextInput />
            </FormField>
          ))}
        </div>
      </Section>
      <Out id="runs" value={runs} />
    </div>
  );
}

export const fixtures: Record<string, ComponentType> = {
  button: ButtonFixture,
  'text-input': TextInputFixture,
  'number-input': NumberInputFixture,
  select: SelectFixture,
  combobox: ComboboxFixture,
  choice: ChoiceFixture,
  'option-card': OptionCardFixture,
  tabs: TabsFixture,
  accordion: AccordionFixture,
  dialog: DialogFixture,
  confirm: ConfirmFixture,
  menu: MenuFixture,
  overlay: OverlayFixture,
  toast: ToastFixture,
  display: DisplayFixture,
  'error-boundary': ErrorBoundaryFixture,
  'image-viewer': ImageViewerFixture,
  layout: LayoutFixture,
  density: DensityFixture,
  grid: GridFixture,
  'grid-labels': GridLabelsFixture,
  'release-notes': ReleaseNotesFixture,
  'input-group': InputGroupFixture,
  'error-alert': ErrorAlertFixture,
  agreement: AgreementFixture,
  'section-footer': SectionFooterFixture,
};
