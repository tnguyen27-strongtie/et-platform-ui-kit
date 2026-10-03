// A made-up fastener capacity check. The numbers only have to be plausible: the PoC exists to
// exercise the kit the way a calculator app does (numbers in, a table of pass/fail rows out).
import { clamp, roundTo } from '@platform/ui';
import { FASTENERS, SPECIES, type Fastener } from './data';

export type ShearType = 'single' | 'double';
export type LoadDuration = 'permanent' | 'normal' | 'wind';

export interface CalcInputs {
  species: string | null;
  sideThickness: number | null;
  mainThickness: number | null;
  rows: number | null;
  perRow: number | null;
  shear: ShearType;
  duration: LoadDuration;
  wetService: boolean;
  demand: number | null;
  includeSteel: boolean;
  notes: string;
}

export const DEFAULT_INPUTS: CalcInputs = {
  species: 'df-l',
  sideThickness: 1.5,
  mainThickness: 3.5,
  rows: 2,
  perRow: 3,
  shear: 'single',
  duration: 'normal',
  wetService: false,
  demand: 1200,
  includeSteel: true,
  notes: '',
};

export const LIMITS = {
  sideThickness: { min: 0.75, max: 3.5, precision: 3 },
  mainThickness: { min: 1.5, max: 7.25, precision: 3 },
  rows: { min: 1, max: 6, precision: 0 },
  perRow: { min: 1, max: 10, precision: 0 },
  demand: { min: 0, max: 50000, precision: 0 },
} as const;

const DURATION_FACTOR: Record<LoadDuration, number> = { permanent: 0.9, normal: 1, wind: 1.6 };

export type Status = 'Passes' | 'Check' | 'Fails';

export interface ResultRow {
  id: string;
  fastener: Fastener;
  perFastener: number;
  capacity: number;
  ratio: number;
  status: Status;
}

export interface CalcResult {
  rows: ResultRow[];
  factors: { cd: number; cm: number; cg: number };
  count: number;
}

/** Returns the error message of the first missing input, or null when the inputs are complete. */
export function missingInput(inputs: CalcInputs): string | null {
  if (inputs.species === null) return 'Pick a species.';
  if (inputs.sideThickness === null) return 'Enter the side member thickness.';
  if (inputs.mainThickness === null) return 'Enter the main member thickness.';
  if (inputs.rows === null || inputs.perRow === null) return 'Enter the fastener pattern.';
  if (inputs.demand === null) return 'Enter the demand.';
  return null;
}

export function calculate(inputs: CalcInputs): CalcResult {
  const species = SPECIES.find((s) => s.value === inputs.species) ?? SPECIES[0]!;
  const side = inputs.sideThickness ?? 0;
  const main = inputs.mainThickness ?? 0;
  const count = (inputs.rows ?? 0) * (inputs.perRow ?? 0);
  const cd = DURATION_FACTOR[inputs.duration];
  const cm = inputs.wetService ? 0.7 : 1;
  // Group action: long rows share load unevenly.
  const cg = roundTo(clamp(1 - 0.03 * ((inputs.perRow ?? 1) - 1), 0.7, 1), 3);
  const planes = inputs.shear === 'double' ? 2 : 1;

  const rows = FASTENERS.filter((f) => inputs.includeSteel || f.material !== 'Steel').map((fastener) => {
    const bearing = Math.min(side, main / planes, fastener.length / (planes + 1));
    const z = 1100 * fastener.diameter * species.gravity * bearing;
    const perFastener = roundTo(z * planes * cd * cm, 0);
    const capacity = roundTo(perFastener * count * cg, 0);
    const ratio = capacity > 0 ? roundTo((inputs.demand ?? 0) / capacity, 3) : Infinity;
    const status: Status = ratio <= 0.9 ? 'Passes' : ratio <= 1 ? 'Check' : 'Fails';
    return { id: fastener.model, fastener, perFastener, capacity, ratio, status };
  });

  return { rows, factors: { cd, cm, cg }, count };
}
