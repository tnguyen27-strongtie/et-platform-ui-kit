import {
  Alert,
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  FormField,
  RadioGroup,
  Select,
  Stack,
  Switch,
  TextInput,
  notify,
  parseThemeConfig,
  themeConfigToJson,
} from '@platform/ui';
import { useState } from 'react';
import { appearanceOptions, type Settings } from '../lib/settings';

interface SettingsDialogProps {
  open: boolean;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
}

export function SettingsDialog({ open, settings, onChange, onClose }: SettingsDialogProps) {
  const [themeText, setThemeText] = useState('');
  const parsed = themeText.trim() ? parseThemeConfig(themeText) : null;

  return (
    <Dialog open={open} onClose={onClose} dismissible="escape" maxWidth="sm" fullWidth>
      <DialogHeader onClose={onClose}>Settings</DialogHeader>
      <DialogBody>
        <Stack spacing={2}>
          <FormField label="Color scheme" htmlFor="color-scheme">
            <RadioGroup
              name="color-scheme"
              value={settings.colorScheme}
              onChange={(colorScheme) => onChange({ colorScheme })}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
          </FormField>
          <FormField label="Appearance" htmlFor="appearance">
            <Select value={settings.appearance} onChange={(appearance) => onChange({ appearance })} options={appearanceOptions} />
          </FormField>
          <FormField label="Number format" htmlFor="locale" description="Used by the results grid.">
            <Select
              value={settings.locale}
              onChange={(locale) => onChange({ locale })}
              options={[
                { value: 'en-US', label: 'English (1,234.5)' },
                { value: 'de-DE', label: 'Deutsch (1.234,5)' },
                { value: 'vi-VN', label: 'Tiếng Việt (1.234,5)' },
              ]}
            />
          </FormField>
          <Switch label="Larger text" checked={settings.density === 'expanded'} onChange={(on) => onChange({ density: on ? 'expanded' : 'standard' })} />
          <Switch
            label="Drawing and results side by side"
            checked={settings.secondarySplit === 'columns'}
            onChange={(on) => onChange({ secondarySplit: on ? 'columns' : 'rows' })}
          />
          <FormField label="Theme file (JSON)" htmlFor="theme-json" description="Paste a theme exported from the theme builder to validate it.">
            <TextInput multiline minRows={3} value={themeText} onChange={(e) => setThemeText(e.target.value)} />
          </FormField>
          {parsed && !parsed.ok && (
            <Alert severity="error" title="Invalid theme">
              {parsed.errors.join(' ')}
            </Alert>
          )}
          {parsed?.ok && (
            <Alert severity="success" title="Valid theme">
              <pre className="m-0 text-xs whitespace-pre-wrap">{themeConfigToJson(parsed.config)}</pre>
            </Alert>
          )}
        </Stack>
      </DialogBody>
      <DialogFooter>
        <Button
          onClick={() => {
            onChange({ colorScheme: 'light', density: 'standard', appearance: 'classic', secondarySplit: 'rows', locale: 'en-US' });
            notify.success('Settings reset');
          }}
        >
          Reset
        </Button>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
