import { type ReactNode } from 'react';

import { cn } from '../utils/cn';

export interface MathNotationProps {
  children?: ReactNode;
  className?: string;
}

/**
 * A variable in running text (S, F, σ): italic, in the math font. Children are optional so it
 * can be passed as an element to translation components, e.g. `components={{ v: <MathVar /> }}`.
 * For whole formulas use MathML.
 */
export function MathVar({ children, className }: MathNotationProps) {
  return <var className={cn('font-math italic', className)}>{children}</var>;
}

/**
 * A subscript (the DS in S<sub>DS</sub>). Upright, because descriptive subscripts are not
 * variables; wrap a variable subscript in MathVar. Does not stretch the line height.
 */
export function MathSub({ children, className }: MathNotationProps) {
  return <sub className={cn('align-sub text-[0.75em] leading-none', className)}>{children}</sub>;
}
