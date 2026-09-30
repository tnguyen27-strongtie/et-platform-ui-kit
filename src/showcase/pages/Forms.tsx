import { useState } from 'react';

import {
  Checkbox,
  Combobox,
  FormField,
  isInRange,
  NumberInput,
  OptionCardGroup,
  RadioGroup,
  Select,
  Switch,
  TextInput,
  useFormField,
} from '../../index';
import { sampleDrawing } from '../data';
import { DemoGrid, DemoPage, DemoSection } from '../layout';

/** A custom control wired to its FormField with useFormField (label, hint, error reach it). */
function AngleSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const field = useFormField();
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={90}
        value={value}
        id={field?.id}
        aria-describedby={field?.describedBy}
        aria-invalid={field?.invalid || undefined}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-(--color-brand)"
      />
      <output htmlFor={field?.id} className="w-10 text-right text-sm tabular-nums">
        {value}°
      </output>
    </div>
  );
}

const connectionOptions = [
  { value: 'wood', label: 'Wood to Wood', note: 'most common' },
  { value: 'steel', label: 'Wood to Steel' },
  { value: 'concrete', label: 'Wood to Concrete' },
  { value: 'masonry', label: 'Wood to Masonry', disabled: true },
];

const productOptions = [
  { value: 'sd9', label: 'SD9112 Strong-Drive screw', image: sampleDrawing },
  { value: 'sdws', label: 'SDWS22400 timber screw', image: sampleDrawing },
  { value: 'sdwc', label: 'SDWC15600 truss screw', image: sampleDrawing },
];

