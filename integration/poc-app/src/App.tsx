import {
  AgreementDialog,
  ConfirmDialog,
  EmptyState,
  PlatformThemeProvider,
  ReleaseNotesDialog,
  ToastHost,
  useAgreementAccepted,
  useReleaseNotesSeen,
  Workspace,
  WorkspaceTabs,
  defaultWorkspaceTabsLabels,
  notify,
  type WorkspaceTab,
} from '@platform/ui';
import { useState } from 'react';
import { AboutDialog } from './features/AboutDialog';
import { AppNav } from './features/AppNav';
import { CalculationWorkspace } from './features/CalculationWorkspace';
import { HelpDialog } from './features/HelpDialog';
import { SettingsDialog } from './features/SettingsDialog';
import { DEFAULT_INPUTS, type CalcInputs } from './lib/calc';
import { APP_VERSION, RELEASES } from './lib/data';
import { useSettings } from './lib/settings';
import theme from './theme.config';

type DialogName = 'settings' | 'about' | 'help' | 'releases' | null;

let nextId = 2;

export function App() {
  const [settings, updateSettings] = useSettings();
  const [dialog, setDialog] = useState<DialogName>(null);
  const [tabs, setTabs] = useState<WorkspaceTab<string>[]>([{ value: 'c1', label: 'Calculation 1' }]);
  const [active, setActive] = useState('c1');
  const [inputs, setInputs] = useState<Record<string, CalcInputs>>({ c1: DEFAULT_INPUTS });
  const [closing, setClosing] = useState<{ id: string; next: string | null } | null>(null);

  const agreement = useAgreementAccepted({ storageKey: 'platform-ui-poc:eula', version: '1' });
  const seen = useReleaseNotesSeen({ currentVersion: APP_VERSION, storageKey: 'platform-ui-poc:release-notes' });

  const addTab = () => {
    const id = `c${nextId++}`;
    setTabs((list) => [...list, { value: id, label: `Calculation ${id.slice(1)}` }]);
    setInputs((all) => ({ ...all, [id]: DEFAULT_INPUTS }));
    setActive(id);
  };

  const removeTab = (id: string, next: string | null) => {
    setTabs((list) => list.filter((t) => t.value !== id));
    if (next !== null) setActive(next);
    notify.info('Calculation closed');
  };

  const changeInputs = (id: string, value: CalcInputs) => {
    setInputs((all) => ({ ...all, [id]: value }));
    setTabs((list) => list.map((t) => (t.value === id ? { ...t, dirty: true } : t)));
  };

  const closingLabel = tabs.find((t) => t.value === closing?.id)?.label;

  return (
    <PlatformThemeProvider config={theme} colorScheme={settings.colorScheme} density={settings.density} appearance={settings.appearance}>
      <AppNav onNew={addTab} onOpen={setDialog} />
      <Workspace>
        <WorkspaceTabs
          tabs={tabs}
          value={active}
          onChange={setActive}
          onAdd={addTab}
          onClose={(id, next) => {
            if (tabs.find((t) => t.value === id)?.dirty) setClosing({ id, next });
            else removeTab(id, next);
          }}
          labels={{ add: 'New calculation', list: defaultWorkspaceTabsLabels.list }}
          empty={<EmptyState title="No calculation open">Use “New calculation” to start one.</EmptyState>}
        >
          {(id) => (
            <CalculationWorkspace
              key={id}
              inputs={inputs[id] ?? DEFAULT_INPUTS}
              onInputsChange={(value) => changeInputs(id, value)}
              settings={settings}
            />
          )}
        </WorkspaceTabs>
      </Workspace>

      <ConfirmDialog
        open={closing !== null}
        title={`Close ${closingLabel ?? 'calculation'}?`}
        confirmLabel="Close calculation"
        destructive
        onConfirm={() => {
          if (closing) removeTab(closing.id, closing.next);
          setClosing(null);
        }}
        onCancel={() => setClosing(null)}
      >
        The inputs of this calculation are not saved.
      </ConfirmDialog>

      <SettingsDialog open={dialog === 'settings'} settings={settings} onChange={updateSettings} onClose={() => setDialog(null)} />
      <AboutDialog open={dialog === 'about'} onClose={() => setDialog(null)} />
      <HelpDialog open={dialog === 'help'} onClose={() => setDialog(null)} />
      <ReleaseNotesDialog
        open={agreement.accepted && (seen.shouldOpen || dialog === 'releases')}
        onClose={() => {
          seen.markSeen();
          setDialog(null);
        }}
        appName="CC"
        appTitle="Connection Calculator"
        intro="Connection Calculator checks timber fastener connections."
        releases={RELEASES}
        lastSeenVersion={seen.lastSeenVersion}
      />
      <AgreementDialog
        open={!agreement.accepted}
        title="License agreement"
        note="Available in English only"
        lang="en"
        labels={{ accept: 'I agree', decline: 'I do not agree' }}
        onAccept={agreement.accept}
        onDecline={() => notify.warning('You must accept the agreement to use the calculator.')}
      >
        <p>This proof of concept is used to test releases of the platform UI kit.</p>
        <h3>1. License</h3>
        <p>You may use it to check that a release integrates with a real application.</p>
        <h3>2. Warranty</h3>
        <ul>
          <li>Results are made up.</li>
          <li>Do not design real connections with it.</li>
        </ul>
      </AgreementDialog>
      <ToastHost />
    </PlatformThemeProvider>
  );
}
