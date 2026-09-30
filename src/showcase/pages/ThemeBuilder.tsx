import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { type ChangeEvent, useRef, useState } from 'react';

import {
  Alert,
  APPEARANCE_NAMES,
  APPEARANCES,
  type AppearanceName,
  appearanceCssVars,
  Button,
  Checkbox,
  Chip,
  type ColorRole,
  contrastRatio,
  DataTable,
  defaultColors,
  FormField,
  IconButton,
  isAppearanceName,
  isValidColor,
  notify,
  OptionCardGroup,
  type PlatformAppearance,
  parseRgb,
  parseThemeConfig,
  RadioGroup,
  resolveAppearance,
  resolveColors,
  Select,
  Switch,
  Tab,
  TabPanel,
  Tabs,
  TextInput,
  themeConfigToJson,
  themeConfigToTs,
  Tooltip,
} from '../../index';
import { Code, DemoGrid, DemoPage, DemoSection, useShowcase } from '../layout';

const roleGroups: Array<{ title: string; hint: string; roles: ColorRole[] }> = [
  // `brand` itself is edited in the section above.
  { title: 'Brand shades', hint: 'Derived from brand unless you set them.', roles: ['brandHover', 'brandActive', 'brandDark', 'brandSubtle', 'brandSelected', 'focusRing', 'accent', 'selection'] },
  { title: 'Text', hint: '', roles: ['text', 'textMuted', 'textNav', 'textOnBrand', 'link'] },
  { title: 'Surfaces and borders', hint: '', roles: ['surface', 'surfaceApp', 'surfaceSubtle', 'surfaceDisabled', 'surfaceHover', 'border', 'borderInput', 'borderStrong', 'borderTabs', 'neutral'] },
  { title: 'Status', hint: '', roles: ['danger', 'warning', 'warningText', 'success', 'successStrong', 'info'] },
  { title: 'Other', hint: '', roles: ['scrollbarThumb', 'scrollbarThumbMenu', 'overlay'] },
];

const derivedFromBrand = new Set<ColorRole>(['brandHover', 'brandActive', 'brandDark', 'brandSubtle', 'brandSelected', 'focusRing', 'accent', 'selection', 'scrollbarThumb']);