export function Forms() {
  const [angle, setAngle] = useState(45);
  const [thickness, setThickness] = useState<number | null>(4);
  const [spacing, setSpacing] = useState<number | null>(0.5);
  const [count, setCount] = useState<number | null>(3);
  const [connection, setConnection] = useState('wood');
  const [materials, setMaterials] = useState<string[]>(['wood']);
  const [product, setProduct] = useState<string>('');
  const [search, setSearch] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>('USA');
  const [plies, setPlies] = useState<number | null>(null);
  const [card, setCard] = useState<string | null>('single');
  const [cardNoCheck, setCardNoCheck] = useState<string | null>('top');
  const [all, setAll] = useState<boolean[]>([true, false]);

  return (
    <DemoPage title="Forms" description="Inputs for calculator parameters. Put every control in a FormField: it wires the label, hint and error for screen readers.">
      <DemoSection
        id="form-field"
        title="FormField"
        description="Label, optional ? help, hint (description) and error around one control. required shows a red label with *; error marks the control invalid. useFormField() wires your own controls the same way."
        code={`<FormField label="Design load" htmlFor="load" required help="Factored load…"
  description="0 to 10,000 lbs" error={loadError}>
  <NumberInput value={load} onChange={setLoad} addonAfter="lbs" />
</FormField>`}
      >
        <DemoGrid>
          <FormField label="Default" htmlFor="ff-default">
            <TextInput placeholder="Value" />
          </FormField>
          <FormField label="With help and hint" htmlFor="ff-help" help="Factored load applied to the connection." description="Shown under the field.">
            <TextInput defaultValue="1250" addonAfter="lbs" />
          </FormField>
          <FormField label="Required with error" htmlFor="ff-error" required error="Project name is required.">
            <TextInput placeholder="Enter a name" />
          </FormField>
          <FormField label="Disabled" htmlFor="ff-disabled" disabled>
            <TextInput defaultValue="Locked value" />
          </FormField>
          <FormField label="Custom control (useFormField)" htmlFor="ff-angle" description="Native range input wired to the field.">
            <AngleSlider value={angle} onChange={setAngle} />
          </FormField>
        </DemoGrid>
      </DemoSection>

      <DemoSection
        id="text-input"
        title="TextInput"
        description="Text values. Units go in addonBefore/addonAfter, never in the value. For numbers use NumberInput."
        code={`<TextInput addonBefore="$" addonAfter="/ft" />
<TextInput multiline minRows={3} />`}
      >
        <DemoGrid>
          <FormField label="Placeholder" htmlFor="ti-ph">
            <TextInput placeholder="e.g. North wall" />
          </FormField>
          <FormField label="Addons" htmlFor="ti-addons">
            <TextInput defaultValue="12.50" addonBefore="$" addonAfter="/ ft" />
          </FormField>
          <FormField label="Multiline" htmlFor="ti-multi" description="Printed on the report.">
            <TextInput multiline minRows={3} defaultValue={'Line one\nLine two'} />
          </FormField>
          <FormField label="Read only" htmlFor="ti-ro" description="Selectable, not editable.">
            <TextInput defaultValue="SDWS22400" readOnly />
          </FormField>
        </DemoGrid>
      </DemoSection>

      <DemoSection
        id="number-input"
        title="NumberInput"
        description="All numeric inputs. Returns number | null (never NaN or a string), accepts . and , as decimal, arrow keys step (Shift ×10) without float drift, out-of-range values are flagged instead of silently changed."
        code={`<NumberInput value={t} onChange={setT} min={1.5} max={3.5} step={0.25} precision={3} addonAfter="in" />`}
      >
        <DemoGrid>
          <FormField
            label="Member thickness"
            htmlFor="num-thickness"
            required
            description="1.5 to 3.5 in. Arrow keys step 0.25 (Shift ×10)."
            error={thickness === null ? 'Required.' : !isInRange(thickness, { min: 1.5, max: 3.5 }) ? 'Must be between 1.5 and 3.5 in.' : undefined}
          >
            <NumberInput value={thickness} onChange={setThickness} min={1.5} max={3.5} step={0.25} precision={3} addonAfter="in" />
          </FormField>
          <FormField label="Spacing (clamped on blur)" htmlFor="num-spacing" description="0 to 1, clamped when you leave the field.">
            <NumberInput value={spacing} onChange={setSpacing} min={0} max={1} step={0.1} clampBehavior="blur" addonAfter="ft" />
          </FormField>
          <FormField label="Fastener count (integer)" htmlFor="num-count">
            <NumberInput value={count} onChange={setCount} min={1} precision={0} />
          </FormField>
          <p className="m-0 self-center text-xs text-text-muted">
            Values: thickness = {JSON.stringify(thickness)}, spacing = {JSON.stringify(spacing)}, count = {JSON.stringify(count)}
          </p>
        </DemoGrid>
      </DemoSection>

      <DemoSection
        id="select"
        title="Select"
        description="Pick from a short list (under ~15 options). Keeps the option value type. Options can have a note, an image, or be disabled."
        code={`<Select value={type} onChange={setType} placeholder="Pick one" options={[
  { value: 'wood', label: 'Wood to Wood', note: 'most common' },
  { value: 'masonry', label: 'Wood to Masonry', disabled: true },
]} />`}
      >
        <DemoGrid>
          <FormField label="Connection type" htmlFor="sel-connection">
            <Select value={connection} options={connectionOptions} onChange={setConnection} />
          </FormField>
          <FormField label="Materials (multiple)" htmlFor="sel-materials">
            <Select multiple value={materials} options={connectionOptions} onChange={setMaterials} />
          </FormField>
          <FormField label="Product (images)" htmlFor="sel-product">
            <Select value={product} options={productOptions} onChange={setProduct} placeholder="Pick a product" />
          </FormField>
          <FormField label="Disabled" htmlFor="sel-disabled" disabled>
            <Select value="wood" options={connectionOptions} onChange={() => undefined} />
          </FormField>
        </DemoGrid>
      </DemoSection>

      <DemoSection
        id="combobox"
        title="Combobox"
        description="Searchable select for long lists. Type to filter; rich labels need searchText."
        code={`<Combobox value={id} onChange={setId} placeholder="Search products" options={products} />`}
      >
        <DemoGrid>
          <FormField label="Product (searchable)" htmlFor="cb-product">
            <Combobox
              value={search}
              onChange={setSearch}
              placeholder="Search products"
              noOptionsText="No product matches"
              options={[
                { value: 'sd9', label: 'SD9112 Strong-Drive screw', note: 'Steel' },
                { value: 'sdws', label: 'SDWS22400 timber screw', note: 'Wood' },
                { value: 'sdwc', label: 'SDWC15600 truss screw', note: 'Wood' },
                { value: 'thd', label: 'THD50400 concrete anchor', note: 'Concrete', disabled: true },
              ]}
            />
          </FormField>
        </DemoGrid>
      </DemoSection>

      <DemoSection
        id="checkbox-switch"
        title="Checkbox and Switch"
        description="Checkbox for options that apply on submit/calculate; Switch for settings that apply immediately. onChange returns a boolean."
        code={`<Checkbox label="Include fasteners" checked={v} onChange={setV} />
<Switch label="Metric units" checked={metric} onChange={setMetric} />
<Checkbox label="Wet service" help="Moisture content above 19% in service." helpLabel="About wet service" />`}
      >
        <div className="flex flex-wrap gap-6">
          <Checkbox label="Include fasteners" defaultChecked />
          <Checkbox label="Show notes" />
          <Checkbox label="Disabled" disabled />
          <Checkbox label="Disabled checked" disabled defaultChecked />
          <Checkbox label="Wet service" help="Moisture content above 19% in service; capacities are reduced." helpLabel="About wet service" />
        </div>
        <div className="flex flex-col gap-1">
          <Checkbox
            label="All members"
            checked={all.every(Boolean)}
            indeterminate={all.some(Boolean) && !all.every(Boolean)}
            onChange={(v) => setAll([v, v])}
          />
          <div className="flex flex-col gap-1 pl-6">
            {['Side member', 'Main member'].map((label, i) => (
              <Checkbox key={label} label={label} checked={all[i]} onChange={(v) => setAll((a) => a.map((x, j) => (j === i ? v : x)))} />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <Switch label="Metric units" defaultChecked />
          <Switch label="Off" />
          <Switch label="Disabled" disabled />
        </div>
      </DemoSection>

      <DemoSection
        id="radio-group"
        title="RadioGroup"
        description="One choice from 2–5 visible options. Keeps number/boolean value types. Arrow keys move the choice."
        code={`<FormField label="Plies" htmlFor="plies">
  <RadioGroup<number> name="plies" value={n} onChange={setN}
    options={[{ value: 1, label: 'One' }, { value: 2, label: 'Two' }]} />
</FormField>`}
      >
        <DemoGrid>
          <FormField label="Country (row)" htmlFor="rg-country">
            <RadioGroup
              name="country"
              value={country}
              onChange={setCountry}
              options={[
                { value: 'USA', label: 'USA' },
                { value: 'Canada', label: 'Canada' },
                { value: 'EU', label: 'EU', disabled: true },
              ]}
            />
          </FormField>
          <FormField label="Plies (column, required)" htmlFor="rg-plies" required error={plies === null ? 'Pick the number of plies.' : undefined}>
            <RadioGroup<number>
              name="plies"
              direction="column"
              value={plies}
              onChange={setPlies}
              options={[
                { value: 1, label: 'One ply' },
                { value: 2, label: 'Two plies' },
                { value: 3, label: 'Three plies' },
              ]}
            />
          </FormField>
        </DemoGrid>
      </DemoSection>

      <DemoSection
        id="option-cards"
        title="OptionCardGroup"
        description="Picture choices (connection types, configurations). Clicking the selected card keeps it selected. description adds a hover/focus tooltip that screen readers always announce."
        code={`<OptionCardGroup aria-label="Shear type" value={v} onChange={setV}
  options={[{ value: 'single', label: 'Single shear', image: <img … />, description: 'One shear plane…' }]} />`}
      >
        <OptionCardGroup
          value={card}
          onChange={setCard}
          aria-label="Shear type"
          options={[
            {
              value: 'single',
              label: 'Single shear',
              description: 'One shear plane: the fastener joins two members.',
              image: <img src={sampleDrawing} alt="" className="h-12 w-20 object-contain" />,
            },
            {
              value: 'double',
              label: 'Double shear',
              description: 'Two shear planes: a main member between two side members.',
              image: <img src={sampleDrawing} alt="" className="h-12 w-20 object-contain" />,
            },
            { value: 'none', label: 'Unavailable', disabled: true, image: <div className="h-12 w-20 rounded-sm bg-true-gray-10" /> },
          ]}
        />
        <OptionCardGroup
          value={cardNoCheck}
          onChange={setCardNoCheck}
          showCheck={false}
          aria-label="Load direction"
          options={[
            { value: 'top', label: 'From top' },
            { value: 'side', label: 'From side' },
          ]}
        />
      </DemoSection>
    </DemoPage>
  );
}
