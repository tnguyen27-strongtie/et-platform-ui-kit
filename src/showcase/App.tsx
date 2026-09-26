import { type ComponentType, useEffect, useState } from 'react';

import { type ColorConfig, type Density, PlatformThemeProvider, Select, Switch, ToastHost, TopNav } from '../index';
import { catalog } from './catalog';
import { href, ShowcaseContext, useRoute } from './layout';
import { Actions } from './pages/Actions';
import { DataDisplay } from './pages/DataDisplay';
import { Feedback } from './pages/Feedback';
import { Forms } from './pages/Forms';
import { Foundations } from './pages/Foundations';
import { Navigation } from './pages/Navigation';
import { Overlays } from './pages/Overlays';
import { Overview } from './pages/Overview';
import { Utilities } from './pages/Utilities';
import { WorkspacePage } from './pages/WorkspacePage';
import { WorkspaceDemo } from './WorkspaceDemo';

const pages: Record<string, ComponentType> = {
  overview: Overview,
  foundations: Foundations,
  actions: Actions,
  forms: Forms,
  overlays: Overlays,
  navigation: Navigation,
  data: DataDisplay,
  feedback: Feedback,
  workspace: WorkspacePage,
  utilities: Utilities,
};

/** Demo brand presets: the whole kit follows PlatformThemeProvider `colors`. */
const brandPresets: Array<{ value: string; label: string; colors: ColorConfig | undefined }> = [
  { value: 'fd', label: 'FD orange (default)', colors: undefined },
  { value: 'blue', label: 'Blue', colors: { brand: '#1f5f99' } },
  { value: 'green', label: 'Green', colors: { brand: '#2e7d32' } },
  { value: 'purple', label: 'Purple', colors: { brand: '#6a3d9a' } },
];

function Sidebar({ page }: { page: string }) {
  return (
    <nav aria-label="Components" className="flex flex-col gap-3 p-3 text-sm">
      <a href={href('overview')} aria-current={page === 'overview' ? 'page' : undefined} className="sidebar-link font-bold">
        Overview
      </a>
      {catalog.map((p) => (
        <div key={p.page} className="flex flex-col gap-0.5">
          <a href={href(p.page)} aria-current={page === p.page ? 'page' : undefined} className="sidebar-link font-bold">
            {p.title}
          </a>
          <ul className="m-0 flex list-none flex-col p-0 pl-2">
            {p.sections.map((s) => (
              <li key={s.id}>
                <a href={href(p.page, s.id)} className="sidebar-link text-text-muted">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function App() {
  const route = useRoute();
  const [density, setDensity] = useState<Density>('standard');
  const [brand, setBrand] = useState('fd');
  const colors = brandPresets.find((b) => b.value === brand)?.colors;
  const Page = pages[route.page] ?? Overview;

  // Scroll to #/<page>/<section> after the page renders; top of page otherwise.
  useEffect(() => {
    if (route.fullScreen) return;
    const el = route.section ? document.getElementById(route.section) : null;
    if (el) el.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  }, [route.page, route.section, route.fullScreen]);

  const controls = (
    <div className="flex items-center gap-4">
      <div className="w-44">
        <Select aria-label="Brand color" value={brand} options={brandPresets} onChange={setBrand} />
      </div>
      <Switch label="Expanded text" checked={density === 'expanded'} onChange={(on) => setDensity(on ? 'expanded' : 'standard')} />
    </div>
  );

  return (
    <PlatformThemeProvider density={density} colors={colors}>
      <ShowcaseContext.Provider value={{ colors }}>
        {/* #root is height:100%; this wrapper grows with the content so the sticky bar and sidebar stay put. */}
        <div className="min-h-full">
        <div className="sticky top-0 z-(--z-top-nav)">
          <TopNav
            logo={
              <a href={href('overview')} className="text-lg font-bold text-accent no-underline">
                Platform UI Kit
              </a>
            }
            right={controls}
          />
        </div>

        {route.fullScreen ? (
          <WorkspaceDemo key={route.fullScreen} split={route.fullScreen} />
        ) : (
          <div className="flex">
            <aside className="sticky top-(--top-nav-height) hidden h-[calc(100dvh-var(--top-nav-height))] w-60 shrink-0 overflow-y-auto border-r border-border bg-surface md:block">
              <Sidebar page={route.page} />
            </aside>
            <main className="min-w-0 flex-1 p-4">
              <div className="mx-auto flex max-w-6xl flex-col gap-4">
                <div className="md:hidden">
                  <Select
                    aria-label="Go to page"
                    value={route.page}
                    onChange={(p) => (location.hash = href(p))}
                    options={[{ value: 'overview', label: 'Overview' }, ...catalog.map((p) => ({ value: p.page, label: p.title }))]}
                  />
                </div>
                <Page />
              </div>
            </main>
          </div>
        )}
        </div>

        <ToastHost />
      </ShowcaseContext.Provider>
    </PlatformThemeProvider>
  );
}