/** #rrggbb for the native color picker (it only understands 6-digit hex). */
function toHex(color: string): string {
  const rgb = parseRgb(color);
  if (!rgb) return '#000000';
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

interface ColorFieldProps {
  role: ColorRole;
  /** The override in the config, if any. */
  value: string | undefined;
  /** What the role resolves to now (default or derived). */
  resolved: string;
  origin: 'custom' | 'derived' | 'default';
  onChange: (value: string | undefined) => void;
}

/** Text field + native picker. Only valid colors reach the theme; empty = back to default. */
function ColorField({ role, value, resolved, origin, onChange }: ColorFieldProps) {
  const [draft, setDraft] = useState(value ?? '');
  // Follow outside changes (import, reset): adjust state during render instead of in an effect.
  const [shownValue, setShownValue] = useState(value);
  if (shownValue !== value) {
    setShownValue(value);
    setDraft(value ?? '');
  }
  const invalid = draft.trim() !== '' && !isValidColor(draft);

  return (
    <FormField
      label={role}
      htmlFor={`color-${role}`}
      error={invalid ? 'Use #rrggbb, rgb() or hsl().' : undefined}
      description={origin === 'custom' ? 'Custom' : origin === 'derived' ? `Derived from brand: ${resolved}` : `Default: ${resolved}`}
    >
      <TextInput
        value={draft}
        placeholder={resolved}
        spellCheck={false}
        onChange={(e) => {
          const next = e.target.value;
          setDraft(next);
          if (next.trim() === '') onChange(undefined);
          else if (isValidColor(next)) onChange(next.trim());
        }}
        addonBefore={
          <input
            type="color"
            aria-label={`${role} color picker`}
            value={toHex(value && isValidColor(value) ? value : resolved)}
            onChange={(e) => {
              setDraft(e.target.value);
              onChange(e.target.value);
            }}
            className="size-6 cursor-pointer border-0 bg-transparent p-0"
          />
        }
        addonAfter={
          value ? (
            <Tooltip title="Back to default">
              <IconButton aria-label={`Reset ${role}`} size="small" onClick={() => onChange(undefined)}>
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : undefined
        }
      />
    </FormField>
  );
}

type Pair = { label: string; fg: ColorRole | string; bg: ColorRole | string; min: number; note: string };

const pairs: Pair[] = [
  { label: 'Primary button text', fg: 'textOnBrand', bg: 'brand', min: 4.5, note: 'Text' },
  { label: 'Body text', fg: 'text', bg: 'surface', min: 4.5, note: 'Text' },
  { label: 'Hints and muted text', fg: 'textMuted', bg: 'surface', min: 4.5, note: 'Text' },
  { label: 'Muted text on app background', fg: 'textMuted', bg: 'surfaceApp', min: 4.5, note: 'Text' },
  { label: 'Links', fg: 'link', bg: 'surface', min: 4.5, note: 'Text' },
  { label: 'Error messages', fg: 'danger', bg: 'surface', min: 4.5, note: 'Text' },
  { label: 'Danger button text', fg: '#ffffff', bg: 'danger', min: 4.5, note: 'Text' },
  { label: 'Warning alert text', fg: 'warningText', bg: 'surface', min: 4.5, note: 'Text' },
  { label: 'Selected option', fg: 'text', bg: 'brandSelected', min: 4.5, note: 'Text' },
  { label: 'Focus ring, checked controls', fg: 'brand', bg: 'surface', min: 3, note: 'UI component' },
  { label: 'Input border', fg: 'borderInput', bg: 'surface', min: 3, note: 'UI component (WCAG 1.4.11)' },
];

/**
 * Miniature of an appearance, drawn from its own values (not the active theme), so every option
 * shows what it would look like: backdrop, a panel, a field and a primary button.
 */
function AppearancePreview({ appearance }: { appearance: PlatformAppearance }) {
  const vars = appearanceCssVars(appearance);
  return (
    <span aria-hidden="true" className="flex h-20 w-40 items-center justify-center p-2" style={{ background: vars['--material-app'], borderRadius: vars['--radius-panel'] }}>
      <span
        className="flex w-full flex-col gap-1.5 border border-border-strong p-2"
        style={{
          background: vars['--material-panel'],
          backdropFilter: vars['--material-filter'],
          borderRadius: vars['--radius-panel'],
          boxShadow: vars['--shadow-panel'],
        }}
      >
        <span className="block h-3 border border-border-input bg-surface" style={{ borderRadius: vars['--radius-field'] }} />
        <span className="block h-3 w-14 self-end bg-brand" style={{ borderRadius: vars['--radius-control'] }} />
      </span>
    </span>
  );
}

const customAppearanceCode = `import { defineAppearance, PlatformThemeProvider } from '@platform/ui';

// Start from a built-in appearance and change only what differs.
export const productGlass = defineAppearance(
  {
    name: 'product-glass',
    shape: { control: '0.75rem', dialog: '1rem' },
    material: { filter: 'blur(12px) saturate(160%)' },
  },
  'glass',
);

<PlatformThemeProvider config={theme} appearance={productGlass}>`;

function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    notify.success(`${what} copied`);
  } catch {
    notify.error('Copy is blocked in this browser. Select the text and copy it instead.');
  }
}

