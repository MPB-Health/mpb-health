import { Modal } from '../Modal';
import { Award, Star, TrendingUp, ArrowUp, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const TIERS = [
  { name: 'Platinum', color: '#8b5cf6', bgClass: 'from-violet-500/10 to-purple-500/10', rate: '20%', minRefs: 100, partners: [{ name: 'None yet', refs: 0 }], benefits: ['Priority support', '20% commission', 'Co-branded materials', 'Quarterly bonus'] },
  { name: 'Gold', color: '#f59e0b', bgClass: 'from-amber-500/10 to-yellow-500/10', rate: '15%', minRefs: 50, partners: [{ name: 'ADP Payroll', refs: 52 }], benefits: ['15% commission', 'Featured partner page', 'Monthly report'] },
  { name: 'Silver', color: '#94a3b8', bgClass: 'from-gray-400/10 to-gray-500/10', rate: '12%', minRefs: 20, partners: [{ name: 'Jane Roberts', refs: 42 }, { name: 'Tom Chen', refs: 36 }], benefits: ['12% commission', 'Dedicated rep', 'Quarterly review'] },
  { name: 'Bronze', color: '#b45309', bgClass: 'from-orange-500/10 to-amber-700/10', rate: '10%', minRefs: 0, partners: [{ name: 'Sarah Kim', refs: 28 }, { name: 'Mike Johnson', refs: 22 }, { name: 'Others', refs: 0 }], benefits: ['10% commission', 'Standard support', 'Monthly newsletter'] },
];

const NEAR_UPGRADE = [
  { name: 'Jane Roberts', current: 'Silver', next: 'Gold', refs: 42, needed: 8 },
  { name: 'Tom Chen', current: 'Silver', next: 'Gold', refs: 36, needed: 14 },
  { name: 'Sarah Kim', current: 'Bronze', next: 'Silver', refs: 28, needed: 0 },
];

export function PartnerTierModal({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Partner Tiers" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {TIERS.map((t) => (
            <div key={t.name} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30 text-center', t.bgClass)}>
              <Award className="w-5 h-5 mx-auto mb-1" style={{ color: t.color }} />
              <p className="text-xs font-bold text-th-text-primary">{t.name}</p>
              <p className="text-lg font-extrabold" style={{ color: t.color }}>{t.rate}</p>
              <p className="text-[8px] text-th-text-tertiary">{t.minRefs > 0 ? `${t.minRefs}+ referrals` : 'Default'}</p>
              <p className="text-[9px] text-th-text-tertiary mt-1">{t.partners.length} partner{t.partners.length !== 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Near Tier Upgrade</p>
          {NEAR_UPGRADE.map((p) => (
            <div key={p.name} className="flex items-center gap-2 py-1.5 border-b border-th-border/10 last:border-0">
              <ArrowUp className="w-3 h-3 text-green-500 shrink-0" />
              <span className="text-xs font-medium text-th-text-primary flex-1">{p.name}</span>
              <span className="text-[9px] text-th-text-tertiary">{p.current} → {p.next}</span>
              <div className="w-16 h-1.5 rounded bg-surface-tertiary overflow-hidden"><div className="h-full rounded bg-th-accent-500" style={{ width: `${(p.refs / (p.refs + p.needed)) * 100}%` }} /></div>
              <span className="text-[9px] font-bold text-th-accent-500">{p.needed > 0 ? `${p.needed} more` : 'Ready!'}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <div className="px-3 py-2 bg-surface-secondary/50"><p className="text-xs font-semibold text-th-text-secondary">Tier Benefits</p></div>
          {TIERS.map((t) => (
            <div key={t.name} className="px-3 py-2 border-t border-th-border/20">
              <p className="text-xs font-semibold mb-1" style={{ color: t.color }}>{t.name}</p>
              <div className="flex flex-wrap gap-1">
                {t.benefits.map((b) => <span key={b} className="text-[8px] px-1.5 py-0.5 rounded bg-surface-tertiary text-th-text-tertiary">{b}</span>)}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Tier Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Sarah Kim</strong> has enough referrals to upgrade to Silver! Process the upgrade to unlock 12% commission and dedicated rep support.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
