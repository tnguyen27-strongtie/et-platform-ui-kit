import ArchiveIcon from '@mui/icons-material/Archive';
import BugReportIcon from '@mui/icons-material/BugReport';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { Fragment, type ReactNode, useEffect, useMemo, useState } from 'react';

import { colors } from '../../tokens/tokens';
import { Accordion, ExpandCollapseAllButton, useAccordionGroup } from '../Accordion';
import { Button } from '../Button';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../Dialog';
import { EmptyState } from '../EmptyState';
import { formatReleaseDate, isUnseen, sortReleases } from './releaseNotesUtils';

// ---------------------------------------------------------------------------------------------
// Data model (what each app provides, typically from a JSON file)
// ---------------------------------------------------------------------------------------------

export type ReleaseCategory = 'feature' | 'improvement' | 'fix' | 'maintenance' | 'security' | 'deprecation';

/** A block inside a category: an optional heading (e.g. a region "EU") and its items. */
export interface ReleaseNoteGroup {
  title?: ReactNode;
  /** Text or rich content (links such as "Explore now"). */
  items: ReactNode[];
}

export interface ReleaseNoteSection {
  category: ReleaseCategory;
  groups: ReleaseNoteGroup[];
}

export interface ReleaseNote {
  /** Semver-like, e.g. "2.5.0". Releases are shown newest first by version. */
  version: string;
  /** "YYYY-MM-DD" (read as a local date) or a Date. */
  date: string | Date;
  /** Optional one-paragraph highlight shown above the categories. */
  summary?: ReactNode;
  sections: ReleaseNoteSection[];
}

export interface ReleaseNotesLabels {
  /** Accordion header after the version. Default: "Released on September 3, 2026". */
  released: (formattedDate: string) => string;
  categories: Record<ReleaseCategory, string>;
  /** Badge on releases newer than lastSeenVersion. */
  newBadge: string;
  empty: string;
  close: string;
  expandAll: string;
  collapseAll: string;
}

export type ReleaseNotesLabelOverrides = Partial<Omit<ReleaseNotesLabels, 'categories'>> & {
  categories?: Partial<Record<ReleaseCategory, string>>;
};

export const defaultReleaseNotesLabels: ReleaseNotesLabels = {
  released: (date) => `Released on ${date}`,
  categories: {
    feature: 'New Feature',
    improvement: 'Improvement',
    fix: 'Bug Fix',
    maintenance: 'Maintenance',
    security: 'Security',
    deprecation: 'Deprecation',
  },
  newBadge: 'New',
  empty: 'No release notes yet.',
  close: 'Close',
  expandAll: 'Expand all releases',
  collapseAll: 'Collapse all releases',
};

// Badge colors come from role tokens (so they follow the app theme) with text chosen for contrast.
const categoryStyle: Record<ReleaseCategory, { bg: string; fg: string; icon: ReactNode }> = {
  feature: { bg: colors.successStrong, fg: '#fff', icon: <StarBorderIcon /> },
  improvement: { bg: colors.info, fg: '#fff', icon: <EditIcon /> },
  fix: { bg: colors.neutral, fg: '#fff', icon: <BugReportIcon /> },
  maintenance: { bg: colors.warning, fg: colors.text, icon: <SettingsIcon /> },
  security: { bg: colors.danger, fg: '#fff', icon: <SecurityIcon /> },
  deprecation: { bg: colors.textMuted, fg: '#fff', icon: <ArchiveIcon /> },
};

// ---------------------------------------------------------------------------------------------
// ReleaseNotes: the list (usable in a dialog or on a help page)
// ---------------------------------------------------------------------------------------------

export interface ReleaseNotesProps {
  releases: ReleaseNote[];
  /** Releases newer than this get a "New" badge. Usually from useReleaseNotesSeen. */
  lastSeenVersion?: string | null;
  /** Which releases start open. Default 'latest'. */
  defaultExpanded?: 'latest' | 'all' | 'none';
  /** Date locale, e.g. 'vi-VN'. Default 'en-US'. */
  locale?: string;
  /** Any subset of the texts, e.g. { released: (d) => `Phát hành ngày ${d}`, categories: { feature: 'Tính năng mới' } }. */
  labels?: ReleaseNotesLabelOverrides;
  /** Heading level of each release (category and group headings follow). Default 'h3'. */
  headingLevel?: 'h2' | 'h3' | 'h4';
}

const nextLevel = { h2: 'h3', h3: 'h4', h4: 'h5' } as const;
const levelAfter = { h2: 'h4', h3: 'h5', h4: 'h6' } as const;

/**
 * Version history: one accordion per release (newest first, latest open), categories as colored
 * badges, optional group headings (regions, products) with bullet lists, links allowed in items.
 */
