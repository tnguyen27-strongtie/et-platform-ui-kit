import { Link, notify, type ReleaseNote } from '../index';

const explore = (what: string) => (
  <Link component="button" type="button" onClick={() => notify.info(`Opening ${what}`)} sx={{ verticalAlign: 'baseline' }}>
    Explore now
  </Link>
);

/** Sample content in the shape an app would load from its release-notes JSON. */
export const sampleReleases: ReleaseNote[] = [
  {
    version: '2.4.0',
    date: '2026-06-18',
    sections: [
      { category: 'feature', groups: [{ title: 'Canada', items: ['Added glulam beam-to-column connections.'] }] },
      { category: 'fix', groups: [{ items: ['Fixed rounding of spacing values in the printed report.'] }] },
    ],
  },
  {
    version: '2.5.0',
    date: '2026-09-03',
    sections: [
      {
        category: 'feature',
        groups: [
          {
            title: 'EU',
            items: [
              <>Added Multi-Ply Connection functionality — {explore('Multi-Ply Connection')}.</>,
              <>Added CLT Floor–Floor Half-Lap Joint functionality — {explore('Half-Lap Joint')}.</>,
              'Added Chile as a supported country.',
              'Added Finnish and Portuguese as supported languages.',
            ],
          },
          {
            title: 'USA',
            items: [
              'Added a results filter (Passed / Failed / All) with a new Validation Breakdown view, allowing users to see which validation checks passed and failed for each solution.',
            ],
          },
        ],
      },
      {
        category: 'improvement',
        groups: [
          {
            title: 'USA',
            items: [
              'Multi-Ply Connection: Improve fastener layout in 3D viewer.',
              'Sole Plate to Rim Board: Add a limit to cap the maximum allowable spacing at 5.5" in. o.c. for SDWS and SDWH screws where the required minimum spacing is 3 in. o.c. (C-F-2025TECHSUP, p. 107).',
            ],
          },
          { items: ['3D Viewer: Added an orientation cube to improve model navigation and viewing experience.'] },
          { items: ['General UI/UX enhancements.'] },
        ],
      },
      { category: 'maintenance', groups: [{ items: ['General system improvements and bug fixes.'] }] },
    ],
  },
  { version: '2.3.0', date: '2026-03-12', sections: [{ category: 'improvement', groups: [{ items: ['Faster 3D model loading.'] }] }] },
  { version: '2.2.0', date: '2025-12-18', sections: [{ category: 'security', groups: [{ items: ['Updated third-party libraries with security fixes.'] }] }] },
];

export const sampleIntro =
  'Find strong and reliable fastening solutions for different regions using Fastener Designer. It includes calculations for the USA, Canada, and the EU, using their respective standards: NDS for the USA, CSA O86:19 for Canada, and EN 1995 for the EU.';
