import { useState } from 'react';

import {
  Box,
  Button,
  type ColorRole,
  colors,
  DataTable,
  defaultColors,
  FormField,
  defaultMaterial,
  defaultShape,
  elevation,
  layout,
  material,
  MathSub,
  MathVar,
  NumberInput,
  radius,
  resolveAppearance,
  shape,
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

const heading = 'm-0 text-sm font-bold';

/** Formulas as the kit renders them: display, inline, inside form fields and inside tables. */
function MathSection() {
  const [w, setW] = useState<number | null>(120);
  const [span, setSpan] = useState<number | null>(12);
  const moment = w != null && span != null ? (w * span * span) / 8 : null;

  return (
    <DemoSection
      id="math"
      title="Math formulas"
      description="Write formulas as MathML. <math> uses the bundled STIX Two Math font; add font-math for symbols in plain text."
      code={`<math display="block">
  <mi>M</mi><mo>=</mo>
  <mfrac><mrow><mi>w</mi><msup><mi>L</mi><mn>2</mn></msup></mrow><mn>8</mn></mfrac>
</math>
<span className="font-math">σ ≤ 0.6 F<sub>y</sub></span>
<MathVar>S</MathVar><MathSub>DS</MathSub>   // variable + upright subscript, also as <Trans components>`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h3 className={heading}>Display formulas</h3>
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {/* Fraction and superscript */}
            <math display="block">
              <mi>M</mi>
              <mo>=</mo>
              <mfrac>
                <mrow>
                  <mi>w</mi>
                  <msup>
                    <mi>L</mi>
                    <mn>2</mn>
                  </msup>
                </mrow>
                <mn>8</mn>
              </mfrac>
            </math>
            {/* Stretched radical and a big operator with limits */}
            <math display="block">
              <msub>
                <mi>f</mi>
                <mi>b</mi>
              </msub>
              <mo>=</mo>
              <msqrt>
                <mrow>
                  <munderover>
                    <mo>∑</mo>
                    <mrow>
                      <mi>i</mi>
                      <mo>=</mo>
                      <mn>1</mn>
                    </mrow>
                    <mi>n</mi>
                  </munderover>
                  <msubsup>
                    <mi>σ</mi>
                    <mi>i</mi>
                    <mn>2</mn>
                  </msubsup>
                </mrow>
              </msqrt>
              <mo>≤</mo>
              <mn>0.6</mn>
              <msub>
                <mi>F</mi>
                <mi>y</mi>
              </msub>
            </math>
            {/* n-th root */}
            <math display="block">
              <mi>d</mi>
              <mo>=</mo>
              <mroot>
                <mfrac>
                  <mrow>
                    <mn>16</mn>
                    <mi>T</mi>
                  </mrow>
                  <mrow>
                    <mi>π</mi>
                    <msub>
                      <mi>τ</mi>
                      <mi>max</mi>
                    </msub>
                  </mrow>
                </mfrac>
                <mn>3</mn>
              </mroot>
            </math>
            {/* Integral */}
            <math display="block">
              <mi>Δ</mi>
              <mo>=</mo>
              <msubsup>
                <mo>∫</mo>
                <mn>0</mn>
                <mi>L</mi>
              </msubsup>
              <mfrac>
                <mrow>
                  <mi>M</mi>
                  <mo>(</mo>
                  <mi>x</mi>
                  <mo>)</mo>
                  <mi>m</mi>
                  <mo>(</mo>
                  <mi>x</mi>
                  <mo>)</mo>
                </mrow>
                <mrow>
                  <mi>E</mi>
                  <mi>I</mi>
                </mrow>
              </mfrac>
              <mspace width="0.17em" />
              <mi>d</mi>
              <mi>x</mi>
            </math>
            {/* Matrix: brackets stretch to the table height */}
            <math display="block">
              <mi mathvariant="bold">K</mi>
              <mo>=</mo>
              <mfrac>
                <mrow>
                  <mi>E</mi>
                  <mi>A</mi>
                </mrow>
                <mi>L</mi>
              </mfrac>
              <mrow>
                <mo>[</mo>
                <mtable>
                  <mtr>
                    <mtd>
                      <mn>1</mn>
                    </mtd>
                    <mtd>
                      <mo>−</mo>
                      <mn>1</mn>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <mo>−</mo>
                      <mn>1</mn>
                    </mtd>
                    <mtd>
                      <mn>1</mn>
                    </mtd>
                  </mtr>
                </mtable>
                <mo>]</mo>
              </mrow>
            </math>
            {/* Piecewise: the brace stretches over both cases */}
            <math display="block">
              <msub>
                <mi>C</mi>
                <mi>p</mi>
              </msub>
              <mo>=</mo>
              <mrow>
                <mo>{'{'}</mo>
                <mtable columnalign="left">
                  <mtr>
                    <mtd>
                      <mn>1.0</mn>
                    </mtd>
                    <mtd>
                      <mtext>if&nbsp;</mtext>
                      <mi>λ</mi>
                      <mo>≤</mo>
                      <mn>0.2</mn>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <mfrac>
                        <mn>1</mn>
                        <msup>
                          <mi>λ</mi>
                          <mn>2</mn>
                        </msup>
                      </mfrac>
                    </mtd>
                    <mtd>
                      <mtext>otherwise</mtext>
                    </mtd>
                  </mtr>
                </mtable>
              </mrow>
            </math>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className={heading}>Inline in text</h3>
          <p className="m-0">
            The bending stress{' '}
            <math>
              <msub>
                <mi>f</mi>
                <mi>b</mi>
              </msub>
              <mo>=</mo>
              <mfrac>
                <mi>M</mi>
                <msub>
                  <mi>S</mi>
                  <mi>x</mi>
                </msub>
              </mfrac>
            </math>{' '}
            must not exceed the allowable stress. Symbols in plain text use{' '}
            <code>font-math</code>: <span className="font-math">σ ≤ 0.6 F<sub>y</sub>, α ≈ 45°, ΔL ± 0.5 mm</span>.
          </p>
          <p className="m-0 text-sm">
            Variables in labels use <code>MathVar</code> and <code>MathSub</code>: design spectral acceleration <MathVar>S</MathVar>
            <MathSub>DS</MathSub> = 1.2 g, response coefficient <MathVar>C</MathVar>
            <MathSub>s</MathSub>. The subscript is upright and does not stretch the line.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className={heading}>In a calculator</h3>
          <div className="grid items-start gap-4 sm:grid-cols-3">
            <FormField
              label={
                <>
                  Uniform load <span className="font-math italic">w</span>
                </>
              }
              htmlFor="math-w"
              help={
                <>
                  Load per unit length, applied over the whole span:{' '}
                  <math>
                    <mi>w</mi>
                    <mo>=</mo>
                    <mfrac>
                      <mi>W</mi>
                      <mi>L</mi>
                    </mfrac>
                  </math>
                </>
              }
            >
              <NumberInput value={w} onChange={setW} min={0} addonAfter="lbs/ft" />
            </FormField>
            <FormField
              label={
                <>
                  Span <span className="font-math italic">L</span>
                </>
              }
              htmlFor="math-span"
            >
              <NumberInput value={span} onChange={setSpan} min={0} addonAfter="ft" />
            </FormField>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Maximum moment</span>
              <output htmlFor="math-w math-span" aria-live="polite">
                <math display="block">
                  <msub>
                    <mi>M</mi>
                    <mi>max</mi>
                  </msub>
                  <mo>=</mo>
                  <mfrac>
                    <mrow>
                      <mn>{w ?? '–'}</mn>
                      <mo>×</mo>
                      <msup>
                        <mn>{span ?? '–'}</mn>
                        <mn>2</mn>
                      </msup>
                    </mrow>
                    <mn>8</mn>
                  </mfrac>
                  <mo>=</mo>
                  <mn>{moment == null ? '–' : moment.toLocaleString('en-US')}</mn>
                  <mtext>&nbsp;lbs·ft</mtext>
                </math>
              </output>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className={heading}>In a table</h3>
          <DataTable aria-label="Section properties">
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.Cell>Property</DataTable.Cell>
                <DataTable.Cell>Formula</DataTable.Cell>
                <DataTable.Cell align="right">Value</DataTable.Cell>
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              <DataTable.Row>
                <DataTable.Cell>Moment of inertia</DataTable.Cell>
                <DataTable.Cell>
                  <math displaystyle="true">
                    <mi>I</mi>
                    <mo>=</mo>
                    <mfrac>
                      <mrow>
                        <mi>b</mi>
                        <msup>
                          <mi>h</mi>
                          <mn>3</mn>
                        </msup>
                      </mrow>
                      <mn>12</mn>
                    </mfrac>
                  </math>
                </DataTable.Cell>
                <DataTable.Cell align="right">
                  415.3 in<sup>4</sup>
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Section modulus</DataTable.Cell>
                <DataTable.Cell>
                  <math displaystyle="true">
                    <mi>S</mi>
                    <mo>=</mo>
                    <mfrac>
                      <mrow>
                        <mi>b</mi>
                        <msup>
                          <mi>h</mi>
                          <mn>2</mn>
                        </msup>
                      </mrow>
                      <mn>6</mn>
                    </mfrac>
                  </math>
                </DataTable.Cell>
                <DataTable.Cell align="right">
                  73.8 in<sup>3</sup>
                </DataTable.Cell>
              </DataTable.Row>
              <DataTable.Row>
                <DataTable.Cell>Radius of gyration</DataTable.Cell>
                <DataTable.Cell>
                  <math displaystyle="true">
                    <mi>r</mi>
                    <mo>=</mo>
                    <msqrt>
                      <mfrac>
                        <mi>I</mi>
                        <mi>A</mi>
                      </mfrac>
                    </msqrt>
                  </math>
                </DataTable.Cell>
                <DataTable.Cell align="right">2.17 in</DataTable.Cell>
              </DataTable.Row>
            </DataTable.Body>
          </DataTable>
        </div>
      </div>
    </DemoSection>
  );
}

export function Foundations() {
  const appearance = resolveAppearance(useShowcase().config.appearance);
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

      <MathSection />

      <DemoSection
        id="tokens"
        title="Radius, shadow, spacing"
        description="Spacing uses 4px steps (Tailwind p-2 = sx p: 2 = 8px). Radius by role, shadows and materials follow the appearance picked in the top bar."
      >
        <h3 className="m-0 text-sm font-bold">Radius by role</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(shape).map(([name, value]) => (
            <div key={name} className="flex flex-col items-center gap-1">
              <div className="h-12 w-16 border-2 border-brand bg-brand-subtle" style={{ borderRadius: value }} />
              <span className="text-xs">
                shape.{name}{' '}
                <span className="text-text-muted">{appearance.shape?.[name as keyof typeof defaultShape] ?? defaultShape[name as keyof typeof defaultShape]}</span>
              </span>
            </div>
          ))}
        </div>
        <h3 className="m-0 text-sm font-bold">Radius steps</h3>
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
          {Object.keys(shadows).map((name) => (
            <div key={name} className="flex flex-col items-center gap-2">
              <div className="size-14 rounded-sm bg-surface" style={{ boxShadow: elevation[name as keyof typeof elevation] }} />
              <span className="text-xs">elevation.{name}</span>
            </div>
          ))}
        </div>
        <h3 className="m-0 text-sm font-bold">Materials</h3>
        <div className="flex flex-wrap gap-4 rounded-sm p-4" style={{ background: material.app }}>
          {(Object.keys(defaultMaterial) as Array<keyof typeof defaultMaterial>)
            .filter((name) => name !== 'filter' && name !== 'scrimFilter' && name !== 'app')
            .map((name) => (
              <div key={name} className="flex flex-col items-center gap-1">
                <div className="size-14 rounded-sm border border-border" style={{ background: material[name], backdropFilter: material.filter }} />
                <span className="text-xs">material.{name}</span>
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
