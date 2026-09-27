import { useState } from 'react';

import {
  Button,
  compareVersions,
  defaultReleaseNotesLabels,
  formatReleaseDate,
  parseReleaseDate,
  ReleaseNotes,
  ReleaseNotesDialog,
  Select,
  sortReleases,
  useReleaseNotesSeen,
} from '../../index';
import { DemoPage, DemoSection, Variants } from '../layout';
import { sampleIntro, sampleReleases } from '../releaseNotesData';

const STORAGE_KEY = 'showcase:release-notes-seen';
const CURRENT_VERSION = sortReleases(sampleReleases)[0]!.version;

/** What an app shell does: open "What's new" once after an update, and from the Help menu. */
function AppShellDemo() {
  const seen = useReleaseNotesSeen({ currentVersion: CURRENT_VERSION, storageKey: STORAGE_KEY });
  const [manual, setManual] = useState(false);
  const open = manual || seen.shouldOpen;
  return (
    <>
      <p className="m-0 text-xs text-text-muted">
        App version {CURRENT_VERSION} · last seen: {seen.lastSeenVersion ?? 'never'} · opens automatically: {String(seen.shouldOpen)}
      </p>
      <Variants>
        <Button variant="primary" onClick={() => setManual(true)}>
          Help → Release notes
        </Button>
      </Variants>
      <ReleaseNotesDialog
        open={open}
        onClose={() => {
          seen.markSeen();
          setManual(false);
        }}
        appName="DC"
        appTitle="Demo Calculator"
        intro={sampleIntro}
        releases={sampleReleases}
        lastSeenVersion={seen.lastSeenVersion}
      />
    </>
  );
}

const locales = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'vi-VN', label: 'Tiếng Việt' },
  { value: 'de-DE', label: 'Deutsch' },
];

const viLabels = {
  released: (date: string) => `Phát hành ngày ${date}`,
  categories: { ...defaultReleaseNotesLabels.categories, feature: 'Tính năng mới', improvement: 'Cải tiến', maintenance: 'Bảo trì', security: 'Bảo mật' },
  newBadge: 'Mới',
  expandAll: 'Mở tất cả',
  collapseAll: 'Thu gọn tất cả',
};

export function Patterns() {
  const [shellKey, setShellKey] = useState(0);
  const [locale, setLocale] = useState('en-US');

  const simulate = (lastSeen: string | null) => {
    try {
      if (lastSeen) localStorage.setItem(STORAGE_KEY, lastSeen);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage blocked: the demo just shows the first-visit behaviour
    }
    setShellKey((k) => k + 1);
  };

  return (
    <DemoPage title="Patterns" description="Ready-made pieces every app needs, driven by the app's own data.">
      <DemoSection
        id="release-notes"
        title="Release notes"
        description="&quot;What's new&quot; dialog: releases newest first by version (2.10 after 2.9), latest open, categories as badges, optional headings (regions) with bullets, links in items. useReleaseNotesSeen opens it once after an update (not on a first visit) and marks newer releases &quot;New&quot;. ReleaseNotes alone fits a help page. All text can be translated."
        code={`const seen = useReleaseNotesSeen({ currentVersion: APP_VERSION, storageKey: 'demo-calc:release-notes' });
<ReleaseNotesDialog
  open={seen.shouldOpen || helpOpen}
  onClose={() => { seen.markSeen(); setHelpOpen(false); }}
  appName="DC" appTitle="Demo Calculator" intro="…"
  releases={releases}                     // from the app's release-notes JSON
  lastSeenVersion={seen.lastSeenVersion} />

// releases: [{ version: '2.5.0', date: '2026-09-03', sections: [
//   { category: 'feature', groups: [{ title: 'EU', items: ['Added …', <>… <Link>Explore now</Link></>] }] },
//   { category: 'maintenance', groups: [{ items: ['General fixes.'] }] } ] }]`}
      >
        <h3 className="m-0 text-sm font-bold">Dialog in an app shell</h3>
        <Variants>
          <Button size="small" onClick={() => simulate('2.3.0')}>
            Simulate: user last saw 2.3.0
          </Button>
          <Button size="small" onClick={() => simulate(null)}>
            Simulate: first visit
          </Button>
        </Variants>
        <AppShellDemo key={shellKey} />

        <h3 className="m-0 text-sm font-bold">Inline on a help page</h3>
        <div className="w-48">
          <Select aria-label="Date language" value={locale} options={locales} onChange={setLocale} />
        </div>
        <ReleaseNotes
          releases={sampleReleases}
          locale={locale}
          labels={locale === 'vi-VN' ? viLabels : undefined}
          defaultExpanded="none"
          headingLevel="h4"
        />
        <p className="m-0 text-xs text-text-muted">
          Helpers: compareVersions(&apos;2.10.0&apos;, &apos;2.9.0&apos;) = {compareVersions('2.10.0', '2.9.0')}; formatReleaseDate(&apos;2026-09-03&apos;) ={' '}
          {formatReleaseDate('2026-09-03')} (parsed as a local date: day {parseReleaseDate('2026-09-03')?.getDate()}).
        </p>
      </DemoSection>
    </DemoPage>
  );
}
