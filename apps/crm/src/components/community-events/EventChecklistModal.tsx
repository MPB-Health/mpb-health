import { useState } from 'react';
import { Modal } from '../Modal';
import { ClipboardCheck, CheckCircle2, Circle, Package, Users, FileText, Megaphone, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const CHECKLISTS: Record<string, { label: string; icon: any; items: string[] }[]> = {
  'Pre-Event (1 Week)': [
    { label: 'Logistics', icon: Package, items: ['Venue confirmed & deposit paid', 'Table/booth reserved', 'Parking & load-in planned', 'AV/power requirements confirmed'] },
    { label: 'Materials', icon: FileText, items: ['Brochures printed (100+)', 'Rate cards current version', 'Sign-up sheets / tablets ready', 'Banner & branded tablecloth'] },
  ],
  'Day-Of': [
    { label: 'Setup', icon: Package, items: ['Arrive 30 min early', 'Display materials arranged', 'QR code sign-up tested', 'Hydration / giveaways set up'] },
    { label: 'Staffing', icon: Users, items: ['Lead rep assigned', 'Backup rep confirmed', 'Name badges ready', 'Elevator pitch rehearsed'] },
  ],
  'Post-Event (48 Hours)': [
    { label: 'Follow-Up', icon: Megaphone, items: ['All contacts entered into CRM', 'Thank-you emails sent', 'Hot leads flagged & assigned', 'Event summary report filed'] },
  ],
};

export function EventChecklistModal({ open, onClose }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const allItems = Object.values(CHECKLISTS).flat().flatMap((g) => g.items);
  const toggle = (item: string) => setChecked((p) => { const n = new Set(p); n.has(item) ? n.delete(item) : n.add(item); return n; });

  return (
    <Modal open={open} onClose={onClose} title="Event Planning Checklist" size="lg">
      <div className="space-y-4">
        <div className="p-3 rounded-xl border border-th-border/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-th-text-secondary">Progress</p>
            <span className="text-xs font-bold text-th-accent-500">{checked.size}/{allItems.length}</span>
          </div>
          <div className="h-2.5 rounded-full bg-surface-tertiary overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', checked.size === allItems.length ? 'bg-green-500' : 'bg-th-accent-500')} style={{ width: `${(checked.size / allItems.length) * 100}%` }} />
          </div>
        </div>

        {Object.entries(CHECKLISTS).map(([phase, groups]) => (
          <div key={phase}>
            <p className="text-xs font-bold text-th-text-primary mb-1.5">{phase}</p>
            {groups.map((g) => (
              <div key={g.label} className="mb-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <g.icon className="w-3.5 h-3.5 text-th-text-tertiary" />
                  <span className="text-[10px] font-semibold text-th-text-secondary">{g.label}</span>
                </div>
                <div className="space-y-0.5 pl-5">
                  {g.items.map((item) => (
                    <label key={item} className="flex items-center gap-2 py-1 cursor-pointer group">
                      {checked.has(item) ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-th-text-tertiary group-hover:text-th-accent-500 shrink-0" />}
                      <input type="checkbox" checked={checked.has(item)} onChange={() => toggle(item)} className="sr-only" />
                      <span className={cn('text-[10px]', checked.has(item) ? 'text-green-700 dark:text-green-300 line-through' : 'text-th-text-primary')}>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Planning Tip</span></div>
          <p className="text-xs text-th-text-secondary">Events with completed checklists generate 40% more leads. The most-missed item: <strong>QR code sign-up tested</strong> — always do a dry run before the event.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
