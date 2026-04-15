import { useState } from 'react';
import { Modal } from '../Modal';
import { TrendingUp, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const MONTHLY = [
  { month: 'Jan', events: 4, contacts: 120, leads: 22 },
  { month: 'Feb', events: 5, contacts: 180, leads: 34 },
  { month: 'Mar', events: 8, contacts: 310, leads: 52 },
  { month: 'Apr', events: 10, contacts: 420, leads: 68 },
  { month: 'May', events: 6, contacts: 250, leads: 40 },
  { month: 'Jun', events: 12, contacts: 590, leads: 88 },
];

const SEASONAL = [
  { quarter: 'Q1', events: 17, leads: 108, insight: 'Ramp-up season — new year health resolutions' },
  { quarter: 'Q2', events: 28, leads: 196, insight: 'Peak season — outdoor events, health fairs' },
  { quarter: 'Q3', events: 22, leads: 142, insight: 'Summer slowdown — focus on indoor church events' },
  { quarter: 'Q4', events: 14, leads: 86, insight: 'Open enrollment push — co-sponsored events' },
];

export function EventTrendModal({ open, onClose }: Props) {
  const [period, setPeriod] = useState<'6m' | '12m' | 'ytd'>('6m');
  const maxContacts = Math.max(...MONTHLY.map((m) => m.contacts), 1);

  return (
    <Modal open={open} onClose={onClose} title="Event Trends" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['6m', '12m', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{p === '6m' ? '6 Months' : p === '12m' ? '12 Months' : 'Year to Date'}</button>
          ))}
        </div>
        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Monthly Contacts Captured</p>
          <div className="flex items-end gap-1.5 h-24">
            {MONTHLY.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-th-accent-500/20 rounded-t" style={{ height: `${(m.contacts / maxContacts) * 100}%` }}>
                  <div className="text-[7px] font-bold text-th-accent-500 text-center pt-0.5">{m.contacts}</div>
                </div>
                <span className="text-[8px] text-th-text-tertiary mt-1">{m.month}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Seasonal Patterns</p>
          <div className="space-y-1.5">
            {SEASONAL.map((s) => (
              <div key={s.quarter} className="flex items-center gap-2 p-2 rounded-lg border border-th-border/20">
                <span className="text-xs font-bold text-th-accent-500 w-8">{s.quarter}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-medium text-th-text-primary">{s.events} events • {s.leads} leads</span>
                  </div>
                  <p className="text-[9px] text-th-text-tertiary">{s.insight}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-amber-500" /><span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Trend Insight</span></div>
          <p className="text-xs text-th-text-secondary">June was your best month with 590 contacts from 12 events. <strong>Q2 is peak season</strong> — schedule 30% more events in Apr–Jun. <strong>Q4</strong> should focus on co-sponsored enrollment events.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
