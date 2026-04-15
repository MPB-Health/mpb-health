import { useState } from 'react';
import { Modal } from '../Modal';
import { Layout, Plus, Phone, Mail, FileText, Users, Calendar, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const TEMPLATES = [
  { id: '1', name: 'New Lead Onboarding', tasks: 5, icon: Users, color: '#3b82f6', steps: ['Initial call within 1h', 'Send intro email', 'Needs assessment', 'Quote preparation', 'Follow-up call'] },
  { id: '2', name: 'Quote Follow-Up Sequence', tasks: 4, icon: FileText, color: '#10b981', steps: ['Send quote (Day 0)', 'Follow-up call (Day 2)', 'Email check-in (Day 5)', 'Final follow-up (Day 10)'] },
  { id: '3', name: 'Event Follow-Up', tasks: 4, icon: Calendar, color: '#8b5cf6', steps: ['Enter contacts to CRM', 'Send thank-you email', 'Call hot leads', 'Schedule follow-up event'] },
  { id: '4', name: 'Referral Partner Outreach', tasks: 3, icon: Phone, color: '#f59e0b', steps: ['Introduction call', 'Send partnership materials', 'Schedule training session'] },
  { id: '5', name: 'Enrollment Completion', tasks: 4, icon: Mail, color: '#ef4444', steps: ['Application review', 'Request missing documents', 'Submit to carrier', 'Confirmation to member'] },
];

export function TaskTemplatesModal({ open, onClose }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Modal open={open} onClose={onClose} title="Task Templates" size="lg">
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30">
          <p className="text-xs text-th-text-secondary">Apply task templates to instantly create pre-configured task sequences for leads, events, partners, and more.</p>
        </div>

        <div className="space-y-2">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="rounded-xl border border-th-border/50 overflow-hidden">
              <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} className="w-full flex items-center gap-3 p-3 hover:bg-surface-secondary/50">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: t.color + '15' }}>
                  <t.icon className="w-4 h-4" style={{ color: t.color }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-xs font-semibold text-th-text-primary">{t.name}</p>
                  <p className="text-[9px] text-th-text-tertiary">{t.tasks} tasks in sequence</p>
                </div>
                <button className="text-[10px] font-medium text-th-accent-500 hover:text-th-accent-600 px-2 py-1 rounded bg-th-accent-500/10">Apply</button>
              </button>
              {expanded === t.id && (
                <div className="px-3 pb-3 space-y-1 border-t border-th-border/20 pt-2">
                  {t.steps.map((step, i) => (
                    <div key={step} className="flex items-center gap-2 py-1 pl-11">
                      <span className="text-[9px] font-bold text-th-accent-500 w-4">{i + 1}</span>
                      <span className="text-[10px] text-th-text-secondary">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-th-border text-sm font-medium text-th-text-tertiary hover:border-th-accent-500/50 hover:text-th-accent-500">
          <Plus className="w-4 h-4" /> Create Custom Template
        </button>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Template Tip</span></div>
          <p className="text-xs text-th-text-secondary">Teams using task templates complete leads 2.3x faster with 40% fewer missed follow-ups. The <strong>New Lead Onboarding</strong> template is the most effective.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
