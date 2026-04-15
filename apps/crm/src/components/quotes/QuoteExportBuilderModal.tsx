import { useState } from 'react';
import { Modal } from '../Modal';
import { Download, FileSpreadsheet, FileText, Printer, CheckSquare } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface QuoteExportBuilderModalProps { open: boolean; onClose: () => void; }

const FIELDS = [
  { id: 'quote_number', label: 'Quote Number', default: true },
  { id: 'name', label: 'Quote Name', default: true },
  { id: 'account', label: 'Account', default: true },
  { id: 'contact', label: 'Contact', default: true },
  { id: 'deal', label: 'Related Deal', default: false },
  { id: 'status', label: 'Status', default: true },
  { id: 'total', label: 'Total Value', default: true },
  { id: 'subtotal', label: 'Subtotal', default: false },
  { id: 'discount', label: 'Discount', default: false },
  { id: 'tax', label: 'Tax', default: false },
  { id: 'line_items', label: 'Line Items', default: false },
  { id: 'valid_until', label: 'Valid Until', default: true },
  { id: 'created', label: 'Created Date', default: false },
  { id: 'terms', label: 'Terms & Conditions', default: false },
  { id: 'notes', label: 'Internal Notes', default: false },
];

const FORMATS = [
  { id: 'csv', label: 'CSV', icon: FileSpreadsheet, desc: 'Spreadsheet-ready' },
  { id: 'pdf', label: 'PDF', icon: FileText, desc: 'Print-ready document' },
  { id: 'print', label: 'Print', icon: Printer, desc: 'Direct to printer' },
];

export function QuoteExportBuilderModal({ open, onClose }: QuoteExportBuilderModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(FIELDS.filter((f) => f.default).map((f) => f.id)));
  const [format, setFormat] = useState('csv');
  const [statusFilter, setStatusFilter] = useState('all');

  const toggle = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <Modal open={open} onClose={onClose} title="Export Builder" size="lg">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Export Format</label>
          <div className="grid grid-cols-3 gap-1.5">
            {FORMATS.map((f) => (
              <button key={f.id} onClick={() => setFormat(f.id)} className={cn('flex items-center gap-2 p-2.5 rounded-xl border transition-all', format === f.id ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50')}>
                <f.icon className={cn('w-4 h-4', format === f.id ? 'text-th-accent-500' : 'text-th-text-tertiary')} />
                <div>
                  <p className="text-xs font-medium text-th-text-primary">{f.label}</p>
                  <p className="text-[9px] text-th-text-tertiary">{f.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Status Filter</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {['all', 'draft', 'pending', 'sent', 'accepted', 'rejected', 'expired'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={cn('px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-all', statusFilter === s ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent')}>{s}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-th-text-secondary">Fields ({selected.size}/{FIELDS.length})</label>
            <button onClick={() => setSelected(selected.size === FIELDS.length ? new Set(FIELDS.filter((f) => f.default).map((f) => f.id)) : new Set(FIELDS.map((f) => f.id)))} className="text-[10px] text-th-accent-500 font-medium">{selected.size === FIELDS.length ? 'Reset Defaults' : 'Select All'}</button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {FIELDS.map((f) => (
              <label key={f.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-surface-secondary/50 cursor-pointer">
                <input type="checkbox" checked={selected.has(f.id)} onChange={() => toggle(f.id)} className="accent-th-accent-500 w-3 h-3" />
                <span className="text-[10px] text-th-text-secondary">{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-surface-secondary/50 border border-th-border/30 flex items-center gap-3">
          <CheckSquare className="w-4 h-4 text-th-accent-500 shrink-0" />
          <div className="text-[10px] text-th-text-secondary">
            <strong>{selected.size} fields</strong> selected • <strong>{statusFilter === 'all' ? 'All' : statusFilter}</strong> quotes • <strong>{format.toUpperCase()}</strong> format
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 transition-colors flex items-center justify-center gap-1.5">
            <Download className="w-4 h-4" /> Export Quotes
          </button>
        </div>
      </div>
    </Modal>
  );
}
