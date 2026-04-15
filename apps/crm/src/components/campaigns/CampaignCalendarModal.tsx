import { useState, useMemo } from 'react';
import { Modal } from '../Modal';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const CAMPAIGNS = [
  { name: 'Open Enrollment Q2', start: '2026-04-01', end: '2026-04-30', status: 'active', color: '#3b82f6' },
  { name: 'Health Fair', start: '2026-04-12', end: '2026-04-14', status: 'active', color: '#10b981' },
  { name: 'LinkedIn Outreach', start: '2026-04-05', end: '2026-04-25', status: 'paused', color: '#8b5cf6' },
  { name: 'Referral Bonus', start: '2026-05-01', end: '2026-05-31', status: 'scheduled', color: '#f59e0b' },
  { name: 'Google Ads', start: '2026-03-15', end: '2026-05-15', status: 'active', color: '#ef4444' },
  { name: 'Summer Webinar', start: '2026-05-10', end: '2026-05-10', status: 'scheduled', color: '#06b6d4' },
];

export function CampaignCalendarModal({ open, onClose }: Props) {
  const [month, setMonth] = useState(3); // 0-indexed, 3=April
  const [year] = useState(2026);

  const monthName = new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const active = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return CAMPAIGNS.filter((c) => {
      const s = new Date(c.start);
      const e = new Date(c.end);
      const ms = new Date(year, month, 1);
      const me = new Date(year, month + 1, 0);
      return s <= me && e >= ms;
    });
  }, [month, year]);

  const getDayCampaigns = (day: number) => {
    const d = new Date(year, month, day);
    return CAMPAIGNS.filter((c) => { const s = new Date(c.start); const e = new Date(c.end); return d >= s && d <= e; });
  };

  return (
    <Modal open={open} onClose={onClose} title="Campaign Calendar" size="xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setMonth((m) => Math.max(0, m - 1))} className="p-1.5 rounded-lg hover:bg-surface-tertiary"><ChevronLeft className="w-4 h-4 text-th-text-tertiary" /></button>
          <span className="text-sm font-semibold text-th-text-primary">{monthName}</span>
          <button onClick={() => setMonth((m) => Math.min(11, m + 1))} className="p-1.5 rounded-lg hover:bg-surface-tertiary"><ChevronRight className="w-4 h-4 text-th-text-tertiary" /></button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-th-border/30 rounded-xl overflow-hidden">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="bg-surface-secondary py-1.5 text-center text-[9px] font-medium text-th-text-tertiary">{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="bg-surface-primary p-1 min-h-[48px]" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayCampaigns = getDayCampaigns(day);
            const isToday = day === 14 && month === 3;
            return (
              <div key={day} className={cn('bg-surface-primary p-1 min-h-[48px]', isToday && 'ring-1 ring-th-accent-500 ring-inset')}>
                <span className={cn('text-[9px] font-medium block', isToday ? 'text-th-accent-500 font-bold' : 'text-th-text-tertiary')}>{day}</span>
                {dayCampaigns.slice(0, 2).map((c) => (
                  <div key={c.name} className="mt-0.5 px-1 py-0.5 rounded text-[6px] font-medium text-white truncate" style={{ backgroundColor: c.color }}>{c.name.split(' ')[0]}</div>
                ))}
                {dayCampaigns.length > 2 && <span className="text-[7px] text-th-text-tertiary">+{dayCampaigns.length - 2}</span>}
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Active This Month ({active.length})</p>
          <div className="space-y-1">
            {active.map((c) => (
              <div key={c.name} className="flex items-center gap-2 py-1">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <span className="text-[10px] font-medium text-th-text-primary flex-1">{c.name}</span>
                <span className={cn('text-[8px] px-1.5 py-0.5 rounded-full font-medium capitalize', c.status === 'active' ? 'bg-green-100 text-green-700' : c.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700')}>{c.status}</span>
                <span className="text-[9px] text-th-text-tertiary">{c.start} → {c.end}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
