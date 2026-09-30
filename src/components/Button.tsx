import CloseIcon from '@mui/icons-material/Close';
import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';
import MuiIconButton, { type IconButtonProps as MuiIconButtonProps } from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import { forwardRef } from 'react';

import { colors } from '../tokens/tokens';

/**
 * Button. Variants: primary | primaryDark | secondary | text | textDark | tertiary | default | fab.
 * Sizes: small | medium. Styling lives in the theme (MuiButton.variants).
 *
 * - Renders type="button" by default, so it never submits a form by accident; pass type="submit" explicitly.
 * - `loading`: shows a spinner and blocks clicks until the work finishes (prevents double submit).
 */
export type ButtonProps = MuiButtonProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  return <MuiButton ref={ref} {...props} />;
});

/** Icon-only buttons have no visible text, so an accessible name is required. */
export type IconButtonProps = MuiIconButtonProps & ({ 'aria-label': string } | { 'aria-labelledby': string });

/** Round icon-only button (round "icon" variant). Pair with a Tooltip carrying the same text. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(props, ref) {
  return <MuiIconButton ref={ref} {...props} />;
});

const StyledClose = styled(MuiIconButton)({
  width: '2rem',
  height: '2rem',
  padding: 0,
  borderRadius: '9999px',
  color: colors.text,
  '&:hover': { backgroundColor: colors.surfaceHover, transform: 'scale(1.05)' },
  '&:active': { backgroundColor: 'var(--color-true-gray-10)' },
  '& svg': { fontSize: '1.5rem' },
});

/** Close "X" used in dialog headers and popovers. */
export const CloseButton = forwardRef<HTMLButtonElement, MuiIconButtonProps>(function CloseButton(props, ref) {
  return (
    <StyledClose ref={ref} aria-label="Close" {...props}>
      <CloseIcon />
    </StyledClose>
  );
});
