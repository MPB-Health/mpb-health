import { useState } from 'react';
import { Modal } from '../Modal';
import { BarChart3, Mail, Globe, Calendar, Video, Megaphone, UserPlus, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const CHANNELS = [
  { type: 'email', label: 'Email', icon: Mail, campaigns: 8, leads: 312, conversions: 82, spend: 6200, cpl: 20, roi: 310, color: '#3b82f6' },
  { type: 'social', label: 'Social Media', icon: Globe, campaigns: 4, leads: 156, conversions: 36, spend: 4800, cpl: 31, roi: 248, color: '#8b5cf6' },
  { type: 'event', label: 'Events', icon: Calendar, campaigns: 3, leads: 198, conversions: 48, spend: 15000, cpl: 76, roi: 164, color: '#10b981' },
  { type: 'webinar', label: 'Webinars', icon: Video, campaigns: 2, leads: 84, conversions: 22, spend: 1800, cpl: 21, roi: 386, color: '#f59e0b' },
  { type: 'advertisement', label: 'Ads', icon: Megaphone, campaigns: 5, leads: 420, conversions: 68, spend: 18000, cpl: 43, roi: 192, color: '#ef4444' },
  { type: 'referral', label: 'Referral', icon: UserPlus, campaigns: 3, leads: 108, conversions: 56, spend: 5400, cpl: 50, roi: 420, color: '#06b6d4' },
];

export function CampaignChannelModal({ open, onClose }: Props) {
  const [sort, setSort] = useState<'roi' | 'leads' | 'cpl'>('roi');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const sorted = [...CHANNELS].sort((a, b) => sort === 'roi' ? b.roi - a.roi : sort === 'leads' ? b.leads - a.leads : a.cpl - b.cpl);
  const maxVal = Math.max(...CHANNELS.map((c) => sort === 'roi' ? c.roi : sort === 'leads' ? c.leads : c.cpl), 1);

  return (
    <Modal open={open} onClose={onClose} title="Channel Performance" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-th-text-tertiary">Sort by:</span>
          {(['roi', 'leads', 'cpl'] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all uppercase', sort === s ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{s}</button>
          ))}
        </div>

        <div className="space-y-2">
          {sorted.map((ch) => {
            const convRate = Math.round((ch.conversions / ch.leads) * 100);
            const barVal = sort === 'roi' ? ch.roi : sort === 'leads' ? ch.leads : ch.cpl;
            return (
              <div key={ch.type} className="p-3 rounded-xl border border-th-border/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ch.color + '20' }}>
                    <ch.icon className="w-4 h-4" style={{ color: ch.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-th-text-primary">{ch.label}</span>
                    <span className="text-[9px] text-th-text-tertiary ml-2">{ch.campaigns} campaigns</span>
                  </div>
                  <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', ch.roi >= 350 ? 'bg-green-500/10 text-green-500' : ch.roi >= 200 ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500')}>{ch.roi}% ROI</span>
                </div>
                <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden mb-2">
                  <div className="h-full rounded-full" style={{ width: `${(barVal / maxVal) * 100}%`, backgroundColor: ch.color }} />
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{ch.leads}</p><p className="text-[7px] text-th-text-tertiary">Leads</p></div>
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{ch.conversions}</p><p className="text-[7px] text-th-text-tertiary">Conv</p></div>
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{convRate}%</p><p className="text-[7px] text-th-text-tertiary">Rate</p></div>
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(ch.spend)}</p><p className="text-[7px] text-th-text-tertiary">Spend</p></div>
                  <div><p className="text-[10px] font-bold text-th-text-primary tabular-nums">{fmt(ch.cpl)}</p><p className="text-[7px] text-th-text-tertiary">CPL</p></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Channel Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Referral</strong> delivers 420% ROI with 52% conversion — your top channel. <strong>Email</strong> has the lowest CPL at $20. Consider shifting 20% of ad budget to email + referral.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
