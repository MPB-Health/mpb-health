import { useState } from 'react';
import { Modal } from './Modal';
import {
  User, Phone, Mail, MapPin, Shield, Heart, Calendar, FileText,
  DollarSign, Clock, MessageSquare, TrendingUp, Activity, Star,
  ChevronRight, ExternalLink, Pill, Stethoscope, AlertTriangle,
  CheckCircle2, Users, Eye,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ClientPolicy {
  id: string;
  planName: string;
  carrier: string;
  status: 'active' | 'renewal_due' | 'expired';
  monthlyPremium: number;
  effectiveDate: string;
  expirationDate: string;
}

interface ClientActivity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  description: string;
  date: string;
  user: string;
}

interface ClientData {
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  leadScore: number;
  lifetimeValue: number;
  firstContactDate: string;
  lastContactDate: string;
  totalInteractions: number;
  pipelineStage: string;
  assignedAgent: string;
  tags: string[];
  healthConditions: string[];
  medications: string[];
  familyMembers: { name: string; relation: string; age: number; hasCoverage: boolean }[];
  policies: ClientPolicy[];
  recentActivity: ClientActivity[];
  satisfactionScore: number;
  referralSource: string;
  notes: string;
}

interface Client360ModalProps {
  open: boolean;
  onClose: () => void;
  client?: ClientData;
  leadId?: string;
}

const MOCK_CLIENT: ClientData = {
  name: 'James Wilson', email: 'james.wilson@email.com', phone: '(407) 555-1234',
  address: '1234 Oak St, Orlando, FL 32801', dateOfBirth: '1959-06-15', age: 66, gender: 'Male',
  leadScore: 87, lifetimeValue: 4800, firstContactDate: '2025-08-10', lastContactDate: '2026-04-10',
  totalInteractions: 42, pipelineStage: 'Qualified', assignedAgent: 'Agent Smith', tags: ['Medicare', 'High Value', 'Referral'],
  healthConditions: ['Diabetes Type 2', 'High Blood Pressure'],
  medications: ['Metformin 500mg', 'Lisinopril 10mg', 'Atorvastatin 20mg'],
  familyMembers: [
    { name: 'Margaret Wilson', relation: 'Spouse', age: 64, hasCoverage: false },
    { name: 'David Wilson', relation: 'Son', age: 38, hasCoverage: true },
  ],
  policies: [
    { id: '1', planName: 'Aetna MA PPO', carrier: 'Aetna', status: 'active', monthlyPremium: 0, effectiveDate: '2026-01-01', expirationDate: '2026-12-31' },
    { id: '2', planName: 'Delta Dental PPO', carrier: 'Delta Dental', status: 'active', monthlyPremium: 35, effectiveDate: '2026-01-01', expirationDate: '2026-12-31' },
  ],
  recentActivity: [
    { id: '1', type: 'call', description: 'Discussed renewal options for 2027', date: '2026-04-10T14:30:00', user: 'Agent Smith' },
    { id: '2', type: 'email', description: 'Sent plan comparison document', date: '2026-04-08T09:15:00', user: 'Agent Smith' },
    { id: '3', type: 'meeting', description: 'Annual review meeting', date: '2026-03-15T10:00:00', user: 'Agent Smith' },
    { id: '4', type: 'note', description: 'Client interested in adding spouse to MA plan', date: '2026-03-15T10:45:00', user: 'Agent Smith' },
    { id: '5', type: 'task', description: 'Follow up on spouse enrollment', date: '2026-04-01T00:00:00', user: 'Agent Smith' },
  ],
  satisfactionScore: 92, referralSource: 'Dr. Sarah Mitchell', notes: 'Long-term client, very engaged. Spouse turning 65 in June — cross-sell opportunity.',
};

