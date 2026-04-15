import { useState } from 'react';
import { Modal } from '../Modal';
import { ArrowLeftRight, CheckCircle2, XCircle, DollarSign } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface QuoteComparisonModalProps { open: boolean; onClose: () => void; }

const MOCK_QUOTES = [
  { id: 'q1', name: 'Q-2024-089 — Essentials Package', value: 12500, items: 3, status: 'pending', discount: 5, validDays: 12, account: 'Acme Corp' },
  { id: 'q2', name: 'Q-2024-091 — Premium Bundle', value: 24800, items: 5, status: 'sent', discount: 10, validDays: 8, account: 'BrightCare' },
  { id: 'q3', name: 'Q-2024-094 — Standard Plan', value: 9100, items: 2, status: 'pending', discount: 0, validDays: 21, account: 'Wellness Group' },
  { id: 'q4', name: 'Q-2024-082 — Family Complete', value: 15800, items: 4, status: 'accepted', discount: 8, validDays: 0, account: 'HealthFirst Inc' },
];

export function QuoteComparisonModal({ open, onClose }: QuoteComparisonModalProps) {
  const [quoteA, setQuoteA] = useState('');
  const [quoteB, setQuoteB] = useState('');
  const a = MOCK_QUOTES.find((q) => q.id === quoteA);
  const b = MOCK_QUOTES.find((q) => q.id === quoteB);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const fields: { label: string; get: (q: typeof MOCK_QUOTES[0]) => string }[] = [
    { label: 'Account', get: (q) => q.account },
    { label: 'Total Value', get: (q) => fmt(q.value) },
    { label: 'Line Items', get: (q) => String(q.items) },
    { label: 'Discount', get: (q) => q.discount > 0 ? `${q.discount}%` : 'None' },
    { label: 'Status', get: (q) => q.status },
    { label: 'Days Remaining', get: (q) => q.validDays > 0 ? `${q.validDays} days` : 'Closed' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Compare Quotes" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Quote A</label>
            <select value={quoteA} onChange={(e) => setQuoteA(e.target.value)} className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none">
              <option value="">Select...</option>
              {MOCK_QUOTES.filter((q) => q.id !== quoteB).map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Quote B</label>
            <select value={quoteB} onChange={(e) => setQuoteB(e.target.value)} className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none">
              <option value="">Select...</option>
              {MOCK_QUOTES.filter((q) => q.id !== quoteA).map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </div>
        </div>

        {a && b ? (
          <>
            <div className="rounded-xl border border-th-border/50 overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-surface-secondary/50">
                  <th className="text-left px-3 py-2 font-medium text-th-text-tertiary w-28">Field</th>
                  <th className="text-center px-3 py-2 font-medium text-th-accent-500">Quote A</th>
                  <th className="w-6" />
                  <th className="text-center px-3 py-2 font-medium text-th-accent-500">Quote B</th>
                </tr></thead>
                <tbody>
                  {fields.map((f) => {
                    const va = f.get(a);
                    const vb = f.get(b);
                    return (
                      <tr key={f.label} className="border-t border-th-border/20">
                        <td className="px-3 py-2.5 font-medium text-th-text-secondary">{f.label}</td>
                        <td className={cn('text-center px-3 py-2.5 font-medium', va === vb ? 'text-th-text-primary' : 'text-th-text-primary')}>{va}</td>
                        <td className="text-center"><ArrowLeftRight className="w-3 h-3 text-th-text-tertiary mx-auto" /></td>
                        <td className={cn('text-center px-3 py-2.5 font-medium', va === vb ? 'text-th-text-primary' : 'text-th-text-primary')}>{vb}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {a.value !== b.value && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <p className="text-xs text-th-text-secondary">
                  <DollarSign className="w-3 h-3 inline text-green-500" /> <strong>{a.value > b.value ? a.name.split(' — ')[1] : b.name.split(' — ')[1]}</strong> is valued {fmt(Math.abs(a.value - b.value))} higher ({Math.round((Math.abs(a.value - b.value) / Math.min(a.value, b.value)) * 100)}% more).
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-th-text-tertiary">
            <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select two quotes to compare</p>
          </div>
        )}

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
