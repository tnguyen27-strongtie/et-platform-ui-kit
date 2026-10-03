import { Link, type ReleaseNote, type SelectOption } from '@platform/ui';

export interface Species {
  value: string;
  label: string;
  gravity: number;
  group: 'Softwood' | 'Hardwood';
}

export const SPECIES: Species[] = [
  { value: 'df-l', label: 'Douglas Fir-Larch', gravity: 0.5, group: 'Softwood' },
  { value: 'hem-fir', label: 'Hem-Fir', gravity: 0.43, group: 'Softwood' },
  { value: 'spf', label: 'Spruce-Pine-Fir', gravity: 0.42, group: 'Softwood' },
  { value: 'syp', label: 'Southern Pine', gravity: 0.55, group: 'Softwood' },
  { value: 'oak', label: 'Red Oak', gravity: 0.67, group: 'Hardwood' },
  { value: 'beech', label: 'Beech-Birch-Hickory', gravity: 0.71, group: 'Hardwood' },
  // Accented name: the Combobox and the grid search must match it without the accent.
  { value: 'epicea', label: 'Épicéa (EU spruce)', gravity: 0.42, group: 'Softwood' },
];

export const speciesOptions: SelectOption<string>[] = SPECIES.map((s) => ({
  value: s.value,
  label: s.label,
  note: `G = ${s.gravity}`,
}));

export interface Fastener {
  model: string;
  description: string;
  material: 'Steel' | 'Stainless' | 'Coated';
  diameter: number;
  length: number;
  datasheetUrl: string;
}

export const FASTENERS: Fastener[] = [
  { model: 'SDWS22300', description: 'Timber screw', material: 'Coated', diameter: 0.22, length: 3, datasheetUrl: 'https://example.com/sdws22300.pdf' },
  { model: 'SDWS22400', description: 'Timber screw', material: 'Coated', diameter: 0.22, length: 4, datasheetUrl: 'https://example.com/sdws22400.pdf' },
  { model: 'SDWS22600', description: 'Timber screw', material: 'Stainless', diameter: 0.22, length: 6, datasheetUrl: 'https://example.com/sdws22600.pdf' },
  { model: 'SDS25300', description: 'Strong-drive screw', material: 'Steel', diameter: 0.25, length: 3, datasheetUrl: 'https://example.com/sds25300.pdf' },
  { model: 'SDS25500', description: 'Strong-drive screw', material: 'Steel', diameter: 0.25, length: 5, datasheetUrl: 'https://example.com/sds25500.pdf' },
  { model: 'LAG38400', description: 'Lag screw 3/8"', material: 'Steel', diameter: 0.375, length: 4, datasheetUrl: 'https://example.com/lag38400.pdf' },
  { model: 'LAG50600', description: 'Lag screw 1/2"', material: 'Steel', diameter: 0.5, length: 6, datasheetUrl: 'https://example.com/lag50600.pdf' },
  { model: 'BOLT58', description: 'Machine bolt 5/8"', material: 'Stainless', diameter: 0.625, length: 7, datasheetUrl: 'https://example.com/bolt58.pdf' },
];

export const APP_VERSION = '3.1.0';

export const RELEASES: ReleaseNote[] = [
  {
    version: '3.1.0',
    date: '2026-10-01',
    summary: 'Several calculations can now be open at once.',
    sections: [
      { category: 'feature', groups: [{ title: 'Workspace', items: ['Open several calculations in tabs.', <>Compare fasteners in the new results grid. <Link href="#results">See results</Link></>] }] },
      { category: 'fix', groups: [{ items: ['Fixed rounding of fractional thicknesses.'] }] },
    ],
  },
  {
    version: '3.0.0',
    date: '2026-08-14',
    sections: [
      { category: 'improvement', groups: [{ items: ['Dark mode and a glass appearance.'] }] },
      { category: 'deprecation', groups: [{ items: ['The old PDF report is replaced by the results grid export.'] }] },
    ],
  },
  {
    version: '3.0.0-rc.1',
    date: '2026-07-30',
    sections: [{ category: 'maintenance', groups: [{ items: ['Release candidate for 3.0.'] }] }],
  },
  {
    version: '2.10.0',
    date: '2026-05-02',
    sections: [{ category: 'security', groups: [{ items: ['Updated dependencies.'] }] }],
  },
];
