// MathML elements for JSX. React renders them, but @types/react does not declare them yet.
import 'react';

type MathMLProps = React.HTMLAttributes<HTMLElement> & {
  display?: 'block' | 'inline';
  displaystyle?: 'true' | 'false';
  mathvariant?: string;
  columnalign?: string;
  width?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      math: MathMLProps;
      mrow: MathMLProps;
      mi: MathMLProps;
      mn: MathMLProps;
      mo: MathMLProps;
      mfrac: MathMLProps;
      msqrt: MathMLProps;
      mroot: MathMLProps;
      msub: MathMLProps;
      msup: MathMLProps;
      msubsup: MathMLProps;
      munderover: MathMLProps;
      mtext: MathMLProps;
      mspace: MathMLProps;
      mtable: MathMLProps;
      mtr: MathMLProps;
      mtd: MathMLProps;
    }
  }
}
