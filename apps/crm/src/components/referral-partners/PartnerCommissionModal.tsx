import { useState } from 'react';
import { Modal } from '../Modal';
import { Wallet, DollarSign, CheckCircle2, Clock, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const PAYOUTS = [
  { id: '1', partner: 'Jane Roberts', amount: 720, referrals: 3, status: 'pending' as const, date: 'Apr 30, 2026' },
  { id: '2', partner: 'Sarah Kim', amount: 480, referrals: 2, status: 'pending' as const, date: 'Apr 30, 2026' },
  { id: '3', partner: 'ADP Payroll', amount: 600, referrals: 2, status: 'pending' as const, date: 'Apr 30, 2026' },
  { id: '4', partner: 'Mike Johnson', amount: 320, referrals: 1, status: 'pending' as const, date: 'Apr 30, 2026' },
  { id: '5', partner: 'Tom Chen', amount: 2240, referrals: 8, status: 'paid' as const, date: 'Mar 31, 2026' },
  { id: '6', partner: 'Jane Roberts', amount: 2160, referrals: 9, status: 'paid' as const, date: 'Mar 31, 2026' },
];

const TIERS = [
  { tier: 'Standard', rate: '10%', minReferrals: 0, partners: 4 },
  { tier: 'Silver', rate: '12%', minReferrals: 20, partners: 2 },
  { tier: 'Gold', rate: '15%', minReferrals: 50, partners: 1 },
];

export function PartnerCommissionModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<'payouts' | 'tiers'>('payouts');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const pendingTotal = PAYOUTS.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const paidTotal = PAYOUTS.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <Modal open={open} onClose={onClose} title="Commission Manager" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(pendingTotal)}</p>
            <p className="text-[10px] text-th-text-tertiary">Pending</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(paidTotal)}</p>
            <p className="text-[10px] text-th-text-tertiary">Paid (last month)</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Wallet className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{fmt(pendingTotal + paidTotal)}</p>
            <p className="text-[10px] text-th-text-tertiary">Total YTD</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(['payouts', 'tiers'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', tab === t ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{t === 'payouts' ? 'Payouts' : 'Commission Tiers'}</button>
          ))}
        </div>
        {tab === 'payouts' ? (
          <div className="rounded-xl border border-th-border/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-surface-secondary/50">
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Partner</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Refs</th>
                <th className="text-right px-3 py-2 font-medium text-th-text-tertiary">Amount</th>
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Status</th>
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary">Date</th>
              </tr></thead>
              <tbody>{PAYOUTS.map((p) => (
                <tr key={p.id} className="border-t border-th-border/20">
                  <td className="px-3 py-2 font-medium text-th-text-primary">{p.partner}</td>
                  <td className="text-right px-3 py-2 tabular-nums text-th-text-secondary">{p.referrals}</td>
                  <td className="text-right px-3 py-2 tabular-nums font-bold text-th-text-primary">{fmt(p.amount)}</td>
                  <td className="px-3 py-2"><span className={cn('text-[8px] px-1.5 py-0.5 rounded-full font-medium', p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700')}>{p.status}</span></td>
                  <td className="px-3 py-2 text-th-text-tertiary">{p.date}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-2">
            {TIERS.map((t) => (
              <div key={t.tier} className="p-3 rounded-xl border border-th-border/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-th-accent-500/10 flex items-center justify-center text-sm font-bold text-th-accent-500">{t.rate}</div>
                <div className="flex-1"><p className="text-xs font-semibold text-th-text-primary">{t.tier}</p><p className="text-[9px] text-th-text-tertiary">{t.minReferrals > 0 ? `${t.minReferrals}+ lifetime referrals` : 'Default tier'}</p></div>
                <span className="text-xs text-th-text-tertiary">{t.partners} partners</span>
              </div>
            ))}
          </div>
        )}
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Commission Tip</span></div>
          <p className="text-xs text-th-text-secondary">{fmt(pendingTotal)} in pending payouts due Apr 30. <strong>Jane Roberts</strong> is 8 referrals from Gold tier — send a congratulatory message.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
