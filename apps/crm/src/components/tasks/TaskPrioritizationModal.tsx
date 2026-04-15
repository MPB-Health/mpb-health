import { useState } from 'react';
import { Modal } from '../Modal';
import { Brain, Sparkles, Star, AlertCircle, Clock, DollarSign } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const PRIORITIZED = [
  { id: 1, title: 'Call Brett Baker — Quick Rate follow-up', lead: 'Brett Baker', score: 98, reason: 'Hot lead, $2,400 potential, responded to quote yesterday, overdue by 0 days', urgency: 'critical' as const, potential: 2400, color: '#ef4444' },
  { id: 2, title: 'Midwest Mfg follow-up (3 days overdue)', lead: 'Midwest Mfg', score: 95, reason: '200-employee group, $52,000 annual premium, 3 days overdue — lead decay risk', urgency: 'critical' as const, potential: 52000, color: '#ef4444' },
  { id: 3, title: 'Send quote to Acme Corp', lead: 'Acme Corp', score: 88, reason: '50-employee group, high-intent inquiry, competitor also quoting — time-sensitive', urgency: 'high' as const, potential: 13000, color: '#f59e0b' },
  { id: 4, title: 'Event follow-up calls (12 hot leads)', lead: 'Event Leads', score: 82, reason: 'Church partnership leads, 48h follow-up window closing, 24.8% historical conversion', urgency: 'high' as const, potential: 4800, color: '#f59e0b' },
  { id: 5, title: 'TechStart LLC enrollment follow-up', lead: 'TechStart LLC', score: 74, reason: 'Application submitted, needs document collection, 12-employee group', urgency: 'medium' as const, potential: 3100, color: '#3b82f6' },
  { id: 6, title: 'Partner commission review', lead: 'Partners', score: 52, reason: 'Monthly admin task, no revenue impact, can defer to end of week', urgency: 'low' as const, potential: 0, color: '#94a3b8' },
];

const urgencyColors = { critical: 'bg-red-500', high: 'bg-amber-500', medium: 'bg-blue-500', low: 'bg-gray-400' };

export function TaskPrioritizationModal({ open, onClose }: Props) {
  const [actioned, setActioned] = useState<Set<number>>(new Set());
  const fmt = (n: number) => n > 0 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n) : '—';

  return (
    <Modal open={open} onClose={onClose} title="AI Smart Priority Queue" size="xl">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI ranked your tasks by urgency, revenue potential, lead decay risk, and historical conversion data. Work top-down for maximum impact.</span></div>
        </div>

        <div className="space-y-2">
          {PRIORITIZED.map((t, i) => (
            <div key={t.id} className={cn('p-3 rounded-xl border', actioned.has(t.id) ? 'border-green-500/20 bg-green-500/5 opacity-50' : 'border-th-border/50')}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-th-text-tertiary w-4">#{i + 1}</span>
                <div className={cn('w-2 h-5 rounded-full', urgencyColors[t.urgency])} />
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: t.color }}>{t.score}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-th-text-primary truncate">{t.title}</p>
                  <div className="flex items-center gap-2 text-[9px] text-th-text-tertiary">
                    <span>{t.lead}</span>
                    {t.potential > 0 && <><span>•</span><span className="text-green-500 font-bold">{fmt(t.potential)}</span></>}
                  </div>
                </div>
                {actioned.has(t.id) && <Star className="w-3.5 h-3.5 text-green-500 fill-green-500 shrink-0" />}
              </div>
              <p className="text-[10px] text-th-text-tertiary mb-1.5 pl-[52px]">{t.reason}</p>
              {!actioned.has(t.id) && (
                <div className="flex gap-1.5 pl-[52px]">
                  <button onClick={() => setActioned((p) => new Set([...p, t.id]))} className="flex-1 py-1.5 rounded-lg bg-th-accent-500/10 text-th-accent-500 text-[10px] font-medium hover:bg-th-accent-500/20">Start Task</button>
                  <button onClick={() => setActioned((p) => new Set([...p, t.id]))} className="px-3 py-1.5 rounded-lg border border-th-border/30 text-[10px] font-medium text-th-text-tertiary hover:bg-surface-secondary">Defer</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
