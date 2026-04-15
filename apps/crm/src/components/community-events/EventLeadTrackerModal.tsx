import { Modal } from '../Modal';
import { Target, ArrowRight, CheckCircle2, Clock, XCircle, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const EVENTS = [
  {
    name: 'Grace Community Fellowship',
    date: 'Apr 12',
    leads: 12,
    pipeline: { new: 4, contacted: 3, qualified: 3, closed: 2, lost: 0 },
    color: '#3b82f6',
  },
  {
    name: 'Downtown Health Expo',
    date: 'Apr 8',
    leads: 18,
    pipeline: { new: 8, contacted: 5, qualified: 3, closed: 1, lost: 1 },
    color: '#f59e0b',
  },
  {
    name: 'Metro Chamber Mixer',
    date: 'Mar 15',
    leads: 11,
    pipeline: { new: 1, contacted: 2, qualified: 3, closed: 4, lost: 1 },
    color: '#8b5cf6',
  },
  {
    name: 'United Way Partnership Day',
    date: 'Mar 5',
    leads: 16,
    pipeline: { new: 0, contacted: 2, qualified: 4, closed: 8, lost: 2 },
    color: '#ef4444',
  },
];

const STAGES = [
  { key: 'new', label: 'New', color: 'bg-blue-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-amber-500' },
  { key: 'qualified', label: 'Qualified', color: 'bg-violet-500' },
  { key: 'closed', label: 'Closed Won', color: 'bg-green-500' },
  { key: 'lost', label: 'Lost', color: 'bg-red-400' },
];

export function EventLeadTrackerModal({ open, onClose }: Props) {
  const totalLeads = EVENTS.reduce((s, e) => s + e.leads, 0);
  const totalClosed = EVENTS.reduce((s, e) => s + e.pipeline.closed, 0);

  return (
    <Modal open={open} onClose={onClose} title="Event Lead Pipeline Tracker" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Target className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{totalLeads}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Event Leads</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{totalClosed}</p>
            <p className="text-[10px] text-th-text-tertiary">Closed Won</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{Math.round(totalClosed / totalLeads * 100)}%</p>
            <p className="text-[10px] text-th-text-tertiary">Conversion Rate</p>
          </div>
        </div>

        <div className="space-y-2">
          {EVENTS.map((ev) => (
            <div key={ev.name} className="p-3 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-5 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                <span className="text-xs font-semibold text-th-text-primary flex-1">{ev.name}</span>
                <span className="text-[9px] text-th-text-tertiary">{ev.date} • {ev.leads} leads</span>
              </div>
              <div className="flex rounded-full h-3 overflow-hidden">
                {STAGES.map((stage) => {
                  const val = (ev.pipeline as any)[stage.key] as number;
                  if (val === 0) return null;
                  return <div key={stage.key} className={cn('h-full', stage.color)} style={{ width: `${(val / ev.leads) * 100}%` }} title={`${stage.label}: ${val}`} />;
                })}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                {STAGES.map((stage) => {
                  const val = (ev.pipeline as any)[stage.key] as number;
                  return <span key={stage.key} className="text-[8px] text-th-text-tertiary">{stage.label}: <strong>{val}</strong></span>;
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-green-500" /><span className="text-xs font-semibold text-green-700 dark:text-green-300">Pipeline Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>United Way Partnership Day</strong> has the best conversion: 50% of leads already closed. <strong>Downtown Health Expo</strong> has 8 leads still in New stage — prioritize contact calls this week.</p>
        </div>
        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
