import { useState } from 'react';
import { Modal } from '../Modal';
import { GitBranch, Sparkles, DollarSign } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

type Model = 'first' | 'last' | 'linear' | 'decay';
const MODELS: { id: Model; name: string; desc: string }[] = [
  { id: 'first', name: 'First Touch', desc: '100% credit to first interaction' },
  { id: 'last', name: 'Last Touch', desc: '100% credit to closing interaction' },
  { id: 'linear', name: 'Linear', desc: 'Equal credit to all touchpoints' },
  { id: 'decay', name: 'Time Decay', desc: 'More credit to recent touches' },
];

const ATTRIBUTION: Record<Model, { channel: string; pct: number; revenue: number; color: string }[]> = {
  first: [
    { channel: 'Google Ads', pct: 38, revenue: 34200, color: '#ef4444' },
    { channel: 'Social Media', pct: 22, revenue: 19800, color: '#8b5cf6' },
    { channel: 'Referral', pct: 18, revenue: 16200, color: '#f59e0b' },
    { channel: 'Email', pct: 14, revenue: 12600, color: '#3b82f6' },
    { channel: 'Events', pct: 8, revenue: 7200, color: '#10b981' },
  ],
  last: [
    { channel: 'Email', pct: 32, revenue: 28800, color: '#3b82f6' },
    { channel: 'Referral', pct: 28, revenue: 25200, color: '#f59e0b' },
    { channel: 'Google Ads', pct: 20, revenue: 18000, color: '#ef4444' },
    { channel: 'Events', pct: 12, revenue: 10800, color: '#10b981' },
    { channel: 'Social Media', pct: 8, revenue: 7200, color: '#8b5cf6' },
  ],
  linear: [
    { channel: 'Google Ads', pct: 26, revenue: 23400, color: '#ef4444' },
    { channel: 'Email', pct: 24, revenue: 21600, color: '#3b82f6' },
    { channel: 'Referral', pct: 22, revenue: 19800, color: '#f59e0b' },
    { channel: 'Social Media', pct: 16, revenue: 14400, color: '#8b5cf6' },
    { channel: 'Events', pct: 12, revenue: 10800, color: '#10b981' },
  ],
  decay: [
    { channel: 'Email', pct: 30, revenue: 27000, color: '#3b82f6' },
    { channel: 'Referral', pct: 25, revenue: 22500, color: '#f59e0b' },
    { channel: 'Google Ads', pct: 22, revenue: 19800, color: '#ef4444' },
    { channel: 'Events', pct: 13, revenue: 11700, color: '#10b981' },
    { channel: 'Social Media', pct: 10, revenue: 9000, color: '#8b5cf6' },
  ],
};

export function CampaignAttributionModal({ open, onClose }: Props) {
  const [model, setModel] = useState<Model>('linear');
  const data = ATTRIBUTION[model];
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  return (
    <Modal open={open} onClose={onClose} title="Attribution Modeling" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-1.5">
          {MODELS.map((m) => (
            <button key={m.id} onClick={() => setModel(m.id)} className={cn('p-2 rounded-xl border text-left transition-all', model === m.id ? 'border-th-accent-500/30 bg-th-accent-500/5' : 'border-th-border/50')}>
              <p className="text-[10px] font-semibold text-th-text-primary">{m.name}</p>
              <p className="text-[8px] text-th-text-tertiary">{m.desc}</p>
            </button>
          ))}
        </div>

        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-2">Revenue Attribution ({MODELS.find((m) => m.id === model)?.name})</p>
          <div className="h-6 rounded-full bg-surface-tertiary overflow-hidden flex mb-2">
            {data.map((d) => (
              <div key={d.channel} className="h-full flex items-center justify-center" style={{ width: `${d.pct}%`, backgroundColor: d.color }}>
                {d.pct > 12 && <span className="text-[7px] font-bold text-white">{d.pct}%</span>}
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {data.map((d) => (
              <div key={d.channel} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs font-medium text-th-text-primary flex-1">{d.channel}</span>
                <div className="w-24 h-2 rounded bg-surface-tertiary overflow-hidden"><div className="h-full rounded" style={{ width: `${d.pct * 2.5}%`, backgroundColor: d.color }} /></div>
                <span className="text-[10px] font-bold text-th-text-primary tabular-nums w-8 text-right">{d.pct}%</span>
                <span className="text-[10px] text-th-text-tertiary tabular-nums w-16 text-right">{fmt(d.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Attribution Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Email</strong> is consistently the strongest closing channel (30-32% last/decay touch). <strong>Google Ads</strong> excels at awareness (38% first touch). Your funnel works: Ads attract, Email closes.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
