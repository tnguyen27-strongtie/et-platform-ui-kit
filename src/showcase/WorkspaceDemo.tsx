import { useRef, useState } from 'react';

import {
  Accordion,
  type AccordionGroup,
  Alert,
  Checkbox,
  ConfirmDialog,
  DataTable,
  ExpandCollapseAllButton,
  FormField,
  ImageViewer,
  type ImageViewerHandle,
  RadioGroup,
  ResetViewButton,
  Section,
  SectionLayout,
  Select,
  TextInput,
  useAccordionGroup,
  ViewControls,
  ViewControlsGroup,
  VisualizationStage,
  Workspace,
  type WorkspaceTab,
  WorkspaceTabs,
} from '../index';
import { sampleDrawing } from './data';

/** Stand-in for the app's own 3D viewer (a web component, a Three.js canvas...). */
function Fake3DViewer() {
  return (
    <svg viewBox="0 0 200 160" className="size-full" role="img" aria-label="3D model placeholder">
      <polygon points="100,20 170,55 100,90 30,55" fill="#f7dec1" stroke="#623c11" />
      <polygon points="30,55 100,90 100,140 30,105" fill="#f0c18c" stroke="#623c11" />
      <polygon points="170,55 100,90 100,140 170,105" fill="#e89f4d" stroke="#623c11" />
    </svg>
  );
}

const inputGroups = ['connection', 'load', 'member'] as const;
type InputGroupKey = (typeof inputGroups)[number];

/** `group` is shared with the section header button; on mobile the body owns its own group. */
function InputBody({ group }: { group?: AccordionGroup<InputGroupKey> }) {
  const [connection, setConnection] = useState('wood');
  const ownGroup = useAccordionGroup(inputGroups);
  const g = group ?? ownGroup;
  return (
    <>
      <Accordion title="Connection type" {...g.item('connection')}>
        <FormField label="Connection" htmlFor="conn">
          <Select
            id="conn"
            value={connection}
            onChange={setConnection}
            options={[
              { value: 'wood', label: 'Wood to Wood' },
              { value: 'steel', label: 'Wood to Steel' },
            ]}
          />
        </FormField>
      </Accordion>
      <Accordion title="Load properties" {...g.item('load')}>
        <div className="flex flex-col gap-3">
          <FormField label="Design load" htmlFor="p" help="Factored load applied to the connection.">
            <TextInput id="p" defaultValue="1250" addonAfter="lbs" />
          </FormField>
          <FormField label="Load duration factor" htmlFor="cd">
            <TextInput id="cd" defaultValue="1.15" />
          </FormField>
        </div>
      </Accordion>
      <Accordion title="Member properties" {...g.item('member')}>
        <FormField label="Side member thickness" htmlFor="t1">
          <TextInput id="t1" defaultValue="1.5" addonAfter="in" />
        </FormField>
      </Accordion>
    </>
  );
}

function InputSection() {
  const group = useAccordionGroup(inputGroups);
  return (
    <Section title="Input" actions={<ExpandCollapseAllButton group={group} />}>
      <InputBody group={group} />
    </Section>
  );
}

function ViewModeAndVisibility() {
  const [viewMode, setViewMode] = useState<string | number | boolean | null>('perspective');
  return (
    <>
      <RadioGroup
        name="viewMode"
        direction="column"
        value={viewMode}
        onChange={setViewMode}
        options={[
          { value: 'perspective', label: 'Perspective' },
          { value: 'orthographic', label: 'Orthographic' },
        ]}
      />
      <ViewControlsGroup title="Object visibility">
        <Checkbox label="Side member" defaultChecked />
        <Checkbox label="Main member" defaultChecked />
        <Checkbox label="Loads" defaultChecked />
        <Checkbox label="Fasteners" disabled />
      </ViewControlsGroup>
    </>
  );
}

function ThreeDBody() {
  return (
    <VisualizationStage
      controls={
        <ViewControls>
          <ResetViewButton onClick={() => undefined} />
          <ViewModeAndVisibility />
        </ViewControls>
      }
      note="* Fasteners are not drawn to scale."
    >
      <Fake3DViewer />
    </VisualizationStage>
  );
}

function DrawingBody() {
  const imageRef = useRef<ImageViewerHandle>(null);
  return (
    <VisualizationStage
      controls={
        <ViewControls>
          <ResetViewButton onClick={() => imageRef.current?.reset()} />
        </ViewControls>
      }
    >
      <ImageViewer ref={imageRef} src={sampleDrawing} alt="Connection section drawing" />
    </VisualizationStage>
  );
}

