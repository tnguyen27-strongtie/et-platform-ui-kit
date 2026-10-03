import DownloadIcon from '@mui/icons-material/Download';
import {
  Alert,
  Button,
  Card,
  DataTable,
  DescriptionList,
  EmptyState,
  ErrorAlert,
  GridImageCell,
  GridLinkCell,
  GridView,
  LoadingIndicator,
  Spinner,
  defaultGridViewLabels,
  formatDisplayNumber,
  isEmptyFilter,
  matchesNumberRange,
  matchesSearch,
  matchesSelect,
  matchesText,
  normalizeText,
  notify,
  type GridColumn,
  type GridViewState,
} from '@platform/ui';
import type { CalcResult, ResultRow } from '../lib/calc';
import type { Settings } from '../lib/settings';

interface OutputPanelProps {
  view: 'results' | 'summary';
  result: CalcResult | null;
  calculating: boolean;
  requestFailed: boolean;
  onRetry: () => void;
  selected: string | null;
  onSelect: (id: string) => void;
  locale: Settings['locale'];
}

const GRID_KEY = 'platform-ui-poc:results-grid';

function loadGridState(): Partial<GridViewState> | undefined {
  try {
    const saved = localStorage.getItem(GRID_KEY);
    return saved ? (JSON.parse(saved) as GridViewState) : undefined;
  } catch {
    return undefined;
  }
}