export function ThemeBuilder() {
  const { config, setConfig } = useShowcase();
  const resolved = resolveColors(config.colors);
  const overrides = config.colors ?? {};
  const [showAll, setShowAll] = useState(false);
  const [format, setFormat] = useState<'json' | 'ts'>('json');
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<{ errors: string[]; warnings: string[] } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const setRole = (role: ColorRole, value: string | undefined) =>
    setConfig((c) => {
      const colors = { ...c.colors };
      if (value === undefined) delete colors[role];
      else colors[role] = value;
      return { ...c, colors: Object.keys(colors).length ? colors : undefined };
    });

  const originOf = (role: ColorRole): ColorFieldProps['origin'] =>
    overrides[role] ? 'custom' : overrides.brand && derivedFromBrand.has(role) ? 'derived' : 'default';

  const json = themeConfigToJson(config);
  const ts = themeConfigToTs(config);
  const exported = format === 'json' ? json : ts;
  const filename = format === 'json' ? 'theme.json' : 'theme.config.ts';
  const customCount = Object.keys(overrides).length;

  const applyImport = (text: string) => {
    const result = parseThemeConfig(text);
    if (result.ok) {
      setConfig(result.config);
      setImportResult({ errors: [], warnings: result.warnings });
      notify.success(`Theme ${result.config.name ? `"${result.config.name}" ` : ''}applied`);
    } else {
      setImportResult({ errors: result.errors, warnings: result.warnings });
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    setImportText(text);
    applyImport(text);
  };

  const appearanceName = resolveAppearance(config.appearance).name;

  return (
    <DemoPage
      title="Theme builder"
      description="Changes apply to the whole showcase right away (and are kept when you reload), so you can open any page to check the result. Export the theme file when you are done."
    >
      <DemoSection
        id="appearance"
        title="Appearance"
        description="The visual style of every component: shape, depth, surface material, font and neutral colors. The brand color and all component APIs stay the same, so an app changes style by changing one value."
        code={customAppearanceCode}
      >
        <OptionCardGroup<AppearanceName>
          aria-label="Appearance"
          value={isAppearanceName(appearanceName) ? appearanceName : null}
          onChange={(appearance) => setConfig((c) => ({ ...c, appearance: appearance === 'classic' ? undefined : appearance }))}
          options={APPEARANCE_NAMES.map((name) => ({
            value: name,
            label: APPEARANCES[name].label ?? name,
            description: APPEARANCES[name].description,
            image: <AppearancePreview appearance={APPEARANCES[name]} />,
          }))}
        />
        <p className="m-0 text-sm text-text-muted">
          {resolveAppearance(config.appearance).description} Users who turn on the system&apos;s reduce-transparency setting get solid surfaces.
        </p>
      </DemoSection>

      <DemoSection
        id="brand"
        title="Brand and text size"
        description="Most apps only need a brand color: hover, active, subtle, selected and focus shades are derived from it."
      >
        <DemoGrid>
          <FormField label="Theme name" htmlFor="theme-name" description="Stored in the file; optional.">
            <TextInput
              value={config.name ?? ''}
              placeholder="e.g. Demo Calculator"
              onChange={(e) => setConfig((c) => ({ ...c, name: e.target.value || undefined }))}
            />
          </FormField>
          <ColorField role="brand" value={overrides.brand} resolved={resolved.brand} origin={originOf('brand')} onChange={(v) => setRole('brand', v)} />
          <FormField label="Default text size" htmlFor="theme-density">
            <RadioGroup<'standard' | 'expanded'>
              name="theme-density"
              value={config.density ?? 'standard'}
              onChange={(density) => setConfig((c) => ({ ...c, density }))}
              options={[
                { value: 'standard', label: 'Standard (14px)' },
                { value: 'expanded', label: 'Expanded (16px)' },
              ]}
            />
          </FormField>
          <div className="flex flex-col gap-2 self-end">
            <div className="flex flex-wrap items-center gap-2">
              {(['brand', 'brandHover', 'brandActive', 'brandSubtle', 'brandSelected', 'focusRing'] as const).map((r) => (
                <Tooltip key={r} title={`${r}: ${resolved[r]}`}>
                  <span role="img" tabIndex={0} aria-label={`${r} ${resolved[r]}`} className="size-8 rounded-sm border border-border" style={{ background: resolved[r] }} />
                </Tooltip>
              ))}
            </div>
            <Button startIcon={<RestartAltIcon />} onClick={() => setConfig({})} disabled={!customCount && !config.density && !config.name && !config.appearance}>
              Reset to kit defaults
            </Button>
          </div>
        </DemoGrid>
        <div className="flex flex-wrap items-center gap-3 rounded-sm border border-border bg-surface-app p-3">
          <span className="text-xs font-bold text-text-muted">Preview</span>
          <Button variant="primary">Calculate</Button>
          <Button>Default</Button>
          <Button variant="text">Text</Button>
          <Checkbox label="Checked" defaultChecked />
          <Switch label="On" defaultChecked />
          <Chip label="Selected" size="small" color="primary" />
          <Select aria-label="Preview select" value="a" onChange={() => undefined} options={[{ value: 'a', label: 'Wood to Wood' }]} />
        </div>
      </DemoSection>

      <DemoSection
        id="roles"
        title="Color roles"
        description={`${customCount} role${customCount === 1 ? '' : 's'} customized. Leave a field empty to use the default; only valid colors are applied.`}
      >
        <Checkbox label="Show all roles (advanced)" checked={showAll} onChange={setShowAll} />
        {roleGroups
          .filter((g) => showAll || g.title === 'Brand shades' || g.roles.some((r) => overrides[r]))
          .map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
              <h3 className="m-0 text-sm font-bold">
                {group.title} {group.hint && <span className="font-normal text-text-muted">— {group.hint}</span>}
              </h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.roles
                  .filter((r) => showAll || group.title === 'Brand shades' || overrides[r])
                  .map((role) => (
                    <ColorField key={role} role={role} value={overrides[role]} resolved={resolved[role]} origin={originOf(role)} onChange={(v) => setRole(role, v)} />
                  ))}
              </div>
            </div>
          ))}
      </DemoSection>

      <DemoSection
        id="contrast"
        title="Contrast check"
        description="WCAG 2.1 AA: text needs 4.5:1 against its background, UI parts such as borders and focus rings 3:1. Some default colors do not pass; fix them here if the product must meet AA."
      >
        <DataTable aria-label="Contrast results">
          <DataTable.Head>
            <DataTable.Row>
              <DataTable.Cell>Pair</DataTable.Cell>
              <DataTable.Cell>Sample</DataTable.Cell>
              <DataTable.Cell align="right">Ratio</DataTable.Cell>
              <DataTable.Cell align="right">Needs</DataTable.Cell>
              <DataTable.Cell>Result</DataTable.Cell>
            </DataTable.Row>
          </DataTable.Head>
          <DataTable.Body>
            {pairs.map((p) => {
              const fg = p.fg in defaultColors ? resolved[p.fg as ColorRole] : p.fg;
              const bg = p.bg in defaultColors ? resolved[p.bg as ColorRole] : p.bg;
              const ratio = contrastRatio(fg, bg);
              const pass = ratio !== null && ratio >= p.min;
              return (
                <DataTable.Row key={p.label} data-testid={`contrast-${p.label}`}>
                  <DataTable.Cell>
                    {p.label}
                    <span className="block text-text-muted">
                      {p.fg} on {p.bg}
                    </span>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <span className="inline-block rounded-sm border border-border px-2 py-1 text-sm font-medium" style={{ color: fg, background: bg }}>
                      Aa 123
                    </span>
                  </DataTable.Cell>
                  <DataTable.Cell align="right">{ratio === null ? '—' : `${ratio.toFixed(2)}:1`}</DataTable.Cell>
                  <DataTable.Cell align="right">
                    {p.min}:1 <span className="block text-text-muted">{p.note}</span>
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <Chip size="small" label={ratio === null ? 'n/a' : pass ? 'Pass' : 'Fail'} color={ratio === null ? 'default' : pass ? 'success' : 'error'} />
                  </DataTable.Cell>
                </DataTable.Row>
              );
            })}
          </DataTable.Body>
        </DataTable>
      </DemoSection>

      <DemoSection
        id="export"
        title="Export and import"
        description="The file contains only what you changed; everything else keeps following the kit defaults (and their future fixes)."
      >
        <Tabs id="theme-format" value={format} onChange={setFormat} aria-label="Export format">
          <Tab value="json" label="theme.json" />
          <Tab value="ts" label="theme.config.ts" />
        </Tabs>
        {(['json', 'ts'] as const).map((f) => (
          <TabPanel key={f} tabsId="theme-format" value={f} current={format}>
            <Code>{exported}</Code>
          </TabPanel>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button startIcon={<ContentCopyIcon />} onClick={() => copy(exported, filename)}>
            Copy {filename}
          </Button>
          <Button variant="primary" startIcon={<DownloadIcon />} onClick={() => download(filename, exported, format === 'json' ? 'application/json' : 'text/plain')}>
            Download {filename}
          </Button>
        </div>

        <h3 className="m-0 text-sm font-bold">Import</h3>
        <FormField label="Paste a theme.json" htmlFor="theme-import">
          <TextInput multiline minRows={4} value={importText} spellCheck={false} placeholder={'{\n  "version": 1,\n  "colors": { "brand": "#1f5f99" }\n}'} onChange={(e) => setImportText(e.target.value)} />
        </FormField>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => applyImport(importText)} disabled={!importText.trim()}>
            Apply pasted theme
          </Button>
          <Button startIcon={<FileUploadIcon />} onClick={() => fileInput.current?.click()}>
            Open theme.json…
          </Button>
          <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={onFile} data-testid="theme-file" />
        </div>
        {importResult && importResult.errors.length > 0 && (
          <Alert severity="error" title="Theme not applied">
            <ul className="m-0 pl-4">
              {importResult.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Alert>
        )}
        {importResult && importResult.warnings.length > 0 && (
          <Alert severity="warning" title={importResult.errors.length ? 'Also' : 'Applied with warnings'}>
            <ul className="m-0 pl-4">
              {importResult.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Alert>
        )}
      </DemoSection>

      <DemoSection id="use" title="Use in a project" description="Commit the exported file next to the app entry and pass it to the provider.">
        <ol className="m-0 flex flex-col gap-3 pl-5 text-sm">
          <li>
            Download <code>theme.config.ts</code> (or <code>theme.json</code>) and save it in the app, e.g. <code>apps/fd/src/theme.config.ts</code>.
          </li>
          <li>
            Pass it to the provider in <code>main.tsx</code>:
            <Code>{`import '@platform/ui/theme.css';
import { PlatformThemeProvider, ToastHost } from '@platform/ui';
import theme from './theme.config';

createRoot(root).render(
  <PlatformThemeProvider config={theme}>
    <App />
    <ToastHost />
  </PlatformThemeProvider>,
);`}</Code>
          </li>
          <li>
            A user setting can still override it, e.g. text size: <code>{'<PlatformThemeProvider config={theme} density={userSettings.density}>'}</code>.
          </li>
          <li>
            Loading the theme at runtime (per customer, from an API)? Validate it first:
            <Code>{`const result = parseThemeConfig(await fetch('/theme.json').then((r) => r.text()));
const theme = result.ok ? result.config : {};   // fall back to kit defaults on errors
if (!result.ok) console.warn(result.errors);`}</Code>
          </li>
          <li>To change it later, open this page, Import the file, edit, and export again.</li>
        </ol>
      </DemoSection>
    </DemoPage>
  );
}
