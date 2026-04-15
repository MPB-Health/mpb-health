import { useState } from 'react';
import { Modal } from '../Modal';
import { Edit3, CheckCircle2, Users, Loader2, AlertCircle } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface BulkContactUpdateModalProps { open: boolean; onClose: () => void; selectedCount: number; onBulkUpdate?: (field: string, value: string) => Promise<number>; }

const UPDATABLE_FIELDS = [
  { key: 'lead_source', label: 'Lead Source', options: ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Trade Show', 'Partner', 'Other'] },
  { key: 'owner_id', label: 'Advisor', options: ['Julia Smith', 'Mark Davis', 'Sarah Johnson', 'Tom Wilson'] },
  { key: 'do_not_call', label: 'Do Not Call', options: ['Yes', 'No'] },
  { key: 'do_not_email', label: 'Do Not Email', options: ['Yes', 'No'] },
];

export function BulkContactUpdateModal({ open, onClose, selectedCount, onBulkUpdate }: BulkContactUpdateModalProps) {
  const [selectedField, setSelectedField] = useState('');
  const [selectedValue, setSelectedValue] = useState('');
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const activeField = UPDATABLE_FIELDS.find((f) => f.key === selectedField);

  const handleUpdate = async () => {
    if (!selectedField || !selectedValue) return;
    setUpdating(true);
    try {
      const count = onBulkUpdate ? await onBulkUpdate(selectedField, selectedValue) : selectedCount;
      setResult(count);
    } finally { setUpdating(false); }
  };

  const handleClose = () => { setResult(null); setSelectedField(''); setSelectedValue(''); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Bulk Update Contacts" size="md">
      <div className="space-y-4">
        {result !== null ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-bold text-th-text-primary">Updated {result} contacts</p>
            <button onClick={handleClose} className="px-6 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600">Done</button>
          </div>
        ) : (
          <>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">{selectedCount} contact{selectedCount !== 1 ? 's' : ''} selected</span>
            </div>

            <div>
              <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Field to update</label>
              <div className="grid grid-cols-2 gap-1.5">
                {UPDATABLE_FIELDS.map((f) => (
                  <button key={f.key} onClick={() => { setSelectedField(f.key); setSelectedValue(''); }}
                    className={cn('px-3 py-2.5 rounded-xl text-sm font-medium border transition-all text-left',
                      selectedField === f.key ? 'border-th-accent-500 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/50 text-th-text-secondary hover:bg-surface-secondary'
                    )}>{f.label}</button>
                ))}
              </div>
            </div>

            {activeField && (
              <div>
                <label className="text-xs font-medium text-th-text-secondary block mb-1.5">New value</label>
                <div className="flex flex-wrap gap-1.5">
                  {activeField.options.map((opt) => (
                    <button key={opt} onClick={() => setSelectedValue(opt)} className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      selectedValue === opt ? 'border-th-accent-500 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/30 text-th-text-tertiary'
                    )}>{opt}</button>
                  ))}
                </div>
              </div>
            )}

            {selectedField && selectedValue && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-xs text-amber-700 dark:text-amber-300">This will update <strong>{activeField?.label}</strong> to <strong>{selectedValue}</strong> for {selectedCount} contacts.</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
              <button onClick={handleUpdate} disabled={!selectedField || !selectedValue || updating}
                className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                Update {selectedCount}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
