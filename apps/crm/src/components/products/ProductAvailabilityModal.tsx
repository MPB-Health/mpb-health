import { useState } from 'react';
import { Modal } from '../Modal';
import { MapPin, CheckCircle2, XCircle, AlertTriangle, Search } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface ProductAvailabilityModalProps { open: boolean; onClose: () => void; }

type Availability = 'available' | 'unavailable' | 'limited';

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

const PLANS_AVAIL: Record<string, Record<string, Availability>> = {
  Essentials: Object.fromEntries(STATES.map((s) => [s, 'available'])),
  'MEC+ Essentials': Object.fromEntries(STATES.map((s) => [s, ['NY','WA','VT'].includes(s) ? 'unavailable' : 'available'])),
  'Care Plus': Object.fromEntries(STATES.map((s) => [s, ['NY','WA','VT','MA','HI'].includes(s) ? 'unavailable' : ['CA','NV','OR'].includes(s) ? 'limited' : 'available'])),
  Direct: Object.fromEntries(STATES.map((s) => [s, ['NY','WA','VT','MA','HI','CT','RI'].includes(s) ? 'unavailable' : 'available'])),
  'Secure HSA': Object.fromEntries(STATES.map((s) => [s, ['NY','WA','VT','MA','HI','CT','RI','NJ'].includes(s) ? 'unavailable' : ['CA','NV'].includes(s) ? 'limited' : 'available'])),
};

const icons: Record<Availability, typeof CheckCircle2> = { available: CheckCircle2, unavailable: XCircle, limited: AlertTriangle };
const colors: Record<Availability, string> = { available: 'text-green-500', unavailable: 'text-red-400', limited: 'text-amber-500' };
const labels: Record<Availability, string> = { available: 'Available', unavailable: 'Not Available', limited: 'Limited' };

export function ProductAvailabilityModal({ open, onClose }: ProductAvailabilityModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('Essentials');
  const [search, setSearch] = useState('');
  const planAvail = PLANS_AVAIL[selectedPlan] ?? {};
  const filtered = STATES.filter((s) => s.toLowerCase().includes(search.toLowerCase()));
  const available = STATES.filter((s) => planAvail[s] === 'available').length;
  const limited = STATES.filter((s) => planAvail[s] === 'limited').length;

  return (
    <Modal open={open} onClose={onClose} title="Plan Availability" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {Object.keys(PLANS_AVAIL).map((p) => (
            <button key={p} onClick={() => setSelectedPlan(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all', selectedPlan === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent')}>{p}</button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-lg font-bold text-green-500">{available}</p><p className="text-[9px] text-th-text-tertiary">Available</p>
          </div>
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-lg font-bold text-amber-500">{limited}</p><p className="text-[9px] text-th-text-tertiary">Limited</p>
          </div>
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-lg font-bold text-red-400">{50 - available - limited}</p><p className="text-[9px] text-th-text-tertiary">Unavailable</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-tertiary">
          <Search className="w-3.5 h-3.5 text-th-text-tertiary" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search state..." className="bg-transparent text-sm outline-none flex-1 text-th-text-secondary placeholder-th-text-tertiary" />
        </div>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-th-border/50 divide-y divide-th-border/20">
          {filtered.map((state) => {
            const avail = planAvail[state] ?? 'unavailable';
            const Icon = icons[avail];
            return (
              <div key={state} className="flex items-center gap-2 px-3 py-2">
                <MapPin className="w-3 h-3 text-th-text-tertiary shrink-0" />
                <span className="text-xs font-medium text-th-text-primary flex-1">{state}</span>
                <Icon className={cn('w-3.5 h-3.5', colors[avail])} />
                <span className={cn('text-[10px] font-medium', colors[avail])}>{labels[avail]}</span>
              </div>
            );
          })}
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
