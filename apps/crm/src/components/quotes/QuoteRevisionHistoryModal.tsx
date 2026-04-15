import { useState } from 'react';
import { Modal } from '../Modal';
import { History, ArrowRight, DollarSign, FileText, User, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface QuoteRevisionHistoryModalProps { open: boolean; onClose: () => void; }

const QUOTES_WITH_REVISIONS = [
  { id: 'q1', name: 'Q-2024-089 — Acme Corp', revisions: 3 },
  { id: 'q2', name: 'Q-2024-091 — BrightCare', revisions: 2 },
  { id: 'q3', name: 'Q-2024-082 — HealthFirst Inc', revisions: 4 },
];

const REVISIONS: Record<string, { version: number; date: string; author: string; value: number; changes: string; status: string }[]> = {
  q1: [
    { version: 3, date: 'Apr 12, 2026', author: 'Sarah K.', value: 12500, changes: 'Reduced discount from 15% to 10%', status: 'pending' },
    { version: 2, date: 'Apr 8, 2026', author: 'Sarah K.', value: 11800, changes: 'Added dental add-on, increased discount to 15%', status: 'rejected' },
    { version: 1, date: 'Apr 5, 2026', author: 'Mike T.', value: 14200, changes: 'Initial quote created', status: 'rejected' },
  ],
  q2: [
    { version: 2, date: 'Apr 10, 2026', author: 'John M.', value: 24800, changes: 'Added family coverage tier', status: 'sent' },
    { version: 1, date: 'Apr 6, 2026', author: 'John M.', value: 18500, changes: 'Initial quote created', status: 'revised' },
  ],
  q3: [
    { version: 4, date: 'Apr 11, 2026', author: 'Sarah K.', value: 15800, changes: 'Final pricing adjustment', status: 'accepted' },
    { version: 3, date: 'Apr 9, 2026', author: 'Sarah K.', value: 16200, changes: 'Custom terms added per legal review', status: 'revised' },
    { version: 2, date: 'Apr 7, 2026', author: 'Mike T.', value: 17500, changes: 'Reduced line items, added HSA option', status: 'revised' },
    { version: 1, date: 'Apr 3, 2026', author: 'Mike T.', value: 19800, changes: 'Initial quote created', status: 'revised' },
  ],
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  revised: 'bg-gray-100 text-gray-600',
};

export function QuoteRevisionHistoryModal({ open, onClose }: QuoteRevisionHistoryModalProps) {
  const [selectedQuote, setSelectedQuote] = useState('q1');
  const revisions = REVISIONS[selectedQuote] || [];
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const first = revisions[revisions.length - 1];
  const latest = revisions[0];
  const valueChange = first && latest ? latest.value - first.value : 0;

  return (
    <Modal open={open} onClose={onClose} title="Revision History" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {QUOTES_WITH_REVISIONS.map((q) => (
            <button key={q.id} onClick={() => setSelectedQuote(q.id)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all', selectedQuote === q.id ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent')}>
              {q.name.split(' — ')[1]} <span className="text-th-text-tertiary">({q.revisions})</span>
            </button>
          ))}
        </div>

        {first && latest && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20 flex items-center gap-3">
            <div className="text-center">
              <p className="text-[9px] text-th-text-tertiary">v1</p>
              <p className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(first.value)}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-th-text-tertiary shrink-0" />
            <div className="text-center">
              <p className="text-[9px] text-th-text-tertiary">v{latest.version}</p>
              <p className="text-xs font-bold text-th-accent-500 tabular-nums">{fmt(latest.value)}</p>
            </div>
            <span className={cn('text-[10px] font-bold ml-auto', valueChange < 0 ? 'text-red-400' : 'text-green-500')}>{valueChange >= 0 ? '+' : ''}{fmt(valueChange)} ({Math.round((valueChange / first.value) * 100)}%)</span>
          </div>
        )}

        <div className="relative pl-4">
          <div className="absolute left-1.5 top-0 bottom-0 w-px bg-th-border" />
          <div className="space-y-3">
            {revisions.map((r, i) => (
              <div key={r.version} className="relative">
                <div className={cn('absolute -left-2.5 w-3 h-3 rounded-full border-2 border-surface-primary', i === 0 ? 'bg-th-accent-500' : 'bg-th-border')} />
                <div className="p-2.5 rounded-xl border border-th-border/50 ml-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-th-accent-500">v{r.version}</span>
                    <span className={cn('text-[8px] px-1.5 py-0.5 rounded-full font-medium capitalize', statusColors[r.status] || '')}>{r.status}</span>
                    <span className="text-xs font-bold text-th-text-primary tabular-nums ml-auto">{fmt(r.value)}</span>
                  </div>
                  <p className="text-[10px] text-th-text-secondary">{r.changes}</p>
                  <div className="flex items-center gap-3 mt-1 text-[9px] text-th-text-tertiary">
                    <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{r.author}</span>
                    <span>{r.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Revision Insight</span></div>
          <p className="text-xs text-th-text-secondary">HealthFirst took 4 revisions to close — the initial quote was 25% over budget. Quotes with 2 or fewer revisions close 3x faster.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
