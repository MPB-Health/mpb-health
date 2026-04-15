import { useState } from 'react';
import { Modal } from '../Modal';
import { FlaskConical, Trophy, Users, TrendingUp, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const TESTS = [
  {
    id: '1', campaign: 'Open Enrollment Q2', status: 'running' as const, started: '3 days ago',
    a: { name: 'Variant A — Urgency CTA', impressions: 2400, clicks: 312, conversions: 48, rate: 15.4 },
    b: { name: 'Variant B — Benefit CTA', impressions: 2400, clicks: 384, conversions: 62, rate: 16.1 },
    winner: 'b', confidence: 92,
  },
  {
    id: '2', campaign: 'Google Ads — Plans', status: 'completed' as const, started: '2 weeks ago',
    a: { name: 'Variant A — Price Focus', impressions: 5000, clicks: 480, conversions: 42, rate: 8.8 },
    b: { name: 'Variant B — Coverage Focus', impressions: 5000, clicks: 620, conversions: 68, rate: 11.0 },
    winner: 'b', confidence: 98,
  },
  {
    id: '3', campaign: 'LinkedIn Outreach', status: 'draft' as const, started: 'Not started',
    a: { name: 'Variant A — Professional Tone', impressions: 0, clicks: 0, conversions: 0, rate: 0 },
    b: { name: 'Variant B — Casual Tone', impressions: 0, clicks: 0, conversions: 0, rate: 0 },
    winner: null, confidence: 0,
  },
];

const statusColors = { running: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700', draft: 'bg-gray-100 text-gray-700' };

export function CampaignABTestModal({ open, onClose }: Props) {
  const [selected, setSelected] = useState('1');
  const test = TESTS.find((t) => t.id === selected);

  return (
    <Modal open={open} onClose={onClose} title="A/B Testing" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TESTS.map((t) => (
            <button key={t.id} onClick={() => setSelected(t.id)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-all', selected === t.id ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent')}>
              {t.campaign} <span className={cn('ml-1 text-[8px] px-1 py-0.5 rounded-full', statusColors[t.status])}>{t.status}</span>
            </button>
          ))}
        </div>

        {test && test.status !== 'draft' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[test.a, test.b].map((v, i) => {
                const isWinner = (i === 0 && test.winner === 'a') || (i === 1 && test.winner === 'b');
                return (
                  <div key={v.name} className={cn('p-3 rounded-xl border', isWinner ? 'border-green-500/30 bg-green-500/5' : 'border-th-border/50')}>
                    <div className="flex items-center gap-1.5 mb-2">
                      {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                      <span className="text-xs font-semibold text-th-text-primary">{v.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 rounded-lg bg-surface-tertiary/50">
                        <p className="text-sm font-bold text-th-text-primary tabular-nums">{v.impressions.toLocaleString()}</p>
                        <p className="text-[8px] text-th-text-tertiary">Impressions</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-surface-tertiary/50">
                        <p className="text-sm font-bold text-th-text-primary tabular-nums">{v.clicks}</p>
                        <p className="text-[8px] text-th-text-tertiary">Clicks</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-surface-tertiary/50">
                        <p className="text-sm font-bold text-th-text-primary tabular-nums">{v.conversions}</p>
                        <p className="text-[8px] text-th-text-tertiary">Conversions</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-surface-tertiary/50">
                        <p className={cn('text-sm font-bold tabular-nums', isWinner ? 'text-green-500' : 'text-th-text-primary')}>{v.rate}%</p>
                        <p className="text-[8px] text-th-text-tertiary">Conv Rate</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {test.confidence > 0 && (
              <div className="p-3 rounded-xl border border-th-border/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-th-text-secondary">Statistical Confidence</span>
                  <span className={cn('text-xs font-bold', test.confidence >= 95 ? 'text-green-500' : test.confidence >= 80 ? 'text-amber-500' : 'text-red-400')}>{test.confidence}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-surface-tertiary overflow-hidden">
                  <div className={cn('h-full rounded-full', test.confidence >= 95 ? 'bg-green-500' : test.confidence >= 80 ? 'bg-amber-500' : 'bg-red-400')} style={{ width: `${test.confidence}%` }} />
                </div>
                <p className="text-[9px] text-th-text-tertiary mt-1">{test.confidence >= 95 ? 'Statistically significant — safe to pick winner' : test.confidence >= 80 ? 'Nearly significant — consider running longer' : 'Not yet significant — needs more data'}</p>
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-th-text-tertiary">
            <FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">This test hasn't started yet</p>
            <p className="text-xs mt-1">Configure variants and launch to begin collecting data</p>
          </div>
        )}

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">A/B Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Benefit-focused CTAs</strong> consistently outperform urgency-based ones across your campaigns. Apply "Variant B" learnings to all email campaigns.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
