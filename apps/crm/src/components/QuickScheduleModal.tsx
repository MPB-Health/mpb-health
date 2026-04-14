import { useState } from 'react';
import { Modal } from './Modal';
import { Calendar, Clock, Users, MapPin, Video } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface QuickScheduleModalProps {
  open: boolean;
  onClose: () => void;
  defaultTitle?: string;
  defaultAttendeeEmail?: string;
  onSchedule: (event: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'call' | 'meeting' | 'video';
    location?: string;
    attendees: string[];
    notes?: string;
  }) => Promise<void>;
}

const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? '00' : '30';
  const label = `${hour > 12 ? hour - 12 : hour}:${min} ${hour >= 12 ? 'PM' : 'AM'}`;
  return { value: `${String(hour).padStart(2, '0')}:${min}`, label };
});

const DURATIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export function QuickScheduleModal({ open, onClose, defaultTitle, defaultAttendeeEmail, onSchedule }: QuickScheduleModalProps) {
  const [title, setTitle] = useState(defaultTitle || '');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState<'call' | 'meeting' | 'video'>('video');
  const [location, setLocation] = useState('');
  const [attendees, setAttendees] = useState(defaultAttendeeEmail || '');
  const [notes, setNotes] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const endTime = (() => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMins = h * 60 + m + duration;
    return `${String(Math.floor(totalMins / 60) % 24).padStart(2, '0')}:${String(totalMins % 60).padStart(2, '0')}`;
  })();

  const handleSchedule = async () => {
    if (!title.trim() || !date) return;
    setScheduling(true);
    try {
      await onSchedule({
        title: title.trim(),
        date,
        startTime,
        endTime,
        type,
        location: location.trim() || undefined,
        attendees: attendees.split(',').map((a) => a.trim()).filter(Boolean),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch {
      // parent handles
    } finally {
      setScheduling(false);
    }
  };

  const typeOptions: { id: 'call' | 'meeting' | 'video'; label: string; icon: React.ElementType }[] = [
    { id: 'video', label: 'Video Call', icon: Video },
    { id: 'call', label: 'Phone Call', icon: Clock },
    { id: 'meeting', label: 'In Person', icon: MapPin },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Quick Schedule" size="lg">
      <div className="space-y-4">
        {/* Type selector */}
        <div className="flex gap-2">
          {typeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setType(opt.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all',
                type === opt.id
                  ? 'border-th-accent-500/30 bg-th-accent-500/10 text-th-accent-600 dark:text-th-accent-400'
                  : 'border-th-border/50 text-th-text-secondary hover:border-th-border'
              )}
            >
              <opt.icon className="w-4 h-4" />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-th-text-secondary">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Follow-up call with Sarah"
            className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
          />
        </div>

        {/* Date, time, duration */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-th-text-secondary">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-th-text-secondary">Start Time</label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
            >
              {TIME_SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-th-text-secondary">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
            >
              {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>

        {/* Attendees */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-th-text-secondary flex items-center gap-1">
            <Users className="w-3 h-3" /> Attendees (comma-separated emails)
          </label>
          <input
            type="text"
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            placeholder="email@example.com, other@example.com"
            className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
          />
        </div>

        {/* Location (for in-person) */}
        {type === 'meeting' && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-th-text-secondary flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Office, coffee shop, etc."
              className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none"
            />
          </div>
        )}

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-th-text-secondary">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Agenda, talking points..."
            className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-secondary px-3 py-2 resize-none focus:border-th-accent-500/50 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button
            onClick={handleSchedule}
            disabled={scheduling || !title.trim() || !date}
            className="flex-1 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {scheduling ? 'Scheduling...' : 'Schedule'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
