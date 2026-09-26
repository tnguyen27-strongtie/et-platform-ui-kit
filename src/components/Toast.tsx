import type { ReactNode } from 'react';
// The unstyled entry: the default one injects its CSS as an unlayered <style> tag, which would
// beat Tailwind utilities. theme.css imports the same CSS into @layer components instead.
import { toast, ToastContainer } from 'react-toastify/unstyled';

import { colors } from '../tokens/tokens';

/**
 * Mount once in the app shell.
 * Toasts pause while hovered or while the window is in the background, so a message is
 * never missed (WCAG 2.2.1). Close with the X or by clicking the toast.
 */
export function ToastHost() {
  return <ToastContainer autoClose={5000} pauseOnHover pauseOnFocusLoss closeOnClick newestOnTop limit={5} />;
}

function ToastBody({ content, action, color }: { content: ReactNode; action?: ReactNode; color: string }) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <span>{content}</span>
      {action && (
        <span className="text-sm font-medium text-nowrap" style={{ color }}>
          {action}
        </span>
      )}
    </div>
  );
}

/**
 * Transient messages. Use for outcomes of an action ("Saved", "Export failed").
 * Validation errors belong next to the field (FormField error), not in a toast.
 * Errors stay until dismissed; the others close after 5s.
 */
export const notify = {
  success: (content: ReactNode, action?: ReactNode) =>
    toast.success(<ToastBody content={content} action={action} color={colors.link} />),
  info: (content: ReactNode, action?: ReactNode) =>
    toast.info(<ToastBody content={content} action={action} color={colors.link} />),
  warning: (content: ReactNode, action?: ReactNode) =>
    toast.warning(<ToastBody content={content} action={action} color={colors.accent} />, { autoClose: 8000 }),
  error: (content: ReactNode, action?: ReactNode) =>
    toast.error(<ToastBody content={content} action={action} color={colors.accent} />, { autoClose: false }),
  dismiss: (id?: string | number) => toast.dismiss(id),
};
