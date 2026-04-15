import { useState } from 'react';
import { Modal } from '../Modal';
import { Calendar, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const UPCOMING = [
  { name: 'Faith Community Health Day', type: 'Church Partnership', date: 'Apr 20, 2026', location: 'Faith Community Church, Orlando', color: '#3b82f6' },
  { name: 'Downtown Farmers Market Booth', type: 'Hydration Booth', date: 'Apr 25, 2026', location: 'Main St Farmers Market', color: '#10b981' },
  { name: 'SBDC Small Business Workshop', type: 'Chamber / BNI', date: 'May 2, 2026', location: 'Orange County SBDC', color: '#8b5cf6' },
  { name: 'Spring Wellness Expo', type: 'Health Fair', date: 'May 10, 2026', location: 'Convention Center Hall B', color: '#f59e0b' },
  { name: 'Rotary Club Co-Sponsored', type: 'Co-sponsored', date: 'May 18, 2026', location: 'Rotary Club Headquarters', color: '#ef4444' },
  { name: 'Summer Kickoff 5K', type: 'Hydration Booth', date: 'Jun 1, 2026', location: 'Lake Eola Park', color: '#10b981' },
];

const PAST_RECENT = [
  { name: 'Grace Community Fellowship', type: 'Church Partnership', date: 'Apr 12, 2026', contacts: 45, leads: 12 },
  { name: 'Downtown Health Expo', type: 'Health Fair', date: 'Apr 8, 2026', contacts: 92, leads: 18 },
];

export function EventCalendarModal({ open, onClose }: Props) {
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');

  return (
    <Modal open={open} onClose={onClose} title="Event Calendar" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['upcoming', 'past'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize', view === v ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{v === 'upcoming' ? 'Upcoming' : 'Recent Past'}</button>
          ))}
        </div>

        {view === 'upcoming' ? (
          <div className="space-y-2">
            {UPCOMING.map((e) => (
              <div key={e.name} className="p-3 rounded-xl border border-th-border/50 flex items-start gap-3">
                <div className="w-1.5 h-full min-h-[40px] rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-th-text-primary">{e.name}</p>
                  <p className="text-[9px] text-th-text-tertiary">{e.type}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[9px] text-th-text-tertiary"><Calendar className="w-3 h-3" />{e.date}</div>
                    <div className="flex items-center gap-1 text-[9px] text-th-text-tertiary"><MapPin className="w-3 h-3" />{e.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {PAST_RECENT.map((e) => (
              <div key={e.name} className="p-3 rounded-xl border border-th-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-th-text-primary">{e.name}</span>
                  <span className="text-[9px] text-th-text-tertiary">{e.type} • {e.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-th-text-secondary"><strong>{e.contacts}</strong> contacts</span>
                  <span className="text-[10px] text-th-text-secondary"><strong>{e.leads}</strong> leads</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
          <p className="text-xs text-th-text-secondary"><strong>{UPCOMING.length}</strong> upcoming events scheduled • Next: <strong>{UPCOMING[0]?.name}</strong> on {UPCOMING[0]?.date}</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
