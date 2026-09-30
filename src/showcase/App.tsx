import { type ComponentType, useEffect, useState } from 'react';

import {
  APPEARANCE_NAMES,
  APPEARANCES,
  type ColorConfig,
  type ColorSchemeSetting,
  isAppearanceName,
  type PlatformThemeConfig,
  PlatformThemeProvider,
  Select,
  Switch,
  ToastHost,
  TopNav,
} from '../index';
import { catalog } from './catalog';
import { exampleThemeOf, exampleThemes, fromStoredTheme, pickAppearance, toStoredTheme } from './exampleThemes';
import { href, ShowcaseContext, useRoute } from './layout';
import { Actions } from './pages/Actions';
import { DataDisplay } from './pages/DataDisplay';
import { Feedback } from './pages/Feedback';
import { Forms } from './pages/Forms';
import { Foundations } from './pages/Foundations';
import { Navigation } from './pages/Navigation';
import { Overlays } from './pages/Overlays';
import { Overview } from './pages/Overview';
import { Patterns } from './pages/Patterns';
import { ThemeBuilder } from './pages/ThemeBuilder';
import { Utilities } from './pages/Utilities';
import { WorkspacePage } from './pages/WorkspacePage';
import { WorkspaceDemo } from './WorkspaceDemo';

const pages: Record<string, ComponentType> = {
  overview: Overview,
  theme: ThemeBuilder,
  foundations: Foundations,
  actions: Actions,
  forms: Forms,
  overlays: Overlays,
  navigation: Navigation,
  data: DataDisplay,
  feedback: Feedback,
  workspace: WorkspacePage,
  patterns: Patterns,
  utilities: Utilities,
};

/** Demo brand presets: the whole kit follows PlatformThemeProvider `colors`. */
const brandPresets: Array<{ value: string; label: string; colors: ColorConfig | undefined }> = [
  { value: 'default', label: 'Orange (default)', colors: undefined },
  { value: 'blue', label: 'Blue', colors: { brand: '#1f5f99' } },
  { value: 'green', label: 'Green', colors: { brand: '#2e7d32' } },
  { value: 'purple', label: 'Purple', colors: { brand: '#6a3d9a' } },
];

const THEME_STORAGE_KEY = 'showcase:theme';

function loadTheme(): PlatformThemeConfig {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored ? fromStoredTheme(stored) : {};
  } catch {
    return {};
  }
}


const sameColors = (a: ColorConfig | undefined, b: ColorConfig | undefined) => JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});

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
  const [config, setConfig] = useState<PlatformThemeConfig>(loadTheme);
  const colors = config.colors;
  const density = config.density ?? 'standard';
  const brand = brandPresets.find((b) => sameColors(b.colors, colors))?.value ?? 'custom';
  const Page = pages[route.page] ?? Overview;

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, toStoredTheme(config));
    } catch {
      // storage blocked: the theme just resets on reload
    }
  }, [config]);

  // Scroll to #/<page>/<section> after the page renders; top of page otherwise.
  useEffect(() => {
    if (route.fullScreen) return;
    const el = route.section ? document.getElementById(route.section) : null;
    if (el) el.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  }, [route.page, route.section, route.fullScreen]);

  const appearance = exampleThemeOf(config)?.id ?? (isAppearanceName(config.appearance) ? config.appearance : 'classic');

  const controls = (
    <div className="flex items-center gap-4">
      {/* Phones: no room in the bar; the Theme builder's Appearance section switches it there. */}
      <div className="hidden w-52 md:block">
        <Select
          aria-label="Appearance"
          value={appearance}
          options={[
            ...APPEARANCE_NAMES.map((name) => ({ value: name, label: APPEARANCES[name].label ?? name })),
            ...exampleThemes.map((e) => ({ value: e.id, label: `${e.label} (example)` })),
          ]}
          onChange={(value) => setConfig((c) => pickAppearance(c, value))}
        />
      </div>
      <div className="hidden w-28 md:block">
        <Select<ColorSchemeSetting>
          aria-label="Color scheme"
          value={config.colorScheme ?? 'light'}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
          onChange={(value) => setConfig((c) => ({ ...c, colorScheme: value === 'light' ? undefined : value }))}
        />
      </div>
      <div className="w-44">
        <Select
          aria-label="Brand color"
          value={brand}
          options={[...brandPresets, ...(brand === 'custom' ? [{ value: 'custom', label: 'Custom (Theme builder)' }] : [])]}
          onChange={(value) => {
            const preset = brandPresets.find((b) => b.value === value);
            if (preset) setConfig((c) => ({ ...c, colors: preset.colors }));
          }}
        />
      </div>
      <Switch label="Expanded text" checked={density === 'expanded'} onChange={(on) => setConfig((c) => ({ ...c, density: on ? 'expanded' : 'standard' }))} />
    </div>
  );

  return (
    <PlatformThemeProvider config={config}>
      <ShowcaseContext.Provider value={{ colors, config, setConfig }}>
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
            <aside className="sticky top-(--top-nav-height) hidden h-[calc(100dvh-var(--top-nav-height))] w-60 shrink-0 overflow-y-auto border-r border-border material-panel md:block">
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
