import { useState } from 'react';
import { Modal } from '../Modal';
import { Shield, PhoneOff, MailX, AlertTriangle, CheckCircle2, Users, Sparkles, TrendingUp } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ContactComplianceModalProps { open: boolean; onClose: () => void; }

const MOCK_STATS = {
  totalContacts: 522,
  dncCount: 34,
  dneCount: 28,
  bothCount: 12,
  optOutLast30: 8,
  tcpaConsent: 488,
  missingConsent: 34,
};

const MOCK_RECENT_OPTOUTS = [
  { name: 'Robert Chen', type: 'DNC', date: '2026-04-12', reason: 'Customer request via phone' },
  { name: 'Susan Thompson', type: 'DNE', date: '2026-04-10', reason: 'Email unsubscribe link' },
  { name: 'James Miller', type: 'Both', date: '2026-04-08', reason: 'Written request' },
  { name: 'Lisa Park', type: 'DNC', date: '2026-04-05', reason: 'Customer request via phone' },
  { name: 'Mark Evans', type: 'DNE', date: '2026-04-02', reason: 'Email unsubscribe link' },
];

export function ContactComplianceModal({ open, onClose }: ContactComplianceModalProps) {
  const [tab, setTab] = useState<'overview' | 'optouts'>('overview');
  const compliancePct = ((MOCK_STATS.tcpaConsent / MOCK_STATS.totalContacts) * 100).toFixed(1);

  return (
    <Modal open={open} onClose={onClose} title="Communication Compliance" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30 text-center">
            <Shield className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary">{compliancePct}%</p>
            <p className="text-[10px] text-th-text-tertiary">TCPA Compliant</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <PhoneOff className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_STATS.dncCount}</p>
            <p className="text-[10px] text-th-text-tertiary">Do Not Call</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-th-border/30 text-center">
            <MailX className="w-4 h-4 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_STATS.dneCount}</p>
            <p className="text-[10px] text-th-text-tertiary">Do Not Email</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_STATS.missingConsent}</p>
            <p className="text-[10px] text-th-text-tertiary">Missing Consent</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-th-border/50">
          {[{ id: 'overview' as const, label: 'Compliance Overview' }, { id: 'optouts' as const, label: `Recent Opt-Outs (${MOCK_RECENT_OPTOUTS.length})` }].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary'
            )}>{t.label}</button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-3">
            {[
              { label: 'TCPA Consent on File', count: MOCK_STATS.tcpaConsent, total: MOCK_STATS.totalContacts, color: 'bg-green-500', icon: CheckCircle2, iconColor: 'text-green-500' },
              { label: 'Do Not Call Registered', count: MOCK_STATS.dncCount, total: MOCK_STATS.totalContacts, color: 'bg-red-500', icon: PhoneOff, iconColor: 'text-red-500' },
              { label: 'Do Not Email Registered', count: MOCK_STATS.dneCount, total: MOCK_STATS.totalContacts, color: 'bg-orange-500', icon: MailX, iconColor: 'text-orange-500' },
              { label: 'Both DNC + DNE', count: MOCK_STATS.bothCount, total: MOCK_STATS.totalContacts, color: 'bg-red-600', icon: AlertTriangle, iconColor: 'text-red-600' },
            ].map((stat) => {
              const pct = ((stat.count / stat.total) * 100).toFixed(1);
              return (
                <div key={stat.label} className="flex items-center gap-3 p-3 rounded-xl border border-th-border/50">
                  <stat.icon className={cn('w-5 h-5 shrink-0', stat.iconColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-th-text-primary">{stat.label}</span>
                      <span className="text-xs font-bold text-th-text-primary tabular-nums">{stat.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-surface-tertiary overflow-hidden">
                      <div className={cn('h-full rounded-full', stat.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">Action Required</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{MOCK_STATS.missingConsent} contacts are missing TCPA consent documentation. Review and update before next outreach campaign.</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'optouts' && (
          <div className="max-h-[280px] overflow-y-auto space-y-1.5">
            {MOCK_RECENT_OPTOUTS.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl border border-th-border/30">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  opt.type === 'DNC' ? 'bg-red-500/10' : opt.type === 'DNE' ? 'bg-orange-500/10' : 'bg-red-600/10')}>
                  {opt.type === 'DNC' ? <PhoneOff className="w-3.5 h-3.5 text-red-500" /> :
                   opt.type === 'DNE' ? <MailX className="w-3.5 h-3.5 text-orange-500" /> :
                   <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-th-text-primary">{opt.name}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold',
                      opt.type === 'DNC' ? 'bg-red-500/10 text-red-500' : opt.type === 'DNE' ? 'bg-orange-500/10 text-orange-500' : 'bg-red-600/10 text-red-600'
                    )}>{opt.type}</span>
                  </div>
                  <p className="text-[10px] text-th-text-tertiary">{opt.reason} • {opt.date}</p>
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
