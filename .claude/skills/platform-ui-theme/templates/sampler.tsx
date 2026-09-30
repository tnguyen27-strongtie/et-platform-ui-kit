/**
 * Theme sampler: a calculator workspace and a component gallery rendered with the real
 * PlatformThemeProvider and a theme file. preview.mjs copies this file into a temporary folder of
 * the project, replaces the __KIT__, __KIT_CSS__ and __THEME__ placeholders and serves it with the
 * project's own Vite, so fonts, the MUI palette and the dark scheme are exactly what the app gets.
 *
 * URL: index.html?scheme=light|dark|system#workspace (or #components). Only public kit exports.
 */
import '__KIT_CSS__';

import { type ReactNode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  Accordion,
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  type ColorSchemeSetting,
  DataTable,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  FormField,
  notify,
  NumberInput,
  OptionCardGroup,
  PlatformThemeProvider,
  RadioGroup,
  Section,
  SectionLayout,
  Select,
  Stack,
  Switch,
  Tab,
  TabPanel,
  Tabs,
  TextInput,
  ToastHost,
  Tooltip,
  TopNav,
  Typography,
  usePlatformColorScheme,
  ViewControls,
  ViewControlsGroup,
  VisualizationStage,
  Workspace,
} from '__KIT__';

import theme from '__THEME__';

type Page = 'workspace' | 'components';

const pageFromHash = (): Page => (location.hash === '#components' ? 'components' : 'workspace');
const schemeFromUrl = (): ColorSchemeSetting => {
  const s = new URLSearchParams(location.search).get('scheme');
  return s === 'dark' || s === 'system' ? s : 'light';
};

function Drawing() {
  return (
    <svg viewBox="0 0 200 160" style={{ width: '100%', height: '100%' }} role="img" aria-label="Sample drawing">
      <polygon points="100,20 170,55 100,90 30,55" fill="#f7dec1" stroke="#623c11" />
      <polygon points="30,55 100,90 100,140 30,105" fill="#f0c18c" stroke="#623c11" />
      <polygon points="170,55 100,90 100,140 170,105" fill="#e89f4d" stroke="#623c11" />
    </svg>
  );
}

function InputSection() {
  const [connection, setConnection] = useState('wood');
  const [load, setLoad] = useState<number | null>(1250);
  const [expanded, setExpanded] = useState({ a: true, b: true });
  return (
    <Section title="Input" footer={<Button variant="primary">Calculate</Button>}>
      <Accordion title="Connection type" expanded={expanded.a} onChange={(a) => setExpanded((e) => ({ ...e, a }))}>
        <FormField label="Connection" htmlFor="s-conn">
          <Select
            id="s-conn"
            value={connection}
            onChange={setConnection}
            options={[
              { value: 'wood', label: 'Wood to Wood' },
              { value: 'steel', label: 'Wood to Steel' },
            ]}
          />
        </FormField>
      </Accordion>
      <Accordion title="Load properties" expanded={expanded.b} onChange={(b) => setExpanded((e) => ({ ...e, b }))}>
        <Stack spacing={3}>
          <FormField label="Design load" htmlFor="s-load" help="Factored load applied to the connection." description="0 to 10,000 lbs">
            <NumberInput id="s-load" value={load} onChange={setLoad} min={0} max={10000} addonAfter="lbs" />
          </FormField>
          <FormField label="Project name" htmlFor="s-name" required error="Project name is required.">
            <TextInput id="s-name" placeholder="Enter a name" />
          </FormField>
          <Checkbox label="Include seismic loads" defaultChecked />
          <Switch label="Show intermediate values" />
        </Stack>
      </Accordion>
    </Section>
  );
}

