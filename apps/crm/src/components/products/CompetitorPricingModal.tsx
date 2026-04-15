import { useState } from 'react';
import { Modal } from '../Modal';
import { Swords, TrendingDown, TrendingUp, Minus, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface CompetitorPricingModalProps { open: boolean; onClose: () => void; }

type Tier = 'basic' | 'standard' | 'premium';
const TIERS: { id: Tier; label: string }[] = [
  { id: 'basic', label: 'Basic Coverage' },
  { id: 'standard', label: 'Standard Coverage' },
  { id: 'premium', label: 'Premium Coverage' },
];

const COMPETITORS: Record<Tier, { company: string; rate: number; ourRate: number; features: string }[]> = {
  basic: [
    { company: 'MPB Health (Essentials)', rate: 142, ourRate: 142, features: 'MEC, preventive care' },
    { company: 'Christian Healthcare', rate: 165, ourRate: 142, features: 'MEC, limited sharing' },
    { company: 'Medi-Share Basic', rate: 178, ourRate: 142, features: 'MEC, preventive' },
    { company: 'OneShare Basic', rate: 155, ourRate: 142, features: 'MEC, wellness' },
  ],
  standard: [
    { company: 'MPB Health (Care Plus)', rate: 284, ourRate: 284, features: 'Cost sharing, IUA' },
    { company: 'Christian Healthcare Plus', rate: 320, ourRate: 284, features: 'Limited cost sharing' },
    { company: 'Medi-Share Standard', rate: 340, ourRate: 284, features: 'Cost sharing' },
    { company: 'OneShare Classic', rate: 298, ourRate: 284, features: 'Cost sharing, IUA' },
  ],
  premium: [
    { company: 'MPB Health (Secure HSA)', rate: 412, ourRate: 412, features: 'HSA, full sharing' },
    { company: 'Christian Healthcare Premium', rate: 485, ourRate: 412, features: 'Full sharing' },
    { company: 'Medi-Share Premium', rate: 520, ourRate: 412, features: 'Full sharing' },
    { company: 'OneShare Complete', rate: 448, ourRate: 412, features: 'Full sharing, HSA' },
  ],
};

export function CompetitorPricingModal({ open, onClose }: CompetitorPricingModalProps) {
  const [tier, setTier] = useState<Tier>('standard');
  const data = COMPETITORS[tier];
  const fmt = (n: number) => `$${n}`;

  return (
    <Modal open={open} onClose={onClose} title="Competitive Pricing" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {TIERS.map((t) => (
            <button key={t.id} onClick={() => setTier(t.id)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', tier === t.id ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent')}>{t.label}</button>
          ))}
        </div>

        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-surface-secondary/50">
              <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Company</th>
              <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Rate/mo</th>
              <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">vs Ours</th>
              <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Features</th>
            </tr></thead>
            <tbody>
              {data.map((row) => {
                const diff = row.rate - row.ourRate;
                const isOurs = row.company.startsWith('MPB');
                return (
                  <tr key={row.company} className={cn('border-t border-th-border/20', isOurs && 'bg-th-accent-500/5')}>
                    <td className="px-3 py-2.5">
                      <span className={cn('font-medium', isOurs ? 'text-th-accent-500' : 'text-th-text-primary')}>{row.company}</span>
                      {isOurs && <span className="ml-1.5 text-[8px] bg-th-accent-500/20 text-th-accent-500 px-1.5 py-0.5 rounded-full font-bold">YOU</span>}
                    </td>
                    <td className="text-right px-3 py-2.5 font-bold tabular-nums text-th-text-primary">{fmt(row.rate)}</td>
                    <td className="text-right px-3 py-2.5">
                      {diff === 0 ? (
                        <span className="flex items-center justify-end gap-0.5 text-th-text-tertiary"><Minus className="w-3 h-3" /> —</span>
                      ) : diff > 0 ? (
                        <span className="flex items-center justify-end gap-0.5 text-green-500"><TrendingUp className="w-3 h-3" /> +{fmt(diff)}</span>
                      ) : (
                        <span className="flex items-center justify-end gap-0.5 text-red-500"><TrendingDown className="w-3 h-3" /> {fmt(diff)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-th-text-tertiary">{row.features}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-green-500" /><span className="text-xs font-semibold text-green-700 dark:text-green-300">Competitive Advantage</span></div>
          <p className="text-xs text-th-text-secondary">MPB Health offers the <strong>lowest rates</strong> across all tiers while maintaining MEC compliance and full feature parity. Use these savings in your sales pitch.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