export function ReleaseNotes({
  releases,
  lastSeenVersion,
  defaultExpanded = 'latest',
  locale = 'en-US',
  labels: labelOverrides,
  headingLevel = 'h3',
}: ReleaseNotesProps) {
  const labels = { ...defaultReleaseNotesLabels, ...labelOverrides, categories: { ...defaultReleaseNotesLabels.categories, ...labelOverrides?.categories } };
  const sorted = useMemo(() => sortReleases(releases), [releases]);
  const versions = sorted.map((r) => r.version);
  const group = useAccordionGroup(
    versions,
    defaultExpanded === 'all',
    defaultExpanded === 'latest' && versions[0] ? { [versions[0]]: true } : undefined,
  );

  if (sorted.length === 0) return <EmptyState title={labels.empty} />;

  const CategoryHeading = nextLevel[headingLevel];
  const GroupHeading = levelAfter[headingLevel];

  return (
    <div className="flex flex-col">
      {sorted.length > 1 && (
        <div className="flex justify-end">
          <ExpandCollapseAllButton group={group} expandLabel={labels.expandAll} collapseLabel={labels.collapseAll} />
        </div>
      )}
      <div className="flex flex-col gap-1">
        {sorted.map((release) => (
          <Accordion
            key={release.version}
            headingLevel={headingLevel}
            className="rounded-sm border border-border-input"
            title={
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-normal">
                <span className="font-bold">{release.version}</span>
                <span>{labels.released(formatReleaseDate(release.date, locale))}</span>
                {lastSeenVersion !== undefined && isUnseen(release.version, lastSeenVersion) && (
                  <span className="rounded-full bg-brand px-2 text-xs leading-5 font-bold text-text-on-brand">{labels.newBadge}</span>
                )}
              </span>
            }
            {...group.item(release.version)}
          >
            <div className="flex flex-col gap-3 px-2 py-1 text-sm leading-relaxed">
              {release.summary && <p className="m-0">{release.summary}</p>}
              {release.sections.map((section, si) => {
                const style = categoryStyle[section.category];
                return (
                  <section key={si} className="flex flex-col">
                    <CategoryHeading className="m-0">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-sm font-medium [&_svg]:text-base"
                        style={{ background: style.bg, color: style.fg }}
                      >
                        <span aria-hidden="true" className="flex">
                          {style.icon}
                        </span>
                        {labels.categories[section.category]}
                      </span>
                    </CategoryHeading>
                    {section.groups.map((g, gi) => (
                      <Fragment key={gi}>
                        <div className="border-b border-border py-2 last:border-b-0">
                          {g.title && <GroupHeading className="m-0 mb-1 text-sm font-bold">{g.title}</GroupHeading>}
                          {!g.title && g.items.length === 1 ? (
                            <p className="m-0">{g.items[0]}</p>
                          ) : (
                            <ul className="m-0 flex list-disc flex-col gap-0.5 pl-5 marker:text-text-muted">
                              {g.items.map((item, ii) => (
                                <li key={ii}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </Fragment>
                    ))}
                  </section>
                );
              })}
            </div>
          </Accordion>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// ReleaseNotesDialog: the "What's new" dialog every app shows
// ---------------------------------------------------------------------------------------------

export interface ReleaseNotesDialogProps extends ReleaseNotesProps {
  open: boolean;
  onClose: () => void;
  /** Short product name in brand color, e.g. "DC". */
  appName: ReactNode;
  /** Full product name under it, e.g. "Demo Calculator". */
  appTitle?: ReactNode;
  /** Paragraph about the product above the releases. */
  intro?: ReactNode;
}

export function ReleaseNotesDialog({ open, onClose, appName, appTitle, intro, labels, headingLevel = 'h3', ...notes }: ReleaseNotesDialogProps) {
  const close = labels?.close ?? defaultReleaseNotesLabels.close;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: 'calc(100% - 1rem)', md: 'min(56rem, calc(100% - 2rem))' },
            my: { md: '2rem' },
            maxHeight: { md: 'calc(100% - 4rem)' },
          },
        },
      }}
    >
      <DialogHeader onClose={onClose}>
        <span className="flex flex-col">
          <span className="text-2xl leading-tight font-bold text-accent">{appName}</span>
          {appTitle && <span className="text-sm font-normal text-text-muted">{appTitle}</span>}
        </span>
      </DialogHeader>
      <DialogBody>
        <div className="flex flex-col gap-2 p-1">
          {intro && <p className="m-0 text-sm leading-relaxed">{intro}</p>}
          <ReleaseNotes labels={labels} headingLevel={headingLevel} {...notes} />
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="primary" onClick={onClose}>
          {close}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------------------------
// useReleaseNotesSeen: open "What's new" once after an update
// ---------------------------------------------------------------------------------------------

export interface UseReleaseNotesSeenOptions {
  /** The running app version (e.g. from package.json / build info). */
  currentVersion: string;
  /** localStorage key; make it unique per app. */
  storageKey: string;
  /** Also open for brand-new users. Default false: first visit just records the version. */
  showOnFirstVisit?: boolean;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode / blocked storage: the dialog may show again next time, nothing breaks.
  }
}

/**
 * Tracks which version the user last saw release notes for.
 * - `shouldOpen`: the app was updated since the last visit (open the dialog automatically)
 * - `lastSeenVersion`: pass to ReleaseNotes so newer releases get a "New" badge
 * - `markSeen()`: call when the dialog closes
 */
export function useReleaseNotesSeen({ currentVersion, storageKey, showOnFirstVisit = false }: UseReleaseNotesSeenOptions) {
  // Snapshot at mount so "New" badges stay while the dialog is open, even after markSeen().
  const [initial] = useState(() => readStorage(storageKey));
  const firstVisit = initial === null;
  const [seen, setSeen] = useState<string | null>(firstVisit && !showOnFirstVisit ? currentVersion : initial);

  useEffect(() => {
    if (firstVisit && !showOnFirstVisit) writeStorage(storageKey, currentVersion);
  }, [firstVisit, showOnFirstVisit, storageKey, currentVersion]);

  return {
    shouldOpen: isUnseen(currentVersion, seen),
    lastSeenVersion: firstVisit && !showOnFirstVisit ? currentVersion : initial,
    markSeen: () => {
      writeStorage(storageKey, currentVersion);
      setSeen(currentVersion);
    },
  };
}
