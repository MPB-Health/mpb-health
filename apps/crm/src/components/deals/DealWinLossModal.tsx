import { useState } from 'react';
import { Modal } from '../Modal';
import { Trophy, ThumbsDown, BarChart3, Sparkles, TrendingUp, Target } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DealWinLossModalProps { open: boolean; onClose: () => void; }

const MOCK_SUMMARY = { won: 28, lost: 14, winRate: 67, avgWonSize: 24500, avgLostSize: 18200, avgWonDays: 32, avgLostDays: 45 };

const MOCK_WIN_REASONS = [
  { reason: 'Strong relationship', count: 12, pct: 43 },
  { reason: 'Competitive pricing', count: 8, pct: 29 },
  { reason: 'Product fit', count: 5, pct: 18 },
  { reason: 'Timing', count: 3, pct: 10 },
];

const MOCK_LOSS_REASONS = [
  { reason: 'Price too high', count: 5, pct: 36 },
  { reason: 'Went with competitor', count: 4, pct: 29 },
  { reason: 'No budget', count: 3, pct: 21 },
  { reason: 'No decision', count: 2, pct: 14 },
];

const MOCK_MONTHLY = [
  { month: 'Jan', won: 5, lost: 2 }, { month: 'Feb', won: 4, lost: 3 },
  { month: 'Mar', won: 6, lost: 1 }, { month: 'Apr', won: 3, lost: 2 },
];

export function DealWinLossModal({ open, onClose }: DealWinLossModalProps) {
  const [tab, setTab] = useState<'overview' | 'reasons'>('overview');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  return (
    <Modal open={open} onClose={onClose} title="Win/Loss Analysis" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Win Rate', value: `${MOCK_SUMMARY.winRate}%`, icon: Target, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Won', value: String(MOCK_SUMMARY.won), icon: Trophy, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Lost', value: String(MOCK_SUMMARY.lost), icon: ThumbsDown, color: 'text-red-500', bg: 'from-red-500/10 to-rose-500/10' },
            { label: 'Avg Won Size', value: fmt(MOCK_SUMMARY.avgWonSize), icon: TrendingUp, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'overview' as const, label: 'Trend' }, { id: 'reasons' as const, label: 'Win/Loss Reasons' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-th-border/50">
              <p className="text-xs font-semibold text-th-text-secondary mb-2">Monthly Win/Loss</p>
              <div className="flex items-end gap-2 h-[80px]">
                {MOCK_MONTHLY.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex flex-col items-center">
                      <div className="w-full rounded-t bg-green-500/50" style={{ height: `${m.won * 10}px` }} />
                      <div className="w-full rounded-b bg-red-500/30" style={{ height: `${m.lost * 10}px` }} />
                    </div>
                    <span className="text-[8px] text-th-text-tertiary font-medium">{m.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="flex items-center gap-1 text-[9px] text-th-text-tertiary"><span className="w-2 h-2 rounded bg-green-500/50" />Won</span>
                <span className="flex items-center gap-1 text-[9px] text-th-text-tertiary"><span className="w-2 h-2 rounded bg-red-500/30" />Lost</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Won Deals</p>
                <div className="space-y-1 text-[10px]">
                  <p className="text-th-text-secondary">Avg size: <strong>{fmt(MOCK_SUMMARY.avgWonSize)}</strong></p>
                  <p className="text-th-text-secondary">Avg cycle: <strong>{MOCK_SUMMARY.avgWonDays} days</strong></p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Lost Deals</p>
                <div className="space-y-1 text-[10px]">
                  <p className="text-th-text-secondary">Avg size: <strong>{fmt(MOCK_SUMMARY.avgLostSize)}</strong></p>
                  <p className="text-th-text-secondary">Avg cycle: <strong>{MOCK_SUMMARY.avgLostDays} days</strong></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'reasons' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-green-500/30">
              <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-2">Why We Win</p>
              <div className="space-y-1.5">
                {MOCK_WIN_REASONS.map((r) => (
                  <div key={r.reason} className="flex items-center gap-2">
                    <span className="text-[10px] text-th-text-primary flex-1">{r.reason}</span>
                    <div className="w-16 h-2.5 rounded bg-surface-tertiary overflow-hidden">
                      <div className="h-full rounded bg-green-500/50" style={{ width: `${r.pct}%` }} />
                    </div>
                    <span className="text-[10px] text-th-text-tertiary tabular-nums w-6 text-right">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-red-500/30">
              <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-2">Why We Lose</p>
              <div className="space-y-1.5">
                {MOCK_LOSS_REASONS.map((r) => (
                  <div key={r.reason} className="flex items-center gap-2">
                    <span className="text-[10px] text-th-text-primary flex-1">{r.reason}</span>
                    <div className="w-16 h-2.5 rounded bg-surface-tertiary overflow-hidden">
                      <div className="h-full rounded bg-red-500/40" style={{ width: `${r.pct}%` }} />
                    </div>
                    <span className="text-[10px] text-th-text-tertiary tabular-nums w-6 text-right">{r.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Win/Loss Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">"<strong>Price too high</strong>" is your #1 loss reason (36%). Consider value-based selling frameworks or tiered pricing to counter this objection.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
