import { useState } from 'react';
import { Modal } from './Modal';
import {
  Users, Plus, Trash2, Heart, Shield, AlertTriangle, TrendingUp,
  User, Baby, ChevronDown, ChevronRight, Edit3, Save, DollarSign,
  Calendar, Pill, Sparkles, Check,
} from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface FamilyMember {
  id: string;
  name: string;
  relation: 'self' | 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  age: number;
  dateOfBirth: string;
  gender: 'male' | 'female';
  hasCoverage: boolean;
  planName?: string;
  carrier?: string;
  monthlyPremium?: number;
  healthConditions: string[];
  medications: string[];
  tobaccoUse: boolean;
  crossSellOpportunity?: string;
}

interface HouseholdManagerModalProps {
  open: boolean;
  onClose: () => void;
  primaryName: string;
  leadId?: string;
  members?: FamilyMember[];
  onSave?: (members: FamilyMember[]) => Promise<void>;
}

const RELATIONS = [
  { value: 'self', label: 'Self (Primary)' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
];

const RELATION_ICONS: Record<string, React.ElementType> = {
  self: User, spouse: Heart, child: Baby, parent: Users, sibling: Users, other: User,
};

const MOCK_MEMBERS: FamilyMember[] = [
  { id: '1', name: 'James Wilson', relation: 'self', age: 66, dateOfBirth: '1959-06-15', gender: 'male', hasCoverage: true, planName: 'Aetna MA PPO', carrier: 'Aetna', monthlyPremium: 0, healthConditions: ['Diabetes', 'High BP'], medications: ['Metformin', 'Lisinopril'], tobaccoUse: false },
  { id: '2', name: 'Margaret Wilson', relation: 'spouse', age: 64, dateOfBirth: '1961-11-20', gender: 'female', hasCoverage: false, healthConditions: ['Arthritis'], medications: ['Ibuprofen'], tobaccoUse: false, crossSellOpportunity: 'Turning 65 in November — Medicare eligible!' },
  { id: '3', name: 'David Wilson', relation: 'child', age: 38, dateOfBirth: '1987-03-08', gender: 'male', hasCoverage: true, planName: 'Employer BCBS', carrier: 'BCBS', healthConditions: [], medications: [], tobaccoUse: false },
  { id: '4', name: 'Emily Wilson', relation: 'child', age: 32, dateOfBirth: '1993-09-12', gender: 'female', hasCoverage: false, healthConditions: [], medications: [], tobaccoUse: false, crossSellOpportunity: 'ACA marketplace plan — subsidy eligible' },
];

export function HouseholdManagerModal({
  open, onClose, primaryName, leadId, members: propMembers, onSave,
}: HouseholdManagerModalProps) {
  const [members, setMembers] = useState<FamilyMember[]>(propMembers || MOCK_MEMBERS);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addMember = () => {
    const newMember: FamilyMember = {
      id: String(Date.now()), name: '', relation: 'spouse', age: 0,
      dateOfBirth: '', gender: 'female', hasCoverage: false,
      healthConditions: [], medications: [], tobaccoUse: false,
    };
    setMembers((prev) => [...prev, newMember]);
    setExpandedMember(newMember.id);
  };

  const removeMember = (id: string) => setMembers((prev) => prev.filter((m) => m.id !== id));

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, ...updates } : m));
  };

  const stats = {
    total: members.length,
    covered: members.filter((m) => m.hasCoverage).length,
    uncovered: members.filter((m) => !m.hasCoverage).length,
    crossSellOpps: members.filter((m) => m.crossSellOpportunity).length,
    totalPremium: members.reduce((s, m) => s + (m.monthlyPremium || 0), 0),
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave?.(members); onClose(); }
    catch { /* parent handles */ }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Household Manager — ${primaryName}`} size="2xl">
      <div className="space-y-4">
        {/* Household summary */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-blue-500/20">
          {/* Visual family tree */}
          <div className="flex items-center gap-2 shrink-0">
            {members.slice(0, 5).map((m, i) => {
              const Icon = RELATION_ICONS[m.relation] || User;
              return (
                <div key={m.id} className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2',
                  m.hasCoverage ? 'border-green-500 bg-green-500/10' : 'border-amber-500 bg-amber-500/10',
                  i > 0 && '-ml-2'
                )} style={{ zIndex: 5 - i }}>
                  <Icon className={cn('w-4 h-4', m.hasCoverage ? 'text-green-500' : 'text-amber-500')} />
                </div>
              );
            })}
            {members.length > 5 && (
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-tertiary border-2 border-th-border -ml-2 text-xs font-bold text-th-text-secondary">
                +{members.length - 5}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-th-text-primary">{stats.total} household members</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-th-text-tertiary">
              <span className="flex items-center gap-1 text-green-500"><Shield className="w-3 h-3" />{stats.covered} covered</span>
              {stats.uncovered > 0 && <span className="flex items-center gap-1 text-amber-500"><AlertTriangle className="w-3 h-3" />{stats.uncovered} uninsured</span>}
              {stats.crossSellOpps > 0 && <span className="flex items-center gap-1 text-violet-500"><TrendingUp className="w-3 h-3" />{stats.crossSellOpps} opportunities</span>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-th-text-primary tabular-nums">${stats.totalPremium}/mo</p>
            <p className="text-[10px] text-th-text-tertiary">household premium</p>
          </div>
        </div>

        {/* Members list */}
        <div className="max-h-[380px] overflow-y-auto space-y-2">
          {members.map((member) => {
            const expanded = expandedMember === member.id;
            const Icon = RELATION_ICONS[member.relation] || User;
            return (
              <div key={member.id} className={cn('rounded-xl border transition-all', expanded ? 'border-th-accent-500/30' : 'border-th-border/50')}>
                <button onClick={() => setExpandedMember(expanded ? null : member.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary/30 transition-colors">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                    member.hasCoverage ? 'bg-green-500/10' : 'bg-amber-500/10'
                  )}>
                    <Icon className={cn('w-4 h-4', member.hasCoverage ? 'text-green-500' : 'text-amber-500')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-th-text-primary">{member.name || '(New Member)'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-tertiary text-th-text-tertiary capitalize">{member.relation}</span>
                      {member.relation === 'self' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500">Primary</span>}
                    </div>
                    <p className="text-xs text-th-text-tertiary">Age {member.age} · {member.gender === 'male' ? 'M' : 'F'}{member.hasCoverage ? ` · ${member.planName}` : ' · No coverage'}</p>
                  </div>
                  {member.crossSellOpportunity && (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full shrink-0">
                      <Sparkles className="w-3 h-3" /> Opportunity
                    </span>
                  )}
                  {expanded ? <ChevronDown className="w-4 h-4 text-th-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-th-text-tertiary" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-th-border/30 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-th-text-tertiary">Full Name</label>
                        <input type="text" value={member.name} onChange={(e) => updateMember(member.id, { name: e.target.value })}
                          className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] text-th-text-tertiary">Relation</label>
                        <select value={member.relation} onChange={(e) => updateMember(member.id, { relation: e.target.value as FamilyMember['relation'] })}
                          className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none">
                          {RELATIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-th-text-tertiary">Date of Birth</label>
                        <input type="date" value={member.dateOfBirth} onChange={(e) => {
                          const dob = e.target.value;
                          const age = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / 31557600000) : 0;
                          updateMember(member.id, { dateOfBirth: dob, age });
                        }}
                          className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-th-text-tertiary">Coverage Status</label>
                        <button onClick={() => updateMember(member.id, { hasCoverage: !member.hasCoverage })}
                          className={cn('w-full text-sm rounded-lg border px-2.5 py-1.5 font-medium transition-all text-left',
                            member.hasCoverage ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400' : 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          )}>{member.hasCoverage ? 'Covered' : 'No Coverage'}</button>
                      </div>
                      {member.hasCoverage && (
                        <div>
                          <label className="text-[10px] text-th-text-tertiary">Plan Name</label>
                          <input type="text" value={member.planName || ''} onChange={(e) => updateMember(member.id, { planName: e.target.value })}
                            className="w-full text-sm rounded-lg border border-th-border/50 bg-surface-primary px-2.5 py-1.5 focus:border-th-accent-500/50 focus:outline-none" />
                        </div>
                      )}
                    </div>

                    {member.crossSellOpportunity && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">{member.crossSellOpportunity}</p>
                      </div>
                    )}

                    {member.healthConditions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {member.healthConditions.map((c) => (
                          <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400">{c}</span>
                        ))}
                      </div>
                    )}

                    {member.relation !== 'self' && (
                      <button onClick={() => removeMember(member.id)} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Remove member
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={addMember} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">
            <Plus className="w-4 h-4" /> Add Member
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-th-border text-sm font-medium text-th-text-secondary hover:bg-surface-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl gradient-accent text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Household'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
