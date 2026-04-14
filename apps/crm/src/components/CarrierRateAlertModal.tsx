import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import {
  Bell, TrendingUp, TrendingDown, AlertTriangle, Shield, Filter,
  ChevronDown, ChevronRight, Calendar, DollarSign, Users, MapPin,
  Eye, Check, Clock, RefreshCw, ExternalLink, Minus,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

type AlertSeverity = 'critical' | 'warning' | 'info';
type ChangeType = 'rate_increase' | 'rate_decrease' | 'plan_added' | 'plan_removed' | 'network_change' | 'formulary_change' | 'benefit_change';

interface CarrierAlert {
  id: string;
  carrier: string;
  planName: string;
  changeType: ChangeType;
  severity: AlertSeverity;
  description: string;
  effectiveDate: string;
  previousValue?: string;
  newValue?: string;
  affectedClients: number;
  region: string;
  acknowledged: boolean;
  date: string;
}

interface CarrierRateAlertModalProps {
  open: boolean;
  onClose: () => void;
  alerts?: CarrierAlert[];
  onAcknowledge?: (alertId: string) => Promise<void>;
  onNotifyClients?: (alertId: string) => Promise<void>;
}

const CHANGE_CONFIG: Record<ChangeType, { label: string; icon: React.ElementType; color: string }> = {
  rate_increase: { label: 'Rate Increase', icon: TrendingUp, color: 'text-red-500' },
  rate_decrease: { label: 'Rate Decrease', icon: TrendingDown, color: 'text-green-500' },
  plan_added: { label: 'New Plan', icon: Shield, color: 'text-blue-500' },
  plan_removed: { label: 'Plan Discontinued', icon: AlertTriangle, color: 'text-red-500' },
  network_change: { label: 'Network Change', icon: Users, color: 'text-amber-500' },
  formulary_change: { label: 'Formulary Update', icon: RefreshCw, color: 'text-violet-500' },
  benefit_change: { label: 'Benefit Change', icon: Shield, color: 'text-cyan-500' },
};

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  warning: { label: 'Warning', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  info: { label: 'Info', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
};

const MOCK_ALERTS: CarrierAlert[] = [
  { id: '1', carrier: 'Aetna', planName: 'Aetna MA PPO', changeType: 'rate_increase', severity: 'critical', description: 'Monthly premium increasing from $0 to $12/month for 2027 plan year.', effectiveDate: '2027-01-01', previousValue: '$0/mo', newValue: '$12/mo', affectedClients: 47, region: 'Florida', acknowledged: false, date: '2026-04-12' },
  { id: '2', carrier: 'UnitedHealthcare', planName: 'AARP MA HMO', changeType: 'network_change', severity: 'warning', description: 'Orlando Health system leaving network effective July 1. Patients will need to transition to in-network providers.', effectiveDate: '2026-07-01', affectedClients: 12, region: 'Orlando, FL', acknowledged: false, date: '2026-04-10' },
  { id: '3', carrier: 'Humana', planName: 'Gold Plus HMO', changeType: 'formulary_change', severity: 'warning', description: 'Tier 3 copay increasing from $40 to $47 for non-preferred generics. Atorvastatin moved to Tier 2.', effectiveDate: '2026-07-01', previousValue: '$40', newValue: '$47', affectedClients: 8, region: 'Florida', acknowledged: true, date: '2026-04-08' },
  { id: '4', carrier: 'BCBS', planName: 'Plan G', changeType: 'rate_increase', severity: 'warning', description: 'Annual rate adjustment: 6.2% increase for 65-69 age bracket in Orange County.', effectiveDate: '2026-07-01', previousValue: '$145/mo', newValue: '$154/mo', affectedClients: 15, region: 'Orange County, FL', acknowledged: false, date: '2026-04-05' },
  { id: '5', carrier: 'Cigna', planName: 'Cigna Secure RX', changeType: 'plan_removed', severity: 'critical', description: 'Plan being discontinued for 2027. Members must choose new Part D coverage during AEP.', effectiveDate: '2027-01-01', affectedClients: 5, region: 'Nationwide', acknowledged: false, date: '2026-04-01' },
  { id: '6', carrier: 'Mutual of Omaha', planName: 'Plan N', changeType: 'rate_decrease', severity: 'info', description: 'Competitive rate reduction: 3.5% decrease for new enrollees under age 70.', effectiveDate: '2026-05-01', previousValue: '$98/mo', newValue: '$95/mo', affectedClients: 0, region: 'Florida', acknowledged: true, date: '2026-03-28' },
  { id: '7', carrier: 'Aetna', planName: 'Medicare PPO', changeType: 'benefit_change', severity: 'info', description: 'New OTC allowance increased from $50/quarter to $75/quarter starting Q3 2026.', effectiveDate: '2026-07-01', previousValue: '$50/qtr', newValue: '$75/qtr', affectedClients: 47, region: 'Florida', acknowledged: true, date: '2026-03-25' },
];

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function CarrierRateAlertModal({
  open, onClose, alerts: propAlerts, onAcknowledge, onNotifyClients,
}: CarrierRateAlertModalProps) {
  const alerts = propAlerts || MOCK_ALERTS;
  const [filterSeverity, setFilterSeverity] = useState<'all' | AlertSeverity>('all');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set(alerts.filter((a) => a.acknowledged).map((a) => a.id)));

  const filtered = useMemo(() => {
    let result = alerts;
    if (filterSeverity !== 'all') result = result.filter((a) => a.severity === filterSeverity);
    return result.sort((a, b) => {
      const sev = { critical: 0, warning: 1, info: 2 };
      if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [alerts, filterSeverity]);

  const stats = useMemo(() => ({
    critical: alerts.filter((a) => a.severity === 'critical' && !acknowledged.has(a.id)).length,
    warning: alerts.filter((a) => a.severity === 'warning' && !acknowledged.has(a.id)).length,
    totalAffected: new Set(alerts.flatMap(() => [])).size,
    affectedClients: alerts.reduce((s, a) => s + a.affectedClients, 0),
  }), [alerts, acknowledged]);

  const handleAcknowledge = async (id: string) => {
    await onAcknowledge?.(id);
    setAcknowledged((prev) => new Set([...prev, id]));
  };

  return (
    <Modal open={open} onClose={onClose} title="Carrier Rate & Change Alerts" size="2xl">
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30">
            <AlertTriangle className="w-4 h-4 text-red-500 mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{stats.critical}</p>
            <p className="text-[10px] text-th-text-tertiary">Critical Alerts</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30">
            <Bell className="w-4 h-4 text-amber-500 mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{stats.warning}</p>
            <p className="text-[10px] text-th-text-tertiary">Warnings</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-sky-500/10 border border-th-border/30">
            <Users className="w-4 h-4 text-blue-500 mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{stats.affectedClients}</p>
            <p className="text-[10px] text-th-text-tertiary">Affected Clients</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-th-border/30">
            <Check className="w-4 h-4 text-green-500 mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{acknowledged.size}/{alerts.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Acknowledged</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {(['all', 'critical', 'warning', 'info'] as const).map((f) => (
            <button key={f} onClick={() => setFilterSeverity(f)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filterSeverity === f ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary hover:text-th-text-secondary'
            )}>
              {f === 'all' ? 'All' : SEVERITY_CONFIG[f].label}
            </button>
          ))}
        </div>

        {/* Alert list */}
        <div className="max-h-[320px] overflow-y-auto space-y-2">
          {filtered.map((alert) => {
            const changeCfg = CHANGE_CONFIG[alert.changeType];
            const sevCfg = SEVERITY_CONFIG[alert.severity];
            const ChangeIcon = changeCfg.icon;
            const expanded = expandedAlert === alert.id;
            const isAcked = acknowledged.has(alert.id);

            return (
              <div key={alert.id} className={cn('rounded-xl border transition-all', isAcked ? 'border-th-border/30 opacity-60' : sevCfg.bg)}>
                <button onClick={() => setExpandedAlert(expanded ? null : alert.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary/20 transition-colors">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', sevCfg.bg)}>
                    <ChangeIcon className={cn('w-4 h-4', changeCfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-th-text-primary">{alert.carrier}</span>
                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', changeCfg.color, `bg-current/10`)}>{changeCfg.label}</span>
                      {isAcked && <Check className="w-3 h-3 text-green-500" />}
                    </div>
                    <p className="text-xs text-th-text-tertiary truncate">{alert.planName} · {alert.description.slice(0, 60)}...</p>
                  </div>
                  <div className="text-right shrink-0">
                    {alert.previousValue && alert.newValue && (
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-th-text-tertiary line-through">{alert.previousValue}</span>
                        <Minus className="w-2 h-2 text-th-text-tertiary" />
                        <span className={cn('font-medium', changeCfg.color)}>{alert.newValue}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-th-text-tertiary">{alert.affectedClients} clients</p>
                  </div>
                  {expanded ? <ChevronDown className="w-4 h-4 text-th-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-th-text-tertiary" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-th-border/30 space-y-3">
                    <p className="text-xs text-th-text-secondary leading-relaxed">{alert.description}</p>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div><span className="text-th-text-tertiary">Effective</span><br /><strong className="text-th-text-primary">{formatDate(alert.effectiveDate)}</strong></div>
                      <div><span className="text-th-text-tertiary">Region</span><br /><strong className="text-th-text-primary">{alert.region}</strong></div>
                      <div><span className="text-th-text-tertiary">Reported</span><br /><strong className="text-th-text-primary">{formatDate(alert.date)}</strong></div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isAcked && (
                        <button onClick={() => handleAcknowledge(alert.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-th-border text-xs font-medium text-th-text-secondary hover:bg-surface-secondary">
                          <Check className="w-3 h-3" /> Acknowledge
                        </button>
                      )}
                      {alert.affectedClients > 0 && (
                        <button onClick={() => onNotifyClients?.(alert.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg gradient-accent text-white text-xs font-medium">
                          <Bell className="w-3 h-3" /> Notify {alert.affectedClients} Clients
                        </button>
                      )}
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
