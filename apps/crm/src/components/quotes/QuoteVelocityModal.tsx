import { Modal } from '../Modal';
import { Clock, Zap, AlertTriangle, TrendingDown, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface QuoteVelocityModalProps { open: boolean; onClose: () => void; }

const VELOCITY = [
  { stage: 'Draft → Sent', avgDays: 1.2, medianDays: 0.8, count: 38, color: '#3b82f6' },
  { stage: 'Sent → Pending', avgDays: 2.8, medianDays: 2.1, count: 32, color: '#f59e0b' },
  { stage: 'Pending → Decision', avgDays: 5.4, medianDays: 4.2, count: 26, color: '#8b5cf6' },
  { stage: 'Total Cycle', avgDays: 9.4, medianDays: 7.1, count: 18, color: '#10b981' },
];

const AGING = [
  { name: 'Q-2024-089 — Acme Corp', days: 21, value: 12500, status: 'pending' as const },
  { name: 'Q-2024-076 — TechStart LLC', days: 18, value: 8400, status: 'sent' as const },
  { name: 'Q-2024-082 — HealthFirst Inc', days: 14, value: 6200, status: 'pending' as const },
  { name: 'Q-2024-091 — BrightCare', days: 12, value: 15800, status: 'sent' as const },
  { name: 'Q-2024-094 — Wellness Group', days: 8, value: 9100, status: 'pending' as const },
];

const maxDays = Math.max(...VELOCITY.map((v) => v.avgDays), 1);

export function QuoteVelocityModal({ open, onClose }: QuoteVelocityModalProps) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  return (
    <Modal open={open} onClose={onClose} title="Quote Velocity & Aging" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">9.4d</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Cycle Time</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Zap className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">7.1d</p>
            <p className="text-[10px] text-th-text-tertiary">Median Cycle</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">5</p>
            <p className="text-[10px] text-th-text-tertiary">Stale Quotes</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Stage Velocity</p>
          <div className="space-y-2">
            {VELOCITY.map((v) => (
              <div key={v.stage} className="flex items-center gap-2">
                <span className="text-[10px] text-th-text-tertiary w-32 shrink-0">{v.stage}</span>
                <div className="flex-1 h-5 rounded bg-surface-tertiary overflow-hidden">
                  <div className="h-full rounded flex items-center px-2" style={{ width: `${(v.avgDays / maxDays) * 100}%`, backgroundColor: v.color + '30' }}>
                    <span className="text-[9px] font-bold text-th-text-primary tabular-nums">{v.avgDays}d avg</span>
                  </div>
                </div>
                <span className="text-[10px] text-th-text-tertiary tabular-nums w-10">{v.medianDays}d med</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-th-text-secondary">Aging Quotes (Needs Attention)</p>
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="space-y-1.5">
            {AGING.map((q) => (
              <div key={q.name} className="flex items-center gap-2 p-2 rounded-lg border border-th-border/30">
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white', q.days > 14 ? 'bg-red-500' : q.days > 7 ? 'bg-amber-500' : 'bg-blue-500')}>{q.days}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-th-text-primary truncate">{q.name}</p>
                </div>
                <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize', q.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700')}>{q.status}</span>
                <span className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(q.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Velocity Insight</span></div>
          <p className="text-xs text-th-text-secondary">The <strong>Pending → Decision</strong> stage averages 5.4 days — the biggest bottleneck. 2 quotes are over 18 days old. Follow up on Acme Corp ($12,500) immediately.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
