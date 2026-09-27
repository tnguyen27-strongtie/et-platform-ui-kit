import type { ReactNode } from 'react';

/** "Updating results" overlay: pulsing brand-colored ring with fading text. */
export function LoadingIndicator({ children }: { children?: ReactNode }) {
  return (
    <div role="status" aria-live="polite" className="flex-center size-full bg-white/75 text-center">
      <div className="relative size-60 animate-loading-border rounded-full border-[3px] border-accent lg:size-80 lg:border-[5px]">
        <div className="absolute top-1/2 left-1/2 -translate-1/2 animate-loading-pulse text-[2rem] leading-tight font-light text-accent lg:text-4xl">
          {children ?? (
            <>
              Updating
              <br />
              Results
            </>
          )}
        </div>
      </div>
    </div>
  );
}
