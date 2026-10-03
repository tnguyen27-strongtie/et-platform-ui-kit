import { Button, ErrorBoundary, Section, SectionLayout, defaultErrorBoundaryLabels, notify } from '@platform/ui';
import { useState } from 'react';
import { DEFAULT_INPUTS, calculate, missingInput, type CalcInputs, type CalcResult } from '../lib/calc';
import type { Settings } from '../lib/settings';
import { IllustrationPanel } from './IllustrationPanel';
import { InputForm } from './InputForm';
import { OutputPanel } from './OutputPanel';

interface CalculationWorkspaceProps {
  inputs: CalcInputs;
  onInputsChange: (inputs: CalcInputs) => void;
  settings: Settings;
}

type OutputTab = 'results' | 'summary';

/** One calculation: the three-section layout every calculator app uses. */
export function CalculationWorkspace({ inputs, onInputsChange, settings }: CalculationWorkspaceProps) {
  const [result, setResult] = useState<CalcResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [requestFailed, setRequestFailed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [outputTab, setOutputTab] = useState<OutputTab>('results');

  const run = () => {
    const missing = missingInput(inputs);
    if (missing) {
      notify.error(missing);
      return;
    }
    setCalculating(true);
    setRequestFailed(false);
    // Simulates a server round trip, so loading states are visible and testable.
    window.setTimeout(() => {
      setCalculating(false);
      if (inputs.notes.trim().toLowerCase() === 'fail') {
        setRequestFailed(true);
        return;
      }
      setResult(calculate(inputs));
      notify.success('Calculation finished');
    }, 400);
  };

  const outputProps = { result, calculating, requestFailed, onRetry: run, selected, onSelect: setSelected, locale: settings.locale };

  const errorLabels = { ...defaultErrorBoundaryLabels, title: 'This section failed to display' };

  const input = (
    <Section
      title="Input"
      footerAlign="between"
      footer={
        <>
          <Button
            onClick={() => {
              onInputsChange(DEFAULT_INPUTS);
              setResult(null);
            }}
          >
            Restart
          </Button>
          <Button variant="primary" loading={calculating} onClick={run}>
            Calculate
          </Button>
        </>
      }
    >
      <ErrorBoundary resetKeys={[inputs]} labels={errorLabels}>
        <InputForm inputs={inputs} onChange={onInputsChange} />
      </ErrorBoundary>
    </Section>
  );

  const output = (
    <Section<OutputTab>
      value={outputTab}
      onChange={setOutputTab}
      tabs={[
        {
          value: 'results',
          label: 'Results',
          keepMounted: true,
          content: (
            <ErrorBoundary resetKeys={[result]} labels={errorLabels}>
              <OutputPanel view="results" {...outputProps} />
            </ErrorBoundary>
          ),
        },
        {
          value: 'summary',
          label: 'Summary',
          className: result ? 'animate-jump' : undefined,
          content: <OutputPanel view="summary" {...outputProps} />,
        },
      ]}
    />
  );

  return (
    <SectionLayout
      layoutId="platform-ui-poc"
      secondarySplit={settings.secondarySplit}
      labels={{ input: 'Input', illustration: 'Drawing', output: 'Output' }}
      input={input}
      illustration={
        <Section title="Drawing">
          <IllustrationPanel inputs={inputs} loading={calculating} selected={selected} />
        </Section>
      }
      output={output}
      // Mobile: one flat tab bar with the section bodies, so no section header repeats a tab name.
      mobileTabs={[
        { value: 'input', label: 'Input', content: <InputForm inputs={inputs} onChange={onInputsChange} />, keepMounted: true },
        { value: 'drawing', label: 'Drawing', content: <IllustrationPanel inputs={inputs} loading={calculating} selected={selected} /> },
        { value: 'output', label: 'Output', content: <OutputPanel view="results" {...outputProps} />, keepMounted: true },
      ]}
      mobileActions={
        <Button size="small" variant="primary" loading={calculating} onClick={run}>
          Calculate
        </Button>
      }
    />
  );
}
