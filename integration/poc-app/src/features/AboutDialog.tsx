import { CloseButton, DescriptionList, Dialog, DialogBody, DialogFooter, DialogHeader, Button, formatReleaseDate, parseReleaseDate } from '@platform/ui';
import { APP_VERSION, RELEASES } from '../lib/data';

export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const released = parseReleaseDate(RELEASES[0]!.date);
  return (
    <Dialog open={open} onClose={onClose} placement="center" maxWidth="xs" fullWidth>
      <DialogHeader>
        <span className="flex items-center justify-between gap-2">
          About
          <CloseButton onClick={onClose} />
        </span>
      </DialogHeader>
      <DialogBody>
        <DescriptionList
          items={[
            { id: 'version', label: 'Version', value: APP_VERSION },
            { id: 'released', label: 'Released', value: released ? formatReleaseDate(released) : '—' },
            { id: 'code', label: 'Design code', value: 'NDS 2024 (simulated)' },
            { id: 'kit', label: 'UI kit', value: '@platform/ui' },
          ]}
        />
      </DialogBody>
      <DialogFooter>
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </Dialog>
  );
}
