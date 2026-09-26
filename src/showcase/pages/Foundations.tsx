import {
  Box,
  Button,
  type ColorRole,
  colors,
  DataTable,
  defaultColors,
  layout,
  radius,
  resolveColors,
  scales,
  shadows,
  Stack,
  Typography,
} from '../../index';
import { DemoPage, DemoSection, useShowcase } from '../layout';

const colorGroups: Array<{ title: string; roles: ColorRole[] }> = [
  { title: 'Brand', roles: ['brand', 'brandHover', 'brandActive', 'brandDark', 'brandSubtle', 'brandSelected', 'focusRing', 'accent', 'selection'] },
  { title: 'Text', roles: ['text', 'textMuted', 'textNav', 'textOnBrand', 'link'] },
  { title: 'Surface and border', roles: ['surface', 'surfaceApp', 'surfaceSubtle', 'surfaceDisabled', 'surfaceHover', 'border', 'borderInput', 'borderStrong', 'borderTabs', 'neutral', 'overlay'] },
  { title: 'Status', roles: ['danger', 'warning', 'warningText', 'success', 'successStrong', 'info'] },
];

function ColorsSection() {
  const { colors: config } = useShowcase();
  const values = resolveColors(config);
  const grouped = new Set(colorGroups.flatMap((g) => g.roles));
  const others = (Object.keys(defaultColors) as ColorRole[]).filter((r) => !grouped.has(r));
  return (
    <DemoSection
      id="colors"
      title="Colors"
      description="Use role colors (colors.brand, bg-brand), never hex: they follow the app's color config. Change the brand in the top bar to see the derived shades."
      code={`<Box sx={{ color: colors.danger }} />      // var(--color-danger)
<div className="bg-surface-subtle text-text-muted" />
<PlatformThemeProvider colors={{ brand: '#1565c0' }}>`}
    >
      {[...colorGroups, ...(others.length ? [{ title: 'Other', roles: others }] : [])].map((group) => (
        <div key={group.title} className="flex flex-col gap-2">
          <h3 className="m-0 text-sm font-bold">{group.title}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {group.roles.map((role) => (
              <div key={role} className="flex items-center gap-2">
                <span className="size-8 shrink-0 rounded-sm border border-border" style={{ background: colors[role] }} />
                <span className="flex min-w-0 flex-col text-xs">
                  <span className="truncate font-bold">{role}</span>
                  <span className="truncate font-mono text-text-muted">{values[role]}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <h3 className="m-0 text-sm font-bold">Scales (fixed, not themed)</h3>
      {Object.entries(scales).map(([name, scale]) => (
        <div key={name} className="flex flex-col gap-1">
          <span className="text-xs font-medium">{name}</span>
          <div className="flex">
            {Object.entries(scale)
              .filter(([k]) => k !== 'base')
              .map(([k, v]) => (
                <div key={k} title={`${name}[${k}] ${v}`} className="h-6 flex-1" style={{ backgroundColor: v }} />
              ))}
          </div>
        </div>
      ))}
    </DemoSection>
  );
}

const typeScale = [
  ['h1', 'Page title'],
  ['h2', 'Section title'],
  ['h3', 'Panel title'],
  ['h4', 'Group title'],
  ['h5', 'Small title'],
  ['h6', 'Overline title'],
  ['subtitle1', 'Subtitle / label (medium)'],
  ['body1', 'Body text follows the density setting (14 or 16px).'],
  ['body2', 'Secondary body text, 14px.'],
  ['caption', 'Caption and hints, 12px muted.'],
] as const;

export function Foundations() {
  return (
    <DemoPage title="Foundations" description="Design tokens every component is built from.">
      <ColorsSection />

      <DemoSection
        id="typography"
        title="Typography"
        description="Titles are bold, labels medium, body regular. Headings use a compact scale for tool UIs."
        code={`<Typography variant="h3">Connection</Typography>
<Typography variant="caption">Values in inches</Typography>`}
      >
        <div className="flex flex-col gap-2">
          {typeScale.map(([variant, text]) => (
            <div key={variant} className="flex items-baseline gap-4">
              <span className="w-20 shrink-0 font-mono text-xs text-text-muted">{variant}</span>
              <Typography variant={variant} component="p" sx={{ m: 0 }}>
                {text}
              </Typography>
            </div>
          ))}
        </div>
      </DemoSection>

      <DemoSection id="tokens" title="Radius, shadow, spacing" description="Spacing uses 4px steps (Tailwind p-2 = sx p: 2 = 8px).">
        <h3 className="m-0 text-sm font-bold">Radius</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(radius).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <div className="size-12 border-2 border-brand bg-brand-subtle" style={{ borderRadius: value }} />
              <span className="text-xs">
                {name} <span className="text-text-muted">{value}</span>
              </span>
            </div>
          ))}
        </div>
        <h3 className="m-0 text-sm font-bold">Shadow</h3>
        <div className="flex flex-wrap gap-6">
          {Object.entries(shadows).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className="size-14 rounded-sm bg-surface" style={{ boxShadow: value }} />
              <span className="text-xs">{name}</span>
            </div>
          ))}
        </div>
        <h3 className="m-0 text-sm font-bold">Spacing</h3>
        <div className="flex flex-col gap-1">
          {[1, 2, 3, 4, 6, 8].map((n) => (
            <div key={n} className="flex items-center gap-2 text-xs">
              <span className="w-24 font-mono text-text-muted">
                {n} = {n * 4}px
              </span>
              <span className="h-3 bg-accent" style={{ width: n * 4 }} />
            </div>
          ))}
        </div>
        <h3 className="m-0 text-sm font-bold">Layout sizes</h3>
        <DataTable aria-label="Layout tokens">
          <DataTable.Body>
            {Object.entries(layout).map(([name, value]) => (
              <DataTable.Row key={name}>
                <DataTable.Cell>
                  <code>layout.{name}</code>
                </DataTable.Cell>
                <DataTable.Cell align="right">{value}px</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable.Body>
        </DataTable>
      </DemoSection>

      <DemoSection
        id="layout-primitives"
        title="Box and Stack"
        description="MUI layout primitives re-exported by the kit (apps do not import @mui directly). Tailwind classes work too."
        code={`<Stack direction="row" spacing={2}>…</Stack>
<Box sx={{ p: 2, bgcolor: 'background.default' }}>…</Box>`}
      >
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </Stack>
        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, border: 1, borderColor: 'divider' }}>Box with theme spacing (p: 2 = 8px)</Box>
      </DemoSection>
    </DemoPage>
  );
}
