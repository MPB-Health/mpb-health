import { Modal } from '../Modal';
import { PieChart, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const TYPES = [
  { type: 'Church Partnership', events: 12, pct: 30, contacts: 340, leads: 68, avgContacts: 28, avgLeads: 5.7, bestEvent: 'Grace Community Fellowship', bestLeads: 12, color: '#3b82f6' },
  { type: 'Health Fair', events: 10, pct: 25, contacts: 620, leads: 86, avgContacts: 62, avgLeads: 8.6, bestEvent: 'Downtown Health & Wellness Expo', bestLeads: 18, color: '#f59e0b' },
  { type: 'Hydration Booth', events: 8, pct: 20, contacts: 520, leads: 45, avgContacts: 65, avgLeads: 5.6, bestEvent: 'Spring Marathon Booth', bestLeads: 10, color: '#10b981' },
  { type: 'Chamber / BNI / SBDC', events: 6, pct: 15, contacts: 180, leads: 42, avgContacts: 30, avgLeads: 7.0, bestEvent: 'Metro Chamber Mixer', bestLeads: 11, color: '#8b5cf6' },
  { type: 'Co-sponsored', events: 4, pct: 10, contacts: 210, leads: 52, avgContacts: 53, avgLeads: 13.0, bestEvent: 'United Way Partnership Day', bestLeads: 16, color: '#ef4444' },
];

export function EventTypeBreakdownModal({ open, onClose }: Props) {
  const totalEvents = TYPES.reduce((s, t) => s + t.events, 0);

  return (
    <Modal open={open} onClose={onClose} title="Event Type Breakdown" size="xl">
      <div className="space-y-4">
        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Distribution ({totalEvents} events)</p>
          <div className="flex rounded-full h-4 overflow-hidden">
            {TYPES.map((t) => (
              <div key={t.type} className="h-full relative group" style={{ width: `${t.pct}%`, backgroundColor: t.color }} title={`${t.type}: ${t.pct}%`} />
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {TYPES.map((t) => (
              <div key={t.type} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                <span className="text-[9px] text-th-text-tertiary">{t.type} ({t.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {TYPES.map((t) => (
            <div key={t.type} className="p-2.5 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2.5 h-5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                <span className="text-xs font-semibold text-th-text-primary flex-1">{t.type}</span>
                <span className="text-[9px] text-th-text-tertiary">{t.events} events</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center mb-1.5">
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{t.contacts}</p><p className="text-[7px] text-th-text-tertiary">Contacts</p></div>
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{t.leads}</p><p className="text-[7px] text-th-text-tertiary">Leads</p></div>
                <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{t.avgContacts}</p><p className="text-[7px] text-th-text-tertiary">Avg/Event</p></div>
                <div><p className="text-[10px] font-bold text-th-accent-500 tabular-nums">{t.avgLeads}</p><p className="text-[7px] text-th-text-tertiary">Leads/Event</p></div>
              </div>
              <div className="text-[9px] text-th-text-tertiary">Top event: <strong className="text-th-text-secondary">{t.bestEvent}</strong> ({t.bestLeads} leads)</div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Type Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Co-sponsored events</strong> average 13 leads/event — the best efficiency. <strong>Hydration booths</strong> capture many contacts but convert poorly at 5.6 leads/event. Consider adding a sign-up incentive at booths.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
