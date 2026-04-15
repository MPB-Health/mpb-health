import { useState } from 'react';
import { Modal } from '../Modal';
import { BarChart3, Users, DollarSign, TrendingUp, Target, Sparkles } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');
interface Props { open: boolean; onClose: () => void; totalCampaigns: number; activeCampaigns: number; totalBudget: number; }

const CAMPAIGNS = [
  { name: 'Open Enrollment Q2', type: 'email', leads: 142, conversions: 38, budget: 4500, spent: 3800, roi: 284, color: '#3b82f6' },
  { name: 'Health Fair 2026', type: 'event', leads: 98, conversions: 24, budget: 8000, spent: 7200, roi: 186, color: '#10b981' },
  { name: 'LinkedIn Outreach', type: 'social', leads: 76, conversions: 18, budget: 2500, spent: 2100, roi: 342, color: '#8b5cf6' },
  { name: 'Referral Bonus May', type: 'referral', leads: 54, conversions: 28, budget: 3000, spent: 2800, roi: 420, color: '#f59e0b' },
  { name: 'Google Ads — Plans', type: 'advertisement', leads: 220, conversions: 42, budget: 12000, spent: 10500, roi: 198, color: '#ef4444' },
];

export function CampaignAnalyticsModal({ open, onClose, totalCampaigns, activeCampaigns, totalBudget }: Props) {
  const [period, setPeriod] = useState<'30d' | '90d' | 'ytd'>('90d');
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const totalLeads = CAMPAIGNS.reduce((s, c) => s + c.leads, 0);
  const totalConversions = CAMPAIGNS.reduce((s, c) => s + c.conversions, 0);
  const totalSpent = CAMPAIGNS.reduce((s, c) => s + c.spent, 0);
  const avgRoi = Math.round(CAMPAIGNS.reduce((s, c) => s + c.roi, 0) / CAMPAIGNS.length);
  const maxLeads = Math.max(...CAMPAIGNS.map((c) => c.leads), 1);

  return (
    <Modal open={open} onClose={onClose} title="Campaign Analytics" size="xl">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {(['30d', '90d', 'ytd'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', period === p ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary')}>{p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'Year to Date'}</button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total Leads', value: totalLeads.toLocaleString(), icon: Users, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Conversions', value: totalConversions.toLocaleString(), icon: Target, color: 'text-green-500', bg: 'from-green-500/10 to-emerald-500/10' },
            { label: 'Total Spent', value: fmt(totalSpent), icon: DollarSign, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
            { label: 'Avg ROI', value: `${avgRoi}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-sm font-bold text-th-text-primary truncate">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {CAMPAIGNS.map((c) => (
            <div key={c.name} className="p-3 rounded-xl border border-th-border/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-8 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-th-text-primary truncate">{c.name}</span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-tertiary capitalize shrink-0">{c.type}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0', c.roi >= 300 ? 'bg-green-500/10 text-green-500' : c.roi >= 200 ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500')}>{c.roi}% ROI</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(c.leads / maxLeads) * 100}%`, backgroundColor: c.color }} />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center shrink-0">
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{c.leads}</p><p className="text-[8px] text-th-text-tertiary">Leads</p></div>
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{c.conversions}</p><p className="text-[8px] text-th-text-tertiary">Conv</p></div>
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{fmt(c.spent)}</p><p className="text-[8px] text-th-text-tertiary">Spent</p></div>
                  <div><p className="text-xs font-bold text-th-text-primary tabular-nums">{Math.round((c.conversions / c.leads) * 100)}%</p><p className="text-[8px] text-th-text-tertiary">Rate</p></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Campaign Insight</span></div>
          <p className="text-xs text-th-text-secondary"><strong>Referral Bonus</strong> delivers the highest ROI at 420% with a 52% conversion rate. <strong>Google Ads</strong> generates the most leads but at a lower conversion rate — optimize landing pages.</p>
        </div>

        <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
      </div>
    </Modal>
  );
}
