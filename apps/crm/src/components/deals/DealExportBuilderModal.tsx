import { useState } from 'react';
import { Modal } from '../Modal';
import { Download, CheckCircle2, Loader2, FileText } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ExportField { key: string; label: string; category: string; selected: boolean; }
interface DealExportBuilderModalProps { open: boolean; onClose: () => void; dealCount: number; }

const FIELDS: ExportField[] = [
  { key: 'name', label: 'Deal Name', category: 'Core', selected: true },
  { key: 'amount', label: 'Amount', category: 'Core', selected: true },
  { key: 'stage', label: 'Stage', category: 'Core', selected: true },
  { key: 'probability', label: 'Probability', category: 'Core', selected: true },
  { key: 'expected_close', label: 'Close Date', category: 'Core', selected: true },
  { key: 'deal_type', label: 'Deal Type', category: 'Metadata', selected: true },
  { key: 'lead_source', label: 'Lead Source', category: 'Metadata', selected: false },
  { key: 'next_step', label: 'Next Step', category: 'Metadata', selected: false },
  { key: 'account', label: 'Account', category: 'Relations', selected: true },
  { key: 'contact', label: 'Primary Contact', category: 'Relations', selected: false },
  { key: 'owner', label: 'Owner', category: 'Relations', selected: false },
  { key: 'tags', label: 'Tags', category: 'Metadata', selected: false },
  { key: 'won_at', label: 'Won Date', category: 'Status', selected: false },
  { key: 'lost_at', label: 'Lost Date', category: 'Status', selected: false },
  { key: 'lost_reason', label: 'Lost Reason', category: 'Status', selected: false },
  { key: 'created_at', label: 'Created', category: 'Metadata', selected: true },
];

export function DealExportBuilderModal({ open, onClose, dealCount }: DealExportBuilderModalProps) {
  const [fields, setFields] = useState(FIELDS);
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const categories = [...new Set(fields.map((f) => f.category))];
  const selected = fields.filter((f) => f.selected);

  const toggle = (key: string) => setFields((p) => p.map((f) => f.key === key ? { ...f, selected: !f.selected } : f));
  const selectAll = () => setFields((p) => p.map((f) => ({ ...f, selected: true })));
  const selectNone = () => setFields((p) => p.map((f) => ({ ...f, selected: false })));

  const handleExport = async () => { setExporting(true); await new Promise((r) => setTimeout(r, 1200)); setExporting(false); setDone(true); };
  const handleClose = () => { setDone(false); setFields(FIELDS); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Deal Export Builder" size="xl">
      <div className="space-y-4">
        {done ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-bold text-th-text-primary">Export Complete</p>
            <p className="text-sm text-th-text-secondary">{dealCount} deals × {selected.length} fields as .{format}</p>
            <button onClick={handleClose} className="px-6 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[10px] text-th-text-tertiary font-medium">Format</label>
                <div className="flex gap-1.5 mt-1">
                  {(['csv', 'xlsx'] as const).map((f) => (
                    <button key={f} onClick={() => setFormat(f)} className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      format === f ? 'border-th-accent-500 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/30 text-th-text-tertiary'
                    )}>.{f}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 text-right">
                <p className="text-[10px] text-th-text-tertiary">{dealCount} deals × {selected.length} fields</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-th-text-secondary">Fields ({selected.length}/{fields.length})</label>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-[10px] text-th-accent-500 font-medium">All</button>
                  <button onClick={selectNone} className="text-[10px] text-th-text-tertiary font-medium">None</button>
                </div>
              </div>
              <div className="max-h-[240px] overflow-y-auto rounded-xl border border-th-border/50 p-2 space-y-2">
                {categories.map((cat) => (
                  <div key={cat}>
                    <p className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider px-1 mb-1">{cat}</p>
                    <div className="flex flex-wrap gap-1">
                      {fields.filter((f) => f.category === cat).map((field) => (
                        <button key={field.key} onClick={() => toggle(field.key)} className={cn(
                          'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all',
                          field.selected ? 'border-th-accent-500 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/20 text-th-text-tertiary'
                        )}>{field.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
              <button onClick={handleExport} disabled={selected.length === 0 || exporting}
                className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export .{format}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
