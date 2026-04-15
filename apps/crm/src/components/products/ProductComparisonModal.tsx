import { useState } from 'react';
import { Modal } from '../Modal';
import { ArrowLeftRight, CheckCircle2, XCircle } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface ProductComparisonModalProps { open: boolean; onClose: () => void; }

const PLANS = [
  { id: 'ess', name: 'Essentials', starting: 142, enrollment: 125, annual: 0, tobacco: 0, mec: true, hsa: false, costShare: false, iua: false },
  { id: 'mec', name: 'MEC+ Essentials', starting: 198, enrollment: 125, annual: 0, tobacco: 0, mec: true, hsa: false, costShare: false, iua: false },
  { id: 'cp', name: 'Care Plus', starting: 284, enrollment: 125, annual: 75, tobacco: 25, mec: true, hsa: false, costShare: true, iua: true },
  { id: 'dir', name: 'Direct', starting: 348, enrollment: 125, annual: 75, tobacco: 25, mec: true, hsa: false, costShare: true, iua: true },
  { id: 'hsa', name: 'Secure HSA', starting: 412, enrollment: 125, annual: 75, tobacco: 25, mec: true, hsa: true, costShare: true, iua: true },
];

export function ProductComparisonModal({ open, onClose }: ProductComparisonModalProps) {
  const [planA, setPlanA] = useState('');
  const [planB, setPlanB] = useState('');
  const a = PLANS.find((p) => p.id === planA);
  const b = PLANS.find((p) => p.id === planB);
  const fmt = (n: number) => `$${n}`;

  const fields: { label: string; getA: (p: typeof PLANS[0]) => string | boolean; type: 'currency' | 'bool' }[] = [
    { label: 'Starting at/mo', getA: (p) => fmt(p.starting), type: 'currency' },
    { label: 'Enrollment Fee', getA: (p) => fmt(p.enrollment), type: 'currency' },
    { label: 'Annual Fee', getA: (p) => p.annual > 0 ? fmt(p.annual) + '/yr' : 'None', type: 'currency' },
    { label: 'Tobacco Surcharge', getA: (p) => p.tobacco > 0 ? fmt(p.tobacco) + '/mo' : 'None', type: 'currency' },
    { label: 'MEC Compliant', getA: (p) => p.mec, type: 'bool' },
    { label: 'HSA Compatible', getA: (p) => p.hsa, type: 'bool' },
    { label: 'Medical Cost Sharing', getA: (p) => p.costShare, type: 'bool' },
    { label: 'IUA Based', getA: (p) => p.iua, type: 'bool' },
  ];

  const renderVal = (val: string | boolean) => {
    if (typeof val === 'boolean') return val ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" /> : <XCircle className="w-4 h-4 text-red-400 mx-auto" />;
    return <span className="text-xs font-medium text-th-text-primary">{val}</span>;
  };

  return (
    <Modal open={open} onClose={onClose} title="Compare Plans" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Plan A</label>
            <select value={planA} onChange={(e) => setPlanA(e.target.value)} className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none">
              <option value="">Select...</option>
              {PLANS.filter((p) => p.id !== planB).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Plan B</label>
            <select value={planB} onChange={(e) => setPlanB(e.target.value)} className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none">
              <option value="">Select...</option>
              {PLANS.filter((p) => p.id !== planA).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        {a && b ? (
          <div className="rounded-xl border border-th-border/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-surface-secondary/50">
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary w-32">Feature</th>
                <th className="text-center px-3 py-2 font-medium text-th-accent-500">{a.name}</th>
                <th className="w-6" />
                <th className="text-center px-3 py-2 font-medium text-th-accent-500">{b.name}</th>
              </tr></thead>
              <tbody>
                {fields.map((f) => (
                  <tr key={f.label} className="border-t border-th-border/20">
                    <td className="px-3 py-2.5 font-medium text-th-text-secondary">{f.label}</td>
                    <td className="text-center px-3 py-2.5">{renderVal(f.getA(a))}</td>
                    <td className="text-center"><ArrowLeftRight className="w-3 h-3 text-th-text-tertiary mx-auto" /></td>
                    <td className="text-center px-3 py-2.5">{renderVal(f.getA(b))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-th-text-tertiary">
            <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select two plans to compare</p>
          </div>
        )}

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