function IllustrationSection() {
  const [tab, setTab] = useState<'3d' | '2d'>('3d');
  return (
    <Section
      value={tab}
      onChange={setTab}
      tabs={[
        { value: '3d', label: '3D Viewer', content: <ThreeDBody /> },
        { value: '2d', label: '2D Drawing', content: <DrawingBody /> },
      ]}
    />
  );
}

function OutputBody() {
  return (
            <div className="p-2">
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
                  ].map(([m, c, q]) => (
                    <DataTable.Row key={m} hover>
                      <DataTable.Cell>{m}</DataTable.Cell>
                      <DataTable.Cell align="right">{c}</DataTable.Cell>
                      <DataTable.Cell align="right">{q}</DataTable.Cell>
                    </DataTable.Row>
                  ))}
                </DataTable.Body>
              </DataTable>
            </div>
  );
}

function ResultBody() {
  return (
    <div className="p-2">
      <Alert severity="success" title="Solution found">
        SDWS22400 passes with a demand/capacity ratio of 0.86.
      </Alert>
    </div>
  );
}

function OutputSection() {
  const [tab, setTab] = useState<'output' | 'result'>('output');
  return (
    <Section
      value={tab}
      onChange={setTab}
      tabs={[
        { value: 'output', label: 'Output', keepMounted: true, content: <OutputBody /> },
        { value: 'result', label: 'Calculation Result', content: <ResultBody /> },
      ]}
    />
  );
}

function CalculatorLayout({ split }: { split: 'rows' | 'columns' }) {
  return (
    <SectionLayout
      layoutId="showcase"
      secondarySplit={split}
      labels={{ input: 'Input', illustration: '3D', output: 'Output' }}
      input={<InputSection />}
      illustration={<IllustrationSection />}
      output={<OutputSection />}
      // Mobile: one flat tab bar, section bodies without their own headers.
      mobileTabs={[
        { value: 'input', label: 'Input', content: <div className="h-full overflow-auto"><InputBody /></div>, keepMounted: true },
        { value: '3d', label: '3D', content: <ThreeDBody /> },
        { value: '2d', label: '2D', content: <DrawingBody /> },
        { value: 'output', label: 'Output', content: <div className="h-full overflow-auto"><OutputBody /></div>, keepMounted: true },
        { value: 'result', label: 'Result', content: <ResultBody /> },
      ]}
    />
  );
}

/** Several calculations open at once. The app owns the list; closing an unsaved one asks first. */
function TabbedWorkspace() {
  const [tabs, setTabs] = useState<WorkspaceTab<string>[]>([
    { value: 'c1', label: 'Calculation 1' },
    { value: 'c2', label: 'Calculation 2', dirty: true },
    { value: 'c3', label: 'Roof beam, level 2' },
    { value: 'c4', label: 'Shear wall SW-4' },
    { value: 'c5', label: 'Hold-down HD-1', dirty: true },
    { value: 'c6', label: 'Ledger connection' },
  ]);
  const [active, setActive] = useState('c1');
  const [pending, setPending] = useState<{ value: string; next: string | null } | null>(null);
  const counter = useRef(7);

  const remove = (value: string, next: string | null) => {
    setTabs((list) => list.filter((t) => t.value !== value));
    if (next !== null) setActive(next);
  };
  const add = () => {
    const n = counter.current++;
    setTabs((list) => [...list, { value: `c${n}`, label: `Calculation ${n}` }]);
    setActive(`c${n}`);
  };

  return (
    <>
      <WorkspaceTabs
        tabs={tabs}
        value={active}
        onChange={setActive}
        onAdd={add}
        onClose={(value, next) => (tabs.find((t) => t.value === value)?.dirty ? setPending({ value, next }) : remove(value, next))}
        labels={{ add: 'New calculation' }}
        empty={
          <div className="flex h-full items-center justify-center rounded-section material-panel text-sm text-text-muted">
            No calculation open. Use + to start one.
          </div>
        }
      >
        {(id) => <CalculatorLayout key={id} split="rows" />}
      </WorkspaceTabs>
      <ConfirmDialog
        open={pending !== null}
        title="Close without saving?"
        confirmLabel="Close"
        destructive
        onConfirm={() => {
          if (pending) remove(pending.value, pending.next);
          setPending(null);
        }}
        onCancel={() => setPending(null)}
      >
        This calculation has changes that are not saved.
      </ConfirmDialog>
    </>
  );
}

export function WorkspaceDemo({ split }: { split: 'rows' | 'columns' | 'tabs' }) {
  return <Workspace>{split === 'tabs' ? <TabbedWorkspace /> : <CalculatorLayout split={split} />}</Workspace>;
}
