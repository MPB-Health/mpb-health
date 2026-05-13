import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2, Clock, FileSpreadsheet, Plus, Send, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useCRM } from '../../contexts/CRMContext';
import { PermissionGate } from '../PermissionGate';
import { supabase } from '../../lib/supabase';
import type { Lead } from '@mpbhealth/crm-core';

type QuoteRow = {
  id: string;
  plan_name: string;
  plan_structure: string | null;
  monthly_price: number | null;
  quote_date: string;
};

type TimeRow = {
  id: string;
  source: string;
  duration_seconds: number;
  description: string | null;
  occurred_at: string;
};

// Section 2 (LinkedIn subsection) + Round 3 — funnel-status values. Spec
// says "etc." so the list is open-ended; these are the canonical states.
const LI_STATUSES = [
  'Connection Request Sent',
  'Connected',
  'Profile Viewed',
  'Message Sent',
  'Replied',
  'Followed Up',
  'InMail Sent',
  'Booked Call',
  'No Response',
];

export function LeadMpWorkflowPanel({ lead, onRefresh }: { lead: Lead; onRefresh: () => void }) {
  const { user } = useAuth();
  const { leadService } = useCRM();
  const queryClient = useQueryClient();

  const [qPlan, setQPlan] = useState('');
  const [qStruct, setQStruct] = useState('');
  const [qPrice, setQPrice] = useState('');
  const [tMinutes, setTMinutes] = useState('');
  const [tNote, setTNote] = useState('');

  const { data: quotes = [] } = useQuery({
    queryKey: ['crmLeadQuotes', lead.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_lead_quote_history')
        .select('id, plan_name, plan_structure, monthly_price, quote_date')
        .eq('lead_id', lead.id)
        .order('quote_date', { ascending: false });
      if (error) throw error;
      return (data || []) as QuoteRow[];
    },
    enabled: !!lead.id,
  });

  const { data: times = [] } = useQuery({
    queryKey: ['crmLeadTime', lead.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_lead_time_entries')
        .select('id, source, duration_seconds, description, occurred_at')
        .eq('lead_id', lead.id)
        .order('occurred_at', { ascending: false });
      if (error) throw error;
      return (data || []) as TimeRow[];
    },
    enabled: !!lead.id,
  });

  const totalMinutes = Math.round(
    times.reduce((a, t) => a + t.duration_seconds, 0) / 60
  );

  const handleMarkLost = async () => {
    if (!confirm('Mark this lead as Lost and move them to Do Not Contact?')) return;
    const r = await leadService.updateLead(lead.id, {
      pipeline_stage: 'lost',
      lost_reason: 'rep_manual_verbal_opt_out',
      do_not_contact: true,
    });
    if (r.success) {
      toast.success('Lead marked as lost');
      onRefresh();
    } else toast.error(r.error || 'Failed');
  };

  const handleMarkQuoteSent = async () => {
    const { error } = await supabase.rpc('crm_mark_preliminary_quote_sent', {
      p_lead_id: lead.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Quote logged — lead moved to Quoted, cadence started');
    onRefresh();
  };

  const handleMarkEnrolled = async () => {
    if (!confirm('Mark enrollment as approved and hand off to concierge?')) return;
    const { error } = await supabase.rpc('crm_apply_enrollment_won', {
      p_lead_id: lead.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Enrollment recorded — concierge handoff timestamped');
    onRefresh();
  };

  const canMarkQuoted = lead.pipeline_stage === 'new' || lead.pipeline_stage === 'working';
  const canMarkEnrolled =
    lead.pipeline_stage === 'application_in_progress' ||
    lead.pipeline_stage === 'engaged' ||
    lead.pipeline_stage === 'quoted';

  // CRM rebuild Phase 3 / Section 13 — manual cadence enrollment from the
  // lead profile. Available cadences come from the same org; the RPC is
  // idempotent so re-enrolling a lead resumes a paused cadence.
  const cadencesForOrg = useQuery({
    queryKey: ['crmLeadProfileCadences', lead.org_id],
    enabled: !!lead.org_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_follow_up_cadences')
        .select('id, name, schema_version, is_active')
        .eq('org_id', lead.org_id!)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const handleEnrollInCadence = async (cadenceId: string) => {
    const { error } = await supabase.rpc('crm_enroll_lead_in_cadence', {
      p_lead_id: lead.id,
      p_cadence_id: cadenceId,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Enrolled in cadence');
    onRefresh();
  };

  const handleSubsection = async (v: string) => {
    const r = await leadService.updateLead(lead.id, {
      workflow_subsection: v as Lead['workflow_subsection'],
    });
    if (r.success) {
      toast.success('Subsection updated');
      onRefresh();
    } else toast.error(r.error || 'Failed');
  };

  const handleLiStatus = async (v: string) => {
    const r = await leadService.updateLead(lead.id, { linkedin_workflow_status: v });
    if (r.success) {
      toast.success('LinkedIn status saved');
      onRefresh();
    } else toast.error(r.error || 'Failed');
  };

  const addQuote = async () => {
    if (!qPlan.trim()) {
      toast.error('Plan name required');
      return;
    }
    if (!lead.org_id) {
      toast.error('Lead has no org');
      return;
    }
    const { error } = await supabase.from('crm_lead_quote_history').insert({
      org_id: lead.org_id,
      lead_id: lead.id,
      plan_name: qPlan.trim(),
      plan_structure: qStruct.trim() || null,
      monthly_price: qPrice ? parseFloat(qPrice) : null,
      created_by: user?.id ?? null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setQPlan('');
    setQStruct('');
    setQPrice('');
    queryClient.invalidateQueries({ queryKey: ['crmLeadQuotes', lead.id] });
    toast.success('Quote saved');
  };

  const addTime = async () => {
    const mins = parseInt(tMinutes, 10);
    if (!Number.isFinite(mins) || mins <= 0) {
      toast.error('Enter minutes (positive number)');
      return;
    }
    if (!lead.org_id) {
      toast.error('Lead has no org');
      return;
    }
    const { error } = await supabase.from('crm_lead_time_entries').insert({
      org_id: lead.org_id,
      lead_id: lead.id,
      user_id: user?.id ?? null,
      source: 'manual',
      duration_seconds: mins * 60,
      description: tNote.trim() || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setTMinutes('');
    setTNote('');
    queryClient.invalidateQueries({ queryKey: ['crmLeadTime', lead.id] });
    toast.success('Time logged');
  };

  return (
    <div className="bg-surface-primary rounded-2xl border border-th-border p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-th-text-primary">Pipeline &amp; workflow</h2>
          <p className="text-xs text-th-text-tertiary mt-0.5">
            Subsections, LinkedIn status, concierge handoff
          </p>
        </div>
        <PermissionGate permission="leads.update">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleMarkQuoteSent}
              disabled={!canMarkQuoted}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-40"
              title="Move to Quoted and kick off the Quote-Response cadence"
            >
              <Send className="w-4 h-4" />
              Mark quote sent
            </button>
            <button
              type="button"
              onClick={handleMarkEnrolled}
              disabled={!canMarkEnrolled}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
              title="Mark enrolled — Won and concierge handoff"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark enrolled
            </button>
            <button
              type="button"
              onClick={handleMarkLost}
              disabled={lead.pipeline_stage === 'lost'}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40"
            >
              <Ban className="w-4 h-4" />
              Mark as lost
            </button>
            {/* CRM rebuild Phase 3 / Section 13 — manual cadence enrollment */}
            {(cadencesForOrg.data ?? []).length > 0 && (
              <div className="relative">
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      handleEnrollInCadence(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-th-accent-200 text-th-accent-700 bg-th-accent-50 hover:bg-th-accent-100 cursor-pointer"
                  aria-label="Enroll in cadence"
                  title="Enroll lead in a cadence"
                >
                  <option value="" disabled>
                    Enroll in cadence…
                  </option>
                  {(cadencesForOrg.data ?? []).map((c: { id: string; name: string }) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </PermissionGate>
      </div>

      {lead.concierge_handoff_at && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
          Concierge handoff recorded {new Date(lead.concierge_handoff_at).toLocaleString()}
        </p>
      )}

      {/* Section 6 / Round 3 — Workflow subsection picker. The LinkedIn
          funnel status field below is conditional: shown only when the
          subsection is 'linkedin' and hidden entirely for every other
          subsection. */}
      <div
        className={`grid gap-4 ${
          lead.workflow_subsection === 'linkedin'
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        <div>
          <label className="text-xs font-medium text-th-text-tertiary">Workflow subsection</label>
          <select
            value={lead.workflow_subsection || 'working'}
            onChange={(e) => handleSubsection(e.target.value)}
            className="mt-1 w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
          >
            <option value="working">Working</option>
            <option value="nurture">Nurture</option>
            <option value="linkedin">LinkedIn</option>
            <option value="do_not_contact">Do not contact</option>
          </select>
        </div>
        {lead.workflow_subsection === 'linkedin' && (
          <div>
            <label className="text-xs font-medium text-th-text-tertiary">
              LinkedIn funnel status
            </label>
            <select
              value={lead.linkedin_workflow_status || ''}
              onChange={(e) => handleLiStatus(e.target.value)}
              className="mt-1 w-full border border-th-border rounded-lg px-3 py-2 text-sm bg-surface-primary"
            >
              <option value="">—</option>
              {LI_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileSpreadsheet className="w-4 h-4 text-th-text-tertiary" />
          <h3 className="text-sm font-semibold text-th-text-primary">Quote history</h3>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {quotes.length === 0 ? (
            <p className="text-xs text-th-text-tertiary">No quotes yet</p>
          ) : (
            quotes.map((q) => (
              <div key={q.id} className="text-xs border border-th-border/60 rounded-lg px-3 py-2">
                <span className="font-medium text-th-text-primary">{q.plan_name}</span>
                {q.plan_structure && (
                  <span className="text-th-text-tertiary"> · {q.plan_structure}</span>
                )}
                {q.monthly_price != null && (
                  <span className="text-th-text-secondary"> · ${q.monthly_price}/mo</span>
                )}
                <span className="text-th-text-tertiary"> · {q.quote_date}</span>
              </div>
            ))
          )}
        </div>
        <PermissionGate permission="leads.update">
          <div className="mt-3 flex flex-wrap gap-2 items-end">
            <input
              value={qPlan}
              onChange={(e) => setQPlan(e.target.value)}
              placeholder="Plan name"
              className="flex-1 min-w-[120px] border border-th-border rounded-lg px-2 py-1.5 text-sm"
            />
            <input
              value={qStruct}
              onChange={(e) => setQStruct(e.target.value)}
              placeholder="Structure"
              className="flex-1 min-w-[120px] border border-th-border rounded-lg px-2 py-1.5 text-sm"
            />
            <input
              value={qPrice}
              onChange={(e) => setQPrice(e.target.value)}
              placeholder="$/mo"
              type="number"
              className="w-24 border border-th-border rounded-lg px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={addQuote}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-th-accent-600 text-white text-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </PermissionGate>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-th-text-tertiary" />
          <h3 className="text-sm font-semibold text-th-text-primary">
            Time on lead
            <span className="ml-2 font-normal text-th-text-tertiary">(~{totalMinutes} min total)</span>
          </h3>
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
          {times.length === 0 ? (
            <p className="text-th-text-tertiary">No time entries</p>
          ) : (
            times.map((t) => (
              <div key={t.id} className="text-th-text-secondary">
                {new Date(t.occurred_at).toLocaleDateString()} — {t.source} — {Math.round(t.duration_seconds / 60)}m
                {t.description && ` · ${t.description}`}
              </div>
            ))
          )}
        </div>
        <PermissionGate permission="leads.update">
          <div className="mt-3 flex flex-wrap gap-2 items-end">
            <input
              value={tMinutes}
              onChange={(e) => setTMinutes(e.target.value)}
              placeholder="Minutes"
              type="number"
              className="w-28 border border-th-border rounded-lg px-2 py-1.5 text-sm"
            />
            <input
              value={tNote}
              onChange={(e) => setTNote(e.target.value)}
              placeholder="Note"
              className="flex-1 min-w-[140px] border border-th-border rounded-lg px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={addTime}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-th-border text-sm"
            >
              Log time
            </button>
          </div>
        </PermissionGate>
      </div>
    </div>
  );
}