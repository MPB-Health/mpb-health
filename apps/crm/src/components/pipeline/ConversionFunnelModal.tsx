import { useState } from 'react';
import { Modal } from '../Modal';
import { ArrowDown, TrendingUp, TrendingDown, Sparkles, Users, Target } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface FunnelStage { name: string; color: string; count: number; value: number; }
interface ConversionFunnelModalProps { open: boolean; onClose: () => void; }

const MOCK_FUNNEL: FunnelStage[] = [
  { name: 'New', color: '#3b82f6', count: 342, value: 0 },
  { name: 'Contacted', color: '#8b5cf6', count: 246, value: 0 },
  { name: 'Qualified', color: '#f59e0b', count: 158, value: 284400 },
  { name: 'Proposal', color: '#ef4444', count: 89, value: 213600 },
  { name: 'Negotiation', color: '#10b981', count: 52, value: 156000 },
  { name: 'Won', color: '#22c55e', count: 38, value: 114000 },
];

function currencyFmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
}

export function ConversionFunnelModal({ open, onClose }: ConversionFunnelModalProps) {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ytd'>('90d');
  const maxCount = MOCK_FUNNEL[0]?.count || 1;
  const overallRate = MOCK_FUNNEL.length > 1 ? ((MOCK_FUNNEL[MOCK_FUNNEL.length - 1].count / MOCK_FUNNEL[0].count) * 100) : 0;

  return (
    <Modal open={open} onClose={onClose} title="Conversion Funnel" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['30d', '90d', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary'
            )}>{p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'Year to Date'}</button>
          ))}
          <div className="flex-1" />
          <div className="text-right">
            <p className="text-xs text-th-text-tertiary">Overall Conversion</p>
            <p className={cn('text-lg font-bold', overallRate >= 10 ? 'text-green-500' : 'text-amber-500')}>{overallRate.toFixed(1)}%</p>
          </div>
        </div>

        {/* Visual funnel */}
        <div className="space-y-0">
          {MOCK_FUNNEL.map((stage, idx) => {
            const widthPct = (stage.count / maxCount) * 100;
            const prevCount = idx > 0 ? MOCK_FUNNEL[idx - 1].count : stage.count;
            const convRate = prevCount ? ((stage.count / prevCount) * 100).toFixed(0) : '100';
            const dropOff = prevCount - stage.count;

            return (
              <div key={stage.name}>
                {idx > 0 && (
                  <div className="flex items-center gap-2 py-1 px-4">
                    <ArrowDown className="w-3 h-3 text-th-text-tertiary" />
                    <span className="text-[10px] text-green-500 font-medium">{convRate}% converted</span>
                    {dropOff > 0 && <span className="text-[10px] text-red-500">({dropOff} lost)</span>}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-th-text-secondary w-24 text-right">{stage.name}</span>
                  <div className="flex-1 relative">
                    <div className="h-10 rounded-lg overflow-hidden flex items-center" style={{ width: `${Math.max(widthPct, 8)}%`, backgroundColor: stage.color + '20' }}>
                      <div className="h-full rounded-lg flex items-center px-3" style={{ width: '100%', backgroundColor: stage.color + '40' }}>
                        <span className="text-sm font-bold text-th-text-primary tabular-nums">{stage.count}</span>
                      </div>
                    </div>
                  </div>
                  {stage.value > 0 && (
                    <span className="text-xs text-th-text-tertiary w-16 text-right tabular-nums">{currencyFmt(stage.value)}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Conversion rates summary */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Top of Funnel', stages: 'New → Contacted', rate: ((MOCK_FUNNEL[1]?.count || 0) / (MOCK_FUNNEL[0]?.count || 1) * 100) },
            { label: 'Middle of Funnel', stages: 'Contacted → Proposal', rate: ((MOCK_FUNNEL[3]?.count || 0) / (MOCK_FUNNEL[1]?.count || 1) * 100) },
            { label: 'Bottom of Funnel', stages: 'Proposal → Won', rate: ((MOCK_FUNNEL[5]?.count || 0) / (MOCK_FUNNEL[3]?.count || 1) * 100) },
          ].map((s) => (
            <div key={s.label} className="p-3 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
              <p className="text-lg font-bold text-th-text-primary tabular-nums">{s.rate.toFixed(0)}%</p>
              <p className="text-[10px] text-th-text-tertiary">{s.stages}</p>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Funnel Insight</span>
          </div>
          <p className="text-xs text-th-text-secondary">Your biggest leak is <strong>New → Contacted</strong> (28% drop-off). Reducing first-contact time from 2.1 days to under 1 hour could recover ~27 leads/month.</p>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
