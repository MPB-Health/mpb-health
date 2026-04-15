import { useState } from 'react';
import { Modal } from '../Modal';
import { BarChart3, Users, Target, Calendar, TrendingUp, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; eventCount: number; }

const STATS = [
  { type: 'Church Partnership', events: 12, contacts: 340, leads: 68, convRate: 20.0, color: '#3b82f6' },
  { type: 'Hydration Booth', events: 8, contacts: 520, leads: 45, convRate: 8.7, color: '#10b981' },
  { type: 'Chamber / BNI / SBDC', events: 6, contacts: 180, leads: 42, convRate: 23.3, color: '#8b5cf6' },
  { type: 'Health Fair', events: 10, contacts: 620, leads: 86, convRate: 13.9, color: '#f59e0b' },
  { type: 'Co-sponsored', events: 4, contacts: 210, leads: 52, convRate: 24.8, color: '#ef4444' },
];

export function EventAnalyticsModal({ open, onClose, eventCount }: Props) {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ytd'>('90d');
  const totalEvents = STATS.reduce((s, e) => s + e.events, 0);
  const totalContacts = STATS.reduce((s, e) => s + e.contacts, 0);
  const totalLeads = STATS.reduce((s, e) => s + e.leads, 0);
  const maxContacts = Math.max(...STATS.map((e) => e.contacts), 1);

  return (
    <Modal open={open} onClose={onClose} title="Event Analytics" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['30d', '90d', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'Year to Date'}</button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Events', value: String(eventCount || totalEvents), icon: Calendar, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Contacts', value: totalContacts.toLocaleString(), icon: Users, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Leads', value: totalLeads.toLocaleString(), icon: Target, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Avg Conv', value: `${(totalLeads / totalContacts * 100).toFixed(1)}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {STATS.map((e) => (
            <div key={e.type} className="p-3 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-8 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-th-text-primary truncate">{e.type}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', e.convRate >= 20 ? 'bg-green-500/10 text-green-500' : e.convRate >= 10 ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500')}>{e.convRate}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(e.contacts / maxContacts) * 100}%`, backgroundColor: e.color }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{e.events}</p><p className="text-[8px] text-th-text-tertiary">Events</p></div>
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{e.contacts}</p><p className="text-[8px] text-th-text-tertiary">Contacts</p></div>
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{e.leads}</p><p className="text-[8px] text-th-text-tertiary">Leads</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Event Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Co-sponsored events</strong> have the highest conversion rate at 24.8% despite fewer events. <strong>Health fairs</strong> generate the most raw leads (86) — high volume, moderate quality.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
