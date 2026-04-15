import { useState } from 'react';
import { Modal } from '../Modal';
import { BarChart3, DollarSign, CheckCircle2, XCircle, Clock, TrendingUp, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

interface QuoteAnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  totalQuotes: number;
  totalValue: number;
  pendingValue: number;
  acceptedValue: number;
}

const FUNNEL = [
  { stage: 'Draft', count: 42, value: 126000, pct: 100, color: '#94a3b8' },
  { stage: 'Sent', count: 35, value: 105000, pct: 83, color: '#3b82f6' },
  { stage: 'Pending', count: 24, value: 72000, pct: 57, color: '#f59e0b' },
  { stage: 'Accepted', count: 18, value: 54000, pct: 43, color: '#10b981' },
];

const STATUS_BREAKDOWN = [
  { status: 'Accepted', count: 18, value: 54000, pct: 43, color: '#10b981', icon: CheckCircle2 },
  { status: 'Pending', count: 8, value: 24000, pct: 19, color: '#f59e0b', icon: Clock },
  { status: 'Rejected', count: 6, value: 18000, pct: 14, color: '#ef4444', icon: XCircle },
  { status: 'Expired', count: 4, value: 12000, pct: 10, color: '#f97316', icon: Clock },
  { status: 'Draft', count: 6, value: 18000, pct: 14, color: '#94a3b8', icon: BarChart3 },
];

export function QuoteAnalyticsModal({ open, onClose, totalQuotes, totalValue, pendingValue, acceptedValue }: QuoteAnalyticsModalProps) {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ytd'>('90d');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const winRate = totalQuotes > 0 ? Math.round((18 / 42) * 100) : 0;

  return (
    <Modal open={open} onClose={onClose} title="Quote Analytics" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['30d', '90d', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'Year to Date'}</button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Total Quotes', value: String(totalQuotes || 42), icon: BarChart3, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Total Value', value: fmt(totalValue || 126000), icon: DollarSign, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Accepted', value: fmt(acceptedValue || 54000), icon: CheckCircle2, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-3">Conversion Funnel</p>
          <div className="space-y-1.5">
            {FUNNEL.map((f, i) => (
              <div key={f.stage} className="flex items-center gap-2">
                <span className="text-[10px] text-th-text-tertiary w-14">{f.stage}</span>
                <div className="flex-1 h-7 rounded-lg bg-surface-tertiary overflow-hidden relative">
                  <div className="h-full rounded-lg flex items-center justify-between px-2.5 transition-all" style={{ width: `${f.pct}%`, backgroundColor: f.color + '30' }}>
                    <span className="text-[10px] font-bold text-th-text-primary">{f.count} quotes</span>
                    <span className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(f.value)}</span>
                  </div>
                </div>
                {i > 0 && <span className="text-[9px] text-th-text-tertiary w-8 text-right">{f.pct}%</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          {STATUS_BREAKDOWN.map((s) => (
            <div key={s.status} className="flex items-center gap-2 p-2 rounded-xl border border-th-border/30">
              <s.icon className="w-4 h-4 shrink-0" style={{ color: s.color }} />
              <span className="text-xs font-medium text-th-text-primary flex-1">{s.status}</span>
              <span className="text-[10px] tabular-nums text-th-text-tertiary">{s.count} quotes</span>
              <span className="text-[10px] tabular-nums font-bold text-th-text-primary">{fmt(s.value)}</span>
              <span className="text-[10px] tabular-nums w-8 text-right" style={{ color: s.color }}>{s.pct}%</span>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Quote Insight</span></div>
          <p className="text-xs text-th-text-secondary">Your <strong>43% win rate</strong> is above industry average. 57% of sent quotes reach the pending stage — focus on reducing the pending-to-accepted drop to boost conversions.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
