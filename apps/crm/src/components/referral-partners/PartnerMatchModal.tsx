import { useState } from 'react';
import { Modal } from '../Modal';
import { Brain, Sparkles, Star, Users, ArrowRight } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const MATCHES = [
  { lead: 'Brett Baker — Small Business Owner', partner: 'Jane Roberts (CPA)', score: 94, reason: 'CPA specializing in small business tax — ideal for self-employed leads needing HSA guidance', color: '#3b82f6' },
  { lead: 'Acme Corp — 25 employees', partner: 'ADP Payroll', score: 91, reason: 'Payroll company with existing relationship — seamless group plan integration', color: '#10b981' },
  { lead: 'Sarah Mitchell — High net worth', partner: 'Tom Chen (Financial Advisor)', score: 88, reason: 'FA experienced with high-net-worth clients and tax-advantaged health plans', color: '#8b5cf6' },
  { lead: 'TechStart LLC — 8 employees', partner: 'Sarah Kim (HR Consultant)', score: 85, reason: 'HR consultant who specializes in startups — can bundle with benefits consulting', color: '#f59e0b' },
  { lead: 'Family Estate Planning Client', partner: 'Mike Johnson (Attorney)', score: 78, reason: 'Estate attorney can cross-refer health sharing as part of estate planning', color: '#ef4444' },
];

export function PartnerMatchModal({ open, onClose }: Props) {
  const [applied, setApplied] = useState<Set<number>>(new Set());

  return (
    <Modal open={open} onClose={onClose} title="AI Partner Matching" size="xl">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">AI matched your unassigned leads to the best-fit referral partner based on specialization, conversion history, and lead profile.</span></div>
        </div>

        <div className="space-y-2">
          {MATCHES.map((m, i) => (
            <div key={m.lead} className={cn('p-3 rounded-xl border', applied.has(i) ? 'border-green-500/20 bg-green-500/5 opacity-60' : 'border-th-border/50')}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: m.color }}>{m.score}%</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-semibold text-th-text-primary truncate">{m.lead}</span>
                    <ArrowRight className="w-3 h-3 text-th-text-tertiary shrink-0" />
                    <span className="font-semibold text-th-accent-500 truncate">{m.partner}</span>
                  </div>
                </div>
                {applied.has(i) && <Star className="w-3.5 h-3.5 text-green-500 fill-green-500 shrink-0" />}
              </div>
              <p className="text-[10px] text-th-text-tertiary mb-2">{m.reason}</p>
              {!applied.has(i) && (
                <button onClick={() => setApplied((p) => new Set([...p, i]))} className="w-full py-1.5 rounded-lg bg-th-accent-500/10 text-th-accent-500 text-[10px] font-medium hover:bg-th-accent-500/20">Assign Partner</button>
              )}
            </div>
          ))}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
