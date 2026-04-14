import { useState } from 'react';
import { Modal } from '../Modal';
import { AlertTriangle, Clock, Phone, Mail, MessageSquare, ArrowRight, Sparkles, User, Zap, TrendingDown } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface StuckLead {
  id: string; name: string; email: string; phone?: string;
  stage: string; stageColor: string;
  daysInStage: number; lastActivity: string; lastActivityType: string;
  riskLevel: 'critical' | 'high' | 'medium';
  suggestedAction: string;
}

interface StuckLeadAlertModalProps { open: boolean; onClose: () => void; onNavigateToLead?: (id: string) => void; }

const MOCK_STUCK: StuckLead[] = [
  { id: '1', name: 'Patricia Moore', email: 'patricia@example.com', phone: '555-0101', stage: 'Qualified', stageColor: '#f59e0b', daysInStage: 22, lastActivity: '2026-03-25', lastActivityType: 'Email sent', riskLevel: 'critical', suggestedAction: 'Direct phone call — no response to last 3 emails' },
  { id: '2', name: 'David Brown', email: 'dbrown@example.com', phone: '555-0102', stage: 'Qualified', stageColor: '#f59e0b', daysInStage: 18, lastActivity: '2026-03-29', lastActivityType: 'Voicemail', riskLevel: 'high', suggestedAction: 'Try SMS — voicemails not being returned' },
  { id: '3', name: 'Robert Chen', email: 'rchen@example.com', stage: 'Contacted', stageColor: '#8b5cf6', daysInStage: 15, lastActivity: '2026-04-01', lastActivityType: 'Email opened', riskLevel: 'high', suggestedAction: 'Send a rate comparison — they opened last email' },
  { id: '4', name: 'Jennifer White', email: 'jwhite@example.com', phone: '555-0104', stage: 'Negotiation', stageColor: '#10b981', daysInStage: 16, lastActivity: '2026-03-30', lastActivityType: 'Meeting', riskLevel: 'medium', suggestedAction: 'Follow up on pending document requests' },
  { id: '5', name: 'Susan Thompson', email: 'sthompson@example.com', phone: '555-0105', stage: 'Proposal', stageColor: '#ef4444', daysInStage: 12, lastActivity: '2026-04-03', lastActivityType: 'Proposal viewed', riskLevel: 'medium', suggestedAction: 'Proposal was viewed 3x — schedule a close call' },
  { id: '6', name: 'James Miller', email: 'jmiller@example.com', stage: 'Contacted', stageColor: '#8b5cf6', daysInStage: 14, lastActivity: '2026-04-02', lastActivityType: 'Call attempt', riskLevel: 'medium', suggestedAction: 'Email with compelling subject line' },
];

const RISK_CONFIG = {
  critical: { color: 'text-red-600 bg-red-500/10 border-red-500/30', badge: 'bg-red-500 text-white', label: 'Critical' },
  high: { color: 'text-orange-600 bg-orange-500/10 border-orange-500/30', badge: 'bg-orange-500 text-white', label: 'High' },
  medium: { color: 'text-amber-600 bg-amber-500/10 border-amber-500/30', badge: 'bg-amber-500 text-white', label: 'Medium' },
};

export function StuckLeadAlertModal({ open, onClose, onNavigateToLead }: StuckLeadAlertModalProps) {
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  const filtered = riskFilter === 'all' ? MOCK_STUCK : MOCK_STUCK.filter((l) => l.riskLevel === riskFilter);
  const criticalCount = MOCK_STUCK.filter((l) => l.riskLevel === 'critical').length;
  const highCount = MOCK_STUCK.filter((l) => l.riskLevel === 'high').length;

  return (
    <Modal open={open} onClose={onClose} title="Stuck Lead Alerts" size="xl">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-th-border/30 text-center">
            <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{MOCK_STUCK.length}</p>
            <p className="text-[10px] text-th-text-tertiary">Total Stuck</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-600/10 to-red-500/10 border border-th-border/30 text-center">
            <TrendingDown className="w-4 h-4 text-red-600 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{criticalCount}</p>
            <p className="text-[10px] text-th-text-tertiary">Critical Risk</p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-th-border/30 text-center">
            <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-th-text-primary tabular-nums">{Math.round(MOCK_STUCK.reduce((s, l) => s + l.daysInStage, 0) / MOCK_STUCK.length)}d</p>
            <p className="text-[10px] text-th-text-tertiary">Avg Days Stuck</p>
          </div>
        </div>

        <div className="flex gap-1">
          {(['all', 'critical', 'high', 'medium'] as const).map((r) => (
            <button key={r} onClick={() => setRiskFilter(r)} className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              riskFilter === r ? 'bg-th-accent-500/10 text-th-accent-500 border border-th-accent-500/30' : 'text-th-text-tertiary border border-transparent'
            )}>{r === 'all' ? `All (${MOCK_STUCK.length})` : `${r.charAt(0).toUpperCase() + r.slice(1)} (${MOCK_STUCK.filter((l) => l.riskLevel === r).length})`}</button>
          ))}
        </div>

        <div className="max-h-[320px] overflow-y-auto space-y-2">
          {filtered.map((lead) => (
            <div key={lead.id} className={cn('p-3 rounded-xl border', RISK_CONFIG[lead.riskLevel].color)}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-tertiary flex items-center justify-center text-xs font-bold text-th-text-primary shrink-0">
                  {lead.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-th-text-primary">{lead.name}</span>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-bold', RISK_CONFIG[lead.riskLevel].badge)}>{RISK_CONFIG[lead.riskLevel].label}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-th-text-tertiary">
                    <span className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: lead.stageColor + '15', color: lead.stageColor }}>
                      {lead.stage}
                    </span>
                    <span>{lead.daysInStage}d in stage</span>
                    <span>Last: {lead.lastActivityType}</span>
                  </div>
                  <div className="mt-1.5 flex items-start gap-1">
                    <Sparkles className="w-3 h-3 text-violet-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-th-text-secondary">{lead.suggestedAction}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {lead.phone && (
                    <button className="w-7 h-7 rounded-lg border border-th-border/50 flex items-center justify-center hover:bg-surface-secondary">
                      <Phone className="w-3 h-3 text-th-text-tertiary" />
                    </button>
                  )}
                  <button className="w-7 h-7 rounded-lg border border-th-border/50 flex items-center justify-center hover:bg-surface-secondary">
                    <Mail className="w-3 h-3 text-th-text-tertiary" />
                  </button>
                  <button onClick={() => onNavigateToLead?.(lead.id)}
                    className="w-7 h-7 rounded-lg border border-th-border/50 flex items-center justify-center hover:bg-surface-secondary">
                    <ArrowRight className="w-3 h-3 text-th-text-tertiary" />
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
