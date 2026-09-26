import { type GridColumn, type GridPreset, notify } from '../index';

export interface Fastener {
  id: string;
  model: string;
  description: string;
  material: 'Wood' | 'Steel' | 'Concrete';
  capacity: number;
  qty: number | null;
  status: 'OK' | 'Check' | 'Fails';
  image: string;
}

const img = '/images/sample-drawing.svg';

export const fasteners: Fastener[] = [
  { id: 'f1', model: 'SDWS22400', description: 'Timber screw, 0.22 x 4"', material: 'Wood', capacity: 1450, qty: 4, status: 'OK', image: img },
  { id: 'f2', model: 'SDWC15600', description: 'Truss screw, 0.15 x 6"', material: 'Wood', capacity: 980, qty: 6, status: 'Check', image: img },
  { id: 'f3', model: 'SD9112', description: 'Connector screw #9 x 1.5"', material: 'Steel', capacity: 610, qty: 10, status: 'OK', image: img },
  { id: 'f4', model: 'Titen HD THD50400', description: 'Heavy-duty concrete anchor', material: 'Concrete', capacity: 3120, qty: 2, status: 'OK', image: img },
  { id: 'f5', model: 'SDS25300', description: 'Strong-Drive SDS screw', material: 'Wood', capacity: 1210, qty: null, status: 'Fails', image: img },
  { id: 'f6', model: 'Bu lông bê tông M12', description: 'Neo bê tông cốt thép', material: 'Concrete', capacity: 2480, qty: 8, status: 'OK', image: img },
  { id: 'f7', model: 'SDWH19600', description: 'Timber hex screw, 0.19 x 6"', material: 'Wood', capacity: 1320, qty: 4, status: 'OK', image: img },
  { id: 'f8', model: 'X-HSN 24', description: 'Powder-actuated steel nail', material: 'Steel', capacity: 450, qty: 12, status: 'Check', image: img },
];

export const fastenerColumns: GridColumn<Fastener>[] = [
  { id: 'model', header: 'Model', value: 'model', type: 'image', width: 230, image: { src: (r) => r.image, subtext: (r) => r.description } },
  { id: 'material', header: 'Material', value: 'material', filter: 'select', width: 140 },
  { id: 'capacity', header: 'Capacity', value: 'capacity', type: 'number', format: (v) => (v == null ? '' : `${(v as number).toLocaleString('en-US')} lbs`), width: 140 },
  { id: 'qty', header: 'Qty', value: 'qty', type: 'number', width: 110 },
  { id: 'status', header: 'Status', value: 'status', filter: 'select', width: 120 },
  {
    id: 'datasheet',
    header: 'Datasheet',
    value: (r) => `${r.model}.pdf`,
    type: 'link',
    link: { href: (r) => `https://example.com/datasheets/${encodeURIComponent(r.model)}.pdf`, external: true },
    sortable: false,
    filter: false,
    width: 210,
  },
  {
    id: 'details',
    header: 'Details',
    value: () => 'View',
    type: 'link',
    link: { onClick: (r) => notify.info(`Details for ${r.model}`) },
    sortable: false,
    filter: false,
    searchable: false,
    width: 130,
  },
];

export const fastenerPresets: GridPreset[] = [
  { id: 'high', label: 'Capacity ≥ 1,000 lbs', filters: { capacity: { min: 1000 } } },
  { id: 'wood', label: 'Wood only', filters: { material: ['Wood'] } },
  { id: 'attention', label: 'Needs attention', filters: { status: ['Check', 'Fails'] } },
];
