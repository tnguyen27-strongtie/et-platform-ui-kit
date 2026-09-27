# Workspace layout

The standard layout of a calculator app: **Input** on the left, **Illustration** (3D, 2D drawing, image) and **Output** on the right.

- [Example](#example)
- [Responsive behavior](#responsive-behavior)
- [SectionLayout](#sectionlayout)
- [Section](#section)
- [Illustration pane](#illustration-pane)
- [ImageViewer](#imageviewer)

## Example

```tsx
<Workspace>
  <SectionLayout
    layoutId="demo-calc"          // remember panel sizes in localStorage; omit to disable
    secondarySplit="rows"         // rows = stacked, columns = side by side (a user setting)
    labels={{ input: 'Input', illustration: '3D', output: 'Output' }}
    input={
      <Section title="Input" actions={<ExpandCollapseAllButton group={group} />}>
        <InputForm />
      </Section>
    }
    illustration={
      <Section value={tab} onChange={setTab} tabs={[
        { value: '3d', label: '3D Viewer', content: <ThreeDView /> },
        { value: '2d', label: '2D Drawing', content: <DrawingView /> },
      ]} />
    }
    output={<Section title="Output"><ResultsTable /></Section>}
    mobileTabs={[                  // mobile: one flat tab bar with section bodies
      { value: 'input', label: 'Input', content: <InputForm />, keepMounted: true },
      { value: '3d', label: '3D', content: <ThreeDView /> },
      { value: 'output', label: 'Output', content: <ResultsTable />, keepMounted: true },
    ]}
  />
</Workspace>
```

## Responsive behavior

| Screen | Behavior |
| --- | --- |
| Desktop ≥ 992px | Input takes 36%; Illustration and Output split 50/50, arranged by `secondarySplit`. Drag the 5px dividers to resize. Dragging Input below 250px collapses it into a vertical rail; its "Expand Input" button opens it again |
| Tablet 768–991px | Same as desktop, but Illustration and Output are always stacked |
| Mobile < 768px | One section at a time, switched by tabs. Tabs with `keepMounted` keep their state and running queries while hidden |

With `layoutId`, panel sizes are saved in localStorage. If the browser blocks storage (sandboxed iframes, strict privacy settings), the layout still works; sizes are just not remembered.

## SectionLayout

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `input`, `illustration`, `output` | `ReactNode` | | Section contents (usually `<Section>`s) |
| `secondarySplit` | `'rows' \| 'columns'` | `'rows'` | How Illustration and Output share the right side on desktop |
| `layoutId` | `string` | | localStorage key prefix for panel sizes |
| `labels` | `Partial<Record<'input' \| 'illustration' \| 'output', ReactNode>>` | `Input`, `3D`, `Output` | Collapsed rail and mobile tab labels |
| `mobileTabs` | `{ value, label, content, disabled?, keepMounted? }[]` | Input, 3D, Output | Mobile tab bar. Pass section bodies here to avoid a second header |
| `mobileActions` | `ReactNode` | | Buttons at the right end of the mobile tab bar |

`Workspace` fills the viewport below the top nav (`100dvh` minus `--top-nav-height`).

## Section

A panel with a gray tab bar on top and a scrollable body. A single-title section renders its title as the only tab, so every section header looks the same.

```tsx
<Section title="Output" actions={<IconButton aria-label="Export">…</IconButton>}>…</Section>

<Section value={tab} onChange={setTab} tabs={[
  { value: 'summary', label: 'Summary', content: <Summary /> },
  { value: 'details', label: 'Details', content: <Details />, keepMounted: true },
]} />
```

| Prop | Type | Description |
| --- | --- | --- |
| `title` + `children` | `ReactNode` | Single-title section |
| `tabs`, `value`, `onChange` | `SectionTab<V>[]`, `V`, `(value: V) => void` | Tabbed section. A tab: `{ value, label, content, disabled?, keepMounted?, className? }` |
| `actions` | `ReactNode` | Icons or buttons at the right end of the header bar |
| `className`, `bodyClassName` | `string` | |

A tab's `className` can draw attention to it, e.g. `"animate-jump"` when a new result arrives.

## Illustration pane

```tsx
const imageRef = useRef<ImageViewerHandle>(null);

<VisualizationStage
  loading={isRendering}
  note="* Fasteners are not drawn to scale."
  controls={
    <ViewControls>
      <ResetViewButton onClick={() => imageRef.current?.reset()} />
      <ViewControlsGroup title="Object visibility">
        <Checkbox label="Side member" defaultChecked />
      </ViewControlsGroup>
    </ViewControls>
  }
>
  <ImageViewer ref={imageRef} src={drawingUrl} alt="Connection drawing" />
</VisualizationStage>
```

| Component | Description |
| --- | --- |
| `VisualizationStage` | Hosts the viewer. Tablet/desktop: controls float top-right, `note` bottom-left. Mobile: controls and note flow below the viewer. Props: `children`, `controls`, `note`, `loading`, `loadingText`, `empty` (shown instead of the viewer when there is nothing to draw), `className` |
| `ViewControls` | Semi-transparent white control panel |
| `ViewControlsGroup` | Titled group of controls inside the panel |
| `ResetViewButton` | Button with a target icon and a tooltip. Props: `onClick`, `label` (default `'Reset view'`) |
| `DropOverlay` | Dashed overlay shown while a file is dragged over a section (e.g. dropping a saved input file) |

The 3D viewer is app code (a web component, a Three.js canvas…). Put it in `VisualizationStage` as `children`.

## ImageViewer

Pan and zoom for 2D drawings and illustrations, with no extra dependency.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src`, `alt` | `string` | | Image. A new `src` resets the view and shows the loading indicator until it loads |
| `minScale` | `number` | `1` | Smallest zoom. `1` fits the viewer; below `1` the image can shrink further |
| `maxScale` | `number` | `8` | Largest zoom |
| `showZoomButtons` | `boolean` | `true` | +/− buttons at the bottom right |

| Input | Effect |
| --- | --- |
| Mouse wheel, trackpad pinch | Zoom around the pointer. The page does not scroll |
| Two-finger pinch (touch) | Zoom around the fingers |
| Drag | Pan (when zoomed in) |
| Double-click | Reset |
| `ref.current.reset()` | Reset from the app, e.g. from `ResetViewButton` |
