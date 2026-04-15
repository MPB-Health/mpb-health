import { useState } from 'react';
import { Modal } from '../Modal';
import { BarChart3, Mail, Phone, MessageSquare, Calendar, Video, Clock, TrendingUp, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ChannelStat { channel: string; icon: typeof Mail; color: string; total: number; thisMonth: number; avgResponseTime: string; preferred: boolean; }
interface ContactActivityModalProps { open: boolean; onClose: () => void; }

const MOCK_CHANNELS: ChannelStat[] = [
  { channel: 'Email', icon: Mail, color: '#3b82f6', total: 1240, thisMonth: 186, avgResponseTime: '4.2h', preferred: true },
  { channel: 'Phone', icon: Phone, color: '#10b981', total: 520, thisMonth: 82, avgResponseTime: '1.1h', preferred: false },
  { channel: 'SMS', icon: MessageSquare, color: '#8b5cf6', total: 380, thisMonth: 64, avgResponseTime: '0.5h', preferred: false },
  { channel: 'Meeting', icon: Calendar, color: '#f59e0b', total: 156, thisMonth: 28, avgResponseTime: 'N/A', preferred: false },
  { channel: 'Video Call', icon: Video, color: '#ef4444', total: 84, thisMonth: 14, avgResponseTime: 'N/A', preferred: false },
];

const MOCK_HOURLY = [
  { hour: '8am', count: 12 }, { hour: '9am', count: 28 }, { hour: '10am', count: 42 },
  { hour: '11am', count: 38 }, { hour: '12pm', count: 18 }, { hour: '1pm', count: 22 },
  { hour: '2pm', count: 35 }, { hour: '3pm', count: 40 }, { hour: '4pm', count: 32 },
  { hour: '5pm', count: 15 }, { hour: '6pm', count: 8 },
];

const MOCK_DAILY = [
  { day: 'Mon', count: 52 }, { day: 'Tue', count: 68 }, { day: 'Wed', count: 74 },
  { day: 'Thu', count: 62 }, { day: 'Fri', count: 48 }, { day: 'Sat', count: 8 }, { day: 'Sun', count: 4 },
];

export function ContactActivityModal({ open, onClose }: ContactActivityModalProps) {
  const [tab, setTab] = useState<'channels' | 'timing'>('channels');
  const totalActivities = MOCK_CHANNELS.reduce((s, c) => s + c.total, 0);
  const maxHourly = Math.max(...MOCK_HOURLY.map((h) => h.count), 1);
  const maxDaily = Math.max(...MOCK_DAILY.map((d) => d.count), 1);

  return (
    <Modal open={open} onClose={onClose} title="Communication Analytics" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <BarChart3 className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{totalActivities.toLocaleString()}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Activities</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_CHANNELS.reduce((s, c) => s + c.thisMonth, 0)}</p>
            <p className="text-[10px] text-th-text-tertiary">This Month</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <Mail className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">Email</p>
            <p className="text-[10px] text-th-text-tertiary">Top Channel</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'channels' as const, label: 'By Channel' }, { id: 'timing' as const, label: 'Best Times' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        {tab === 'channels' && (
          <div className="space-y-2">
            {MOCK_CHANNELS.map((ch) => {
              const ChIcon = ch.icon;
              const pct = ((ch.total / totalActivities) * 100).toFixed(0);
              return (
                <div key={ch.channel} className="p-3 rounded-xl border border-th-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ch.color + '15' }}>
                      <ChIcon className="w-4 h-4" style={{ color: ch.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-th-text-primary">{ch.channel}</span>
                        {ch.preferred && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium">Preferred</span>}
                      </div>
                      <div className="h-1.5 rounded-full bg-surface-tertiary overflow-hidden mt-1">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: ch.color }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center shrink-0">
                      <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{ch.total}</p><p className="text-[8px] text-th-text-tertiary">Total</p></div>
                      <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{ch.thisMonth}</p><p className="text-[8px] text-th-text-tertiary">Month</p></div>
                      <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{ch.avgResponseTime}</p><p className="text-[8px] text-th-text-tertiary">Avg Resp</p></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'timing' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-th-border/50">
              <p className="text-xs font-semibold text-th-text-secondary mb-2">Best Hours</p>
              <div className="flex items-end gap-1 h-[80px]">
                {MOCK_HOURLY.map((h) => (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full rounded-t bg-th-accent-500/40" style={{ height: `${(h.count / maxHourly) * 60}px` }} />
                    <span className="text-[7px] text-th-text-tertiary">{h.hour}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-th-border/50">
              <p className="text-xs font-semibold text-th-text-secondary mb-2">Best Days</p>
              <div className="flex items-end gap-2 h-[80px]">
                {MOCK_DAILY.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full rounded-t bg-green-500/40" style={{ height: `${(d.count / maxDaily) * 60}px` }} />
                    <span className="text-[8px] text-th-text-tertiary font-medium">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Timing Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">Peak engagement is <strong>Wed 10am-11am</strong>. Schedule important outreach during this window for best response rates.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
