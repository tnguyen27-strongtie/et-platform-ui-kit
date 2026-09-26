/**
 * Pure helpers behind NumberInput. Kept free of React so they can be unit tested
 * (node --test scripts) and reused by apps for their own validation.
 */

export interface NumberRules {
  min?: number;
  max?: number;
  /** Maximum decimal places. 0 = integers only. */
  precision?: number;
}

/**
 * True if `text` may appear while the user is typing a number (e.g. "", "-", "1.", ",5").
 * Accepts "." or "," as the decimal separator; rejects letters, exponents and thousands separators.
 */
export function isPartialNumber(text: string, rules: NumberRules = {}): boolean {
  const allowNegative = rules.min === undefined || rules.min < 0;
  const sign = allowNegative ? '-?' : '';
  const decimals = rules.precision === 0 ? '' : `([.,]\\d${rules.precision === undefined ? '*' : `{0,${rules.precision}}`})?`;
  return new RegExp(`^${sign}\\d*${decimals}$`).test(text);
}

/**
 * Parses user text to a number.
 * Returns null for an empty field, undefined when the text is not (yet) a complete number
 * ("-", ".", "-."), otherwise the finite number. Never returns NaN or -0.
 */
export function parseNumber(text: string): number | null | undefined {
  const t = text.trim().replace(',', '.');
  if (t === '') return null;
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return undefined;
  const n = Number(t);
  if (!Number.isFinite(n)) return undefined;
  return n === 0 ? 0 : n;
}

/** Number of decimal places written in `n` (0.1 -> 1, 1e-7 -> 7). */
export function decimalsOf(n: number): number {
  if (!Number.isFinite(n) || Number.isInteger(n)) return 0;
  const [mantissa = '', exp] = n.toExponential().split('e');
  const frac = mantissa.split('.')[1]?.length ?? 0;
  return Math.max(0, frac - Number(exp));
}

/** n * 10^digits done on the decimal string, so no binary rounding error is introduced. */
function shift(n: number, digits: number): number {
  const [mantissa, exp = '0'] = n.toExponential().split('e');
  return Number(`${mantissa}e${Number(exp) + digits}`);
}

/**
 * Rounds half away from zero to `digits` decimals without binary artefacts
 * (1.005 -> 1.01, -2.5 -> -3, 0.1 + 0.2 -> 0.3).
 */
export function roundTo(n: number, digits: number): number {
  if (!Number.isFinite(n) || n === 0) return n === 0 ? 0 : n;
  const r = Math.sign(n) * shift(Math.round(shift(Math.abs(n), digits)), -digits);
  return r === 0 ? 0 : r;
}

export function clamp(n: number, min = -Infinity, max = Infinity): number {
  return Math.min(max, Math.max(min, n));
}

export function isInRange(n: number, { min, max }: NumberRules): boolean {
  return (min === undefined || n >= min) && (max === undefined || n <= max);
}

/**
 * Steps `value` by `delta` (e.g. +step on ArrowUp), clamped to the range and rounded to the
 * precision of the step and value so repeated steps never drift (0.1 + 0.1 + 0.1 = 0.3).
 * An empty value becomes 0, or the nearest bound when 0 is out of range.
 */
export function stepNumber(value: number | null, delta: number, rules: NumberRules = {}): number {
  if (value === null) return clamp(0, rules.min, rules.max);
  const digits = rules.precision ?? Math.max(decimalsOf(delta), decimalsOf(value));
  return clamp(roundTo(value + delta, digits), rules.min, rules.max);
}

/** Text shown for a committed value: fixed decimals if precision is set, else shortest form. */
export function formatNumber(value: number | null, precision?: number): string {
  if (value === null || !Number.isFinite(value)) return '';
  if (precision !== undefined) return roundTo(value, precision).toFixed(precision);
  const text = String(value);
  // Avoid exponent notation (1e-7), which the field would not accept back as input.
  return text.includes('e') ? value.toFixed(Math.min(100, decimalsOf(value))) : text;
}
