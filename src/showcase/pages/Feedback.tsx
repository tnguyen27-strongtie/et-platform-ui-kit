import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useState } from 'react';

import { Alert, Button, EmptyState, ErrorBoundary, LoadingIndicator, notify, Spinner, Switch } from '../../index';
import { DemoGrid, DemoPage, DemoSection, Labeled, Variants } from '../layout';

function ResultPanel({ broken }: { broken: boolean }) {
  if (broken) throw new Error('Result data is missing the capacity column');
  return <p className="m-0 text-sm">Result panel rendered normally.</p>;
}

export function Feedback() {
  const [loading, setLoading] = useState(false);
  const [broken, setBroken] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);

  return (
    <DemoPage title="Feedback" description="Status, progress, empty and error states.">
      <DemoSection
        id="alert"
        title="Alert"
        description="Inline status message in a panel. error is announced immediately (role=alert); the others politely (role=status)."
        code={`<Alert severity="error" title="Validation">Member thickness is outside the allowed range.</Alert>`}
      >
        <Alert severity="error" title="Validation">
          Member thickness is outside the allowed range.
        </Alert>
        <Alert severity="warning" title="No output results">
          There are no results based upon the input parameters.
        </Alert>
        <Alert severity="success" title="Design passes">
          All checks are within capacity.
        </Alert>
        <Alert severity="info">Results use the 2024 NDS. Change the code edition in Settings.</Alert>
      </DemoSection>

      <DemoSection
        id="empty-state"
        title="EmptyState"
        description="A pane with nothing to show yet. Say why and offer the next step."
        code={`<EmptyState title="No results yet" action={<Button variant="primary">Calculate</Button>}>
  Fill in the inputs, then run the calculation.
</EmptyState>`}
      >
        <DemoGrid>
          <EmptyState title="No results yet" action={<Button variant="primary">Calculate</Button>}>
            Fill in the inputs, then run the calculation.
          </EmptyState>
          <EmptyState title="No matching products" icon={<SearchOffIcon fontSize="inherit" />}>
            Try fewer filters or another material.
          </EmptyState>
        </DemoGrid>
      </DemoSection>

      <DemoSection
        id="loading"
        title="Spinner and LoadingIndicator"
        description="Spinner: small, inline (a list loading, a button area). LoadingIndicator: &quot;Updating results&quot; overlay covering a whole pane. Both are announced to screen readers."
        code={`<Spinner size={16} label="Loading products" />
<VisualizationStage loading={isRendering}>…</VisualizationStage>   // uses LoadingIndicator`}
      >
        <Variants>
          <Labeled label="size 16">
            <Spinner size={16} />
          </Labeled>
          <Labeled label="size 20 (default)">
            <Spinner />
          </Labeled>
          <Labeled label="size 32, brand color">
            <span className="text-brand">
              <Spinner size={32} label="Loading results" />
            </span>
          </Labeled>
          <Labeled label="inline with text">
            <span className="flex items-center gap-2 text-sm">
              <Spinner size={14} /> Loading products…
            </span>
          </Labeled>
        </Variants>
        <Switch label="Show LoadingIndicator" checked={loading} onChange={setLoading} />
        <div className="relative h-72 rounded-sm border border-border bg-surface">
          <p className="m-0 p-3 text-sm">Pane content behind the overlay.</p>
          {loading && (
            <div className="absolute inset-0">
              <LoadingIndicator />
            </div>
          )}
        </div>
      </DemoSection>

      <DemoSection
        id="error-boundary"
        title="ErrorBoundary"
        description="Keeps a crash in one pane (e.g. unexpected result data) from blanking the app. resetKeys retries when the data changes; onError reports it."
        code={`<ErrorBoundary resetKeys={[results]} onError={(e) => log(e)}>
  <ResultsTable results={results} />
</ErrorBoundary>`}
      >
        <Variants>
          <Button variant="danger" onClick={() => setBroken(true)}>
            Break the panel
          </Button>
          <Button
            onClick={() => {
              setBroken(false);
              setDataVersion((v) => v + 1);
            }}
          >
            Load fixed data
          </Button>
        </Variants>
        <div className="rounded-sm border border-border">
          <ErrorBoundary resetKeys={[dataVersion]} onError={(e) => notify.error(`Reported: ${e.message}`)}>
            <div className="p-3">
              <ResultPanel broken={broken} />
            </div>
          </ErrorBoundary>
        </div>
        <p className="m-0 text-xs text-text-muted">The rest of the page keeps working while the panel shows its fallback.</p>
      </DemoSection>
    </DemoPage>
  );
}
