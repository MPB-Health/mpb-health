import { useState } from 'react';
import { Modal } from '../Modal';
import { Download, CheckCircle2, GripVertical, Loader2, Eye, FileText } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ExportField { key: string; label: string; category: string; selected: boolean; }
interface ContactExportBuilderModalProps { open: boolean; onClose: () => void; totalContacts: number; selectedCount: number; }

const DEFAULT_FIELDS: ExportField[] = [
  { key: 'first_name', label: 'First Name', category: 'Identity', selected: true },
  { key: 'last_name', label: 'Last Name', category: 'Identity', selected: true },
  { key: 'email', label: 'Email', category: 'Contact', selected: true },
  { key: 'phone', label: 'Phone', category: 'Contact', selected: true },
  { key: 'mobile', label: 'Mobile', category: 'Contact', selected: false },
  { key: 'title', label: 'Title', category: 'Work', selected: false },
  { key: 'department', label: 'Department', category: 'Work', selected: false },
  { key: 'account', label: 'Account', category: 'Work', selected: true },
  { key: 'lead_source', label: 'Lead Source', category: 'Metadata', selected: true },
  { key: 'plan_type', label: 'Plan Type', category: 'Insurance', selected: true },
  { key: 'carrier', label: 'Carrier', category: 'Insurance', selected: false },
  { key: 'premium', label: 'Premium Amount', category: 'Insurance', selected: false },
  { key: 'mailing_street', label: 'Street', category: 'Address', selected: false },
  { key: 'mailing_city', label: 'City', category: 'Address', selected: false },
  { key: 'mailing_state', label: 'State', category: 'Address', selected: false },
  { key: 'mailing_zip', label: 'ZIP', category: 'Address', selected: false },
  { key: 'tags', label: 'Tags', category: 'Metadata', selected: false },
  { key: 'do_not_call', label: 'Do Not Call', category: 'Compliance', selected: false },
  { key: 'do_not_email', label: 'Do Not Email', category: 'Compliance', selected: false },
  { key: 'created_at', label: 'Created Date', category: 'Metadata', selected: true },
];

export function ContactExportBuilderModal({ open, onClose, totalContacts, selectedCount }: ContactExportBuilderModalProps) {
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [scope, setScope] = useState<'all' | 'selected' | 'filtered'>('all');
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const categories = [...new Set(fields.map((f) => f.category))];
  const selectedFields = fields.filter((f) => f.selected);

  const toggleField = (key: string) => {
    setFields((prev) => prev.map((f) => f.key === key ? { ...f, selected: !f.selected } : f));
  };

  const selectAll = () => setFields((prev) => prev.map((f) => ({ ...f, selected: true })));
  const selectNone = () => setFields((prev) => prev.map((f) => ({ ...f, selected: false })));

  const handleExport = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setExporting(false);
    setDone(true);
  };

  const handleClose = () => { setDone(false); setFields(DEFAULT_FIELDS); onClose(); };

  const exportCount = scope === 'selected' ? selectedCount : totalContacts;

  return (
    <Modal open={open} onClose={handleClose} title="Export Builder" size="xl">
      <div className="space-y-4">
        {done ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-bold text-th-text-primary">Export Complete</p>
            <p className="text-sm text-th-text-secondary">{exportCount} contacts exported with {selectedFields.length} fields as .{format}</p>
            <button onClick={handleClose} className="px-6 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600">Done</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] text-th-text-tertiary font-medium">Scope</label>
                <div className="flex gap-1.5 mt-1">
                  {[
                    { id: 'all' as const, label: `All (${totalContacts})` },
                    { id: 'selected' as const, label: `Selected (${selectedCount})` },
                  ].map((s) => (
                    <button key={s.id} onClick={() => setScope(s.id)} disabled={s.id === 'selected' && selectedCount === 0}
                      className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-40',
                        scope === s.id ? 'border-th-accent-500 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/30 text-th-text-tertiary'
                      )}>{s.label}</button>
                  ))}
                </div>
              </div>
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
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-th-text-secondary">Fields ({selectedFields.length}/{fields.length})</label>
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
                        <button key={field.key} onClick={() => toggleField(field.key)} className={cn(
                          'px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all',
                          field.selected ? 'border-th-accent-500 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/20 text-th-text-tertiary'
                        )}>{field.label}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-surface-secondary/50 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-th-text-tertiary shrink-0" />
              <span className="text-[10px] text-th-text-tertiary">
                Preview: {exportCount} rows × {selectedFields.length} columns = {(exportCount * selectedFields.length).toLocaleString()} cells
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
              <button onClick={handleExport} disabled={selectedFields.length === 0 || exporting}
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
