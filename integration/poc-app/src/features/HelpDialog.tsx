import {
  Box,
  Chip,
  DataTable,
  Dialog,
  DialogBody,
  DialogHeader,
  Divider,
  FormField,
  HelpPopover,
  InfoTip,
  Link,
  MathSub,
  MathVar,
  ReleaseNotes,
  Switch,
  Tab,
  TabPanel,
  Tabs,
  TextInput,
  compareVersions,
  decimalsOf,
  defaultReleaseNotesLabels,
  formatDisplayNumber,
  formatFraction,
  formatNumber,
  isPartialNumber,
  parseNumber,
  sortReleases,
  stepNumber,
} from '@platform/ui';
import { useState } from 'react';
import { RELEASES } from '../lib/data';

type HelpTab = 'guide' | 'formulas' | 'numbers' | 'releases';

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<HelpTab>('guide');
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogHeader onClose={onClose}>Help</DialogHeader>
      <DialogBody>
        <Tabs id="help" value={tab} onChange={setTab} aria-label="Help topics">
          <Tab value="guide" label="Guide" />
          <Tab value="formulas" label="Formulas" />
          <Tab value="numbers" label="Number input" />
          <Tab value="releases" label="All releases" />
        </Tabs>
        <TabPanel tabsId="help" value="guide" current={tab}>
          <Guide />
        </TabPanel>
        <TabPanel tabsId="help" value="formulas" current={tab}>
          <Formulas />
        </TabPanel>
        <TabPanel tabsId="help" value="numbers" current={tab} keepMounted>
          <NumberPlayground />
        </TabPanel>
        <TabPanel tabsId="help" value="releases" current={tab}>
          <AllReleases />
        </TabPanel>
      </DialogBody>
    </Dialog>
  );
}

function Guide() {
  return (
    <Box className="flex flex-col gap-3 pt-3 text-sm">
      <p className="m-0">
        Fill in the inputs, then press Calculate. Fields marked with <Chip size="small" label="*" /> are required.
        <InfoTip title="Why are some fields required?">
          <p>The capacity depends on every member and on the fastener pattern.</p>
          <p>
            See the <Link href="#formulas">formulas</Link>.
          </p>
        </InfoTip>
      </p>
      <Divider />
      <p className="m-0">
        Open several calculations with the + button. A dot on a tab means it has changes.
        <HelpPopover label="About tabs" content="Closing a changed calculation asks first." />
      </p>
    </Box>
  );
}

function Formulas() {
  return (
    <Box className="flex flex-col gap-3 pt-3">
      <p className="m-0 text-sm">
        Adjusted capacity <MathVar>Z</MathVar>
        <MathSub>adj</MathSub> of one fastener:
      </p>
      <math display="block">
        <msub>
          <mi>Z</mi>
          <mi>adj</mi>
        </msub>
        <mo>=</mo>
        <mi>Z</mi>
        <mo>·</mo>
        <msub>
          <mi>C</mi>
          <mi>D</mi>
        </msub>
        <mo>·</mo>
        <msub>
          <mi>C</mi>
          <mi>M</mi>
        </msub>
        <mo>·</mo>
        <msub>
          <mi>C</mi>
          <mi>g</mi>
        </msub>
      </math>
      <math display="block">
        <mi>ratio</mi>
        <mo>=</mo>
        <mfrac>
          <mi>demand</mi>
          <mrow>
            <mi>n</mi>
            <mo>·</mo>
            <msub>
              <mi>Z</mi>
              <mi>adj</mi>
            </msub>
          </mrow>
        </mfrac>
      </math>
    </Box>
  );
}

/** Shows what the kit's number helpers make of a typed text, as a support person would check it. */
function NumberPlayground() {
  const [text, setText] = useState('1,4375');
  const parsed = parseNumber(text);
  const value = typeof parsed === 'number' ? parsed : null;
  const rows: [string, string][] = [
    ['Partial while typing', String(isPartialNumber(text))],
    ['parseNumber', parsed === undefined ? 'incomplete' : String(parsed)],
    ['formatNumber (3)', formatNumber(value, 3)],
    ['formatDisplayNumber de-DE', formatDisplayNumber(value, { precision: 2, locale: 'de-DE' })],
    ['formatFraction', formatFraction(value, { unit: '"' })],
    ['decimalsOf', value === null ? '' : String(decimalsOf(value))],
    ['stepNumber +0.1', value === null ? '' : String(stepNumber(value, 0.1))],
  ];
  return (
    <Box className="flex flex-col gap-3 pt-3">
      <FormField label="Text to check" htmlFor="number-text">
        <TextInput value={text} onChange={(e) => setText(e.target.value)} />
      </FormField>
      <DataTable aria-label="Number helper results">
        <DataTable.Head>
          <DataTable.Row>
            <DataTable.Cell>Helper</DataTable.Cell>
            <DataTable.Cell align="right">Result</DataTable.Cell>
          </DataTable.Row>
        </DataTable.Head>
        <DataTable.Body>
          {rows.map(([name, result]) => (
            <DataTable.Row key={name}>
              <DataTable.Cell>{name}</DataTable.Cell>
              <DataTable.Cell align="right">{result || '—'}</DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable.Body>
      </DataTable>
    </Box>
  );
}

function AllReleases() {
  const [vietnamese, setVietnamese] = useState(false);
  const newest = sortReleases(RELEASES)[0]!;
  // Pre-releases sort before their final release: 3.0.0-rc.1 < 3.0.0.
  const ordered = compareVersions('3.0.0-rc.1', '3.0.0') < 0;
  return (
    <Box className="flex flex-col gap-3 pt-3">
      <Switch label="Tiếng Việt" checked={vietnamese} onChange={setVietnamese} />
      <p className="m-0 text-xs text-text-muted">
        Latest: {newest.version} {ordered ? '' : '(version order is wrong)'}
      </p>
      <ReleaseNotes
        releases={RELEASES}
        lastSeenVersion="3.0.0"
        defaultExpanded="all"
        headingLevel="h3"
        locale={vietnamese ? 'vi-VN' : 'en-US'}
        labels={
          vietnamese
            ? { released: (date) => `Phát hành ngày ${date}`, categories: { feature: 'Tính năng mới', fix: 'Sửa lỗi' } }
            : { newBadge: defaultReleaseNotesLabels.newBadge }
        }
      />
    </Box>
  );
}
