import {
  Accordion,
  Card,
  Checkbox,
  Combobox,
  ExpandCollapseAllButton,
  FormField,
  MathSub,
  MathVar,
  NumberInput,
  OptionCardGroup,
  RadioGroup,
  TextInput,
  cn,
  isInRange,
  useAccordionGroup,
  useFormField,
} from '@platform/ui';
import { LIMITS, type CalcInputs, type LoadDuration, type ShearType } from '../lib/calc';
import { speciesOptions } from '../lib/data';

interface InputFormProps {
  inputs: CalcInputs;
  onChange: (inputs: CalcInputs) => void;
}

function rangeError(value: number | null, limits: { min: number; max: number }, unit: string) {
  if (value === null) return 'Required.';
  return isInRange(value, limits) ? undefined : `Must be between ${limits.min} and ${limits.max}${unit}.`;
}

export function InputForm({ inputs, onChange }: InputFormProps) {
  const group = useAccordionGroup(['members', 'fasteners', 'loads'] as const);
  const set = <K extends keyof CalcInputs>(key: K, value: CalcInputs[K]) => onChange({ ...inputs, [key]: value });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end">
        <ExpandCollapseAllButton group={group} />
      </div>

      <Accordion title="Members" help="Thicknesses are actual, not nominal, sizes." helpLabel="About members" {...group.item('members')}>
        <div className="grid gap-3 md:grid-cols-2">
          <Card role="group" title="Species" titleAs="h4" padding="md">
            <FormField label="Wood species" htmlFor="species" required description="Type to search, accents are ignored.">
              <Combobox value={inputs.species} onChange={(v) => set('species', v)} options={speciesOptions} placeholder="Search species" />
            </FormField>
          </Card>
          <Card role="group" title="Side and main member thickness" titleAs="h4" padding="md" wrapTitle>
            <div className="flex flex-col gap-2">
              <FormField
                label={
                  <>
                    <MathVar>t</MathVar>
                    <MathSub>s</MathSub> side member
                  </>
                }
                htmlFor="side"
                required
                error={rangeError(inputs.sideThickness, LIMITS.sideThickness, ' in')}
              >
                <NumberInput value={inputs.sideThickness} onChange={(v) => set('sideThickness', v)} step={0.25} {...LIMITS.sideThickness} addonAfter="in" />
              </FormField>
              <FormField
                label="Main member"
                htmlFor="main"
                required
                help="Measured perpendicular to the grain."
                error={rangeError(inputs.mainThickness, LIMITS.mainThickness, ' in')}
              >
                <NumberInput
                  value={inputs.mainThickness}
                  onChange={(v) => set('mainThickness', v)}
                  step={0.25}
                  clampBehavior="blur"
                  {...LIMITS.mainThickness}
                  addonAfter="in"
                />
              </FormField>
            </div>
          </Card>
        </div>
      </Accordion>

      <Accordion title="Fasteners" {...group.item('fasteners')}>
        <div className="flex flex-col gap-3">
          <FormField label="Shear type" htmlFor="shear">
            <OptionCardGroup<ShearType>
              aria-label="Shear type"
              value={inputs.shear}
              onChange={(v) => set('shear', v)}
              options={[
                { value: 'single', label: 'Single shear', image: <img src="/single-shear.svg" alt="" width={96} height={64} />, description: 'One shear plane between two members.' },
                { value: 'double', label: 'Double shear', image: <img src="/double-shear.svg" alt="" width={96} height={64} />, description: 'Two shear planes: a main member between two side members.' },
              ]}
            />
          </FormField>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Rows" htmlFor="rows" required error={rangeError(inputs.rows, LIMITS.rows, '')}>
              <NumberInput value={inputs.rows} onChange={(v) => set('rows', v)} {...LIMITS.rows} />
            </FormField>
            <FormField label="Fasteners per row" htmlFor="per-row" description="Long rows reduce capacity (group action).">
              <RangeControl value={inputs.perRow ?? 1} onChange={(v) => set('perRow', v)} {...LIMITS.perRow} />
            </FormField>
          </div>
          <Checkbox label="Include plain steel fasteners" checked={inputs.includeSteel} onChange={(v) => set('includeSteel', v)} />
        </div>
      </Accordion>

      <Accordion title="Loads" {...group.item('loads')}>
        <div className="flex flex-col gap-3">
          <FormField label="Demand" htmlFor="demand" required error={inputs.demand === null ? 'Required.' : undefined}>
            <NumberInput value={inputs.demand} onChange={(v) => set('demand', v)} step={50} {...LIMITS.demand} addonAfter="lbs" />
          </FormField>
          <FormField label="Load duration" htmlFor="duration">
            <RadioGroup<LoadDuration>
              name="duration"
              value={inputs.duration}
              onChange={(v) => set('duration', v)}
              direction="column"
              options={[
                { value: 'permanent', label: 'Permanent (0.9)' },
                { value: 'normal', label: 'Normal (1.0)' },
                { value: 'wind', label: 'Wind or seismic (1.6)' },
              ]}
            />
          </FormField>
          <Checkbox
            label="Wet service"
            checked={inputs.wetService}
            onChange={(v) => set('wetService', v)}
            help="Moisture content above 19% in service."
            helpLabel="About wet service"
          />
          <FormField label="Notes" htmlFor="notes" description='Type "fail" to simulate a failed request.'>
            <TextInput multiline minRows={2} value={inputs.notes} onChange={(e) => set('notes', e.target.value)} />
          </FormField>
        </div>
      </Accordion>
    </div>
  );
}

/** An app-made control: it reads its id, description and state from the surrounding FormField. */
function RangeControl({ value, onChange, min, max }: { value: number; onChange: (value: number) => void; min: number; max: number }) {
  const field = useFormField();
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        id={field?.id}
        aria-labelledby={field?.labelId}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || undefined}
        disabled={field?.disabled}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn('flex-1 accent-brand', field?.disabled && 'opacity-50')}
      />
      <output htmlFor={field?.id} className="w-6 text-right tabular-nums">
        {value}
      </output>
    </div>
  );
}
