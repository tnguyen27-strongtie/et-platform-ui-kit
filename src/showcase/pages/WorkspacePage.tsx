import { type DragEvent, useRef, useState } from 'react';

import {
  Button,
  Checkbox,
  DropOverlay,
  EmptyState,
  FormField,
  ImageViewer,
  type ImageViewerHandle,
  notify,
  ResetViewButton,
  Section,
  SectionLayout,
  Switch,
  TextInput,
  ViewControls,
  ViewControlsGroup,
  VisualizationStage,
} from '../../index';
import { DemoGrid, DemoPage, DemoSection, Variants } from '../layout';

export function WorkspacePage() {
  const [tab, setTab] = useState<'3d' | '2d'>('2d');
  const [loading, setLoading] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const viewer = useRef<ImageViewerHandle>(null);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const names = [...e.dataTransfer.files].map((f) => f.name);
    setFiles(names);
    if (names.length) notify.success(`Loaded ${names.join(', ')}`);
  };

  return (
    <DemoPage title="Workspace" description="The three-section calculator layout (Input, Illustration, Output) and its building blocks.">
      <DemoSection
        id="section-layout"
        title="SectionLayout"
        description="Input left (36%), Illustration and Output right. Drag the 5px handles to resize; drag Input below 250px to collapse it to a rail. Tablet stacks the right side; mobile shows one section at a time with tabs."
        code={`<Workspace>
  <SectionLayout layoutId="app" secondarySplit="rows"
    input={<Section title="Input">…</Section>}
    illustration={<Section tabs={…} value={tab} onChange={setTab} />}
    output={<Section title="Output">…</Section>} />
</Workspace>`}
      >
        <Variants>
          <Button variant="primary" href="#workspace">
            Open full screen (stacked)
          </Button>
          <Button href="#workspace-columns">Open full screen (side by side)</Button>
        </Variants>
        <div className="h-[28rem] overflow-hidden rounded-sm border border-border">
          <SectionLayout
            input={
              <Section title="Input">
                <p className="m-0 p-3 text-sm">Input form</p>
              </Section>
            }
            illustration={
              <Section title="Illustration">
                <p className="m-0 p-3 text-sm">3D / 2D viewer</p>
              </Section>
            }
            output={
              <Section title="Output">
                <p className="m-0 p-3 text-sm">Results</p>
              </Section>
            }
          />
        </div>
      </DemoSection>

      <DemoSection
        id="section"
        title="Section"
        description="Panel frame for a workspace section: one title or several tabs, actions at the right of the bar, scrolling body. footer stays visible under the body (Calculate / Restart) without covering fields."
        code={`<Section title="Output" actions={<IconButton aria-label="Export">…</IconButton>}>…</Section>
<Section value={tab} onChange={setTab} tabs={[{ value: '3d', label: '3D', content: <Viewer /> }]} />
<Section title="Input" footerAlign="between"
  footer={<><Button>Restart</Button><Button variant="primary">Calculate</Button></>}>…</Section>`}
      >
        <DemoGrid>
          <div className="h-48 border border-border">
            <Section title="Output" actions={<Button size="small" variant="text">Export</Button>}>
              <p className="m-0 p-3 text-sm">Single-title section.</p>
            </Section>
          </div>
          <div className="h-48 border border-border">
            <Section
              value={tab}
              onChange={setTab}
              tabs={[
                { value: '3d', label: '3D Viewer', content: <p className="m-0 p-3 text-sm">3D content</p> },
                { value: '2d', label: '2D Drawing', content: <p className="m-0 p-3 text-sm">2D content</p> },
              ]}
            />
          </div>
          <div className="h-48 border border-border">
            <Section
              title="Input"
              footerAlign="between"
              footer={
                <>
                  <Button onClick={() => notify.info('Inputs restored')}>Restart</Button>
                  <Button variant="primary" onClick={() => notify.success('Calculated')}>
                    Calculate
                  </Button>
                </>
              }
            >
              <div className="flex flex-col gap-3 p-3">
                {['Wall length', 'Wall height', 'Sheathing thickness', 'Nail spacing'].map((label, i) => (
                  <FormField key={label} label={label} htmlFor={`footer-demo-${i}`}>
                    <TextInput />
                  </FormField>
                ))}
              </div>
            </Section>
          </div>
        </DemoGrid>
      </DemoSection>

      <DemoSection
        id="visualization"
        title="VisualizationStage and ImageViewer"
        description="Illustration body: viewer fills the pane, controls float top-right and a note sits bottom-left (below the viewer on mobile). ImageViewer: wheel zooms at the cursor, drag pans, double-click or Reset restores."
        code={`<VisualizationStage loading={busy} note="* Not to scale" controls={<ViewControls>…</ViewControls>}>
  <ImageViewer ref={viewer} src={drawingUrl} alt="Connection drawing" />
</VisualizationStage>`}
      >
        <Variants>
          <Switch label="Loading" checked={loading} onChange={setLoading} />
          <Switch label="Empty" checked={empty} onChange={setEmpty} />
        </Variants>
        <div className="h-96 overflow-hidden rounded-sm border border-border">
          <VisualizationStage
            loading={loading}
            note="* Fasteners are not drawn to scale."
            empty={empty ? <EmptyState title="Nothing to draw yet">Enter the member sizes first.</EmptyState> : undefined}
            controls={
              <ViewControls>
                <ResetViewButton onClick={() => viewer.current?.reset()} />
                <ViewControlsGroup title="Object visibility">
                  <Checkbox label="Side member" defaultChecked />
                  <Checkbox label="Main member" defaultChecked />
                  <Checkbox label="Fasteners" />
                </ViewControlsGroup>
              </ViewControls>
            }
          >
            <ImageViewer ref={viewer} src="/images/sample-drawing.svg" alt="Connection drawing" />
          </VisualizationStage>
        </div>
      </DemoSection>

      <DemoSection
        id="drop-overlay"
        title="DropOverlay"
        description="Shown over a section while a file is dragged onto it (e.g. load a saved project JSON). Drag any file from your desktop onto the box."
        code={`{dragging && <DropOverlay>Drop project file</DropOverlay>}`}
      >
        <div
          className="relative flex h-40 items-center justify-center rounded-sm border border-dashed border-border-strong text-sm text-text-muted"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={onDrop}
        >
          {files.length ? `Loaded: ${files.join(', ')}` : 'Drag a file here'}
          {dragging && <DropOverlay>Drop project file</DropOverlay>}
        </div>
      </DemoSection>
    </DemoPage>
  );
}
