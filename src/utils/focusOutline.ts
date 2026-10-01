// architecture-allow: tests Style constants that need runtime token values; buttons.spec.ts checks the outline in the browser.
import { colors } from '../tokens/tokens';

/**
 * Keyboard focus indicator (WCAG 2.4.7). Ripples are disabled kit-wide, and MUI relies on
 * the focus ripple to show focus, so every focusable control gets this outline instead.
 */
export const focusOutline = { outline: `2px solid ${colors.brand}`, outlineOffset: '2px' } as const;

/** The same outline drawn inside the element, for controls whose edges are clipped. */
export const focusOutlineInset = { ...focusOutline, outlineOffset: '-2px' } as const;
