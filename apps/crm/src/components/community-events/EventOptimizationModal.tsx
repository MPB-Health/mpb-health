import { useState } from 'react';
import { Modal } from '../Modal';
import { Brain, Sparkles, Star, Lightbulb } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const RECOMMENDATIONS = [
  { id: 1, title: 'Double Church Partnership Events', impact: 'High', confidence: 94, reason: 'Church events have 4,380% ROI with $7.35 CPL — your best-performing channel. Scheduling 2 more per month would add ~12 leads/month.', action: 'Schedule 2 new church events this month', color: '#3b82f6' },
  { id: 2, title: 'Add Sign-Up Incentive at Hydration Booths', impact: 'Medium', confidence: 82, reason: 'Hydration booths capture many contacts (65 avg) but convert poorly at 8.7%. A raffle or free consultation offer could boost conversion to 15%+.', action: 'Create raffle prize giveaway for next booth', color: '#10b981' },
  { id: 3, title: 'Expand Co-Sponsored Event Partnerships', impact: 'High', confidence: 88, reason: 'Co-sponsored events average 13 leads/event — best leads-per-event ratio. Partner with Rotary, United Way, and local nonprofits.', action: 'Reach out to 3 local nonprofits this week', color: '#8b5cf6' },
  { id: 4, title: 'Reduce Health Fair Frequency', impact: 'Medium', confidence: 76, reason: 'Health fairs cost $2,000 per event with only 860% ROI. Redirect budget to church partnerships and co-sponsored events.', action: 'Cut health fair budget by 30%', color: '#f59e0b' },
  { id: 5, title: 'Implement Same-Day Lead Follow-Up', impact: 'High', confidence: 91, reason: 'Analysis shows contacts followed up within 24h convert at 3.2x the rate of those followed up after 48h+. Automate SMS within 2h of event close.', action: 'Set up automated SMS campaign trigger', color: '#ef4444' },
];

export function EventOptimizationModal({ open, onClose }: Props) {
  const [applied, setApplied] = useState<Set<number>>(new Set());

  return (
    <Modal open={open} onClose={onClose} title="AI Event Strategy" size="xl">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI analyzed your event performance data to recommend strategy optimizations that could increase lead generation by 35%.</span></div>
        </div>

        <div className="space-y-2">
          {RECOMMENDATIONS.map((r) => (
            <div key={r.id} className={cn('p-3 rounded-xl border', applied.has(r.id) ? 'border-green-500/20 bg-green-500/5 opacity-60' : 'border-th-border/50')}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: r.color }}>{r.confidence}%</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-th-text-primary">{r.title}</p>
                  <span className={cn('text-[8px] px-1.5 py-0.5 rounded-full font-bold', r.impact === 'High' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500')}>{r.impact} Impact</span>
                </div>
                {applied.has(r.id) && <Star className="w-3.5 h-3.5 text-green-500 fill-green-500 shrink-0" />}
              </div>
              <p className="text-[10px] text-th-text-tertiary mb-1.5">{r.reason}</p>
              <div className="flex items-center gap-2 mb-1.5">
                <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">{r.action}</span>
              </div>
              {!applied.has(r.id) && (
                <button onClick={() => setApplied((p) => new Set([...p, r.id]))} className="w-full py-1.5 rounded-lg bg-th-accent-500/10 text-th-accent-500 text-[10px] font-medium hover:bg-th-accent-500/20">Apply Recommendation</button>
              )}
            </div>
          ))}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