const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  call: { icon: Phone, color: 'text-green-500' },
  email: { icon: Mail, color: 'text-cyan-500' },
  meeting: { icon: Calendar, color: 'text-amber-500' },
  note: { icon: FileText, color: 'text-violet-500' },
  task: { icon: CheckCircle2, color: 'text-blue-500' },
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-500 bg-green-500/10',
  renewal_due: 'text-amber-500 bg-amber-500/10',
  expired: 'text-red-500 bg-red-500/10',
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function Client360Modal({ open, onClose, client: propClient, leadId }: Client360ModalProps) {
  const client = propClient || MOCK_CLIENT;
  const [tab, setTab] = useState<'overview' | 'health' | 'policies' | 'activity'>('overview');

  const totalPremium = client.policies.filter((p) => p.status === 'active').reduce((s, p) => s + p.monthlyPremium, 0);
  const crossSellOpps = client.familyMembers.filter((f) => !f.hasCoverage);

  return (
    <Modal open={open} onClose={onClose} title="Client 360" size="2xl">
      <div className="space-y-4">
        {/* Client header */}
        <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-white">{client.name.split(' ').map((n) => n[0]).join('')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-th-text-primary">{client.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-th-text-tertiary flex-wrap">
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{client.address}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {client.tags.map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-th-accent-500/10 text-th-accent-500 font-medium">{t}</span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0 space-y-1">
            <div className="w-12 h-12 rounded-full border-3 border-th-accent-500 flex items-center justify-center mx-auto">
              <span className="text-sm font-bold text-th-accent-500 tabular-nums">{client.leadScore}</span>
            </div>
            <p className="text-[10px] text-th-text-tertiary">Lead Score</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Lifetime Value', value: `$${client.lifetimeValue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500' },
            { label: 'Active Policies', value: client.policies.filter((p) => p.status === 'active').length, icon: Shield, color: 'text-blue-500' },
            { label: 'Monthly Premium', value: `$${totalPremium}`, icon: DollarSign, color: 'text-amber-500' },
            { label: 'Interactions', value: client.totalInteractions, icon: Activity, color: 'text-violet-500' },
            { label: 'Satisfaction', value: `${client.satisfactionScore}%`, icon: Star, color: 'text-amber-500' },
          ].map((s) => (
            <div key={s.label} className="p-2 rounded-xl bg-surface-secondary/50 border border-th-border/30 text-center">
              <s.icon className={cn('w-3.5 h-3.5 mx-auto mb-0.5', s.color)} />
              <p className="text-sm font-bold text-th-text-primary tabular-nums">{s.value}</p>
              <p className="text-[10px] text-th-text-tertiary">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-th-border/50">
          {[
            { id: 'overview' as const, label: 'Overview', icon: Eye },
            { id: 'health' as const, label: 'Health Profile', icon: Heart },
            { id: 'policies' as const, label: 'Policies', icon: Shield },
            { id: 'activity' as const, label: 'Activity', icon: Activity },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px',
              tab === t.id ? 'border-th-accent-500 text-th-accent-500' : 'border-transparent text-th-text-tertiary hover:text-th-text-secondary'
            )}><t.icon className="w-3.5 h-3.5" /> {t.label}</button>
          ))}
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-th-text-secondary">Demographics</p>
                  {[
                    { label: 'Date of Birth', value: formatDate(client.dateOfBirth) },
                    { label: 'Age', value: `${client.age} years old` },
                    { label: 'Gender', value: client.gender },
                    { label: 'Pipeline Stage', value: client.pipelineStage },
                    { label: 'Assigned Agent', value: client.assignedAgent },
                    { label: 'Referral Source', value: client.referralSource },
                  ].map((f) => (
                    <div key={f.label} className="flex justify-between text-xs">
                      <span className="text-th-text-tertiary">{f.label}</span>
                      <span className="text-th-text-primary font-medium">{f.value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-th-text-secondary mb-2">Family / Household</p>
                    {client.familyMembers.map((fm, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5">
                        <Users className="w-3.5 h-3.5 text-th-text-tertiary" />
                        <span className="text-xs text-th-text-primary flex-1">{fm.name} ({fm.relation}, {fm.age})</span>
                        {fm.hasCoverage ? (
                          <span className="text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">Covered</span>
                        ) : (
                          <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">No Coverage</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {crossSellOpps.length > 0 && (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {crossSellOpps.length} cross-sell {crossSellOpps.length === 1 ? 'opportunity' : 'opportunities'}
                      </p>
                    </div>
                  )}
                  {client.notes && (
                    <div className="p-2 rounded-xl bg-surface-secondary border border-th-border/30">
                      <p className="text-[10px] font-semibold text-th-text-tertiary uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-xs text-th-text-secondary">{client.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'health' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-th-text-secondary mb-2 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-red-500" /> Health Conditions</p>
                <div className="flex flex-wrap gap-2">
                  {client.healthConditions.length > 0 ? client.healthConditions.map((c) => (
                    <span key={c} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-xs font-medium text-red-600 dark:text-red-400">
                      <AlertTriangle className="w-3 h-3" />{c}
                    </span>
                  )) : <span className="text-xs text-th-text-tertiary">No conditions reported</span>}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-th-text-secondary mb-2 flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-violet-500" /> Current Medications</p>
                <div className="flex flex-wrap gap-2">
                  {client.medications.length > 0 ? client.medications.map((m) => (
                    <span key={m} className="px-2.5 py-1.5 rounded-lg bg-violet-500/10 text-xs font-medium text-violet-600 dark:text-violet-400">{m}</span>
                  )) : <span className="text-xs text-th-text-tertiary">No medications reported</span>}
                </div>
              </div>
            </div>
          )}

          {tab === 'policies' && (
            <div className="space-y-2">
              {client.policies.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-th-border/50">
                  <Shield className={cn('w-5 h-5 shrink-0', STATUS_COLORS[p.status]?.split(' ')[0])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-th-text-primary">{p.planName}</p>
                    <p className="text-xs text-th-text-tertiary">{p.carrier} · {formatDate(p.effectiveDate)} — {formatDate(p.expirationDate)}</p>
                  </div>
                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize', STATUS_COLORS[p.status])}>{p.status.replace('_', ' ')}</span>
                  <span className="text-sm font-bold text-th-text-primary tabular-nums">${p.monthlyPremium}/mo</span>
                </div>
              ))}
            </div>
          )}

          {tab === 'activity' && (
            <div className="space-y-1">
              {client.recentActivity.map((a) => {
                const cfg = ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.note;
                const Icon = cfg.icon;
                return (
                  <div key={a.id} className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-surface-secondary/50 transition-colors">
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-current/10', cfg.color)}>
                      <Icon className={cn('w-3 h-3', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-th-text-primary">{a.description}</p>
                      <p className="text-[10px] text-th-text-tertiary mt-0.5">{a.user} · {formatDate(a.date)} {formatTime(a.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Close</button>
        </div>
      </div>
    </Modal>
  );
}
