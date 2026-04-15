import { useState } from 'react';
import { Modal } from '../Modal';
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const DAYS_DATA: Record<number, { count: number; overdue?: boolean; types: string[] }> = {
  14: { count: 3, types: ['Follow-up', 'Quote', 'Review'] },
  15: { count: 2, types: ['Enrollment', 'Document'] },
  16: { count: 1, types: ['Review'] },
  17: { count: 2, types: ['Event follow-up', 'Commission'] },
  18: { count: 1, types: ['Campaign report'] },
  21: { count: 3, types: ['Call', 'Email', 'Partner'] },
  22: { count: 2, types: ['Quote', 'Follow-up'] },
  25: { count: 4, types: ['Event prep', 'Call', 'Quote', 'Review'] },
  28: { count: 1, types: ['Monthly report'] },
};

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TaskCalendarModal({ open, onClose }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(14);
  const today = 14;
  const daysInMonth = 30;
  const startOffset = 2;

  return (
    <Modal open={open} onClose={onClose} title="Task Calendar — April 2026" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1">
          {WEEK_DAYS.map((d) => <div key={d} className="text-center text-[9px] font-medium text-th-text-tertiary py-1">{d}</div>)}
          {Array.from({ length: startOffset }, (_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const data = DAYS_DATA[day];
            const isToday = day === today;
            const isSelected = day === selectedDay;
            return (
              <button key={day} onClick={() => setSelectedDay(day)} className={cn('p-1 rounded-lg text-center transition-all min-h-[40px] relative', isToday ? 'ring-2 ring-th-accent-500' : '', isSelected ? 'bg-th-accent-500/10' : 'hover:bg-surface-secondary/50')}>
                <span className={cn('text-[10px] font-medium', isToday ? 'text-th-accent-500 font-bold' : 'text-th-text-primary')}>{day}</span>
                {data && (
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {Array.from({ length: Math.min(data.count, 3) }, (__, j) => (
                      <div key={j} className={cn('w-1 h-1 rounded-full', data.count > 2 ? 'bg-amber-500' : 'bg-blue-500')} />
                    ))}
                    {data.count > 3 && <span className="text-[6px] text-th-text-tertiary">+</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedDay && DAYS_DATA[selectedDay] && (
          <div className="p-3 rounded-xl border border-th-border/50">
            <p className="text-xs font-semibold text-th-text-primary mb-2">April {selectedDay} — {DAYS_DATA[selectedDay].count} tasks</p>
            <div className="space-y-1">
              {DAYS_DATA[selectedDay].types.map((t) => (
                <div key={t} className="flex items-center gap-2 py-1">
                  <Clock className="w-3 h-3 text-th-text-tertiary" />
                  <span className="text-[10px] text-th-text-secondary">{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30 flex items-center gap-3">
          <Calendar className="w-4 h-4 text-th-accent-500 shrink-0" />
          <p className="text-[10px] text-th-text-secondary">Busiest day: <strong>Apr 25</strong> with 4 tasks. <strong>{Object.values(DAYS_DATA).reduce((s, d) => s + d.count, 0)}</strong> total tasks this month.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
