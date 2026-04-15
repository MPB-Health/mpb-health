import { useState } from 'react';
import { Modal } from '../Modal';
import { RotateCcw, Users, CheckCircle2, Loader2, Sparkles, Star } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface DealRotationModalProps { open: boolean; onClose: () => void; }

const MOCK_REPS = [
  { id: 'r1', name: 'Julia Smith', avatar: 'JS', activeDeals: 14, capacity: 20, lastAssigned: '2d ago', color: '#3b82f6' },
  { id: 'r2', name: 'Mark Davis', avatar: 'MD', activeDeals: 12, capacity: 18, lastAssigned: '3d ago', color: '#10b981' },
  { id: 'r3', name: 'Sarah Johnson', avatar: 'SJ', activeDeals: 10, capacity: 16, lastAssigned: '1d ago', color: '#8b5cf6' },
  { id: 'r4', name: 'Tom Wilson', avatar: 'TW', activeDeals: 8, capacity: 15, lastAssigned: '4d ago', color: '#f59e0b' },
];

export function DealRotationModal({ open, onClose }: DealRotationModalProps) {
  const [mode, setMode] = useState<'round-robin' | 'capacity' | 'balanced'>('round-robin');
  const [enabled, setEnabled] = useState(true);
  const [selectedReps, setSelectedReps] = useState<Set<string>>(new Set(MOCK_REPS.map((r) => r.id)));

  const toggleRep = (id: string) => {
    setSelectedReps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const nextUp = MOCK_REPS.reduce((a, b) => {
    if (!selectedReps.has(a.id)) return b;
    if (!selectedReps.has(b.id)) return a;
    if (mode === 'capacity') return (a.capacity - a.activeDeals) > (b.capacity - b.activeDeals) ? a : b;
    return a;
  });

  return (
    <Modal open={open} onClose={onClose} title="Deal Assignment Rotation" size="xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl border border-th-border/50">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-th-accent-500" />
            <span className="text-sm font-medium text-th-text-primary">Auto-Assignment</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={() => setEnabled(!enabled)} className="sr-only peer" />
            <div className="w-9 h-5 bg-surface-tertiary rounded-full peer peer-checked:bg-th-accent-500 transition-colors">
              <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform', enabled && 'translate-x-4')} />
            </div>
          </label>
        </div>

        <div>
          <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Assignment Mode</label>
          <div className="flex gap-1.5">
            {[
              { id: 'round-robin' as const, label: 'Round Robin', desc: 'Sequential rotation' },
              { id: 'capacity' as const, label: 'By Capacity', desc: 'Most available first' },
              { id: 'balanced' as const, label: 'Balanced', desc: 'Equal deal count' },
            ].map((m) => (
              <button key={m.id} onClick={() => setMode(m.id)} className={cn(
                'flex-1 px-3 py-2 rounded-xl text-xs border transition-all text-left',
                mode === m.id ? 'border-th-accent-500 bg-th-accent-500/10' : 'border-th-border/30'
              )}>
                <p className={cn('font-medium', mode === m.id ? 'text-th-accent-500' : 'text-th-text-secondary')}>{m.label}</p>
                <p className="text-[9px] text-th-text-tertiary mt-0.5">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-th-text-secondary block mb-1.5">Team Members</label>
          <div className="space-y-1.5">
            {MOCK_REPS.map((rep) => {
              const isSelected = selectedReps.has(rep.id);
              const utilization = Math.round((rep.activeDeals / rep.capacity) * 100);
              const isNext = rep.id === nextUp.id && enabled;
              return (
                <label key={rep.id} className={cn('flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all',
                  isSelected ? 'border-th-border/50' : 'border-th-border/20 opacity-50')}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleRep(rep.id)} className="rounded" />
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: rep.color }}>
                    {rep.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-th-text-primary">{rep.name}</span>
                      {isNext && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 font-bold flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />Next</span>}
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-tertiary overflow-hidden mt-1">
                      <div className={cn('h-full rounded-full', utilization >= 80 ? 'bg-red-500' : utilization >= 60 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: `${utilization}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-th-text-primary font-medium tabular-nums">{rep.activeDeals}/{rep.capacity}</p>
                    <p className="text-[9px] text-th-text-tertiary">{rep.lastAssigned}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Assignment Tip</span>
          </div>
          <p className="text-xs text-th-text-secondary"><strong>Tom Wilson</strong> has the most capacity (7 slots open). In "By Capacity" mode, new deals will be assigned to reps with the most room.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
