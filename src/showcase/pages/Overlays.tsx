import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useState } from 'react';

import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogBody,
  type DialogCloseReason,
  DialogFooter,
  DialogHeader,
  type DialogProps,
  FormField,
  HelpPopover,
  IconButton,
  InfoTip,
  notify,
  TextInput,
  Tooltip,
} from '../../index';
import { DemoPage, DemoSection, Labeled, Variants } from '../layout';

type DialogDemo = { placement: 'top' | 'center'; dismissible: NonNullable<DialogProps['dismissible']> };

export function Overlays() {
  const [dialog, setDialog] = useState<DialogDemo | null>(null);
  const [lastClose, setLastClose] = useState<string>('—');
  const [confirm, setConfirm] = useState<'save' | 'reset' | null>(null);
  const [saving, setSaving] = useState(false);

  const closeDialog = (reason: DialogCloseReason | 'button') => {
    setLastClose(reason);
    setDialog(null);
  };

  return (
    <DemoPage title="Overlays" description="Content shown above the page: hints, explanations, dialogs and toasts.">
      <DemoSection
        id="tooltip"
        title="Tooltip (hover, short)"
        description="One-line hint on hover or keyboard focus (300ms delay, stays while hovered, Escape closes). Text only; anything longer or with links belongs in InfoTip."
        code={`<Tooltip title="Reset view">
  <IconButton aria-label="Reset view"><RestartAltIcon /></IconButton>
</Tooltip>`}
      >
        <Variants>
          <Labeled label="icon button">
            <Tooltip title="Reset view">
              <IconButton aria-label="Reset view">
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
          </Labeled>
          <Labeled label="disabled button">
            <Tooltip title="Fill in all required inputs first">
              <Button variant="primary" disabled>
                Export
              </Button>
            </Tooltip>
          </Labeled>
          {(['top', 'right', 'bottom', 'left'] as const).map((placement) => (
            <Labeled key={placement} label={`placement ${placement}`}>
              <Tooltip title={`Tooltip on ${placement}`} placement={placement}>
                <Button size="small">{placement}</Button>
              </Tooltip>
            </Labeled>
          ))}
        </Variants>
      </DemoSection>

      <DemoSection
        id="infotip"
        title="InfoTip (click, long)"
        description="Explanations with structure or links. Opens on click as a small dialog; focus moves inside; Escape, click outside or X closes. HelpPopover (and FormField help) is the same with the ? trigger."
        code={`<InfoTip title="How capacity is calculated">
  <p>…</p><ul><li>…</li></ul>
</InfoTip>
<InfoTip trigger="info" label="About C_D">…</InfoTip>
<InfoTip trigger={<Button variant="text">Why?</Button>}>…</InfoTip>`}
      >
        <Variants>
          <Labeled label="trigger 'help' + title">
            <span className="text-sm">
              Capacity
              <InfoTip title="How capacity is calculated">
                <p>Capacity is the lowest of the fastener, main member and side member limits, adjusted for load duration and wet service.</p>
                <ul>
                  <li>Fastener: withdrawal and lateral design values</li>
                  <li>Main and side member: bearing and net section</li>
                </ul>
                <p>
                  See the <a href="https://example.com/guide">design guide</a> for the full method.
                </p>
              </InfoTip>
            </span>
          </Labeled>
          <Labeled label="trigger 'info', no title">
            <InfoTip trigger="info" label="About load duration" placement="right">
              Load duration factor C<sub>D</sub> adjusts wood strength for how long the load is applied.
            </InfoTip>
          </Labeled>
          <Labeled label="custom trigger">
            <InfoTip trigger={<Button size="small" variant="text">Why is this failing?</Button>} title="Why it fails">
              <p>The side member is thinner than the minimum penetration for this screw.</p>
            </InfoTip>
          </Labeled>
          <Labeled label="HelpPopover (alias)">
            <span className="text-sm">
              Wet service
              <HelpPopover content="Use when the moisture content will exceed 19% in service." />
            </span>
          </Labeled>
        </Variants>
      </DemoSection>

      <DemoSection
        id="dialog"
        title="Dialog"
        description="Modal task: focus stays inside, Escape closes, focus returns to the opener. Forms use dismissible=&quot;escape&quot; so a stray click outside does not lose input; &quot;none&quot; while saving."
        code={`<Dialog open={open} onClose={(reason) => close()} dismissible="escape" placement="center">
  <DialogHeader onClose={close}>Save as template</DialogHeader>
  <DialogBody>…</DialogBody>
  <DialogFooter><Button onClick={close}>Cancel</Button><Button variant="primary">Save</Button></DialogFooter>
</Dialog>`}
      >
        <Variants>
          <Button onClick={() => setDialog({ placement: 'top', dismissible: 'any' })}>Top, dismiss any way</Button>
          <Button onClick={() => setDialog({ placement: 'center', dismissible: 'escape' })}>Center, Escape only</Button>
          <Button onClick={() => setDialog({ placement: 'center', dismissible: 'none' })}>Center, buttons only</Button>
        </Variants>
        <p className="m-0 text-xs text-text-muted">Last close reason: {lastClose}</p>
        <Dialog open={!!dialog} onClose={closeDialog} placement={dialog?.placement} dismissible={dialog?.dismissible}>
          <DialogHeader onClose={() => closeDialog('button')}>Save as template</DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-3">
              <p className="m-0 text-sm">
                placement=&quot;{dialog?.placement}&quot;, dismissible=&quot;{dialog?.dismissible}&quot;
              </p>
              <FormField label="Template name" htmlFor="tpl">
                <TextInput placeholder="My connection" />
              </FormField>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => closeDialog('button')}>Cancel</Button>
            <Button variant="primary" onClick={() => closeDialog('button')}>
              Save
            </Button>
          </DialogFooter>
        </Dialog>
      </DemoSection>

      <DemoSection
        id="confirm-dialog"
        title="ConfirmDialog"
        description="Ask before losing data. destructive: red button and Cancel focused first. loading: cannot close or confirm twice."
        code={`<ConfirmDialog open={open} title="Reset all inputs?" destructive confirmLabel="Reset"
  onCancel={close} onConfirm={reset}>Every input returns to its default.</ConfirmDialog>`}
      >
        <Variants>
          <Button variant="primary" onClick={() => setConfirm('save')}>
            Save changes (with loading)
          </Button>
          <Button variant="danger" onClick={() => setConfirm('reset')}>
            Reset inputs (destructive)
          </Button>
        </Variants>
        <ConfirmDialog
          open={confirm === 'save'}
          title="Save changes?"
          confirmLabel="Save"
          loading={saving}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setSaving(true);
            setTimeout(() => {
              setSaving(false);
              setConfirm(null);
              notify.success('Saved');
            }, 1200);
          }}
        >
          The project file will be overwritten.
        </ConfirmDialog>
        <ConfirmDialog
          open={confirm === 'reset'}
          title="Reset all inputs?"
          destructive
          confirmLabel="Reset"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setConfirm(null);
            notify.success('Inputs reset', 'Undo');
          }}
        >
          Every input returns to its default value. This cannot be undone.
        </ConfirmDialog>
      </DemoSection>

      <DemoSection
        id="toast"
        title="Toast"
        description="Outcome of an action. Errors stay until dismissed; warnings 8s; others 5s; hover pauses. Validation errors belong next to the field, not in a toast."
        code={`notify.success('Saved', 'Undo');
notify.error('Export failed', 'Retry');
notify.dismiss();`}
      >
        <Variants>
          <Button onClick={() => notify.success('Calculation saved', 'Undo')}>Success</Button>
          <Button onClick={() => notify.info('Results updated for the new load')}>Info</Button>
          <Button onClick={() => notify.warning('Some fasteners are not drawn to scale')}>Warning</Button>
          <Button onClick={() => notify.error('Export failed', 'Retry')}>Error (stays)</Button>
          <Button variant="text" onClick={() => notify.dismiss()}>
            Dismiss all
          </Button>
        </Variants>
      </DemoSection>
    </DemoPage>
  );
}
