import { useState } from 'react';
import { Modal } from '../Modal';
import { Brain, Sparkles, Star, ArrowRight } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const MATCHES = [
  { lead: 'Acme Corp — 50 employees, FL', advisor: 'Maria Santos (Benefits Broker)', score: 96, reason: 'FL-licensed broker specializing in group benefits with 95% close rate on groups 25–100', color: '#3b82f6' },
  { lead: 'TechStart LLC — 12 employees, NY', advisor: 'David Park (Independent Agent)', score: 92, reason: 'NY-licensed agent with startup-sector experience and strong small-group track record', color: '#10b981' },
  { lead: 'Baker Family — Individual, TX', advisor: 'James Wilson (FMO)', score: 88, reason: 'FMO with large TX individual-market network and HSA plan expertise', color: '#8b5cf6' },
  { lead: 'Midwest Mfg — 200 employees, OH', advisor: 'Rachel Green (GA)', score: 85, reason: 'OH-based GA with enterprise-level benefits experience and MEC+ specialization', color: '#f59e0b' },
  { lead: 'West Coast Fitness — 8 employees, CA', advisor: 'Unassigned', score: 0, reason: 'No CA-licensed advisor available — recruit needed', color: '#ef4444' },
];

export function AdvisorMatchModal({ open, onClose }: Props) {
  const [applied, setApplied] = useState<Set<number>>(new Set());

  return (
    <Modal open={open} onClose={onClose} title="AI Advisor Matching" size="xl">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI matched unassigned leads to best-fit advisors based on licensing, territory, specialization, and historical performance.</span></div>
        </div>

        <div className="space-y-2">
          {MATCHES.map((m, i) => (
            <div key={m.lead} className={cn('p-3 rounded-xl border', m.score === 0 ? 'border-red-500/30 bg-red-500/5' : applied.has(i) ? 'border-green-500/20 bg-green-500/5 opacity-60' : 'border-th-border/50')}>
              <div className="flex items-center gap-2 mb-2">
                {m.score > 0 ? (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: m.color }}>{m.score}%</div>
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 bg-red-500">!</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-th-text-primary truncate">{m.lead}</span>
                    <ArrowRight className="w-3 h-3 text-th-text-tertiary shrink-0" />
                    <span className={cn('font-semibold truncate', m.score > 0 ? 'text-th-accent-500' : 'text-red-500')}>{m.advisor}</span>
                  </div>
                </div>
                {applied.has(i) && <Star className="w-3.5 h-3.5 text-green-500 fill-green-500 shrink-0" />}
              </div>
              <p className="text-[10px] text-th-text-tertiary mb-2">{m.reason}</p>
              {m.score > 0 && !applied.has(i) && (
                <button onClick={() => setApplied((p) => new Set([...p, i]))} className="w-full py-1.5 rounded-lg bg-th-accent-500/10 text-th-accent-500 text-[10px] font-medium hover:bg-th-accent-500/20">Assign Advisor</button>
              )}
            </div>
          ))}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
