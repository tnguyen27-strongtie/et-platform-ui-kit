import CloseIcon from '@mui/icons-material/Close';
import MuiButton, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';
import MuiIconButton, { type IconButtonProps } from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import { forwardRef } from 'react';

import { colors, scales } from '../tokens/tokens';

/**
 * FD button. Variants: primary | primaryDark | secondary | text | textDark | tertiary | default | fab.
 * Sizes: small | medium. Styling lives in the theme (MuiButton.variants).
 */
export type ButtonProps = MuiButtonProps;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  return <MuiButton ref={ref} {...props} />;
});

/** Round icon-only button (FD "icon" variant). */
export const IconButton = MuiIconButton;
export type { IconButtonProps };

const StyledClose = styled(MuiIconButton)({
  width: '2rem',
  height: '2rem',
  padding: 0,
  borderRadius: '9999px',
  color: colors.text,
  '&:hover': { backgroundColor: colors.surfaceHover, transform: 'scale(1.05)' },
  '&:active': { backgroundColor: scales.trueGray[10] },
  '& svg': { fontSize: '1.5rem' },
});

/** Close "X" used in dialog headers and popovers. */
export const CloseButton = forwardRef<HTMLButtonElement, IconButtonProps>(function CloseButton(props, ref) {
  return (
    <StyledClose ref={ref} aria-label="Close" {...props}>
      <CloseIcon />
    </StyledClose>
  );
});
