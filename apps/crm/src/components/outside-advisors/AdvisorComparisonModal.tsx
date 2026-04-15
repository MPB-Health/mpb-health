import { useState } from 'react';
import { Modal } from '../Modal';
import { ArrowLeftRight } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const ADVISORS = [
  { id: '1', name: 'Maria Santos', type: 'Benefits Broker', sourced: 38, closed: 16, production: 42000, closeRate: 42.1, avgCase: 2625, performance: 95 },
  { id: '2', name: 'David Park', type: 'Independent Agent', sourced: 32, closed: 13, production: 34000, closeRate: 40.6, avgCase: 2615, performance: 75 },
  { id: '3', name: 'Rachel Green', type: 'General Agent', sourced: 26, closed: 10, production: 26000, closeRate: 38.5, avgCase: 2600, performance: 58 },
  { id: '4', name: 'James Wilson', type: 'FMO', sourced: 20, closed: 9, production: 23500, closeRate: 45.0, avgCase: 2611, performance: 88 },
  { id: '5', name: 'Linda Chen', type: 'Wholesale', sourced: 14, closed: 8, production: 21000, closeRate: 57.1, avgCase: 2625, performance: 82 },
];

export function AdvisorComparisonModal({ open, onClose }: Props) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const pa = ADVISORS.find((p) => p.id === a);
  const pb = ADVISORS.find((p) => p.id === b);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const fields: { label: string; get: (p: typeof ADVISORS[0]) => string | number }[] = [
    { label: 'Channel', get: (p) => p.type },
    { label: 'Leads Sourced', get: (p) => p.sourced },
    { label: 'Cases Closed', get: (p) => p.closed },
    { label: 'Close Rate', get: (p) => `${p.closeRate}%` },
    { label: 'Production', get: (p) => fmt(p.production) },
    { label: 'Avg Case Size', get: (p) => fmt(p.avgCase) },
    { label: 'Performance', get: (p) => `${p.performance}/100` },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Compare Advisors" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Advisor A</label>
            <select value={a} onChange={(e) => setA(e.target.value)} className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none">
              <option value="">Select...</option>
              {ADVISORS.filter((p) => p.id !== b).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Advisor B</label>
            <select value={b} onChange={(e) => setB(e.target.value)} className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none">
              <option value="">Select...</option>
              {ADVISORS.filter((p) => p.id !== a).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
            <p className="text-sm">Select two advisors to compare</p>
          </div>
        )}
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
