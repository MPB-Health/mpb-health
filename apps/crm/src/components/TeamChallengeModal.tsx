import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  Trophy, Target, Flame, Star, Users, Clock, TrendingUp,
  Plus, Medal, Award, Zap, Crown, BarChart3, Calendar,
  ChevronRight, Check, Gift, Sparkles,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ChallengeParticipant {
  id: string;
  name: string;
  avatar: string;
  score: number;
  target: number;
  streak: number;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'individual' | 'team';
  metric: string;
  target: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  prize?: string;
  participants: ChallengeParticipant[];
}

interface TeamChallengeModalProps {
  open: boolean;
  onClose: () => void;
  challenges?: Challenge[];
  currentUserId?: string;
  onCreateChallenge?: (challenge: Partial<Challenge>) => Promise<void>;
  onJoinChallenge?: (challengeId: string) => Promise<void>;
}

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: '1', name: 'April Enrollment Sprint', description: 'Most Medicare enrollments this month wins!',
    type: 'individual', metric: 'Enrollments', target: 20, startDate: '2026-04-01', endDate: '2026-04-30', status: 'active', prize: '$500 bonus + Trophy',
    participants: [
      { id: 'u1', name: 'Sarah K.', avatar: 'SK', score: 15, target: 20, streak: 7 },
      { id: 'u2', name: 'Mike R.', avatar: 'MR', score: 12, target: 20, streak: 3 },
      { id: 'u3', name: 'Lisa P.', avatar: 'LP', score: 11, target: 20, streak: 5 },
      { id: 'u4', name: 'John D.', avatar: 'JD', score: 9, target: 20, streak: 2 },
      { id: 'u5', name: 'Amy T.', avatar: 'AT', score: 8, target: 20, streak: 4 },
    ],
  },
  {
    id: '2', name: 'Call Blitz Week', description: '50 outbound calls in one week. Go!',
    type: 'individual', metric: 'Calls', target: 50, startDate: '2026-04-14', endDate: '2026-04-18', status: 'active', prize: 'Team lunch',
    participants: [
      { id: 'u1', name: 'Sarah K.', avatar: 'SK', score: 32, target: 50, streak: 3 },
      { id: 'u2', name: 'Mike R.', avatar: 'MR', score: 28, target: 50, streak: 2 },
      { id: 'u3', name: 'Lisa P.', avatar: 'LP', score: 41, target: 50, streak: 5 },
    ],
  },
  {
    id: '3', name: 'Q2 Revenue Race', description: 'Team-based quarterly revenue challenge',
    type: 'team', metric: 'Revenue ($)', target: 100000, startDate: '2026-04-01', endDate: '2026-06-30', status: 'active', prize: 'Team trip',
    participants: [
      { id: 't1', name: 'Team Alpha', avatar: 'TA', score: 34500, target: 100000, streak: 0 },
      { id: 't2', name: 'Team Beta', avatar: 'TB', score: 28900, target: 100000, streak: 0 },
    ],
  },
];

function daysLeft(endDate: string) {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}

function formatNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function TeamChallengeModal({
  open, onClose, challenges: propChallenges, currentUserId = 'u1', onCreateChallenge, onJoinChallenge,
}: TeamChallengeModalProps) {
  const challenges = propChallenges || MOCK_CHALLENGES;
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(challenges[0]?.id || null);
  const [tab, setTab] = useState<'active' | 'create'>('active');

  const active = challenges.filter((c) => c.status === 'active');
  const selected = challenges.find((c) => c.id === selectedChallenge);

  const [newChallenge, setNewChallenge] = useState({
    name: '', description: '', metric: 'Enrollments', target: 10, endDate: '', prize: '',
  });

  return (
    <Modal open={open} onClose={onClose} title="Team Challenges & Competitions" size="2xl">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-th-border/50">
          <button onClick={() => setTab('active')} className={cn(
            'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
            tab === 'active' ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
          )}><Trophy className="w-3.5 h-3.5" /> Active ({active.length})</button>
          <button onClick={() => setTab('create')} className={cn(
            'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
            tab === 'create' ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
          )}><Plus className="w-3.5 h-3.5" /> Create Challenge</button>
        </div>

        {tab === 'active' && (
          <div className="flex gap-4" style={{ minHeight: 340 }}>
            {/* Challenge list */}
            <div className="w-48 shrink-0 space-y-1.5">
              {active.map((c) => (
                <button key={c.id} onClick={() => setSelectedChallenge(c.id)} className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl border transition-all',
                  selectedChallenge === c.id ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50 hover:border-th-accent-500/20'
                )}>
                  <div className="flex items-center gap-1.5">
                    {c.type === 'team' ? <Users className="w-3 h-3 text-blue-500" /> : <Target className="w-3 h-3 text-amber-500" />}
                    <span className="text-xs font-semibold text-th-text-primary truncate">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-th-text-tertiary">
                    <span>{c.participants.length} participants</span>
                    <span>{daysLeft(c.endDate)}d left</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Challenge detail */}
            {selected && (
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-th-text-primary">{selected.name}</h3>
                    <p className="text-xs text-th-text-tertiary mt-0.5">{selected.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-th-text-tertiary">
                      <span className="flex items-center gap-1"><Target className="w-3 h-3" />Target: {formatNum(selected.target)} {selected.metric}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{daysLeft(selected.endDate)} days left</span>
                      {selected.prize && <span className="flex items-center gap-1 text-amber-500"><Gift className="w-3 h-3" />{selected.prize}</span>}
                    </div>
                  </div>
                </div>

                {/* Leaderboard */}
                <div className="space-y-2">
                  {selected.participants.sort((a, b) => b.score - a.score).map((p, idx) => {
                    const pct = selected.target ? Math.min(100, (p.score / selected.target) * 100) : 0;
                    const isYou = p.id === currentUserId;
                    return (
                      <div key={p.id} className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all',
                        isYou ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/30'
                      )}>
                        <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                          idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-gray-300 text-gray-700' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-surface-tertiary text-th-text-secondary'
                        )}>
                          {idx === 0 ? <Crown className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {p.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-th-text-primary">{p.name}</span>
                            {isYou && <span className="text-[9px] font-bold text-th-accent-500 bg-th-accent-500/10 px-1 py-0.5 rounded">YOU</span>}
                            {p.streak >= 3 && <span className="flex items-center gap-0.5 text-[10px] text-orange-500"><Flame className="w-3 h-3" />{p.streak}d</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-2 rounded-full bg-surface-tertiary overflow-hidden">
                              <div className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-green-500' : 'bg-th-accent-500')} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-th-text-secondary tabular-nums">{formatNum(p.score)}/{formatNum(selected.target)}</span>
                          </div>
                        </div>
                        <span className={cn('text-xs font-bold tabular-nums', pct >= 100 ? 'text-green-500' : 'text-th-text-secondary')}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'create' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-th-text-secondary mb-1 block">Challenge Name</label>
                <input type="text" value={newChallenge.name} onChange={(e) => setNewChallenge({ ...newChallenge, name: e.target.value })}
                  placeholder="May Enrollment Blitz" className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-th-text-secondary mb-1 block">Metric</label>
                <select value={newChallenge.metric} onChange={(e) => setNewChallenge({ ...newChallenge, metric: e.target.value })}
                  className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none">
                  {['Enrollments', 'Calls', 'Emails', 'Meetings', 'Revenue ($)', 'New Leads', 'Deals Closed'].map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-th-text-secondary mb-1 block">Target</label>
                <input type="number" value={newChallenge.target} onChange={(e) => setNewChallenge({ ...newChallenge, target: Number(e.target.value) })}
                  className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 tabular-nums focus:border-th-accent-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-th-text-secondary mb-1 block">End Date</label>
                <input type="date" value={newChallenge.endDate} onChange={(e) => setNewChallenge({ ...newChallenge, endDate: e.target.value })}
                  className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-th-text-secondary mb-1 block">Description</label>
              <textarea value={newChallenge.description} onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })} rows={2}
                placeholder="Describe the challenge..." className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 resize-none focus:border-th-accent-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-th-text-secondary mb-1 block">Prize (optional)</label>
              <input type="text" value={newChallenge.prize} onChange={(e) => setNewChallenge({ ...newChallenge, prize: e.target.value })}
                placeholder="$500 bonus, team lunch, etc." className="w-full text-sm rounded-xl border border-th-border/50 bg-surface-primary px-3 py-2 focus:border-th-accent-500/50 focus:outline-none" />
            </div>
            <button onClick={() => { onCreateChallenge?.(newChallenge); setTab('active'); }}
              disabled={!newChallenge.name || !newChallenge.endDate}
              className="w-full py-3 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              <Trophy className="w-4 h-4" /> Launch Challenge
            </button>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
