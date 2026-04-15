import { useState } from 'react';
import { Modal } from '../Modal';
import { ClipboardCheck, CheckCircle2, Circle, Mail, FileText, Users, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const STEPS = [
  { id: 'agreement', label: 'Partner Agreement Signed', desc: 'Legal referral partnership agreement', icon: FileText },
  { id: 'profile', label: 'Profile Completed', desc: 'Contact info, company, specialties', icon: Users },
  { id: 'training', label: 'Product Training', desc: 'Completed MPB Health plan overview', icon: ClipboardCheck },
  { id: 'materials', label: 'Marketing Materials Sent', desc: 'Brochures, rate cards, referral links', icon: Mail },
  { id: 'portal', label: 'Partner Portal Access', desc: 'Login credentials and dashboard setup', icon: Users },
  { id: 'first_referral', label: 'First Referral Submitted', desc: 'Successfully submitted first referral', icon: CheckCircle2 },
];

const NEW_PARTNERS = [
  { name: 'Lisa Park — CPA', completed: 4, total: 6 },
  { name: 'David Lee — FA', completed: 2, total: 6 },
  { name: 'Amy Chen — HR', completed: 6, total: 6 },
];

export function PartnerOnboardingModal({ open, onClose }: Props) {
  const [selectedPartner, setSelectedPartner] = useState(0);
  const partner = NEW_PARTNERS[selectedPartner];
  const completedSteps = STEPS.slice(0, partner.completed);

  return (
    <Modal open={open} onClose={onClose} title="Partner Onboarding" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {NEW_PARTNERS.map((p, i) => (
            <button key={p.name} onClick={() => setSelectedPartner(i)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all', selectedPartner === i ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent')}>
              {p.name} <span className={cn('text-[8px]', p.completed === p.total ? 'text-green-500' : 'text-th-text-tertiary')}>{p.completed}/{p.total}</span>
            </button>
          ))}
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-th-text-secondary">Progress</p>
            <span className="text-xs font-bold text-th-accent-500">{Math.round((partner.completed / partner.total) * 100)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-surface-tertiary overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', partner.completed === partner.total ? 'bg-green-500' : 'bg-th-accent-500')} style={{ width: `${(partner.completed / partner.total) * 100}%` }} />
          </div>
        </div>

        <div className="space-y-1">
          {STEPS.map((s, i) => {
            const done = i < partner.completed;
            return (
              <div key={s.id} className={cn('flex items-center gap-3 p-2.5 rounded-xl border', done ? 'border-green-500/20 bg-green-500/5' : 'border-th-border/30')}>
                {done ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <Circle className="w-4 h-4 text-th-text-tertiary shrink-0" />}
                <s.icon className={cn('w-4 h-4 shrink-0', done ? 'text-green-500' : 'text-th-text-tertiary')} />
                <div className="flex-1">
                  <p className={cn('text-xs font-medium', done ? 'text-green-700 dark:text-green-300 line-through' : 'text-th-text-primary')}>{s.label}</p>
                  <p className="text-[9px] text-th-text-tertiary">{s.desc}</p>
                </div>
                {!done && i === partner.completed && <button className="text-[10px] font-medium text-th-accent-500 hover:text-th-accent-600 shrink-0">Complete</button>}
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Onboarding Tip</span></div>
          <p className="text-xs text-th-text-secondary"><strong>David Lee</strong> is stuck at step 3 (Product Training) for 5 days. Send a training reminder to keep onboarding momentum.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
