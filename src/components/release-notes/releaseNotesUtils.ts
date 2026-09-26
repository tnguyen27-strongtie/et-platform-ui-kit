/**
 * Pure helpers behind ReleaseNotes (no React), unit tested in tests/unit/releaseNotes.test.ts.
 */

/**
 * Compares dotted versions numerically ("2.10.0" > "2.9.1"). A leading "v" is ignored, missing
 * parts count as 0, and a pre-release ("2.5.0-beta.1") sorts before its release.
 * Returns < 0 when a is older, > 0 when newer, 0 when equal.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [core = '', pre] = v.trim().replace(/^v/i, '').split('-', 2);
    return { parts: core.split('.').map((p) => Number.parseInt(p, 10) || 0), pre };
  };
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < Math.max(x.parts.length, y.parts.length); i++) {
    const d = (x.parts[i] ?? 0) - (y.parts[i] ?? 0);
    if (d !== 0) return d;
  }
  if (x.pre === y.pre) return 0;
  if (x.pre === undefined) return 1;
  if (y.pre === undefined) return -1;
  return x.pre.localeCompare(y.pre, undefined, { numeric: true });
}

/**
 * Parses a release date. "YYYY-MM-DD" is read as a local calendar date: new Date('2026-09-03')
 * would be UTC midnight and show as September 2 in the Americas.
 */
export function parseReleaseDate(date: string | Date): Date | null {
  if (date instanceof Date) return Number.isNaN(date.getTime()) ? null : date;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(date);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "September 3, 2026" in the given locale; the raw text if the date cannot be parsed. */
export function formatReleaseDate(date: string | Date, locale = 'en-US'): string {
  const d = parseReleaseDate(date);
  if (!d) return typeof date === 'string' ? date : '';
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(d);
}

/** Newest first, by version (not by array order or date, which are easy to get wrong). */
export function sortReleases<T extends { version: string }>(releases: readonly T[]): T[] {
  return [...releases].sort((a, b) => compareVersions(b.version, a.version));
}

/** True when `version` is newer than what the user last saw (everything is new if nothing was seen). */
export function isUnseen(version: string, lastSeenVersion: string | null | undefined): boolean {
  return !lastSeenVersion || compareVersions(version, lastSeenVersion) > 0;
}
