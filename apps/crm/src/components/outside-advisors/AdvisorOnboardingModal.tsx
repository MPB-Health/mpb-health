import { useState } from 'react';
import { Modal } from '../Modal';
import { ClipboardCheck, CheckCircle2, Circle, FileText, Shield, Users, Mail, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const STEPS = [
  { id: 'agreement', label: 'Advisor Agreement Signed', desc: 'Distribution/producer agreement', icon: FileText },
  { id: 'license', label: 'License Verification', desc: 'State insurance license on file', icon: Shield },
  { id: 'eo', label: 'E&O Insurance', desc: 'Errors & omissions proof uploaded', icon: Shield },
  { id: 'training', label: 'Product Training Complete', desc: 'MPB Health plan & compliance training', icon: ClipboardCheck },
  { id: 'portal', label: 'Portal Access Setup', desc: 'Advisor dashboard credentials issued', icon: Users },
  { id: 'materials', label: 'Marketing Materials Sent', desc: 'Rate cards, brochures, co-branded assets', icon: Mail },
  { id: 'first_case', label: 'First Case Submitted', desc: 'Successfully submitted first application', icon: CheckCircle2 },
];

const NEW_ADVISORS = [
  { name: 'Kevin Brown — Broker', completed: 5, total: 7 },
  { name: 'Amy Foster — Agent', completed: 3, total: 7 },
  { name: 'Nick Torres — GA', completed: 7, total: 7 },
];

export function AdvisorOnboardingModal({ open, onClose }: Props) {
  const [selectedAdvisor, setSelectedAdvisor] = useState(0);
  const advisor = NEW_ADVISORS[selectedAdvisor];

  return (
    <Modal open={open} onClose={onClose} title="Advisor Onboarding & Compliance" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {NEW_ADVISORS.map((a, i) => (
            <button key={a.name} onClick={() => setSelectedAdvisor(i)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all', selectedAdvisor === i ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent')}>
              {a.name} <span className={cn('text-[8px]', a.completed === a.total ? 'text-green-500' : 'text-th-text-tertiary')}>{a.completed}/{a.total}</span>
            </button>
          ))}
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-th-text-secondary">Compliance Progress</p>
            <span className="text-xs font-bold text-th-accent-500">{Math.round((advisor.completed / advisor.total) * 100)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-surface-tertiary overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', advisor.completed === advisor.total ? 'bg-green-500' : 'bg-th-accent-500')} style={{ width: `${(advisor.completed / advisor.total) * 100}%` }} />
          </div>
        </div>

        <div className="space-y-1">
          {STEPS.map((s, i) => {
            const done = i < advisor.completed;
            return (
              <div key={s.id} className={cn('flex items-center gap-3 p-2.5 rounded-xl border', done ? 'border-green-500/20 bg-green-500/5' : 'border-th-border/30')}>
                {done ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <Circle className="w-4 h-4 text-th-text-tertiary shrink-0" />}
                <s.icon className={cn('w-4 h-4 shrink-0', done ? 'text-green-500' : 'text-th-text-tertiary')} />
                <div className="flex-1">
                  <p className={cn('text-xs font-medium', done ? 'text-green-700 dark:text-green-300 line-through' : 'text-th-text-primary')}>{s.label}</p>
                  <p className="text-[9px] text-th-text-tertiary">{s.desc}</p>
                </div>
                {!done && i === advisor.completed && <button className="text-[10px] font-medium text-th-accent-500 hover:text-th-accent-600 shrink-0">Complete</button>}
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Compliance Alert</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Amy Foster</strong> is missing E&O Insurance and Product Training — follow up before allowing case submissions. <strong>Kevin Brown</strong> needs portal access and marketing materials.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
