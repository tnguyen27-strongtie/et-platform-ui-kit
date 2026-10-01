/**
 * E2E test harness: renders one fixture per URL hash (/tests/e2e/harness/index.html#select).
 * Fixtures print what their callbacks received into <output data-testid="...">, so specs
 * assert on values and types (e.g. 2 vs "2"), not only on what is drawn.
 */
import '../../../src/theme/theme.css';

import { type ComponentType, StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { PlatformThemeProvider, ToastHost } from '../../../src/index';
import { fixtures, ownThemeFixtures } from './fixtures';

function Harness() {
  const [name, setName] = useState(() => location.hash.slice(1));
  useEffect(() => {
    const onHash = () => setName(location.hash.slice(1));
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);
  // The hash may name no fixture at all.
  const Fixture = (fixtures as Partial<Record<string, ComponentType>>)[name];
  const page = (
    <main style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
      <h1 style={{ margin: 0, fontSize: 16 }}>Test harness</h1>
      <h2 style={{ margin: 0, fontSize: 14 }}>Fixture: {name}</h2>
      {Fixture ? <Fixture /> : <p>Unknown fixture "{name}". Available: {Object.keys(fixtures).join(', ')}</p>}
    </main>
  );
  if ((ownThemeFixtures as ReadonlySet<string>).has(name)) return page;
  return (
    <PlatformThemeProvider>
      {page}
      <ToastHost />
    </PlatformThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
