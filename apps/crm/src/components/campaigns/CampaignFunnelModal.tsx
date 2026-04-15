import { Modal } from '../Modal';
import { BarChart3, Sparkles } from 'lucide-react';
const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; }

const FUNNEL = [
  { stage: 'Impressions', count: 48200, pct: 100, color: '#94a3b8' },
  { stage: 'Clicks', count: 4820, pct: 10, color: '#3b82f6' },
  { stage: 'Leads Generated', count: 590, pct: 12.2, color: '#8b5cf6' },
  { stage: 'Qualified Leads', count: 354, pct: 60, color: '#f59e0b' },
  { stage: 'Quotes Sent', count: 186, pct: 52.5, color: '#10b981' },
  { stage: 'Conversions', count: 150, pct: 80.6, color: '#22c55e' },
];

const BY_CAMPAIGN = [
  { name: 'Google Ads', impressions: 22000, leads: 220, conversions: 42, rate: 19.1 },
  { name: 'Open Enrollment', impressions: 8500, leads: 142, conversions: 38, rate: 26.8 },
  { name: 'Health Fair', impressions: 4200, leads: 98, conversions: 24, rate: 24.5 },
  { name: 'LinkedIn', impressions: 9500, leads: 76, conversions: 18, rate: 23.7 },
  { name: 'Referral Bonus', impressions: 4000, leads: 54, conversions: 28, rate: 51.9 },
];

export function CampaignFunnelModal({ open, onClose }: Props) {
  const maxCount = FUNNEL[0].count;

  return (
    <Modal open={open} onClose={onClose} title="Campaign Funnel" size="xl">
      <div className="space-y-4">
        <div className="p-3 rounded-xl border border-th-border/50">
          <p className="text-xs font-semibold text-th-text-secondary mb-3">Overall Conversion Funnel</p>
          <div className="space-y-1">
            {FUNNEL.map((f, i) => (
              <div key={f.stage} className="flex items-center gap-2">
                <span className="text-[10px] text-th-text-tertiary w-28 shrink-0">{f.stage}</span>
                <div className="flex-1 h-7 rounded-lg bg-surface-tertiary overflow-hidden">
                  <div className="h-full rounded-lg flex items-center justify-between px-2.5" style={{ width: `${Math.max((f.count / maxCount) * 100, 8)}%`, backgroundColor: f.color + '30' }}>
                    <span className="text-[10px] font-bold text-th-text-primary tabular-nums">{f.count.toLocaleString()}</span>
                  </div>
                </div>
                {i > 0 && <span className="text-[9px] text-th-text-tertiary w-12 text-right tabular-nums">{f.pct}% ↓</span>}
              </div>
            ))}
          </div>
          <div className="mt-2 p-2 rounded-lg bg-green-500/10 text-center">
            <p className="text-[10px] text-green-600 font-medium">Overall: 48,200 impressions → 150 conversions = <strong>0.31% end-to-end rate</strong></p>
          </div>
        </div>

        <div className="rounded-xl border border-th-border/50 overflow-hidden">
          <div className="px-3 py-2 bg-surface-secondary/50"><p className="text-xs font-semibold text-th-text-secondary">Funnel by Campaign</p></div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-th-border/30">
              <th className="text-left px-3 py-1.5 text-th-text-tertiary font-medium">Campaign</th>
              <th className="text-right px-3 py-1.5 text-th-text-tertiary font-medium">Impressions</th>
              <th className="text-right px-3 py-1.5 text-th-text-tertiary font-medium">Leads</th>
              <th className="text-right px-3 py-1.5 text-th-text-tertiary font-medium">Conv</th>
              <th className="text-right px-3 py-1.5 text-th-text-tertiary font-medium">Rate</th>
            </tr></thead>
            <tbody>{BY_CAMPAIGN.map((c) => (
              <tr key={c.name} className="border-t border-th-border/20">
                <td className="px-3 py-2 font-medium text-th-text-primary">{c.name}</td>
                <td className="text-right px-3 py-2 tabular-nums text-th-text-secondary">{c.impressions.toLocaleString()}</td>
                <td className="text-right px-3 py-2 tabular-nums text-th-text-secondary">{c.leads}</td>
                <td className="text-right px-3 py-2 tabular-nums font-bold text-th-text-primary">{c.conversions}</td>
                <td className="text-right px-3 py-2 tabular-nums"><span className={cn('font-bold', c.rate >= 30 ? 'text-green-500' : c.rate >= 20 ? 'text-blue-500' : 'text-amber-500')}>{c.rate}%</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Funnel Insight</span></div>
          <p className="text-xs text-th-text-secondary">The biggest drop-off is <strong>Clicks → Leads</strong> (12.2%). Optimize landing pages to capture more visitors. <strong>Referral Bonus</strong> converts at 51.9% — your best funnel performer.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
