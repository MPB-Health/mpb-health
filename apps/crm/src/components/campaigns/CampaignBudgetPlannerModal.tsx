import { useState } from 'react';
import { Modal } from '../Modal';
import { DollarSign, PieChart, Sparkles, TrendingUp } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; totalBudget: number; }

const CHANNELS = [
  { id: 'email', name: 'Email', current: 6200, suggested: 8500, roi: 310, color: '#3b82f6' },
  { id: 'social', name: 'Social Media', current: 4800, suggested: 3200, roi: 248, color: '#8b5cf6' },
  { id: 'events', name: 'Events', current: 15000, suggested: 12000, roi: 164, color: '#10b981' },
  { id: 'webinar', name: 'Webinars', current: 1800, suggested: 3500, roi: 386, color: '#f59e0b' },
  { id: 'ads', name: 'Advertising', current: 18000, suggested: 15000, roi: 192, color: '#ef4444' },
  { id: 'referral', name: 'Referral', current: 5400, suggested: 8800, roi: 420, color: '#06b6d4' },
];

export function CampaignBudgetPlannerModal({ open, onClose, totalBudget }: Props) {
  const [allocations, setAllocations] = useState<Record<string, number>>(Object.fromEntries(CHANNELS.map((c) => [c.id, c.current])));
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const totalAllocated = Object.values(allocations).reduce((s, v) => s + v, 0);
  const totalSuggested = CHANNELS.reduce((s, c) => s + c.suggested, 0);
  const maxBudget = Math.max(...Object.values(allocations), ...CHANNELS.map((c) => c.suggested), 1);

  const handleChange = (id: string, val: number) => setAllocations((prev) => ({ ...prev, [id]: Math.max(0, val) }));
  const applySuggested = () => setAllocations(Object.fromEntries(CHANNELS.map((c) => [c.id, c.suggested])));

  return (
    <Modal open={open} onClose={onClose} title="Budget Planner" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <DollarSign className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(totalAllocated)}</p>
            <p className="text-[10px] text-th-text-tertiary">Allocated</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(totalSuggested)}</p>
            <p className="text-[10px] text-th-text-tertiary">AI Suggested</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <PieChart className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(totalSuggested - totalAllocated)}</p>
            <p className="text-[10px] text-th-text-tertiary">Difference</p>
          </div>
        </div>

        <button onClick={applySuggested} className="w-full py-1.5 rounded-lg bg-th-accent-500/10 text-th-accent-500 text-[10px] font-medium hover:bg-th-accent-500/20 transition-colors">Apply AI-Optimized Budget</button>

        <div className="space-y-2">
          {CHANNELS.map((ch) => {
            const current = allocations[ch.id] ?? ch.current;
            const diff = current - ch.current;
            return (
              <div key={ch.id} className="p-2.5 rounded-xl border border-th-border/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2.5 h-5 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
                  <span className="text-xs font-semibold text-th-text-primary flex-1">{ch.name}</span>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', ch.roi >= 350 ? 'bg-green-500/10 text-green-500' : ch.roi >= 200 ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500')}>{ch.roi}% ROI</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={25000} step={500} value={current} onChange={(e) => handleChange(ch.id, Number(e.target.value))} className="flex-1 accent-th-accent-500 h-1" />
                  <span className="text-xs font-bold text-th-text-primary tabular-nums w-16 text-right">{fmt(current)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded" style={{ width: `${(current / maxBudget) * 100}%`, backgroundColor: ch.color }} />
                  </div>
                  <span className="text-[8px] text-th-text-tertiary">Suggested: {fmt(ch.suggested)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-green-500" /><span className="text-xs font-semibold text-green-700 dark:text-green-300">Budget Insight</span></div>
          <p className="text-xs text-th-text-secondary">Shifting $3k from <strong>Events</strong> and <strong>Ads</strong> into <strong>Referral</strong> and <strong>Webinars</strong> could increase overall ROI by 34% based on historical performance.</p>
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600">Save Budget Plan</button>
        </div>
      </div>
    </Modal>
  );
}