function saveGridState(state: GridViewState) {
  try {
    localStorage.setItem(GRID_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: the layout is not remembered.
  }
}

const columns: GridColumn<ResultRow>[] = [
  {
    id: 'model',
    header: 'Model',
    value: (r) => r.fastener.model,
    type: 'image',
    width: 200,
    image: { src: () => '/fastener.svg', subtext: (r) => r.fastener.description },
  },
  { id: 'material', header: 'Material', value: (r) => r.fastener.material, filter: 'select' },
  { id: 'per', header: 'Per fastener', value: 'perFastener', type: 'number', format: (v) => `${(v as number).toLocaleString('en-US')} lbs` },
  { id: 'capacity', header: 'Capacity', value: 'capacity', type: 'number' },
  { id: 'ratio', header: 'Ratio', value: 'ratio', type: 'number', precision: 3 },
  { id: 'status', header: 'Status', value: 'status', filter: 'select' },
  {
    id: 'sheet',
    header: 'Datasheet',
    value: (r) => `${r.fastener.model}.pdf`,
    type: 'link',
    link: { href: (r) => r.fastener.datasheetUrl, external: true },
    filter: false,
    sortable: false,
  },
  {
    id: 'details',
    header: 'Details',
    value: () => 'View',
    type: 'link',
    link: { onClick: (r) => notify.info(`${r.fastener.model}: ${r.capacity} lbs`) },
    filter: false,
    sortable: false,
    searchable: false,
  },
];

export function OutputPanel(props: OutputPanelProps) {
  const { result, calculating, requestFailed, onRetry } = props;

  if (requestFailed) {
    return (
      <div className="p-3">
        <ErrorAlert title="The calculation failed" reference="Reference: poc-trace-0001" onRetry={onRetry} retryLabel="Try again">
          The server could not finish the calculation (simulated).
        </ErrorAlert>
      </div>
    );
  }
  if (!result) {
    return calculating ? (
      <LoadingIndicator>Calculating…</LoadingIndicator>
    ) : (
      <EmptyState title="No results yet" action={<Button onClick={onRetry}>Calculate</Button>}>
        Fill in the inputs and press Calculate.
      </EmptyState>
    );
  }
  return props.view === 'results' ? <ResultsGrid {...props} result={result} /> : <Summary {...props} result={result} />;
}

function ResultsGrid({ result, calculating, selected, onSelect, locale }: OutputPanelProps & { result: CalcResult }) {
  const failing = result.rows.filter((r) => r.status === 'Fails').length;
  return (
    <div className="flex flex-col gap-2 p-2">
      {failing > 0 ? (
        <Alert severity="warning" title={`${failing} of ${result.rows.length} fasteners fail`}>
          Increase the number of fasteners or pick a larger diameter.
        </Alert>
      ) : (
        <Alert severity="success" title="Every fastener passes">
          Ratios are at most 0.9.
        </Alert>
      )}
      <GridView
        aria-label="Fastener results"
        rows={result.rows}
        columns={columns}
        getRowId={(r) => r.id}
        search={{ placeholder: 'Search model, material…', columns: ['model', 'material', 'status'] }}
        presets={[
          { id: 'strong', label: 'Capacity ≥ 2,000 lbs', filters: { capacity: { min: 2000 } } },
          { id: 'stainless', label: 'Stainless only', filters: { material: ['Stainless'] } },
        ]}
        rowHighlight={(r) => (r.status === 'Fails' ? 'danger' : r.status === 'Check' ? 'warning' : undefined)}
        selectedRowId={selected}
        onRowClick={(r) => onSelect(r.id)}
        initialState={loadGridState() ?? { pinned: { start: ['model'], end: ['details'] } }}
        onStateChange={saveGridState}
        maxHeight={420}
        locale={locale}
        emptyText="No fasteners"
        labels={{ noMatches: `${defaultGridViewLabels.noMatches} Try another preset.` }}
        toolbar={
          <Button size="small" startIcon={calculating ? <Spinner size={14} label="Updating results" /> : <DownloadIcon />} onClick={() => notify.success('Exported (simulated)')}>
            Export
          </Button>
        }
      />
    </div>
  );
}

function Summary({ result, locale }: OutputPanelProps & { result: CalcResult }) {
  const best = [...result.rows].sort((a, b) => b.capacity - a.capacity)[0];
  // The grid's filter helpers, used on their own the way an app's own search would use them.
  const screws = result.rows.filter((r) => matchesText(r.fastener.description, 'SCREW'));
  const coatedScrews = result.rows.filter((r) => matchesSearch([r.fastener.model, r.fastener.material], 'sdws coated'));
  const midRange = result.rows.filter((r) => matchesNumberRange(r.capacity, { min: 1000, max: 5000 }));
  const notSteel = result.rows.filter((r) => matchesSelect(r.fastener.material, ['Coated', 'Stainless']));
  const noFilter = isEmptyFilter({}) && isEmptyFilter([]) && isEmptyFilter('');

  return (
    <div className="flex flex-col gap-3 p-2">
      <Card title="Adjustment factors" subtitle={`${result.count} fasteners`} footer={`Search key: ${normalizeText('Épicéa')}`}>
        <DescriptionList
          size="sm"
          items={[
            { id: 'cd', label: 'Load duration CD', value: result.factors.cd },
            { id: 'cm', label: 'Wet service CM', value: result.factors.cm },
            { id: 'cg', label: 'Group action Cg', value: result.factors.cg },
            { id: 'filters', label: 'Screws / coated / 1–5k / not steel', value: `${screws.length} / ${coatedScrews.length} / ${midRange.length} / ${notSteel.length}` },
            { id: 'empty', label: 'Empty filters detected', value: noFilter ? 'Yes' : 'No' },
          ]}
        />
      </Card>
      {best && (
        <Card title="Strongest option" padding="none" actions={<Button size="small" variant="text">Use</Button>}>
          <DataTable aria-label="Strongest option" maxHeight={200}>
            <DataTable.Head>
              <DataTable.Row>
                <DataTable.Cell>Fastener</DataTable.Cell>
                <DataTable.Cell align="right">Capacity</DataTable.Cell>
                <DataTable.Cell>Datasheet</DataTable.Cell>
              </DataTable.Row>
            </DataTable.Head>
            <DataTable.Body>
              <DataTable.Row>
                <DataTable.Cell>
                  <GridImageCell src="/fastener.svg" text={best.fastener.model} subtext={best.fastener.description} />
                </DataTable.Cell>
                <DataTable.Cell align="right">{formatDisplayNumber(best.capacity, { locale })} lbs</DataTable.Cell>
                <DataTable.Cell>
                  <GridLinkCell href={best.fastener.datasheetUrl} external>
                    Datasheet
                  </GridLinkCell>
                </DataTable.Cell>
              </DataTable.Row>
            </DataTable.Body>
          </DataTable>
        </Card>
      )}
    </div>
  );
}
