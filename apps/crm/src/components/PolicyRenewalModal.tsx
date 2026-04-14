import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  RefreshCw, Calendar, AlertTriangle, CheckCircle2, Clock, ArrowRight,
  Bell, Mail, Phone, FileText, DollarSign, TrendingUp, TrendingDown,
  ChevronDown, ChevronRight, Shield, Zap, Send,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

type PolicyStatus = 'active' | 'renewal_due' | 'expired' | 'lapsed' | 'pending';
type RenewalAction = 'renew_same' | 'switch_plan' | 'cancel' | 'pending_review';

interface Policy {
  id: string;
  policyNumber: string;
  clientName: string;
  planName: string;
  carrier: string;
  planType: string;
  status: PolicyStatus;
  effectiveDate: string;
  expirationDate: string;
  monthlyPremium: number;
  newPremium?: number;
  premiumChange?: number;
  deductible: number;
  agentOfRecord: string;
  renewalAction?: RenewalAction;
  lastContactDate?: string;
  remindersSent: number;
  notes?: string;
}

interface PolicyRenewalModalProps {
  open: boolean;
  onClose: () => void;
  policies?: Policy[];
  onSetAction?: (policyId: string, action: RenewalAction) => Promise<void>;
  onSendReminder?: (policyId: string, channel: 'email' | 'sms' | 'call') => Promise<void>;
  onBulkRemind?: (policyIds: string[]) => Promise<void>;
}

