# Workspace layout

The standard layout of a calculator app: **Input** on the left, **Illustration** (3D, 2D drawing, image) and **Output** on the right. Apps without a drawing or without a separate result pane leave that section out.

- [Example](#example)
- [Choosing the sections](#choosing-the-sections)
- [Responsive behavior](#responsive-behavior)
- [SectionLayout](#sectionlayout)
- [Section](#section)
- [WorkspaceTabs](#workspacetabs)
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

## Choosing the sections

`input` is required; `illustration` and `output` are optional. Pass only the sections the app has, and the layout adapts on every screen size:

| Sections given | Desktop and tablet | Mobile tabs |
| --- | --- | --- |
| `input`, `illustration`, `output` | Input \| (Illustration / Output) | Input, 3D, Output |
| `input`, `output` | Input \| Output | Input, Output |
| `input`, `illustration` | Input \| Illustration | Input, 3D |
| `input` | Input fills the workspace | Input |

```tsx
// A calculator without a drawing
<SectionLayout
  layoutId="my-calc"
  input={<Section title="Input"><InputForm /></Section>}
  output={<Section title="Output"><Results /></Section>}
/>
```

With one section on the right, Input and that section start half and half (`defaultInputSize` changes it).

A section counts as left out when its prop is `undefined`, `null` or `false`, so it can depend on app state (`illustration={hasDrawing && <DrawingSection />}`). The saved Input width (`layoutId`) is shared by all variants. With one section on the right, `secondarySplit` has no effect. A custom `mobileTabs` list replaces the default tabs as before.

## Responsive behavior

| Screen | Behavior |
| --- | --- |
| Desktop ≥ 992px | Input takes 36% with Illustration and Output, 50% with only one of them (`defaultInputSize` overrides); Illustration and Output split 50/50, arranged by `secondarySplit`. Drag the 5px dividers to resize. Dragging Input below 250px collapses it into a vertical rail; its "Expand Input" button opens it again |
| Tablet 768–991px | Same as desktop, but Illustration and Output are always stacked |
| Mobile < 768px | One section at a time, switched by tabs. Tabs with `keepMounted` keep their state and running queries while hidden |

With `layoutId`, panel sizes are saved in localStorage. If the browser blocks storage (sandboxed iframes, strict privacy settings), the layout still works; sizes are just not remembered.

## SectionLayout

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `input` | `ReactNode` | | Input section (usually a `<Section>`) |
| `illustration`, `output` | `ReactNode` | | Optional sections. Leave one out and the other takes the right side; see [Choosing the sections](#choosing-the-sections) |
| `secondarySplit` | `'rows' \| 'columns'` | `'rows'` | How Illustration and Output share the right side on desktop |
| `layoutId` | `string` | | localStorage key prefix for panel sizes |
| `defaultInputSize` | `number` | `36` with Illustration and Output, `50` with one | Starting Input width in percent (desktop, tablet). A size saved under `layoutId` wins |
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

<Section title="Input" footerAlign="between" footer={<>
  <Button onClick={restart}>Restart</Button>
  <Button variant="primary" onClick={calculate}>Calculate</Button>
</>}>…</Section>
```

| Prop | Type | Description |
| --- | --- | --- |
| `title` + `children` | `ReactNode` | Single-title section |
| `tabs`, `value`, `onChange` | `SectionTab<V>[]`, `V`, `(value: V) => void` | Tabbed section. A tab: `{ value, label, content, disabled?, keepMounted?, className? }` |
| `actions` | `ReactNode` | Icons or buttons at the right end of the header bar |
| `footer` | `ReactNode` | Bar under the scrolling body that stays visible, e.g. Calculate / Restart. Put the primary button last |
| `footerAlign` | `'end' \| 'between'` | `'end'` (default) right-aligns the buttons; `'between'` puts the first one at the left |
| `className`, `bodyClassName` | `string` | |

The footer sits outside the scroll area, so it never covers the last field or the focused control, and no extra padding is needed.

A tab's `className` can draw attention to it, e.g. `"animate-jump"` when a new result arrives.

## WorkspaceTabs

Several workspaces open at once, for example one per calculation, switched by a tab bar above them like browser tabs. The component is controlled: the app owns the list of tabs and every calculation's data, and the kit renders the bar and the selected workspace.

```tsx
const [calcs, setCalcs] = useState<WorkspaceTab<string>[]>([{ value: 'c1', label: 'Calculation 1' }]);
const [active, setActive] = useState('c1');

<Workspace>
  <WorkspaceTabs
    tabs={calcs}
    value={active}
    onChange={setActive}
    onAdd={() => { const id = createId(); setCalcs((l) => [...l, { value: id, label: 'New calculation' }]); setActive(id); }}
    onClose={(id, next) => {
      // Ask first when the calculation has unsaved work (ConfirmDialog), then:
      setCalcs((l) => l.filter((c) => c.value !== id));
      if (next !== null) setActive(next);
    }}
    labels={{ add: 'New calculation' }}
    empty={<EmptyState title="No calculation open" />}
  >
    {(id) => <SectionLayout key={id} layoutId="calc" input={<InputFor id={id} />} output={<OutputFor id={id} />} />}
  </WorkspaceTabs>
</Workspace>
```

- **Mounting.** Only the selected workspace is mounted, so hidden 3D views do not use memory. Keep each calculation's inputs in app state (keyed by tab value), or set `keepMounted` on a tab to keep its content alive. Give the content a `key` so React does not reuse one workspace's state for another.
- **Closing.** There are three ways to close a tab, one for each kind of user:
  - **Mouse:** the × on the tab (a 24px target), or a middle click.
  - **Keyboard:** <kbd>Delete</kbd> or <kbd>Backspace</kbd> on the focused tab; the tab announces this through `aria-keyshortcuts`. When the app removes the tab, focus moves to the newly selected tab. If the app keeps it (the user cancelled a confirmation), focus is left alone.
  - **Touch and screen readers:** a "Close {name}" entry for the selected tab in the menu after the tabs. On touch screens that menu is always shown, labelled "Tabs" when every tab fits.

  The × is not a real button, because a button inside a tab is invalid. It is hidden from screen readers, which use the menu entry instead. `onClose(value, next)` gets the tab to select: the closed tab's right neighbour, else its left one, `null` when none is left. If the closed tab was not selected, `next` is the current tab.
- **Unsaved work.** `dirty: true` shows a dot after the name and adds "(Unsaved changes)" to the tab's accessible name. The kit never asks for confirmation itself; do that in `onClose`.
- **Overflow.** The bar shows as many tabs as fit its width, at any screen size. The rest go to an "N more" menu after the tabs. The selected tab is always shown: if it would not fit, it takes the place of as many of the last fitting tabs as it needs. A selected tab wider than the whole bar shortens its name with "…". Picking a workspace from the menu selects it and brings it into the bar. On a phone that usually means the selected tab, "N more" and "+". The bar measures again when its width changes or when tab widths change (for example when the web font finishes loading).

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `tabs` | `WorkspaceTab<V>[]` | | `{ value, label, dirty?, disabled?, closable?, keepMounted? }`. `label` is plain text (it is also used in the menu and its "Close" entry) |
| `value`, `onChange` | `V`, `(value: V) => void` | | Selected tab |
| `onAdd` | `() => void` | | Shows a "+" button after the tabs. The app adds the tab and selects it |
| `onClose` | `(value: V, next: V \| null) => void` | | Makes tabs closable (×, <kbd>Delete</kbd>, menu entry). `closable: false` on a tab turns all three off for it |
| `actions` | `ReactNode` | | Buttons at the right end of the bar |
| `empty` | `ReactNode` | | Shown in place of the content when `tabs` is empty |
| `labels` | `Partial<WorkspaceTabsLabels>` | `defaultWorkspaceTabsLabels` | `list` ("Open workspaces"), `more(count)` ("{count} more"), `menu` ("Tabs", the menu button on touch screens when every tab fits), `add` ("New tab"), `close(label)` ("Close {label}", the menu entry and the ×'s tooltip), `unsaved` ("Unsaved changes") |
| `className` | `string` | | Merged on the root |
| `children` | `(value: V) => ReactNode` | | Renders a tab's content. Called for the selected tab and for `keepMounted` tabs |

Types: `WorkspaceTabsProps<V>`, `WorkspaceTab<V>`, `WorkspaceTabsLabels`.

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
| `ViewControlsGroup` | Titled group of controls inside the panel; the title is the group's accessible name |
| `ResetViewButton` | Button with a target icon and a tooltip. Props: `onClick` (called with no arguments), `label` (default `'Reset view'`, also the accessible name) |
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
