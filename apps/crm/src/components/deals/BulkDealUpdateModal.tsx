import { useState } from 'react';
import { Modal } from '../Modal';
import { Edit3, CheckCircle2, Loader2, AlertCircle, DollarSign } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface BulkDealUpdateModalProps { open: boolean; onClose: () => void; dealCount: number; }

const FIELDS = [
  { key: 'deal_type', label: 'Deal Type', options: ['New Business', 'Existing Business', 'Renewal'] },
  { key: 'lead_source', label: 'Lead Source', options: ['Website', 'Referral', 'Cold Call', 'LinkedIn', 'Trade Show', 'Partner'] },
  { key: 'next_step', label: 'Next Step', options: ['Follow up call', 'Send proposal', 'Schedule meeting', 'Negotiate terms', 'Closing call'] },
];

export function BulkDealUpdateModal({ open, onClose, dealCount }: BulkDealUpdateModalProps) {
  const [field, setField] = useState('');
  const [value, setValue] = useState('');
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const active = FIELDS.find((f) => f.key === field);

  const handleUpdate = async () => {
    setUpdating(true);
    await new Promise((r) => setTimeout(r, 1000));
    setResult(dealCount);
    setUpdating(false);
  };

  const handleClose = () => { setResult(null); setField(''); setValue(''); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Bulk Update Deals" size="md">
      <div className="space-y-4">
        {result !== null ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-bold text-th-text-primary">Updated {result} deals</p>
            <button onClick={handleClose} className="px-6 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600">Done</button>
          </div>
        ) : (
          <>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-xs text-blue-700 dark:text-blue-300 font-medium">{dealCount} deal{dealCount !== 1 ? 's' : ''} will be updated</span>
            </div>

            <div>
              <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Field</label>
              <div className="flex flex-wrap gap-1.5">
                {FIELDS.map((f) => (
                  <button key={f.key} onClick={() => { setField(f.key); setValue(''); }}
                    className={cn('px-3 py-2 rounded-xl text-sm font-medium border transition-all',
                      field === f.key ? 'border-th-accent-500 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/50 text-th-text-secondary hover:bg-surface-secondary'
                    )}>{f.label}</button>
                ))}
              </div>
            </div>

            {active && (
              <div>
                <label className="text-xs font-medium text-th-text-secondary block mb-1.5">New value</label>
                <div className="flex flex-wrap gap-1.5">
                  {active.options.map((opt) => (
                    <button key={opt} onClick={() => setValue(opt)} className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      value === opt ? 'border-th-accent-500 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/30 text-th-text-tertiary'
                    )}>{opt}</button>
                  ))}
                </div>
              </div>
            )}

            {field && value && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-xs text-amber-700 dark:text-amber-300">This will set <strong>{active?.label}</strong> to <strong>{value}</strong> for {dealCount} deals.</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
              <button onClick={handleUpdate} disabled={!field || !value || updating}
                className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                Update {dealCount}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
