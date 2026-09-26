import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { Card, type ColorConfig, type PlatformThemeConfig } from '../index';

// ---------- Routing: #/<page>/<section>; #workspace and #workspace-columns open full-screen layouts ----------

export interface Route {
  page: string;
  section?: string;
  /** Legacy full-screen workspace demos: #workspace (stacked) and #workspace-columns. */
  fullScreen?: 'rows' | 'columns';
}

export function parseHash(hash: string): Route {
  if (hash === '#workspace') return { page: 'workspace', fullScreen: 'rows' };
  if (hash === '#workspace-columns') return { page: 'workspace', fullScreen: 'columns' };
  const clean = hash.replace(/^#\/?/, '');
  const [page = 'overview', section] = clean.split('/');
  return { page: page || 'overview', section };
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parseHash(location.hash));
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

export const href = (page: string, section?: string) => `#/${page}${section ? `/${section}` : ''}`;

// ---------- Theme settings shared with pages (Foundations shows live values) ----------

export interface ShowcaseSettings {
  colors: ColorConfig | undefined;
  /** The showcase-wide theme (edited by the Theme builder, persisted in localStorage). */
  config: PlatformThemeConfig;
  setConfig: (update: PlatformThemeConfig | ((prev: PlatformThemeConfig) => PlatformThemeConfig)) => void;
}

export const ShowcaseContext = createContext<ShowcaseSettings>({ colors: undefined, config: {}, setConfig: () => undefined });
export const useShowcase = () => useContext(ShowcaseContext);

// ---------- Page building blocks ----------

export function DemoPage({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="m-0 text-2xl font-bold">{title}</h1>
        <p className="m-0 max-w-3xl text-sm text-text-muted">{description}</p>
      </header>
      {children}
    </div>
  );
}

export interface DemoSectionProps {
  /** Anchor id, used by the sidebar (#/page/id). */
  id: string;
  title: string;
  /** One line on when to use it. */
  description?: ReactNode;
  /** Short usage example shown under the demo. */
  code?: string;
  children: ReactNode;
}

export function DemoSection({ id, title, description, code, children }: DemoSectionProps) {
  return (
    <div id={id} className="scroll-mt-20">
      <Card title={title} titleAs="h2" padding="md">
        <div className="flex flex-col gap-3">
          {description && <p className="m-0 text-sm text-text-muted">{description}</p>}
          {children}
          {code && <Code>{code}</Code>}
        </div>
      </Card>
    </div>
  );
}

export function Code({ children }: { children: string }) {
  return (
    <pre className="m-0 overflow-auto rounded-sm border border-border bg-surface-subtle p-2 font-mono text-xs leading-relaxed" tabIndex={0}>
      <code>{children.trim()}</code>
    </pre>
  );
}

/** Row of demo items with a small caption under each. */
export function Variants({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-4">{children}</div>;
}

export function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1">
      {children}
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

/** Two-column grid on wide screens for side-by-side demos. */
export function DemoGrid({ children }: { children: ReactNode }) {
  return <div className="grid items-start gap-4 lg:grid-cols-2">{children}</div>;
}