function IllustrationSection() {
  const [mode, setMode] = useState<'perspective' | 'orthographic'>('perspective');
  return (
    <Section title="3D Viewer">
      <VisualizationStage
        controls={
          <ViewControls>
            <RadioGroup
              name="s-view"
              direction="column"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'perspective', label: 'Perspective' },
                { value: 'orthographic', label: 'Orthographic' },
              ]}
            />
            <ViewControlsGroup title="Object visibility">
              <Checkbox label="Members" defaultChecked />
              <Checkbox label="Fasteners" />
            </ViewControlsGroup>
          </ViewControls>
        }
        note="* Not drawn to scale."
      >
        <Drawing />
      </VisualizationStage>
    </Section>
  );
}

function ResultsTable() {
  return (
    <DataTable aria-label="Results">
      <DataTable.Head>
        <DataTable.Row>
          <DataTable.Cell>Model</DataTable.Cell>
          <DataTable.Cell align="right">Capacity (lbs)</DataTable.Cell>
          <DataTable.Cell align="right">Qty</DataTable.Cell>
        </DataTable.Row>
      </DataTable.Head>
      <DataTable.Body>
        {(
          [
            ['SDWS22400', 1450, 4],
            ['SDWC15600', 980, 6],
            ['SD9112', 610, 10],
          ] as const
        ).map(([m, c, q]) => (
          <DataTable.Row key={m} hover>
            <DataTable.Cell>{m}</DataTable.Cell>
            <DataTable.Cell align="right">{c}</DataTable.Cell>
            <DataTable.Cell align="right">{q}</DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable.Body>
    </DataTable>
  );
}

function OutputSection() {
  const [tab, setTab] = useState<'output' | 'result'>('output');
  return (
    <Section
      value={tab}
      onChange={setTab}
      tabs={[
        { value: 'output', label: 'Output', content: <Box sx={{ p: 2 }}><ResultsTable /></Box> },
        {
          value: 'result',
          label: 'Calculation Result',
          content: (
            <Box sx={{ p: 2 }}>
              <Alert severity="success" title="Solution found">
                SDWS22400 passes with a demand/capacity ratio of 0.86.
              </Alert>
            </Box>
          ),
        },
      ]}
    />
  );
}

function WorkspacePage() {
  return (
    <Workspace>
      <SectionLayout input={<InputSection />} illustration={<IllustrationSection />} output={<OutputSection />} />
    </Workspace>
  );
}

/** A fixed-width cell so fields sit side by side instead of stretching across the card. */
function Cell({ children }: { children: ReactNode }) {
  return <Box sx={{ width: 240 }}>{children}</Box>;
}

const swatch = <span style={{ display: 'block', width: 72, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-brand-selected)' }} />;

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card title={title}>
      <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', p: 2 }}>
        {children}
      </Stack>
    </Card>
  );
}

function ComponentsPage() {
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState<'single' | 'double'>('single');
  const [tab, setTab] = useState<'a' | 'b'>('a');
  const [value, setValue] = useState<number | null>(12.5);
  return (
    <Box sx={{ height: 'calc(var(--viewport-height) - var(--top-nav-height))', overflow: 'auto', background: 'var(--material-app)', p: 4 }}>
      <Stack spacing={4} sx={{ maxWidth: 1100, mx: 'auto' }}>
        <Group title="Buttons">
          {(['primary', 'primaryDark', 'secondary', 'default', 'tertiary', 'text', 'textDark', 'danger'] as const).map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
          <Button variant="primary" disabled>
            disabled
          </Button>
          <Button variant="primary" loading>
            loading
          </Button>
        </Group>
        <Group title="Fields">
          <Cell>
            <FormField label="Text" htmlFor="c-text">
              <TextInput id="c-text" placeholder="North wall" />
            </FormField>
          </Cell>
          <Cell>
            <FormField label="Number" htmlFor="c-num">
              <NumberInput id="c-num" value={value} onChange={setValue} addonAfter="ft" />
            </FormField>
          </Cell>
          <Cell>
            <FormField label="Select" htmlFor="c-sel">
              <Select id="c-sel" value="a" onChange={() => undefined} options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]} />
            </FormField>
          </Cell>
          <Cell>
            <FormField label="Disabled" htmlFor="c-dis">
              <TextInput id="c-dis" value="Locked" disabled />
            </FormField>
          </Cell>
        </Group>
        <Group title="Choices">
          <Checkbox label="Checked" defaultChecked />
          <Checkbox label="Unchecked" />
          <Switch label="Switch on" defaultChecked />
          <RadioGroup name="c-radio" value="x" onChange={() => undefined} options={[{ value: 'x', label: 'Radio A' }, { value: 'y', label: 'Radio B' }]} />
        </Group>
        <Group title="Option cards and tabs">
          <OptionCardGroup
            aria-label="Shear type"
            value={card}
            onChange={setCard}
            options={[
              { value: 'single', label: 'Single shear', description: 'One shear plane.', image: swatch },
              { value: 'double', label: 'Double shear', description: 'Two shear planes.', image: swatch },
            ]}
          />
          <Box sx={{ minWidth: 320 }}>
            <Tabs id="c-tabs" value={tab} onChange={setTab} aria-label="Sample tabs">
              <Tab value="a" label="Summary" />
              <Tab value="b" label="Details" />
            </Tabs>
            <TabPanel tabsId="c-tabs" value="a" current={tab}>
              <Typography sx={{ p: 2 }}>Summary panel</Typography>
            </TabPanel>
            <TabPanel tabsId="c-tabs" value="b" current={tab}>
              <Typography sx={{ p: 2 }}>Details panel</Typography>
            </TabPanel>
          </Box>
        </Group>
        <Card title="Alerts">
          <Stack spacing={2} sx={{ p: 2 }}>
            <Alert severity="error" title="Validation">Member thickness is outside the allowed range.</Alert>
            <Alert severity="warning" title="No output results">There are no results for these inputs.</Alert>
            <Alert severity="success" title="Design passes">All checks are within capacity.</Alert>
            <Alert severity="info">Results use the 2024 edition.</Alert>
          </Stack>
        </Card>
        <Group title="Overlays">
          <Tooltip title="Short hint">
            <Button>Hover for tooltip</Button>
          </Tooltip>
          <Button onClick={() => setOpen(true)}>Open dialog</Button>
          <Button onClick={() => notify.success('Template saved')}>Show toast</Button>
        </Group>
        <Card title="Results" padding="none">
          <ResultsTable />
        </Card>
      </Stack>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogHeader onClose={() => setOpen(false)}>Save template</DialogHeader>
        <DialogBody>
          <FormField label="Template name" htmlFor="c-dlg">
            <TextInput id="c-dlg" defaultValue="North wall" />
          </FormField>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => setOpen(false)}>
            Save
          </Button>
        </DialogFooter>
      </Dialog>
    </Box>
  );
}

