import { useState } from 'react';
import { Modal } from '../Modal';
import { AlertTriangle, Shield, TrendingDown, Clock, Phone, Mail, Building2, Sparkles, CheckCircle2 } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface AtRiskAccount {
  id: string; name: string; riskScore: number; riskLevel: 'critical' | 'high' | 'medium';
  factors: string[]; lastContact: string; revenue: number; suggestedAction: string;
}
interface AccountRiskModalProps { open: boolean; onClose: () => void; onNavigateToAccount?: (id: string) => void; }

const MOCK_AT_RISK: AtRiskAccount[] = [
  { id: '1', name: 'Senior Care Alliance', riskScore: 88, riskLevel: 'critical', factors: ['No contact in 45 days', 'Revenue declining 19%', 'Key contact left'], lastContact: '2026-03-01', revenue: 198000, suggestedAction: 'Emergency outreach — schedule executive call this week' },
  { id: '2', name: 'National Health Plan', riskScore: 76, riskLevel: 'high', factors: ['Revenue down 19.5%', 'Support tickets increased', 'Contract renewal in 60 days'], lastContact: '2026-03-28', revenue: 118000, suggestedAction: 'Prepare renewal proposal with competitive pricing' },
  { id: '3', name: 'Medicare Solutions Inc', riskScore: 62, riskLevel: 'high', factors: ['Engagement declining', 'Growth score critical', 'Competitor activity detected'], lastContact: '2026-04-02', revenue: 256000, suggestedAction: 'Schedule a value review meeting with decision maker' },
  { id: '4', name: 'Valley Care Group', riskScore: 45, riskLevel: 'medium', factors: ['Low product adoption', 'Infrequent touchpoints'], lastContact: '2026-04-05', revenue: 82000, suggestedAction: 'Send personalized usage report and schedule training' },
];

const RISK_CONFIG = {
  critical: { color: 'text-red-600 bg-red-500/10 border-red-500/30', badge: 'bg-red-500 text-white' },
  high: { color: 'text-orange-600 bg-orange-500/10 border-orange-500/30', badge: 'bg-orange-500 text-white' },
  medium: { color: 'text-amber-600 bg-amber-500/10 border-amber-500/30', badge: 'bg-amber-500 text-white' },
};

function currencyFmt(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`; }

export function AccountRiskModal({ open, onClose, onNavigateToAccount }: AccountRiskModalProps) {
  const totalAtRisk = MOCK_AT_RISK.reduce((s, a) => s + a.revenue, 0);
  const criticalCount = MOCK_AT_RISK.filter((a) => a.riskLevel === 'critical').length;

  return (
    <Modal open={open} onClose={onClose} title="Account Churn Risk" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_AT_RISK.length}</p>
            <p className="text-[10px] text-th-text-tertiary">At-Risk Accounts</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-600/10 to-red-500/10 border border-th-border/30 text-center">
            <Shield className="w-4 h-4 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{criticalCount}</p>
            <p className="text-[10px] text-th-text-tertiary">Critical Risk</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <TrendingDown className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{currencyFmt(totalAtRisk)}</p>
            <p className="text-[10px] text-th-text-tertiary">Revenue at Risk</p>
          </div>
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-2">
          {MOCK_AT_RISK.map((acct) => (
            <div key={acct.id} className={cn('p-3 rounded-xl border', RISK_CONFIG[acct.riskLevel].color)}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-tertiary flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-th-text-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-th-text-primary">{acct.name}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', RISK_CONFIG[acct.riskLevel].badge)}>
                      {acct.riskLevel.toUpperCase()} — {acct.riskScore}
                    </span>
                    <span className="text-[10px] text-green-500 font-medium ml-auto">{currencyFmt(acct.revenue)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {acct.factors.map((f) => (
                      <span key={f} className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-secondary">{f}</span>
                    ))}
                  </div>
                  <div className="mt-1.5 flex items-start gap-1">
                    <Sparkles className="w-3 h-3 text-violet-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-th-text-secondary">{acct.suggestedAction}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0 mt-1">
                  <button className="w-7 h-7 rounded-lg border border-th-border/50 flex items-center justify-center hover:bg-surface-secondary">
                    <Phone className="w-3 h-3 text-th-text-tertiary" />
                  </button>
                  <button className="w-7 h-7 rounded-lg border border-th-border/50 flex items-center justify-center hover:bg-surface-secondary">
                    <Mail className="w-3 h-3 text-th-text-tertiary" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
