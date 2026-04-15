import { Modal } from '../Modal';
import { DollarSign, TrendingUp, Sparkles, Wallet, PieChart } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const ADVISORS = [
  { name: 'Maria Santos', production: 42000, override: 4200, paidOut: 3150, pending: 1050, rate: 10, plans: { essentials: 8, mecPlus: 4, carePlus: 3, hsa: 1 }, color: '#3b82f6' },
  { name: 'David Park', production: 34000, override: 3400, paidOut: 3400, pending: 0, rate: 10, plans: { essentials: 6, mecPlus: 3, carePlus: 2, hsa: 2 }, color: '#10b981' },
  { name: 'Rachel Green', production: 26000, override: 2600, paidOut: 1950, pending: 650, rate: 10, plans: { essentials: 5, mecPlus: 2, carePlus: 2, hsa: 1 }, color: '#8b5cf6' },
  { name: 'James Wilson', production: 23500, override: 3525, paidOut: 2644, pending: 881, rate: 15, plans: { essentials: 4, mecPlus: 2, carePlus: 2, hsa: 1 }, color: '#f59e0b' },
  { name: 'Linda Chen', production: 21000, override: 3150, paidOut: 2363, pending: 787, rate: 15, plans: { essentials: 3, mecPlus: 2, carePlus: 2, hsa: 1 }, color: '#ef4444' },
];

export function AdvisorProductionModal({ open, onClose }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const totalProduction = ADVISORS.reduce((s, a) => s + a.production, 0);
  const totalOverride = ADVISORS.reduce((s, a) => s + a.override, 0);
  const totalPending = ADVISORS.reduce((s, a) => s + a.pending, 0);
  const maxProd = Math.max(...ADVISORS.map((a) => a.production), 1);

  return (
    <Modal open={open} onClose={onClose} title="Advisor Production & Overrides" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total Production', value: fmt(totalProduction), icon: DollarSign, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Overrides', value: fmt(totalOverride), icon: Wallet, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Pending Payout', value: fmt(totalPending), icon: PieChart, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
            { label: 'Avg Rate', value: '11.6%', icon: TrendingUp, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {ADVISORS.map((a) => (
            <div key={a.name} className="p-2.5 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                <span className="text-xs font-semibold text-th-text-primary flex-1">{a.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-tertiary">{a.rate}% override</span>
              </div>
              <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden mb-1.5">
                <div className="h-full rounded-full" style={{ width: `${(a.production / maxProd) * 100}%`, backgroundColor: a.color }} />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(a.production)}</p><p className="text-[7px] text-th-text-tertiary">Production</p></div>
                <div><p className="text-[10px] font-bold text-green-500 tabular-nums">{fmt(a.override)}</p><p className="text-[7px] text-th-text-tertiary">Override</p></div>
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(a.paidOut)}</p><p className="text-[7px] text-th-text-tertiary">Paid</p></div>
                <div><p className={cn('text-[10px] font-bold tabular-nums', a.pending > 0 ? 'text-amber-500' : 'text-th-text-tertiary')}>{fmt(a.pending)}</p><p className="text-[7px] text-th-text-tertiary">Pending</p></div>
              </div>
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[8px] text-th-text-tertiary">Plan mix:</span>
                {Object.entries(a.plans).map(([k, v]) => (
                  <span key={k} className="text-[7px] px-1 py-0.5 rounded bg-surface-tertiary text-th-text-tertiary">{k}: {v}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-green-500" /><span className="text-xs font-semibold text-green-700 dark:text-green-300">Production Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>{fmt(totalPending)}</strong> in pending overrides across 4 advisors. <strong>James Wilson & Linda Chen</strong> earn 15% — FMO/Wholesale channels generate premium-tier production.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