const STATUS_CONFIG: Record<PolicyStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
  renewal_due: { label: 'Renewal Due', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  expired: { label: 'Expired', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  lapsed: { label: 'Lapsed', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  pending: { label: 'Pending', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
};

const SAMPLE_POLICIES: Policy[] = [
  { id: '1', policyNumber: 'MA-2025-10421', clientName: 'James Wilson', planName: 'Aetna MA PPO', carrier: 'Aetna', planType: 'Medicare Advantage', status: 'renewal_due', effectiveDate: '2025-01-01', expirationDate: '2025-12-31', monthlyPremium: 0, newPremium: 12, premiumChange: 12, deductible: 250, agentOfRecord: 'Agent Smith', remindersSent: 1, lastContactDate: '2026-03-15' },
  { id: '2', policyNumber: 'MS-2025-08334', clientName: 'Mary Johnson', planName: 'BCBS Plan G', carrier: 'BCBS', planType: 'Medicare Supplement', status: 'renewal_due', effectiveDate: '2025-04-01', expirationDate: '2026-03-31', monthlyPremium: 145, newPremium: 162, premiumChange: 17, deductible: 0, agentOfRecord: 'Agent Smith', remindersSent: 0 },
  { id: '3', policyNumber: 'ACA-2026-15672', clientName: 'Robert Chen', planName: 'UHC Silver PPO', carrier: 'UHC', planType: 'ACA Marketplace', status: 'active', effectiveDate: '2026-01-01', expirationDate: '2026-12-31', monthlyPremium: 320, deductible: 3000, agentOfRecord: 'Agent Smith', remindersSent: 0 },
  { id: '4', policyNumber: 'MA-2025-09821', clientName: 'Dorothy Harris', planName: 'Humana Gold HMO', carrier: 'Humana', planType: 'Medicare Advantage', status: 'expired', effectiveDate: '2025-01-01', expirationDate: '2025-12-31', monthlyPremium: 15, deductible: 0, agentOfRecord: 'Agent Smith', remindersSent: 3, lastContactDate: '2026-01-10' },
];

function daysUntil(dateStr: string) {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PolicyRenewalModal({
  open, onClose, policies: propPolicies, onSetAction, onSendReminder, onBulkRemind,
}: PolicyRenewalModalProps) {
  const policies = propPolicies && propPolicies.length > 0 ? propPolicies : SAMPLE_POLICIES;
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'renewal_due' | 'expired'>('all');
  const [sending, setSending] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return policies;
    return policies.filter((p) => p.status === filter);
  }, [policies, filter]);

  const stats = useMemo(() => ({
    total: policies.length,
    renewalDue: policies.filter((p) => p.status === 'renewal_due').length,
    expired: policies.filter((p) => p.status === 'expired' || p.status === 'lapsed').length,
    active: policies.filter((p) => p.status === 'active').length,
    totalPremium: policies.reduce((sum, p) => sum + p.monthlyPremium, 0),
    atRiskPremium: policies.filter((p) => p.status === 'renewal_due' || p.status === 'expired').reduce((sum, p) => sum + p.monthlyPremium, 0),
  }), [policies]);

  const handleReminder = async (policyId: string, channel: 'email' | 'sms' | 'call') => {
    setSending(policyId);
    try {
      await onSendReminder?.(policyId, channel);
    } catch { /* parent handles */ }
    finally { setSending(null); }
  };

  const renewalDueIds = policies.filter((p) => p.status === 'renewal_due').map((p) => p.id);

  return (
    <Modal open={open} onClose={onClose} title="Policy Renewal Engine" size="2xl">
      <div className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total Policies', value: stats.total, icon: Shield, color: 'text-blue-500', bg: 'from-blue-500/10 to-sky-500/10' },
            { label: 'Renewals Due', value: stats.renewalDue, icon: RefreshCw, color: 'text-amber-500', bg: 'from-amber-500/10 to-yellow-500/10' },
            { label: 'Expired/Lapsed', value: stats.expired, icon: AlertTriangle, color: 'text-red-500', bg: 'from-red-500/10 to-rose-500/10' },
            { label: 'At-Risk Premium', value: `$${stats.atRiskPremium}/mo`, icon: DollarSign, color: 'text-violet-500', bg: 'from-violet-500/10 to-purple-500/10' },
          ].map((s) => (
            <div key={s.label} className={cn('p-3 rounded-xl bg-gradient-to-br border border-th-border/30', s.bg)}>
              <s.icon className={cn('w-4 h-4 mb-1', s.color)} />
              <p className="text-lg font-bold text-th-text-primary tabular-nums">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters & bulk actions */}
        <div className="flex items-center gap-2">
          {(['all', 'renewal_due', 'expired'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === f ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary hover:text-th-text-secondary'
            )}>
              {f === 'all' ? 'All' : f === 'renewal_due' ? 'Renewal Due' : 'Expired'}
            </button>
          ))}
          <div className="flex-1" />
          {renewalDueIds.length > 0 && (
            <button onClick={() => onBulkRemind?.(renewalDueIds)} className="flex items-center gap-1.5 text-xs font-medium text-th-accent-500 hover:text-th-accent-600 transition-colors">
              <Send className="w-3.5 h-3.5" /> Remind All ({renewalDueIds.length})
            </button>
          )}
        </div>

        {/* Policy timeline */}
        <div className="max-h-[360px] overflow-y-auto space-y-2">
          {filtered.map((policy) => {
            const statusCfg = STATUS_CONFIG[policy.status];
            const days = daysUntil(policy.expirationDate);
            const expanded = expandedPolicy === policy.id;
            const premiumUp = (policy.premiumChange ?? 0) > 0;
            return (
              <div key={policy.id} className={cn('rounded-xl border transition-all', expanded ? 'border-th-accent-500/30' : 'border-th-border/50')}>
                <button onClick={() => setExpandedPolicy(expanded ? null : policy.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary/30 transition-colors">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', statusCfg.bg)}>
                    {policy.status === 'renewal_due' ? <RefreshCw className={cn('w-4 h-4', statusCfg.color)} /> :
                     policy.status === 'expired' ? <AlertTriangle className={cn('w-4 h-4', statusCfg.color)} /> :
                     <CheckCircle2 className={cn('w-4 h-4', statusCfg.color)} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-th-text-primary">{policy.clientName}</span>
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', statusCfg.color, statusCfg.bg)}>{statusCfg.label}</span>
                    </div>
                    <p className="text-xs text-th-text-tertiary">{policy.carrier} · {policy.planName} · {policy.policyNumber}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-th-text-primary tabular-nums">${policy.monthlyPremium}/mo</p>
                    {policy.premiumChange !== undefined && (
                      <p className={cn('text-[10px] flex items-center justify-end gap-0.5', premiumUp ? 'text-red-500' : 'text-green-500')}>
                        {premiumUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {premiumUp ? '+' : ''}{currencyFmt(policy.premiumChange)}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {days > 0 ? (
                      <span className={cn('text-[10px] font-medium px-2 py-1 rounded-full tabular-nums',
                        days <= 30 ? 'text-red-600 dark:text-red-400 bg-red-500/10' :
                        days <= 60 ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10' :
                        'text-th-text-tertiary bg-surface-tertiary'
                      )}>
                        {days}d left
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-1 rounded-full text-red-600 dark:text-red-400 bg-red-500/10 tabular-nums">
                        {Math.abs(days)}d ago
                      </span>
                    )}
                  </div>
                  {expanded ? <ChevronDown className="w-4 h-4 text-th-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-th-text-tertiary" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-th-border/30 space-y-3">
                    <div className="grid grid-cols-4 gap-3 text-xs">
                      <div><span className="text-th-text-tertiary">Effective</span><br /><strong className="text-th-text-primary">{formatDate(policy.effectiveDate)}</strong></div>
                      <div><span className="text-th-text-tertiary">Expiration</span><br /><strong className="text-th-text-primary">{formatDate(policy.expirationDate)}</strong></div>
                      <div><span className="text-th-text-tertiary">Deductible</span><br /><strong className="text-th-text-primary tabular-nums">${policy.deductible}</strong></div>
                      <div><span className="text-th-text-tertiary">Reminders Sent</span><br /><strong className="text-th-text-primary tabular-nums">{policy.remindersSent}</strong></div>
                    </div>
                    {policy.newPremium !== undefined && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          Premium changing from <strong>${policy.monthlyPremium}</strong> to <strong>${policy.newPremium}</strong>/mo (+${policy.premiumChange})
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-th-text-tertiary">Send reminder:</span>
                      {[
                        { channel: 'email' as const, icon: Mail, label: 'Email' },
                        { channel: 'sms' as const, icon: Phone, label: 'SMS' },
                        { channel: 'call' as const, icon: Phone, label: 'Schedule Call' },
                      ].map((ch) => (
                        <button key={ch.channel} onClick={() => handleReminder(policy.id, ch.channel)}
                          disabled={sending === policy.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-th-border text-xs text-th-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50">
                          <ch.icon className="w-3 h-3" /> {ch.label}
                        </button>
                      ))}
                      <div className="flex-1" />
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-accent text-white text-xs font-medium">
                        <Zap className="w-3 h-3" /> Start Renewal
                      </button>
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

function currencyFmt(n: number) {
  return `$${Math.abs(n).toLocaleString()}`;
}
