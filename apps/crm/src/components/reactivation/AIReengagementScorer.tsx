import { useState, useMemo } from 'react';
import { Modal } from '../Modal';
import {
  Sparkles, TrendingUp, TrendingDown, User, Phone, Mail,
  Clock, Target, ArrowRight, ChevronDown, ChevronRight,
  Loader2, RefreshCw, AlertTriangle, CheckCircle2, Zap,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ScoredLead {
  id: string;
  name: string;
  email: string;
  stage: string;
  daysSinceContact: number;
  reengagementScore: number;
  predictedChannel: 'email' | 'phone' | 'sms';
  factors: { label: string; impact: 'positive' | 'negative' | 'neutral'; detail: string }[];
  bestTimeToContact: string;
  estimatedRevenue: number;
}

interface AIReengagementScorerProps {
  open: boolean;
  onClose: () => void;
  staleLeads?: { id: string; name: string; email: string | null; stage: string | null; daysSinceContact: number | null }[];
  onEnrollLead?: (leadId: string) => void;
}

const MOCK_SCORED: ScoredLead[] = [
  { id: '1', name: 'Patricia Moore', email: 'patricia.moore@email.com', stage: 'qualified', daysSinceContact: 95, reengagementScore: 87,
    predictedChannel: 'phone', bestTimeToContact: 'Tue 10:00 AM',  estimatedRevenue: 2400,
    factors: [
      { label: 'Previous engagement', impact: 'positive', detail: 'Had 6 interactions before going cold' },
      { label: 'Stage depth', impact: 'positive', detail: 'Was qualified — already vetted' },
      { label: 'Time decay', impact: 'negative', detail: '95 days since last contact' },
      { label: 'Seasonal timing', impact: 'positive', detail: 'AEP approaching — natural re-engage trigger' },
    ],
  },
  { id: '2', name: 'Robert Chen', email: 'robert.chen@email.com', stage: 'contacted', daysSinceContact: 120, reengagementScore: 72,
    predictedChannel: 'email', bestTimeToContact: 'Wed 2:00 PM', estimatedRevenue: 1800,
    factors: [
      { label: 'Email responsiveness', impact: 'positive', detail: 'Opened 4/5 previous emails' },
      { label: 'Limited interactions', impact: 'negative', detail: 'Only 2 interactions total' },
      { label: 'Age factor', impact: 'positive', detail: 'Turning 65 this year — Medicare eligible' },
    ],
  },
  { id: '3', name: 'Jennifer White', email: 'jennifer.white@email.com', stage: 'proposal', daysSinceContact: 62, reengagementScore: 91,
    predictedChannel: 'phone', bestTimeToContact: 'Mon 11:00 AM', estimatedRevenue: 5200,
    factors: [
      { label: 'Stage depth', impact: 'positive', detail: 'Was at proposal — very close to converting' },
      { label: 'High value', impact: 'positive', detail: 'Group health — $5.2K annual value' },
      { label: 'Recent stale', impact: 'positive', detail: 'Only 62 days — still fresh' },
      { label: 'No explicit rejection', impact: 'positive', detail: 'Went cold, didn\'t say no' },
    ],
  },
  { id: '4', name: 'David Brown', email: 'david.brown@email.com', stage: 'new', daysSinceContact: 180, reengagementScore: 34,
    predictedChannel: 'email', bestTimeToContact: 'Thu 9:00 AM', estimatedRevenue: 600,
    factors: [
      { label: 'Minimal history', impact: 'negative', detail: 'Only 1 interaction — initial form' },
      { label: 'Very stale', impact: 'negative', detail: '180 days — significantly decayed' },
      { label: 'Low intent signals', impact: 'negative', detail: 'No email opens, no site visits' },
    ],
  },
  { id: '5', name: 'Susan Thompson', email: 'susan.thompson@email.com', stage: 'negotiation', daysSinceContact: 45, reengagementScore: 94,
    predictedChannel: 'phone', bestTimeToContact: 'Tue 3:00 PM', estimatedRevenue: 3600,
    factors: [
      { label: 'Negotiation stage', impact: 'positive', detail: 'Was actively negotiating terms' },
      { label: 'Recent stale', impact: 'positive', detail: 'Only 45 days — high recovery chance' },
      { label: 'Multiple interactions', impact: 'positive', detail: '12 touchpoints before going cold' },
      { label: 'Rate concern', impact: 'neutral', detail: 'Last note mentions premium comparison' },
    ],
  },
];

const CHANNEL_ICONS = { email: Mail, phone: Phone, sms: ArrowRight };

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

function scoreBg(score: number) {
  if (score >= 80) return 'from-green-500/10 to-emerald-500/10 border-green-500/20';
  if (score >= 60) return 'from-amber-500/10 to-yellow-500/10 border-amber-500/20';
  return 'from-red-500/10 to-rose-500/10 border-red-500/20';
}

export function AIReengagementScorer({ open, onClose, staleLeads, onEnrollLead }: AIReengagementScorerProps) {
  const [scoring, setScoring] = useState(false);
  const [scored, setScored] = useState<ScoredLead[]>(MOCK_SCORED);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'score' | 'revenue' | 'days'>('score');

  const sorted = useMemo(() => {
    return [...scored].sort((a, b) => {
      if (sortBy === 'score') return b.reengagementScore - a.reengagementScore;
      if (sortBy === 'revenue') return b.estimatedRevenue - a.estimatedRevenue;
      return a.daysSinceContact - b.daysSinceContact;
    });
  }, [scored, sortBy]);

  const avgScore = scored.length ? Math.round(scored.reduce((s, l) => s + l.reengagementScore, 0) / scored.length) : 0;
  const highPotential = scored.filter((l) => l.reengagementScore >= 70).length;
  const totalPotentialRevenue = scored.filter((l) => l.reengagementScore >= 60).reduce((s, l) => s + l.estimatedRevenue, 0);

  const runScoring = async () => {
    setScoring(true);
    await new Promise((r) => setTimeout(r, 1500));
    setScored(MOCK_SCORED);
    setScoring(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="AI Re-engagement Scorer" size="2xl">
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-blue-500/10 border border-th-border/30 text-center">
            <Sparkles className="w-4 h-4 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{avgScore}</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Score</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Target className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{highPotential}</p>
            <p className="text-[10px] text-th-text-tertiary">High Potential</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">${(totalPotentialRevenue / 1000).toFixed(1)}k</p>
            <p className="text-[10px] text-th-text-tertiary">Potential Revenue</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-th-border/30 text-center">
            <User className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{scored.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Leads Scored</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button onClick={runScoring} disabled={scoring}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl gradient-accent text-white text-xs font-medium disabled:opacity-50">
            {scoring ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {scoring ? 'Scoring...' : 'Re-score All'}
          </button>
          <div className="flex-1" />
          <span className="text-xs text-th-text-tertiary">Sort:</span>
          {[
            { key: 'score' as const, label: 'Score' },
            { key: 'revenue' as const, label: 'Revenue' },
            { key: 'days' as const, label: 'Freshest' },
          ].map((s) => (
            <button key={s.key} onClick={() => setSortBy(s.key)} className={cn(
              'px-2 py-1 rounded-lg text-xs font-medium',
              sortBy === s.key ? 'bg-th-accent-500/10 text-th-accent-500' : 'text-th-text-tertiary'
            )}>{s.label}</button>
          ))}
        </div>

        {/* Scored leads */}
        <div className="max-h-[340px] overflow-y-auto space-y-2">
          {sorted.map((lead) => {
            const expanded = expandedLead === lead.id;
            const ChannelIcon = CHANNEL_ICONS[lead.predictedChannel];
            return (
              <div key={lead.id} className={cn('rounded-xl border transition-all', scoreBg(lead.reengagementScore))}>
                <button onClick={() => setExpandedLead(expanded ? null : lead.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left">
                  {/* Score badge */}
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 font-bold text-sm', scoreBg(lead.reengagementScore), scoreColor(lead.reengagementScore))}>
                    {lead.reengagementScore}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-th-text-primary">{lead.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-tertiary capitalize">{lead.stage}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-th-text-tertiary mt-0.5">
                      <span>{lead.daysSinceContact}d stale</span>
                      <span className="flex items-center gap-0.5"><ChannelIcon className="w-2.5 h-2.5" /> Best: {lead.predictedChannel}</span>
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {lead.bestTimeToContact}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-th-text-primary tabular-nums">${lead.estimatedRevenue.toLocaleString()}</p>
                    <p className="text-[10px] text-th-text-tertiary">est. value</p>
                  </div>
                  {expanded ? <ChevronDown className="w-4 h-4 text-th-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-th-text-tertiary" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-th-border/30 space-y-2">
                    <p className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider">Scoring Factors</p>
                    <div className="space-y-1">
                      {lead.factors.map((f, i) => (
                        <div key={i} className="flex items-start gap-2">
                          {f.impact === 'positive' ? <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 shrink-0" /> :
                           f.impact === 'negative' ? <AlertTriangle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" /> :
                           <ArrowRight className="w-3 h-3 text-th-text-tertiary mt-0.5 shrink-0" />}
                          <div>
                            <span className="text-xs font-medium text-th-text-primary">{f.label}</span>
                            <p className="text-[10px] text-th-text-tertiary">{f.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => onEnrollLead?.(lead.id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg gradient-accent text-white text-xs font-medium">
                        <Zap className="w-3 h-3" /> Enroll Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
