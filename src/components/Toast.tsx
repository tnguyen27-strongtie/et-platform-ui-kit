import 'react-toastify/dist/ReactToastify.css';

import type { ReactNode } from 'react';
import { toast, ToastContainer } from 'react-toastify';

import { colors } from '../tokens/tokens';

/** FD toast defaults: 5s, no pause on hover, close on click. Mount once in the app shell. */
export function ToastHost() {
  return <ToastContainer autoClose={5000} pauseOnHover={false} closeOnClick />;
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

export const notify = {
  success: (content: ReactNode, action?: ReactNode) =>
    toast.success(<ToastBody content={content} action={action} color={colors.link} />),
  error: (content: ReactNode, action?: ReactNode) =>
    toast.error(<ToastBody content={content} action={action} color={colors.accent} />),
  info: (content: ReactNode) => toast.info(content),
};
