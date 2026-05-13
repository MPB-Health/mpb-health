import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Plus,
  Search,
  Loader2,
  X,
  Mail,
  Phone,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GradientHeader } from '@mpbhealth/ui';
import { PermissionGate } from '../../components/PermissionGate';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { formatTimeAgo } from '@mpbhealth/crm-core';

// ----------------------------------------------------------------------------
// CRM rebuild Phase 5 / Section 9 + Round 5 Addendum
// ----------------------------------------------------------------------------
// Recruiting list — clones LeadsList but reads from `crm_recruiting_records`
// and uses `crm_recruiting_pipeline_stages` for the 7 locked stages.
// Subsection bar mirrors Leads (All / Working / Nurture / LinkedIn / DNC).
// Daily Log auto-capture flows through `crm_activities` regardless of
// source, so logging a call/email/note on a recruiting record updates the
// rep's Daily Log v2 automatically.

type WorkflowTab = 'all' | 'working' | 'nurture' | 'linkedin' | 'do_not_contact';

interface RecruitingRecord {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  pipeline_stage: string;
  workflow_subsection: string;
  state: string | null;
  city: string | null;
  agency_affiliation: string | null;
  appointed_carriers: string[];
  license_number: string | null;
  npn: string | null;
  assigned_to: string | null;
  last_touched_at: string | null;
  last_contacted_at: string | null;
  stage_changed_at: string | null;
  created_at: string;
  do_not_contact: boolean;
  notes: string | null;
}

interface RecruitingStage {
  id: string;
  name: string;
  display_name: string;
  color: string;
  sort_order: number;
  is_terminal: boolean;
}

const SUBSECTION_TABS: { key: WorkflowTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'working', label: 'Working' },
  { key: 'nurture', label: 'Nurture' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'do_not_contact', label: 'Do Not Contact' },
];

const SUBSECTION_KEY = 'crm.recruiting.workflowTab';