function SchemeLabel() {
  return <span data-testid="scheme">{usePlatformColorScheme()}</span>;
}

function Sampler() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [scheme, setScheme] = useState<ColorSchemeSetting>(schemeFromUrl);
  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);
  const setSchemeInUrl = (next: ColorSchemeSetting) => {
    setScheme(next);
    const url = new URL(location.href);
    url.searchParams.set('scheme', next);
    history.replaceState(null, '', url);
  };

  return (
    <PlatformThemeProvider config={theme} colorScheme={scheme}>
      <TopNav
        logo={<strong>{theme.name ?? 'Theme preview'}</strong>}
        right={
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Button variant={page === 'workspace' ? 'primary' : 'default'} size="small" onClick={() => (location.hash = 'workspace')}>
              Workspace
            </Button>
            <Button variant={page === 'components' ? 'primary' : 'default'} size="small" onClick={() => (location.hash = 'components')}>
              Components
            </Button>
            <Box sx={{ width: 120 }}>
              <Select<ColorSchemeSetting>
                aria-label="Color scheme"
                value={scheme}
                onChange={setSchemeInUrl}
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ]}
              />
            </Box>
            <SchemeLabel />
          </Stack>
        }
      />
      {page === 'workspace' ? <WorkspacePage /> : <ComponentsPage />}
      <ToastHost />
    </PlatformThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(<Sampler />);
