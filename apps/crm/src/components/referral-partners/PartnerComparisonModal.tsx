import { useState } from 'react';
import { Modal } from '../Modal';
import { ArrowLeftRight } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const PARTNERS = [
  { id: '1', name: 'Jane Roberts', type: 'CPA', referrals: 42, conversions: 18, revenue: 28800, rate: 42.9, avgDeal: 1600, engagement: 92 },
  { id: '2', name: 'Tom Chen', type: 'Financial Advisor', referrals: 36, conversions: 14, revenue: 22400, rate: 38.9, avgDeal: 1600, engagement: 78 },
  { id: '3', name: 'Sarah Kim', type: 'HR Consultant', referrals: 28, conversions: 12, revenue: 19200, rate: 42.9, avgDeal: 1600, engagement: 62 },
  { id: '4', name: 'ADP Payroll', type: 'Payroll', referrals: 18, conversions: 10, revenue: 16000, rate: 55.6, avgDeal: 1600, engagement: 85 },
  { id: '5', name: 'Mike Johnson', type: 'Attorney', referrals: 22, conversions: 8, revenue: 12800, rate: 36.4, avgDeal: 1600, engagement: 35 },
];

export function PartnerComparisonModal({ open, onClose }: Props) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const pa = PARTNERS.find((p) => p.id === a);
  const pb = PARTNERS.find((p) => p.id === b);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const fields: { label: string; get: (p: typeof PARTNERS[0]) => string | number }[] = [
    { label: 'Type', get: (p) => p.type },
    { label: 'Referrals', get: (p) => p.referrals },
    { label: 'Conversions', get: (p) => p.conversions },
    { label: 'Conv Rate', get: (p) => `${p.rate}%` },
    { label: 'Revenue', get: (p) => fmt(p.revenue) },
    { label: 'Engagement', get: (p) => `${p.engagement}/100` },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Compare Partners" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Partner A</label>
            <select value={a} onChange={(e) => setA(e.target.value)} className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none">
              <option value="">Select...</option>
              {PARTNERS.filter((p) => p.id !== b).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Partner B</label>
            <select value={b} onChange={(e) => setB(e.target.value)} className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none">
              <option value="">Select...</option>
              {PARTNERS.filter((p) => p.id !== a).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {pa && pb ? (
          <div className="rounded-xl border border-th-border/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-surface-secondary/50">
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary w-24">Metric</th>
                <th className="text-center px-3 py-2 font-medium text-th-accent-500">{pa.name}</th>
                <th className="w-6" />
                <th className="text-center px-3 py-2 font-medium text-th-accent-500">{pb.name}</th>
              </tr></thead>
              <tbody>{fields.map((f) => {
                const va = f.get(pa);
                const vb = f.get(pb);
                return (
                  <tr key={f.label} className="border-t border-th-border/20">
                    <td className="px-3 py-2.5 font-medium text-th-text-secondary">{f.label}</td>
                    <td className="text-center px-3 py-2.5 font-medium text-th-text-primary">{va}</td>
                    <td className="text-center"><ArrowLeftRight className="w-3 h-3 text-th-text-tertiary mx-auto" /></td>
                    <td className="text-center px-3 py-2.5 font-medium text-th-text-primary">{vb}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-th-text-tertiary">
            <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select two partners to compare</p>
          </div>
        )}
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