export default function RecruitingList() {
  const queryClient = useQueryClient();
  const { activeOrgId } = useOrg();
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>(() => {
    if (typeof window === 'undefined') return 'all';
    return (window.localStorage.getItem(SUBSECTION_KEY) as WorkflowTab) || 'all';
  });
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SUBSECTION_KEY, workflowTab);
    }
  }, [workflowTab]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: stages = [] } = useQuery({
    queryKey: ['recruitingStages', activeOrgId],
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_recruiting_pipeline_stages')
        .select('*')
        .eq('org_id', activeOrgId!)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as RecruitingStage[];
    },
    staleTime: 60_000,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['recruitingRecords', activeOrgId, workflowTab],
    enabled: !!activeOrgId,
    queryFn: async () => {
      let query = supabase
        .from('crm_recruiting_records')
        .select('*')
        .eq('org_id', activeOrgId!)
        .order('last_touched_at', { ascending: false, nullsFirst: false });

      if (workflowTab !== 'all') {
        query = query.eq('workflow_subsection', workflowTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as RecruitingRecord[];
    },
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!searchTerm) return records;
    const needle = searchTerm.toLowerCase();
    return records.filter((r) => {
      const name = `${r.first_name} ${r.last_name}`.toLowerCase();
      return (
        name.includes(needle) ||
        (r.email ?? '').toLowerCase().includes(needle) ||
        (r.phone ?? '').toLowerCase().includes(needle) ||
        (r.npn ?? '').toLowerCase().includes(needle) ||
        (r.license_number ?? '').toLowerCase().includes(needle) ||
        (r.agency_affiliation ?? '').toLowerCase().includes(needle)
      );
    });
  }, [records, searchTerm]);

  const stageLabel = useMemo(() => {
    const m = new Map<string, RecruitingStage>();
    stages.forEach((s) => m.set(s.name, s));
    return m;
  }, [stages]);

  return (
    <PermissionGate permission="recruiting.read">
      <div className="space-y-6">
        <GradientHeader
          title="Recruiting"
          subtitle="Agent pipeline — Prospect → Active. Fully separate from Members and Leads."
          icon={<Briefcase className="w-5 h-5" />}
          size="sm"
          actions={
            <PermissionGate permission="recruiting.write">
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl text-sm font-medium hover:bg-th-accent-700"
              >
                <Plus className="w-4 h-4" /> New Recruit
              </button>
            </PermissionGate>
          }
        />

        {/* Subsection bar (mirrors Leads list) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 px-1">
          {SUBSECTION_TABS.map(({ key, label }) => {
            const active = workflowTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setWorkflowTab(key)}
                aria-pressed={active}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors text-center ${
                  active
                    ? 'bg-th-accent-600 border-th-accent-600 text-white shadow-sm'
                    : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-th-text-tertiary" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, email, phone, NPN, license, agency…"
              className="w-full pl-9 pr-3 py-2 border border-th-border rounded-lg text-sm bg-surface-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-surface-primary border border-th-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-th-text-tertiary">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Briefcase className="w-10 h-10 text-th-text-tertiary mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium text-th-text-primary">No recruits in this view</p>
              <p className="text-xs text-th-text-tertiary mt-1">
                Add an agent prospect to seed the pipeline.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary text-th-text-tertiary">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider">Stage</th>
                  <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider">Contact</th>
                  <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider">Agency</th>
                  <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider">License / NPN</th>
                  <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider whitespace-nowrap">Last Touched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {filtered.map((r) => {
                  const s = stageLabel.get(r.pipeline_stage);
                  return (
                    <tr key={r.id} className="hover:bg-surface-secondary/40">
                      <td className="px-6 py-3">
                        <Link
                          to={`/recruiting/${r.id}`}
                          className="font-medium text-th-text-primary hover:text-th-accent-700"
                        >
                          {r.first_name} {r.last_name}
                        </Link>
                        {r.do_not_contact && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider bg-red-50 text-red-700 px-1.5 py-0.5 rounded">
                            DNC
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: s ? `${s.color}1A` : 'var(--surface-secondary)',
                            color: s?.color ?? 'var(--th-text-secondary)',
                          }}
                        >
                          {s?.display_name ?? r.pipeline_stage}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-th-text-secondary">
                        <div className="flex items-center gap-3 text-xs">
                          {r.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {r.email}
                            </span>
                          )}
                          {r.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {r.phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-th-text-secondary text-xs">
                        {r.agency_affiliation ?? '—'}
                      </td>
                      <td className="px-6 py-3 text-th-text-tertiary text-xs">
                        {[r.license_number, r.npn].filter(Boolean).join(' / ') || '—'}
                      </td>
                      <td className="px-6 py-3 text-xs text-th-text-tertiary whitespace-nowrap">
                        {r.last_touched_at
                          ? formatTimeAgo(r.last_touched_at)
                          : r.last_contacted_at
                            ? formatTimeAgo(r.last_contacted_at)
                            : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {showCreate && (
          <CreateRecruitModal
            stages={stages}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              queryClient.invalidateQueries({ queryKey: ['recruitingRecords', activeOrgId] });
            }}
          />
        )}
      </div>
    </PermissionGate>
  );
}

function CreateRecruitModal({
  stages,
  onClose,
  onCreated,
}: {
  stages: RecruitingStage[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { activeOrgId } = useOrg();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState(stages[0]?.name ?? 'prospect');
  const [agency, setAgency] = useState('');
  const [npn, setNpn] = useState('');
  const [license, setLicense] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!activeOrgId) return;
    if (!first.trim() || !last.trim()) {
      toast.error('First + last name required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('crm_recruiting_records').insert({
      org_id: activeOrgId,
      first_name: first.trim(),
      last_name: last.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      pipeline_stage: stage,
      agency_affiliation: agency.trim() || null,
      npn: npn.trim() || null,
      license_number: license.trim() || null,
      stage_changed_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Recruit created');
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-surface-primary rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-th-border">
          <h2 className="text-base font-semibold text-th-text-primary">New Recruit</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded hover:bg-surface-secondary">
            <X className="w-4 h-4 text-th-text-secondary" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            placeholder="First name"
            className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
          />
          <input
            value={last}
            onChange={(e) => setLast(e.target.value)}
            placeholder="Last name"
            className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone"
            className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
          />
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="sm:col-span-2 border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
          >
            {stages.map((s) => (
              <option key={s.id} value={s.name}>
                {s.display_name}
              </option>
            ))}
          </select>
          <input
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
            placeholder="Agency affiliation"
            className="sm:col-span-2 border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
          />
          <input
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            placeholder="License #"
            className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
          />
          <input
            value={npn}
            onChange={(e) => setNpn(e.target.value)}
            placeholder="NPN"
            className="border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
          />
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-th-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium border border-th-border rounded-lg hover:bg-surface-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
