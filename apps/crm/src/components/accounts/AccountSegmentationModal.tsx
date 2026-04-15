import { useState } from 'react';
import { Modal } from '../Modal';
import { Layers, Sparkles, Star, Users, TrendingUp, ArrowRight, Target, Crown } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface Segment { tier: string; label: string; accounts: number; revenue: number; icpScore: number; color: string; icon: typeof Crown; criteria: string; }
interface AccountSegmentationModalProps { open: boolean; onClose: () => void; }

const MOCK_SEGMENTS: Segment[] = [
  { tier: 'S', label: 'Strategic', accounts: 5, revenue: 680000, icpScore: 95, color: '#8b5cf6', icon: Crown, criteria: 'Revenue > $100k, 5+ deals, hot rating' },
  { tier: 'A', label: 'Key Accounts', accounts: 12, revenue: 420000, icpScore: 82, color: '#3b82f6', icon: Star, criteria: 'Revenue > $30k, active engagement, warm+' },
  { tier: 'B', label: 'Growth', accounts: 24, revenue: 180000, icpScore: 68, color: '#10b981', icon: TrendingUp, criteria: 'Revenue $5k-$30k, recent activity' },
  { tier: 'C', label: 'Nurture', accounts: 32, revenue: 45000, icpScore: 45, color: '#f59e0b', icon: Users, criteria: 'New or low activity, potential fit' },
  { tier: 'D', label: 'Monitor', accounts: 25, revenue: 12000, icpScore: 22, color: '#6b7280', icon: Target, criteria: 'Inactive, low fit, or unqualified' },
];

const ICP_FACTORS = [
  { name: 'Company Size', weight: 25, description: 'Employee count & annual premium volume' },
  { name: 'Industry Fit', weight: 20, description: 'Health insurance, Medicare, senior care' },
  { name: 'Engagement Level', weight: 20, description: 'Meetings, emails, calls in last 90 days' },
  { name: 'Revenue Potential', weight: 15, description: 'Estimated lifetime value projection' },
  { name: 'Decision Speed', weight: 10, description: 'Average time from first contact to close' },
  { name: 'Geographic Match', weight: 10, description: 'Within serviceable territory zones' },
];

function currencyFmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

export function AccountSegmentationModal({ open, onClose }: AccountSegmentationModalProps) {
  const [tab, setTab] = useState<'segments' | 'icp'>('segments');
  const totalAccounts = MOCK_SEGMENTS.reduce((s, seg) => s + seg.accounts, 0);

  return (
    <Modal open={open} onClose={onClose} title="Account Segmentation" size="xl">
      <div className="space-y-4">
        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'segments' as const, label: 'Tier Segments' }, { id: 'icp' as const, label: 'ICP Scoring Model' }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        {tab === 'segments' && (
          <div className="space-y-3">
            {MOCK_SEGMENTS.map((seg) => {
              const pctOfTotal = ((seg.accounts / totalAccounts) * 100).toFixed(0);
              return (
                <div key={seg.tier} className="p-3 rounded-xl border border-th-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
                      style={{ backgroundColor: seg.color }}>
                      {seg.tier}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-th-text-primary">{seg.label}</span>
                        <span className="text-[10px] text-th-text-tertiary">{seg.accounts} accounts ({pctOfTotal}%)</span>
                      </div>
                      <p className="text-[10px] text-th-text-tertiary mt-0.5">{seg.criteria}</p>
                      <div className="flex items-center gap-4 mt-1.5">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-th-text-tertiary">Revenue:</span>
                          <span className="text-xs font-bold text-green-500">{currencyFmt(seg.revenue)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-th-text-tertiary">ICP Score:</span>
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1.5 rounded-full bg-surface-tertiary overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${seg.icpScore}%`, backgroundColor: seg.color }} />
                            </div>
                            <span className="text-[10px] font-bold tabular-nums" style={{ color: seg.color }}>{seg.icpScore}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-surface-tertiary flex items-center justify-center">
                        <div className="w-full h-full rounded-xl" style={{ background: `conic-gradient(${seg.color} ${(seg.accounts / totalAccounts) * 360}deg, transparent 0deg)`, opacity: 0.3 }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'icp' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Ideal Customer Profile</span>
              </div>
              <p className="text-xs text-th-text-secondary">ICP scores are calculated from 6 weighted factors. Adjust weights to match your sales strategy.</p>
            </div>

            {ICP_FACTORS.map((factor) => (
              <div key={factor.name} className="flex items-center gap-3 p-3 rounded-xl border border-th-border/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-th-text-primary">{factor.name}</span>
                    <span className="text-xs font-bold text-th-accent-500 tabular-nums">{factor.weight}%</span>
                  </div>
                  <p className="text-[10px] text-th-text-tertiary mt-0.5">{factor.description}</p>
                  <div className="mt-1.5 h-2 rounded-full bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded-full bg-th-accent-500/60" style={{ width: `${factor.weight}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
