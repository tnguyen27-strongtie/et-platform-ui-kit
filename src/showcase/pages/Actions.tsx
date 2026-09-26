import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from 'react';

import { Button, CloseButton, DropdownMenu, IconButton, notify, Tooltip } from '../../index';
import { DemoPage, DemoSection, Labeled, Variants } from '../layout';

const variants = ['primary', 'primaryDark', 'secondary', 'default', 'tertiary', 'text', 'textDark', 'danger'] as const;

export function Actions() {
  const [loading, setLoading] = useState(false);
  return (
    <DemoPage title="Actions" description="Buttons and menus that start an action.">
      <DemoSection
        id="button"
        title="Button"
        description="One primary button per view (e.g. Calculate). danger for irreversible actions. Buttons never submit a form unless type=&quot;submit&quot;; loading blocks double clicks."
        code={`<Button variant="primary" loading={isSaving} onClick={save}>Save</Button>
<Button variant="danger" startIcon={<DeleteOutlineIcon />}>Delete</Button>
<Button type="submit">Submit</Button>`}
      >
        <h3 className="m-0 text-sm font-bold">Variants</h3>
        <Variants>
          {variants.map((v) => (
            <Labeled key={v} label={v}>
              <Button variant={v}>{v === 'default' ? 'Default' : 'Calculate'}</Button>
            </Labeled>
          ))}
          <Labeled label="fab">
            <Button variant="fab" aria-label="Add">
              <AddIcon />
            </Button>
          </Labeled>
        </Variants>
        <h3 className="m-0 text-sm font-bold">Disabled</h3>
        <Variants>
          {variants.map((v) => (
            <Button key={v} variant={v} disabled>
              {v}
            </Button>
          ))}
        </Variants>
        <h3 className="m-0 text-sm font-bold">Sizes, icons, loading</h3>
        <Variants>
          <Labeled label="small">
            <Button size="small" variant="primary">
              Small
            </Button>
          </Labeled>
          <Labeled label="medium (default)">
            <Button variant="primary">Medium</Button>
          </Labeled>
          <Labeled label="startIcon">
            <Button startIcon={<DownloadIcon />}>Export</Button>
          </Labeled>
          <Labeled label="danger + icon">
            <Button variant="danger" startIcon={<DeleteOutlineIcon />}>
              Delete
            </Button>
          </Labeled>
          <Labeled label="loading (click)">
            <Button
              variant="primary"
              loading={loading}
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 1500);
              }}
            >
              Calculate
            </Button>
          </Labeled>
        </Variants>
      </DemoSection>

      <DemoSection
        id="icon-button"
        title="IconButton and CloseButton"
        description="Icon-only buttons must have aria-label (checked by TypeScript). Pair with a Tooltip carrying the same text. CloseButton is the X used in dialogs and popovers."
        code={`<Tooltip title="Settings">
  <IconButton aria-label="Settings"><SettingsIcon /></IconButton>
</Tooltip>
<CloseButton onClick={close} />`}
      >
        <Variants>
          {[
            ['Settings', <SettingsIcon key="s" />],
            ['Edit', <EditIcon key="e" />],
            ['Duplicate', <ContentCopyIcon key="c" />],
          ].map(([label, icon]) => (
            <Tooltip key={label as string} title={label as string}>
              <IconButton aria-label={label as string}>{icon}</IconButton>
            </Tooltip>
          ))}
          <Tooltip title="Delete (disabled)">
            <IconButton aria-label="Delete" disabled>
              <DeleteOutlineIcon />
            </IconButton>
          </Tooltip>
          <Labeled label="CloseButton">
            <CloseButton onClick={() => notify.info('Closed')} />
          </Labeled>
        </Variants>
      </DemoSection>

      <DemoSection
        id="dropdown-menu"
        title="DropdownMenu"
        description="A button that opens a list of actions. Menus are 160–320px wide; long labels wrap. Keyboard: Enter opens, arrows move, Escape closes."
        code={`<DropdownMenu label="Export" items={[
  { id: 'pdf', label: 'PDF report', icon: <DownloadIcon />, onSelect: exportPdf },
  { id: 'sep', divider: true },
  { id: 'delete', label: 'Delete project', danger: true, onSelect: remove },
]} />`}
      >
        <Variants>
          <DropdownMenu
            label="Export"
            items={[
              { id: 'pdf', label: 'PDF report', icon: <DownloadIcon fontSize="small" />, onSelect: () => notify.info('Exporting PDF') },
              { id: 'csv', label: 'CSV table', onSelect: () => notify.info('Exporting CSV') },
              { id: 'dxf', label: 'DXF drawing (not available for this connection)', disabled: true, onSelect: () => undefined },
              { id: 'sep', divider: true },
              { id: 'delete', label: 'Delete project', danger: true, onSelect: () => notify.warning('Delete clicked') },
            ]}
          />
          <DropdownMenu
            label="Actions"
            variant="primary"
            items={[
              { id: 'long', label: 'Export the full calculation report with every load combination', onSelect: () => undefined },
              { id: 'short', label: 'Print', onSelect: () => undefined },
            ]}
          />
          <DropdownMenu label="Disabled" disabled items={[{ id: 'x', label: 'X', onSelect: () => undefined }]} />
        </Variants>
      </DemoSection>
    </DemoPage>
  );
}
