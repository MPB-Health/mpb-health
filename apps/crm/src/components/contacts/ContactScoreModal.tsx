import { useState } from 'react';
import { Modal } from '../Modal';
import { Star, TrendingUp, TrendingDown, Sparkles, Users, Mail, Phone, Calendar, ArrowRight } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ScoredContact { id: string; name: string; email: string; score: number; trend: 'up' | 'down' | 'stable'; factors: { name: string; points: number; max: number }[]; }
interface ContactScoreModalProps { open: boolean; onClose: () => void; onNavigateToContact?: (id: string) => void; }

const MOCK_SCORED: ScoredContact[] = [
  { id: '1', name: 'Brett Baker', email: 'brettbaker7@me.com', score: 92, trend: 'up', factors: [
    { name: 'Email engagement', points: 25, max: 25 }, { name: 'Phone responsive', points: 20, max: 20 },
    { name: 'Meeting attendance', points: 22, max: 25 }, { name: 'Recency', points: 25, max: 30 },
  ]},
  { id: '2', name: 'Patricia Moore', email: 'patricia@example.com', score: 78, trend: 'stable', factors: [
    { name: 'Email engagement', points: 22, max: 25 }, { name: 'Phone responsive', points: 15, max: 20 },
    { name: 'Meeting attendance', points: 20, max: 25 }, { name: 'Recency', points: 21, max: 30 },
  ]},
  { id: '3', name: 'David Brown', email: 'dbrown@example.com', score: 65, trend: 'down', factors: [
    { name: 'Email engagement', points: 18, max: 25 }, { name: 'Phone responsive', points: 10, max: 20 },
    { name: 'Meeting attendance', points: 15, max: 25 }, { name: 'Recency', points: 22, max: 30 },
  ]},
  { id: '4', name: 'Jennifer White', email: 'jwhite@example.com', score: 54, trend: 'down', factors: [
    { name: 'Email engagement', points: 12, max: 25 }, { name: 'Phone responsive', points: 8, max: 20 },
    { name: 'Meeting attendance', points: 14, max: 25 }, { name: 'Recency', points: 20, max: 30 },
  ]},
  { id: '5', name: 'Susan Thompson', email: 'sthompson@example.com', score: 88, trend: 'up', factors: [
    { name: 'Email engagement', points: 24, max: 25 }, { name: 'Phone responsive', points: 18, max: 20 },
    { name: 'Meeting attendance', points: 21, max: 25 }, { name: 'Recency', points: 25, max: 30 },
  ]},
  { id: '6', name: 'Robert Chen', email: 'rchen@example.com', score: 42, trend: 'down', factors: [
    { name: 'Email engagement', points: 8, max: 25 }, { name: 'Phone responsive', points: 6, max: 20 },
    { name: 'Meeting attendance', points: 10, max: 25 }, { name: 'Recency', points: 18, max: 30 },
  ]},
];

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-500 bg-green-500';
  if (score >= 60) return 'text-blue-500 bg-blue-500';
  if (score >= 40) return 'text-amber-500 bg-amber-500';
  return 'text-red-500 bg-red-500';
}

export function ContactScoreModal({ open, onClose, onNavigateToContact }: ContactScoreModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sort, setSort] = useState<'score' | 'name'>('score');

  const sorted = [...MOCK_SCORED].sort((a, b) => sort === 'score' ? b.score - a.score : a.name.localeCompare(b.name));
  const avgScore = Math.round(MOCK_SCORED.reduce((s, c) => s + c.score, 0) / MOCK_SCORED.length);
  const highEngagement = MOCK_SCORED.filter((c) => c.score >= 70).length;
  const declining = MOCK_SCORED.filter((c) => c.trend === 'down').length;

  return (
    <Modal open={open} onClose={onClose} title="Contact Engagement Scores" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30 text-center">
            <Star className="w-4 h-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{avgScore}</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Score</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{highEngagement}</p>
            <p className="text-[10px] text-th-text-tertiary">High Engagement</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <TrendingDown className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{declining}</p>
            <p className="text-[10px] text-th-text-tertiary">Declining</p>
          </div>
        </div>

        <div className="flex gap-1">
          {[{ id: 'score' as const, label: 'By Score' }, { id: 'name' as const, label: 'By Name' }].map((s) => (
            <button key={s.id} onClick={() => setSort(s.id)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              sort === s.id ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary'
            )}>{s.label}</button>
          ))}
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-1.5">
          {sorted.map((contact) => {
            const colors = getScoreColor(contact.score);
            const isExpanded = expandedId === contact.id;
            return (
              <div key={contact.id} className="rounded-xl border border-th-border/50 overflow-hidden">
                <button onClick={() => setExpandedId(isExpanded ? null : contact.id)}
                  className="w-full text-left p-3 flex items-center gap-3 hover:bg-surface-secondary/30 transition-colors">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-sm', colors.split(' ')[1])}>
                    {contact.score}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-th-text-primary">{contact.name}</span>
                      {contact.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                      {contact.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                    </div>
                    <span className="text-[10px] text-th-text-tertiary">{contact.email}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onNavigateToContact?.(contact.id); }}
                    className="text-[10px] text-th-accent-500 hover:text-th-accent-600 font-medium shrink-0">View</button>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-th-border/30 bg-surface-secondary/20">
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {contact.factors.map((f) => {
                        const pct = (f.points / f.max) * 100;
                        return (
                          <div key={f.name} className="text-center">
                            <p className="text-xs font-bold text-th-text-primary tabular-nums">{f.points}/{f.max}</p>
                            <div className="h-1 rounded-full bg-surface-tertiary overflow-hidden mt-0.5 mx-2">
                              <div className={cn('h-full rounded-full', pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[8px] text-th-text-tertiary mt-0.5">{f.name}</p>
                          </div>
                        );
                      })}
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
