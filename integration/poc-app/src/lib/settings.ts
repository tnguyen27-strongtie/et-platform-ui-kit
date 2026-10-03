import { APPEARANCE_NAMES, isAppearanceName, type AppearanceName } from '@platform/ui';
import { useCallback, useState } from 'react';

export type ColorSchemeSetting = 'light' | 'dark' | 'system';

export interface Settings {
  colorScheme: ColorSchemeSetting;
  density: 'standard' | 'expanded';
  appearance: AppearanceName;
  secondarySplit: 'rows' | 'columns';
  locale: 'en-US' | 'de-DE' | 'vi-VN';
}

const KEY = 'platform-ui-poc:settings';
const DEFAULTS: Settings = { colorScheme: 'light', density: 'standard', appearance: 'classic', secondarySplit: 'rows', locale: 'en-US' };

export const appearanceOptions = APPEARANCE_NAMES.map((name) => ({ value: name, label: name[0]!.toUpperCase() + name.slice(1) }));

function load(): Settings {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Settings>;
    // Stored settings may come from an older app version: drop an appearance the kit no longer has.
    const appearance = isAppearanceName(stored.appearance) ? stored.appearance : DEFAULTS.appearance;
    return { ...DEFAULTS, ...stored, appearance };
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(load);
  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // Storage blocked: settings last for this visit only.
      }
      return next;
    });
  }, []);
  return [settings, update] as const;
}
