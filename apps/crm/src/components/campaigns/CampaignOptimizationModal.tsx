import { useState } from 'react';
import { Modal } from '../Modal';
import { Brain, Sparkles, ArrowUp, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const SUGGESTIONS = [
  { id: '1', campaign: 'Open Enrollment Q2', type: 'timing', title: 'Shift send time to 10am EST', impact: '+18% open rate', effort: 'Low', desc: 'Historical data shows 10am EST has 18% higher open rates for health insurance content vs your current 2pm.', applied: false },
  { id: '2', campaign: 'Google Ads — Plans', type: 'budget', title: 'Reallocate $2k from display to search', impact: '+32% conversions', effort: 'Medium', desc: 'Search campaigns convert at 3.2x the rate of display for your audience. Shift budget from underperforming display ads.', applied: false },
  { id: '3', campaign: 'Health Fair 2026', type: 'audience', title: 'Add "Young Families" segment', impact: '+24% attendance', effort: 'Low', desc: 'Young families (25-35) in your area show 24% higher event attendance but aren\'t in current targeting.', applied: false },
  { id: '4', campaign: 'LinkedIn Outreach', type: 'content', title: 'Use video posts instead of static', impact: '+45% engagement', effort: 'High', desc: 'LinkedIn video posts in healthcare get 45% more engagement. Create 3 short-form videos showcasing plan benefits.', applied: false },
  { id: '5', campaign: 'All Campaigns', type: 'general', title: 'Enable automated follow-up sequences', impact: '+22% conversion', effort: 'Medium', desc: 'Adding a 3-email follow-up sequence to campaign leads increases conversion by 22% on average.', applied: false },
];

const typeColors: Record<string, string> = { timing: 'text-blue-500', budget: 'text-green-500', audience: 'text-violet-500', content: 'text-amber-500', general: 'text-pink-500' };

export function CampaignOptimizationModal({ open, onClose }: Props) {
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const apply = (id: string) => setApplied((prev) => new Set([...prev, id]));

  return (
    <Modal open={open} onClose={onClose} title="AI Campaign Optimizer" size="xl">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI analyzed your campaigns against 10,000+ benchmarks and found {SUGGESTIONS.length} optimization opportunities.</span></div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Zap className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{SUGGESTIONS.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Suggestions</p>
          </div>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <ArrowUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">+28%</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Impact</p>
          </div>
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <CheckCircle2 className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{applied.size}/{SUGGESTIONS.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Applied</p>
          </div>
        </div>

        <div className="space-y-2">
          {SUGGESTIONS.map((s) => (
            <div key={s.id} className={cn('p-3 rounded-xl border border-th-border/50', applied.has(s.id) && 'opacity-50')}>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase', typeColors[s.type] || '', 'bg-current/10')} style={{ backgroundColor: undefined }}>{s.type}</span>
                <span className="text-xs font-semibold text-th-text-primary flex-1">{s.title}</span>
                {applied.has(s.id) && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
              </div>
              <p className="text-[10px] text-th-text-tertiary mb-2">{s.desc}</p>
              <div className="flex items-center gap-3">
                <span className="text-[9px] text-th-text-tertiary">Campaign: <strong className="text-th-text-secondary">{s.campaign}</strong></span>
                <span className="text-[9px] font-bold text-green-500">{s.impact}</span>
                <span className={cn('text-[8px] px-1.5 py-0.5 rounded-full', s.effort === 'Low' ? 'bg-green-500/10 text-green-500' : s.effort === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500')}>{s.effort} effort</span>
                {!applied.has(s.id) && <button onClick={() => apply(s.id)} className="ml-auto text-[10px] font-medium text-th-accent-500 hover:text-th-accent-600">Apply</button>}
              </div>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
