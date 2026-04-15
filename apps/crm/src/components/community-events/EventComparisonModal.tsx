import { useState } from 'react';
import { Modal } from '../Modal';
import { ArrowLeftRight } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const EVENTS = [
  { id: '1', name: 'Grace Community Fellowship', type: 'Church', contacts: 45, leads: 12, cost: 50, convRate: 26.7, costPerLead: 4.17, closed: 2 },
  { id: '2', name: 'Downtown Health Expo', type: 'Health Fair', contacts: 92, leads: 18, cost: 500, convRate: 19.6, costPerLead: 27.78, closed: 1 },
  { id: '3', name: 'Spring Marathon Booth', type: 'Hydration', contacts: 85, leads: 10, cost: 300, convRate: 11.8, costPerLead: 30.00, closed: 2 },
  { id: '4', name: 'Metro Chamber Mixer', type: 'Chamber', contacts: 35, leads: 11, cost: 150, convRate: 31.4, costPerLead: 13.64, closed: 4 },
  { id: '5', name: 'United Way Partnership', type: 'Co-sponsored', contacts: 60, leads: 16, cost: 400, convRate: 26.7, costPerLead: 25.00, closed: 8 },
];

export function EventComparisonModal({ open, onClose }: Props) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const ea = EVENTS.find((e) => e.id === a);
  const eb = EVENTS.find((e) => e.id === b);
  const fmt = (n: number) => `$${n.toFixed(2)}`;

  const fields: { label: string; get: (e: typeof EVENTS[0]) => string | number }[] = [
    { label: 'Type', get: (e) => e.type },
    { label: 'Contacts', get: (e) => e.contacts },
    { label: 'Leads', get: (e) => e.leads },
    { label: 'Conv Rate', get: (e) => `${e.convRate}%` },
    { label: 'Cost', get: (e) => fmt(e.cost) },
    { label: 'Cost/Lead', get: (e) => fmt(e.costPerLead) },
    { label: 'Closed Won', get: (e) => e.closed },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Compare Events" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Event A</label>
            <select value={a} onChange={(e) => setA(e.target.value)} className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none">
              <option value="">Select...</option>
              {EVENTS.filter((e) => e.id !== b).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1">Event B</label>
            <select value={b} onChange={(e) => setB(e.target.value)} className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2.5 focus:border-th-accent-500/50 focus:outline-none">
              <option value="">Select...</option>
              {EVENTS.filter((e) => e.id !== a).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>

        {ea && eb ? (
          <div className="rounded-xl border border-th-border/50 overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-surface-secondary/50">
                <th className="text-left px-3 py-2 font-medium text-th-text-tertiary w-24">Metric</th>
                <th className="text-center px-3 py-2 font-medium text-th-accent-500">{ea.name}</th>
                <th className="w-6" />
                <th className="text-center px-3 py-2 font-medium text-th-accent-500">{eb.name}</th>
              </tr></thead>
              <tbody>{fields.map((f) => (
                <tr key={f.label} className="border-t border-th-border/20">
                  <td className="px-3 py-2.5 font-medium text-th-text-secondary">{f.label}</td>
                  <td className="text-center px-3 py-2.5 font-medium text-th-text-primary">{f.get(ea)}</td>
                  <td className="text-center"><ArrowLeftRight className="w-3 h-3 text-th-text-tertiary mx-auto" /></td>
                  <td className="text-center px-3 py-2.5 font-medium text-th-text-primary">{f.get(eb)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-th-text-tertiary">
            <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Select two events to compare</p>
          </div>
        )}
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
