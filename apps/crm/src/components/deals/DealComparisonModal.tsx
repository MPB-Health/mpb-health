import { useState } from 'react';
import { Modal } from '../Modal';
import { ArrowLeftRight, DollarSign, Clock, Target, CheckCircle2 } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DealComparisonModalProps { open: boolean; onClose: () => void; }

const MOCK_DEALS = [
  { id: '1', name: 'Enterprise Health Plan', amount: 85000, stage: 'Proposal', probability: 82, daysOpen: 34, type: 'New Business', source: 'Referral', contacts: 3, activities: 18 },
  { id: '2', name: 'Group Medicare Package', amount: 62000, stage: 'Value Proposition', probability: 65, daysOpen: 22, type: 'New Business', source: 'Website', contacts: 2, activities: 12 },
  { id: '3', name: 'Family Coverage Plus', amount: 42000, stage: 'Negotiation', probability: 54, daysOpen: 48, type: 'Existing Business', source: 'Referral', contacts: 1, activities: 8 },
  { id: '4', name: 'Dental Plan Upgrade', amount: 28000, stage: 'Proposal', probability: 86, daysOpen: 18, type: 'Renewal', source: 'Cold Call', contacts: 2, activities: 14 },
];

export function DealComparisonModal({ open, onClose }: DealComparisonModalProps) {
  const [dealA, setDealA] = useState('');
  const [dealB, setDealB] = useState('');

  const a = MOCK_DEALS.find((d) => d.id === dealA);
  const b = MOCK_DEALS.find((d) => d.id === dealB);
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const fields = [
    { label: 'Amount', getVal: (d: typeof MOCK_DEALS[0]) => fmt(d.amount), higher: 'better', getNum: (d: typeof MOCK_DEALS[0]) => d.amount },
    { label: 'Probability', getVal: (d: typeof MOCK_DEALS[0]) => `${d.probability}%`, higher: 'better', getNum: (d: typeof MOCK_DEALS[0]) => d.probability },
    { label: 'Stage', getVal: (d: typeof MOCK_DEALS[0]) => d.stage, higher: null, getNum: () => 0 },
    { label: 'Days Open', getVal: (d: typeof MOCK_DEALS[0]) => `${d.daysOpen}d`, higher: 'worse', getNum: (d: typeof MOCK_DEALS[0]) => d.daysOpen },
    { label: 'Type', getVal: (d: typeof MOCK_DEALS[0]) => d.type, higher: null, getNum: () => 0 },
    { label: 'Source', getVal: (d: typeof MOCK_DEALS[0]) => d.source, higher: null, getNum: () => 0 },
    { label: 'Contacts', getVal: (d: typeof MOCK_DEALS[0]) => String(d.contacts), higher: 'better', getNum: (d: typeof MOCK_DEALS[0]) => d.contacts },
    { label: 'Activities', getVal: (d: typeof MOCK_DEALS[0]) => String(d.activities), higher: 'better', getNum: (d: typeof MOCK_DEALS[0]) => d.activities },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Compare Deals" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Deal A</label>
            <select value={dealA} onChange={(e) => setDealA(e.target.value)}
              className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none">
              <option value="">Select a deal...</option>
              {MOCK_DEALS.filter((d) => d.id !== dealB).map((d) => <option key={d.id} value={d.id}>{d.name} ({fmt(d.amount)})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Deal B</label>
            <select value={dealB} onChange={(e) => setDealB(e.target.value)}
              className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none">
              <option value="">Select a deal...</option>
              {MOCK_DEALS.filter((d) => d.id !== dealA).map((d) => <option key={d.id} value={d.id}>{d.name} ({fmt(d.amount)})</option>)}
            </select>
          </div>
        </div>

        {a && b ? (
          <div className="rounded-xl border border-th-border/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-surface-secondary/50">
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary w-24">Metric</th>
                <th className="text-center px-3 py-2 font-medium text-th-accent-500">{a.name}</th>
                <th className="w-6" />
                <th className="text-center px-3 py-2 font-medium text-th-accent-500">{b.name}</th>
              </tr></thead>
              <tbody>
                {fields.map((f) => {
                  const aNum = f.getNum(a);
                  const bNum = f.getNum(b);
                  const aWins = f.higher === 'better' ? aNum > bNum : f.higher === 'worse' ? aNum < bNum : false;
                  const bWins = f.higher === 'better' ? bNum > aNum : f.higher === 'worse' ? bNum < aNum : false;
                  return (
                    <tr key={f.label} className="border-t border-th-border/20">
                      <td className="px-3 py-2.5 font-medium text-th-text-secondary">{f.label}</td>
                      <td className={cn('text-center px-3 py-2.5 tabular-nums', aWins ? 'font-bold text-green-500' : 'text-th-text-primary')}>{f.getVal(a)}</td>
                      <td className="text-center"><ArrowLeftRight className="w-3 h-3 text-th-text-tertiary mx-auto" /></td>
                      <td className={cn('text-center px-3 py-2.5 tabular-nums', bWins ? 'font-bold text-green-500' : 'text-th-text-primary')}>{f.getVal(b)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-th-text-tertiary">
            <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select two deals to compare them side by side</p>
          </div>
        )}

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
