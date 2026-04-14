import { useState, useMemo } from 'react';
import { Modal } from '../Modal';
import {
  Users, Zap, Filter, Check, Loader2, ChevronDown, ChevronRight,
  Clock, Target, AlertTriangle, RefreshCw, Mail, Phone,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface StaleLeadItem {
  id: string;
  name: string;
  email: string | null;
  stage: string | null;
  daysSinceContact: number | null;
}

interface CadenceOption {
  id: string;
  name: string;
  steps: number;
  isDefault: boolean;
}

interface BulkReactivationModalProps {
  open: boolean;
  onClose: () => void;
  leads: StaleLeadItem[];
  cadences?: CadenceOption[];
  onBulkEnroll?: (leadIds: string[], cadenceId: string, options: { delay?: number; priority?: string }) => Promise<number>;
}

const MOCK_CADENCES: CadenceOption[] = [
  { id: 'c1', name: 'Reactivation', steps: 5, isDefault: false },
  { id: 'c2', name: 'Aggressive Win-Back', steps: 8, isDefault: false },
  { id: 'c3', name: 'Gentle Re-Engagement', steps: 3, isDefault: true },
];

export function BulkReactivationModal({ open, onClose, leads, cadences: propCadences, onBulkEnroll }: BulkReactivationModalProps) {
  const cadences = propCadences || MOCK_CADENCES;
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set(leads.map((l) => l.id)));
  const [selectedCadence, setSelectedCadence] = useState(cadences[0]?.id || '');
  const [staggerDelay, setStaggerDelay] = useState(0);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);

  const filteredLeads = useMemo(() => {
    if (priorityFilter === 'all') return leads;
    return leads.filter((l) => {
      const days = l.daysSinceContact ?? 999;
      if (priorityFilter === 'hot') return days <= 60;
      if (priorityFilter === 'warm') return days > 60 && days <= 120;
      return days > 120;
    });
  }, [leads, priorityFilter]);

  const toggleLead = (id: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedLeads(new Set(filteredLeads.map((l) => l.id)));
  const clearAll = () => setSelectedLeads(new Set());

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const count = await onBulkEnroll?.(Array.from(selectedLeads), selectedCadence, { delay: staggerDelay, priority: priorityFilter }) || selectedLeads.size;
      setEnrolledCount(count);
      setEnrolled(true);
    } catch { /* parent handles */ }
    finally { setEnrolling(false); }
  };

  if (enrolled) {
    return (
      <Modal open={open} onClose={onClose} title="Bulk Reactivation" size="xl">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-th-text-primary">Enrolled {enrolledCount} Leads!</h3>
          <p className="text-sm text-th-text-secondary mt-2">All selected leads have been enrolled in the reactivation cadence.</p>
          <button onClick={onClose} className="mt-6 px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium">Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Bulk Reactivation Enrollment" size="xl">
      <div className="space-y-4">
        {/* Cadence selection */}
        <div>
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Select Cadence</p>
          <div className="flex gap-2">
            {cadences.map((c) => (
              <button key={c.id} onClick={() => setSelectedCadence(c.id)} className={cn(
                'flex-1 p-3 rounded-xl border text-left transition-all',
                selectedCadence === c.id ? 'border-th-accent-500/50 bg-th-accent-500/5' : 'border-th-border/50 hover:border-th-accent-500/30'
              )}>
                <p className="text-xs font-medium text-th-text-primary">{c.name}</p>
                <p className="text-[10px] text-th-text-tertiary">{c.steps} steps{c.isDefault ? ' · Default' : ''}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-th-text-secondary mb-1 block">Stagger Enrollment</label>
            <select value={staggerDelay} onChange={(e) => setStaggerDelay(Number(e.target.value))}
              className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none">
              <option value={0}>All at once</option>
              <option value={30}>30 min intervals</option>
              <option value={60}>1 hour intervals</option>
              <option value={240}>4 hour intervals</option>
              <option value={1440}>1 per day</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-th-text-secondary mb-1 block">Priority Filter</label>
            <div className="flex gap-1">
              {(['all', 'hot', 'warm', 'cold'] as const).map((f) => (
                <button key={f} onClick={() => setPriorityFilter(f)} className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-medium transition-all',
                  priorityFilter === f ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent'
                )}>
                  {f === 'hot' ? '🔥' : f === 'warm' ? '🟡' : f === 'cold' ? '🥶' : ''} {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lead selection */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-th-text-secondary">{selectedLeads.size} of {filteredLeads.length} selected</span>
            <div className="flex-1" />
            <button onClick={selectAll} className="text-xs text-th-accent-500 hover:text-th-accent-600">Select All</button>
            <button onClick={clearAll} className="text-xs text-th-text-tertiary hover:text-th-text-secondary">Clear</button>
          </div>
          <div className="max-h-[220px] overflow-y-auto space-y-1 border border-th-border/50 rounded-xl p-1.5">
            {filteredLeads.map((lead) => {
              const days = lead.daysSinceContact ?? 0;
              const heat = days <= 60 ? 'hot' : days <= 120 ? 'warm' : 'cold';
              return (
                <label key={lead.id} className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all',
                  selectedLeads.has(lead.id) ? 'bg-th-accent-500/5' : 'hover:bg-surface-secondary/50'
                )}>
                  <input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={() => toggleLead(lead.id)}
                    className="w-4 h-4 rounded border-th-border text-th-accent-500 focus:ring-th-accent-500/40" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-th-text-primary">{lead.name}</span>
                    {lead.email && <span className="text-[10px] text-th-text-tertiary ml-1.5">{lead.email}</span>}
                  </div>
                  <span className="text-[10px] text-th-text-tertiary capitalize">{lead.stage || 'new'}</span>
                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                    heat === 'hot' ? 'text-orange-500 bg-orange-500/10' : heat === 'warm' ? 'text-amber-500 bg-amber-500/10' : 'text-blue-500 bg-blue-500/10'
                  )}>{days}d</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Summary & action */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30">
          <Users className="w-5 h-5 text-th-accent-500" />
          <div className="flex-1">
            <p className="text-xs font-medium text-th-text-primary">{selectedLeads.size} leads will be enrolled in <strong>{cadences.find((c) => c.id === selectedCadence)?.name}</strong></p>
            {staggerDelay > 0 && <p className="text-[10px] text-th-text-tertiary">Staggered over ~{Math.round((selectedLeads.size * staggerDelay) / 60)}h</p>}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <div className="flex-1" />
          <button onClick={handleEnroll} disabled={enrolling || selectedLeads.size === 0}
            className="px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {enrolling ? 'Enrolling...' : `Enroll ${selectedLeads.size} Leads`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
