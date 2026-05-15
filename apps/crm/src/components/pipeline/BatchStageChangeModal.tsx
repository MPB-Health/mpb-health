import { useState, useMemo } from 'react';
import { Modal } from '../Modal';
import { ArrowRight, CheckCircle2, Users, Search, Filter, Loader2 } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface LeadItem { id: string; name: string; email: string; currentStage: string; score: number; }
interface StageOption { name: string; display_name: string; color: string; }

interface BatchStageChangeModalProps {
  open: boolean;
  onClose: () => void;
  stages?: StageOption[];
  onBatchMove?: (leadIds: string[], targetStage: string) => Promise<number>;
}

const MOCK_STAGES: StageOption[] = [
  { name: 'new', display_name: 'New', color: '#3b82f6' },
  { name: 'contacted', display_name: 'Contacted', color: '#8b5cf6' },
  { name: 'qualified', display_name: 'Qualified', color: '#f59e0b' },
  { name: 'proposal', display_name: 'Proposal', color: '#ef4444' },
  { name: 'negotiation', display_name: 'Negotiation', color: '#10b981' },
  { name: 'won', display_name: 'Won', color: '#22c55e' },
];

// Round 12 Addendum (2026-05-14): Leo departed. Mock lead renamed so the
// Batch Stage Change modal preview doesn't surface a lookalike name.
const MOCK_LEADS: LeadItem[] = [
  { id: '1', name: 'Sample Prospect', email: 'test@gmail.com', currentStage: 'new', score: 42 },
  { id: '2', name: 'Test Moraes', email: 'test@gmail.com', currentStage: 'new', score: 38 },
  { id: '3', name: 'Brett Baker', email: 'brettbaker7@me.com', currentStage: 'new', score: 71 },
  { id: '4', name: 'Patricia Moore', email: 'patricia@example.com', currentStage: 'contacted', score: 55 },
  { id: '5', name: 'David Brown', email: 'dbrown@example.com', currentStage: 'contacted', score: 63 },
  { id: '6', name: 'Jennifer White', email: 'jwhite@example.com', currentStage: 'qualified', score: 78 },
  { id: '7', name: 'Robert Chen', email: 'rchen@example.com', currentStage: 'qualified', score: 44 },
  { id: '8', name: 'Susan Thompson', email: 'sthompson@example.com', currentStage: 'proposal', score: 82 },
];

export function BatchStageChangeModal({ open, onClose, onBatchMove }: BatchStageChangeModalProps) {
  const stages = MOCK_STAGES;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetStage, setTargetStage] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [moving, setMoving] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const filteredLeads = useMemo(() => {
    let leads = MOCK_LEADS;
    if (sourceFilter !== 'all') leads = leads.filter((l) => l.currentStage === sourceFilter);
    if (search) {
      const q = search.toLowerCase();
      leads = leads.filter((l) => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q));
    }
    return leads;
  }, [sourceFilter, search]);

  const toggleLead = (id: string) => setSelectedIds((prev) => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const selectAll = () => {
    if (selectedIds.size === filteredLeads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
  };

  const handleMove = async () => {
    if (!targetStage || selectedIds.size === 0) return;
    setMoving(true);
    try {
      const count = onBatchMove ? await onBatchMove(Array.from(selectedIds), targetStage) : selectedIds.size;
      setResult(count);
      setSelectedIds(new Set());
    } finally { setMoving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Batch Stage Change" size="xl">
      <div className="space-y-4">
        {result !== null ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-bold text-th-text-primary">Moved {result} leads</p>
            <p className="text-sm text-th-text-secondary">All selected leads have been moved to the new stage.</p>
            <button onClick={() => { setResult(null); onClose(); }}
              className="px-6 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600">Done</button>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-th-text-tertiary" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-th-border/50 bg-surface-primary focus:border-th-accent-500/50 focus:outline-none" />
              </div>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}
                className="text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none">
                <option value="all">All Stages</option>
                {stages.map((s) => <option key={s.name} value={s.name}>{s.display_name}</option>)}
              </select>
            </div>

            {/* Lead list */}
            <div className="max-h-[220px] overflow-y-auto rounded-xl border border-th-border/50">
              <div className="sticky top-0 bg-surface-secondary/80 backdrop-blur-sm px-3 py-1.5 border-b border-th-border/30 flex items-center gap-2">
                <input type="checkbox" checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                  onChange={selectAll} className="rounded" />
                <span className="text-[10px] text-th-text-tertiary font-medium">{selectedIds.size} of {filteredLeads.length} selected</span>
              </div>
              {filteredLeads.map((lead) => {
                const stageConf = stages.find((s) => s.name === lead.currentStage);
                return (
                  <label key={lead.id} className="flex items-center gap-3 px-3 py-2 border-b border-th-border/20 hover:bg-surface-secondary/50 cursor-pointer">
                    <input type="checkbox" checked={selectedIds.has(lead.id)} onChange={() => toggleLead(lead.id)} className="rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-th-text-primary truncate">{lead.name}</p>
                      <p className="text-[10px] text-th-text-tertiary truncate">{lead.email}</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: (stageConf?.color || '#888') + '15', color: stageConf?.color || '#888' }}>
                      {stageConf?.display_name || lead.currentStage}
                    </span>
                    <span className="text-[10px] bg-th-accent-100 text-th-accent-700 px-1.5 py-0.5 rounded-full tabular-nums">{lead.score}</span>
                  </label>
                );
              })}
            </div>

            {/* Target stage */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-th-border/50 bg-surface-secondary/30">
              <ArrowRight className="w-4 h-4 text-th-text-tertiary shrink-0" />
              <span className="text-xs font-medium text-th-text-secondary shrink-0">Move to:</span>
              <div className="flex flex-wrap gap-1.5">
                {stages.map((s) => (
                  <button key={s.name} onClick={() => setTargetStage(s.name)} className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                    targetStage === s.name ? 'border-th-accent-500 bg-th-accent-500/10 text-th-accent-500' : 'border-th-border/30 text-th-text-tertiary hover:text-th-text-secondary'
                  )}>
                    <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: s.color }} />
                    {s.display_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
              <button onClick={handleMove} disabled={selectedIds.size === 0 || !targetStage || moving}
                className="flex-1 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600 disabled:opacity-50 flex items-center justify-center gap-2">
                {moving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                Move {selectedIds.size} Lead{selectedIds.size !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
