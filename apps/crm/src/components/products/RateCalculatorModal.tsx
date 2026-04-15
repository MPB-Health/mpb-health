import { useState, useMemo } from 'react';
import { Modal } from '../Modal';
import { Calculator, DollarSign, User, HeartPulse, Cigarette } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface RateCalculatorModalProps { open: boolean; onClose: () => void; }

const PLAN_RATES: Record<string, Record<string, number>> = {
  essentials: { member: 142, member_spouse: 284, member_children: 238, family: 395 },
  mec: { member: 198, member_spouse: 396, member_children: 340, family: 510 },
  care_plus: { member: 284, member_spouse: 568, member_children: 480, family: 720 },
  direct: { member: 348, member_spouse: 696, member_children: 585, family: 860 },
  secure_hsa: { member: 412, member_spouse: 824, member_children: 690, family: 1020 },
};

const PLANS = [
  { id: 'essentials', name: 'Essentials' },
  { id: 'mec', name: 'MEC+ Essentials' },
  { id: 'care_plus', name: 'Care Plus' },
  { id: 'direct', name: 'Direct' },
  { id: 'secure_hsa', name: 'Secure HSA' },
];

const MEMBER_TYPES = [
  { id: 'member', label: 'Member Only', icon: User },
  { id: 'member_spouse', label: 'Member + Spouse', icon: User },
  { id: 'member_children', label: 'Member + Children', icon: User },
  { id: 'family', label: 'Family', icon: User },
];

export function RateCalculatorModal({ open, onClose }: RateCalculatorModalProps) {
  const [plan, setPlan] = useState('essentials');
  const [memberType, setMemberType] = useState('member');
  const [age, setAge] = useState(35);
  const [tobacco, setTobacco] = useState(false);

  const rate = useMemo(() => {
    const base = PLAN_RATES[plan]?.[memberType] ?? 0;
    const ageFactor = age >= 55 ? 1.3 : age >= 40 ? 1.15 : 1.0;
    const tobaccoAmt = tobacco ? 25 : 0;
    return Math.round(base * ageFactor) + tobaccoAmt;
  }, [plan, memberType, age, tobacco]);

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  return (
    <Modal open={open} onClose={onClose} title="Quick Rate Calculator" size="lg">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Health Plan</label>
          <div className="grid grid-cols-2 gap-1.5">
            {PLANS.map((p) => (
              <button key={p.id} onClick={() => setPlan(p.id)} className={cn('px-3 py-2 rounded-xl text-xs font-medium border transition-all', plan === p.id ? 'bg-th-accent-500/10 text-th-accent-500 border-th-accent-500/30' : 'border-th-border/50 text-th-text-tertiary hover:border-th-border')}>{p.name}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Member Type</label>
          <div className="grid grid-cols-2 gap-1.5">
            {MEMBER_TYPES.map((mt) => (
              <button key={mt.id} onClick={() => setMemberType(mt.id)} className={cn('px-3 py-2 rounded-xl text-xs font-medium border transition-all', memberType === mt.id ? 'bg-th-accent-500/10 text-th-accent-500 border-th-accent-500/30' : 'border-th-border/50 text-th-text-tertiary hover:border-th-border')}>{mt.label}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Age: {age}</label>
            <input type="range" min={18} max={64} value={age} onChange={(e) => setAge(Number(e.target.value))} className="w-full accent-th-accent-500" />
            <div className="flex justify-between text-[9px] text-th-text-tertiary"><span>18</span><span>64</span></div>
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Tobacco Use</label>
            <button onClick={() => setTobacco(!tobacco)} className={cn('w-full py-2 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all', tobacco ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'border-th-border/50 text-th-text-tertiary')}>
              <Cigarette className="w-3.5 h-3.5" />
              {tobacco ? 'Yes (+$25/mo)' : 'No'}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-th-accent-500/10 via-blue-500/10 to-violet-500/10 border border-th-accent-500/20 text-center">
          <DollarSign className="w-5 h-5 mx-auto mb-1 text-th-accent-500" />
          <p className="text-3xl font-extrabold text-th-text-primary tabular-nums">{fmt(rate)}<span className="text-sm font-medium text-th-text-tertiary">/mo</span></p>
          <p className="text-[10px] text-th-text-tertiary mt-1">Estimated monthly contribution</p>
          <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-th-text-tertiary">
            <span>Annual: {fmt(rate * 12)}</span>
            <span>|</span>
            <span>Quarterly: {fmt(rate * 3)}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-th-border/50 text-[10px] text-th-text-tertiary">
          <HeartPulse className="w-3 h-3 inline mr-1" /> Rates are approximate estimates. Actual pricing may vary by state, age band, and IUA selection. Always verify with the official rate sheet.
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
