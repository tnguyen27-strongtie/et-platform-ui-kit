# Release notes

Every app needs a "What's new" dialog. The kit provides the UI and the version tracking; the app provides the data (usually a JSON file) and decides where to open it from.

- [Example](#example)
- [Data format](#data-format)
- [Components](#components)
- [useReleaseNotesSeen](#usereleasenotesseen)
- [Translation](#translation)
- [Helpers](#helpers)

## Example

```tsx
import { ReleaseNotesDialog, useReleaseNotesSeen } from '@platform/ui';
import releases from './release-notes.json';

const seen = useReleaseNotesSeen({ currentVersion: APP_VERSION, storageKey: 'demo-calc:release-notes' });

<ReleaseNotesDialog
  open={seen.shouldOpen || helpMenuOpen}
  onClose={() => { seen.markSeen(); setHelpMenuOpen(false); }}
  appName="DC"
  appTitle="Demo Calculator"
  intro="Demo Calculator checks timber connections for the USA, Canada and the EU."
  releases={releases}
  lastSeenVersion={seen.lastSeenVersion}
/>
```

The dialog opens once automatically after an update, and any time from the help menu.

## Data format

```ts
const releases: ReleaseNote[] = [
  {
    version: '2.5.0',
    date: '2026-09-03',                 // read as a local date
    summary: 'Optional highlight shown above the categories.',
    sections: [
      {
        category: 'feature',
        groups: [
          { title: 'EU', items: ['Added Chile as a supported country.', <>Added Multi-Ply. <Link href="/multi-ply">Explore now</Link></>] },
          { title: 'USA', items: ['Added a results filter.'] },
        ],
      },
      { category: 'improvement', groups: [{ items: ['General UI enhancements.'] }] },
      { category: 'maintenance', groups: [{ items: ['General system improvements and bug fixes.'] }] },
    ],
  },
];
```

| Type | Fields |
| --- | --- |
| `ReleaseNote` | `version` (semver-like), `date` (`"YYYY-MM-DD"` or `Date`), `summary?`, `sections` |
| `ReleaseNoteSection` | `category`, `groups` |
| `ReleaseCategory` | `feature`, `improvement`, `fix`, `maintenance`, `security`, `deprecation` |
| `ReleaseNoteGroup` | `title?` (e.g. a region or product), `items` (text or rich content with links) |

## Components

### ReleaseNotesDialog

| Prop | Type | Description |
| --- | --- | --- |
| `open`, `onClose` | `boolean`, `() => void` | |
| `appName` | `ReactNode` | Short product name, shown in the brand color (e.g. "DC") |
| `appTitle` | `ReactNode` | Optional full product name under it |
| `intro` | `ReactNode` | Optional paragraph above the list |
| `releases`, `lastSeenVersion`, `defaultExpanded`, `locale`, `labels`, `headingLevel` | | Every [`ReleaseNotes`](#releasenotes) prop |

Up to 56rem wide; the list scrolls between the header and the **Close** button. Close and Escape return focus to the trigger.

### ReleaseNotes

The list on its own, for a help page or any other container.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `releases` | `ReleaseNote[]` | | Sorted newest first **by semver** (2.10.0 before 2.9.0; pre-releases before their final release) |
| `lastSeenVersion` | `string \| null` | | Newer releases get a "New" badge |
| `defaultExpanded` | `'latest' \| 'all' \| 'none'` | `'latest'` | Which releases start open |
| `locale` | `string` | `'en-US'` | Date format, e.g. `'vi-VN'` |
| `labels` | `ReleaseNotesLabelOverrides` | | See [Translation](#translation) |
| `headingLevel` | `'h2' \| 'h3' \| 'h4'` | `'h3'` | Each release is a heading; categories and groups use the next levels, so screen readers can navigate them |

Each category is a colored badge with an icon, using role colors. A group with a `title` renders as a bold heading with a bulleted list; a single item without a title renders as a paragraph. With two or more releases, an expand/collapse all button appears.

## useReleaseNotesSeen

```ts
const { shouldOpen, lastSeenVersion, markSeen } = useReleaseNotesSeen({
  currentVersion: '2.5.0',
  storageKey: 'demo-calc:release-notes', // unique per app
  showOnFirstVisit: false,
});
```

| Returns | Description |
| --- | --- |
| `shouldOpen` | `true` when the app was updated since the user's last visit |
| `lastSeenVersion` | Pass to the dialog so newer releases get a "New" badge. Stays the same while the dialog is open |
| `markSeen()` | Call when the dialog closes |

On a first visit nothing opens; the current version is just recorded (set `showOnFirstVisit` to change that). The version is stored in localStorage; if storage is blocked, nothing breaks and the dialog may simply show again next time.

## Translation

```tsx
<ReleaseNotes
  releases={releases}
  locale="vi-VN"
  labels={{
    released: (date) => `Phát hành ngày ${date}`,
    categories: { feature: 'Tính năng mới', fix: 'Sửa lỗi' },
    empty: 'Chưa có ghi chú phát hành.',
  }}
/>
```

`ReleaseNotesLabels`: `released(date)`, `categories`, `newBadge`, `empty`, `close`, `expandAll`, `collapseAll`. Defaults are in `defaultReleaseNotesLabels`.

## Helpers

| Function | Description |
| --- | --- |
| `compareVersions(a, b)` | Semver-aware comparison for sorting |
| `sortReleases(releases)` | Newest first |
| `parseReleaseDate(date)` | `Date` (or `null` if invalid). Reads `"YYYY-MM-DD"` as a local date, so it is not shifted a day back in American time zones like `new Date('…')` |
| `formatReleaseDate(date, locale?)` | Long date, e.g. "September 3, 2026" |
