import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Bell, Mail, Save, Loader2, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';

// ---------------------------------------------------------------------------
// CRM Round 8 — Performance Lag config (Settings tab)
// ---------------------------------------------------------------------------
// Spec: "Notification channels: in-app notification + email; both default-on
// (configurable in Settings). Default trigger cadence: daily check against
// a rolling 7-day window (configurable in Settings)." Backed by
// `crm_performance_lag_config` (one row per org, RLS: members read, admins
// write).

interface LagConfigRow {
  org_id: string;
  is_enabled: boolean;
  threshold_pct: number;
  window_days: number;
  cadence: 'daily' | 'weekday' | 'weekly';
  notify_rep: boolean;
  notify_admins: boolean;
  email_channel: boolean;
  inapp_channel: boolean;
  quiet_period_days: number;
  min_business_days_in_system: number;
  exclude_special_projects: boolean;
  // Round 9 — implementer-decision flexibility (defaults preserved).
  metric_kind: 'activity_count' | 'leads_worked' | 'time_logged_minutes';
  baseline_kind: 'team_avg_excl_self' | 'team_median_excl_self' | 'top_performer_pct';
  top_performer_pct_target: number;
  window_kind: 'rolling' | 'snapshot_weekly';
  // Section 12 / Round 10 — spec lock for the metric / baseline / window
  // / exclude_special_projects fields. When true, the scan ignores the
  // configurable knobs and uses the Round 6 Addendum spec values.
  spec_locked: boolean;
}

export function PerformanceLagSettings() {
  const { activeOrgId, orgRole } = useOrg();
  const isOrgAdmin = orgRole === 'admin' || orgRole === 'owner';
  const queryClient = useQueryClient();

  const queryKey = ['performanceLagConfig', activeOrgId] as const;

  const { data: config, isLoading } = useQuery({
    queryKey,
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_performance_lag_config')
        .select('*')
        .eq('org_id', activeOrgId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as LagConfigRow | null;
    },
    staleTime: 30_000,
  });

  const [draft, setDraft] = useState<LagConfigRow | null>(null);
  const [saving, setSaving] = useState(false);

  // Hydrate the draft state when the config loads or the org changes.
  useEffect(() => {
    if (config) setDraft(config);
  }, [config]);

  if (!activeOrgId) {
    return (
      <div className="p-6 text-center text-th-text-tertiary text-sm">
        No active org selected.
      </div>
    );
  }

  if (isLoading || !draft) {
    return (
      <div className="p-6 text-center text-th-text-tertiary text-sm">
        <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Loading…
      </div>
    );
  }

  const handleSave = async () => {
    if (!isOrgAdmin) {
      toast.error('Only org admins can change Performance Lag settings');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('crm_performance_lag_config')
      .update({
        is_enabled: draft.is_enabled,
        threshold_pct: draft.threshold_pct,
        window_days: draft.window_days,
        cadence: draft.cadence,
        notify_rep: draft.notify_rep,
        notify_admins: draft.notify_admins,
        email_channel: draft.email_channel,
        inapp_channel: draft.inapp_channel,
        quiet_period_days: draft.quiet_period_days,
        min_business_days_in_system: draft.min_business_days_in_system,
        exclude_special_projects: draft.exclude_special_projects,
        metric_kind: draft.metric_kind,
        baseline_kind: draft.baseline_kind,
        top_performer_pct_target: draft.top_performer_pct_target,
        window_kind: draft.window_kind,
        spec_locked: draft.spec_locked,
      })
      .eq('org_id', activeOrgId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Performance Lag settings saved');
    queryClient.invalidateQueries({ queryKey });
  };

  const set = <K extends keyof LagConfigRow>(key: K, value: LagConfigRow[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  // Channel sanity guard: at least one channel should remain on, or
  // alerts will fire silently. We don't disable the toggle, but show a
  // warning when both are off.
  const noChannels = !draft.inapp_channel && !draft.email_channel;
  const noAudience = !draft.notify_rep && !draft.notify_admins;

  // Section 12 / Round 6 Addendum — spec-locked items (metric_kind,
  // baseline_kind, window_kind, exclude_special_projects). When the
  // lock is on (default), these fields are forced to the spec values
  // and the matching inputs are read-only. Admins who explicitly want
  // to deviate must toggle off the spec lock first.
  const specLocked = !!draft.spec_locked;
  const lockedDisable = !isOrgAdmin || specLocked;

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl p-4 flex items-start gap-3 border ${
          specLocked
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}
      >
        {specLocked ? (
          <Lock className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
        ) : (
          <Unlock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        )}
        <div className="text-sm flex-1">
          <p className={`font-semibold ${specLocked ? 'text-emerald-900' : 'text-amber-900'}`}>
            {specLocked
              ? 'Spec lock — Section 12 (Round 6 Addendum) ON'
              : 'Spec lock OFF — operational override active'}
          </p>
          <p className={`mt-0.5 ${specLocked ? 'text-emerald-800' : 'text-amber-800'}`}>
            {specLocked ? (
              <>
                Metric is <strong>activity counts</strong> across all auto- and manual-logged
                touches (Calls, Texts, Emails, Cancellation Calls, LinkedIn touches, Pipeline
                actions, Deals Closed, Activities, Content Creation entries). Special Projects
                time is <strong>excluded</strong>. Each activity = 1 count, no weighting. Baseline
                is the team average excluding the rep being scored, evaluated on a rolling window.
              </>
            ) : (
              <>
                You have unlocked the spec-frozen items (metric kind, baseline kind, window kind,
                exclude Special Projects). The scan will use whatever values you save below — this
                deviates from the Section 12 / Round 6 Addendum spec.
              </>
            )}
          </p>
          <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={specLocked}
              onChange={(e) => set('spec_locked', e.target.checked)}
              disabled={!isOrgAdmin}
            />
            <span className={specLocked ? 'text-emerald-900' : 'text-amber-900'}>
              Lock this org to the Section 12 spec values (recommended)
            </span>
          </label>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-900">
          <p className="font-semibold">Performance Lag Alert — Section 12</p>
          <p className="mt-0.5 text-amber-800">
            Fires when a rep&apos;s {metricLabel(draft.metric_kind)} is at least {draft.threshold_pct}%
            below the {baselineLabel(draft.baseline_kind, draft.top_performer_pct_target)} over the
            {draft.window_kind === 'snapshot_weekly'
              ? ' previous Mon–Sun week'
              : ` rolling ${draft.window_days}-day window`}. Spec defaults (activity count vs team
            average, 20% / 7 days / daily / both channels on / rep + admins) match this org&apos;s
            current config when nothing here has been changed.
          </p>
        </div>
      </div>

      <Section title="Trigger">
        <Toggle
          label="Performance Lag Alert is active"
          description="When off, the daily scan exits early and no alerts fire for this org."
          checked={draft.is_enabled}
          onChange={(v) => set('is_enabled', v)}
          disabled={!isOrgAdmin}
        />
        <NumberField
          label="Threshold (% below the chosen baseline)"
          description="Default 20. The rep fires an alert when their score is at least this much below the baseline for the same window."
          value={draft.threshold_pct}
          min={5}
          max={90}
          onChange={(v) => set('threshold_pct', v)}
          disabled={!isOrgAdmin}
          suffix="%"
        />
        <NumberField
          label="Rolling window (days)"
          description="Default 7 (calendar days). Used when the window kind is 'rolling'. Set to 30 for a 30-day rolling alternative."
          value={draft.window_days}
          min={1}
          max={90}
          onChange={(v) => set('window_days', v)}
          disabled={!isOrgAdmin || draft.window_kind === 'snapshot_weekly'}
          suffix={draft.window_days === 1 ? 'day' : 'days'}
        />
        <SelectField
          label="Window kind"
          description={
            specLocked
              ? 'Locked to rolling per Section 12 / Round 6 Addendum.'
              : 'Rolling = the last N days ending today (default). Weekly snapshot = the previous full Mon–Sun week, evaluated each scan.'
          }
          value={specLocked ? 'rolling' : draft.window_kind}
          options={[
            { value: 'rolling', label: 'Rolling (default — last N calendar days)' },
            { value: 'snapshot_weekly', label: 'Weekly snapshot (previous Mon–Sun)' },
          ]}
          onChange={(v) => set('window_kind', v as LagConfigRow['window_kind'])}
          disabled={lockedDisable}
        />
        <SelectField
          label="Cadence"
          description="How often the scan runs. The pg_cron job currently runs daily at 13:30 UTC; this setting is honored by future per-org schedulers."
          value={draft.cadence}
          options={[
            { value: 'daily', label: 'Daily (default)' },
            { value: 'weekday', label: 'Weekdays only (Mon–Fri)' },
            { value: 'weekly', label: 'Weekly' },
          ]}
          onChange={(v) => set('cadence', v as LagConfigRow['cadence'])}
          disabled={!isOrgAdmin}
        />
        <NumberField
          label="Quiet period after firing (days)"
          description="Once an alert fires for a rep, the same rep is silenced for this many days before the scan re-evaluates them."
          value={draft.quiet_period_days}
          min={0}
          max={30}
          onChange={(v) => set('quiet_period_days', v)}
          disabled={!isOrgAdmin}
          suffix={draft.quiet_period_days === 1 ? 'day' : 'days'}
        />
        <NumberField
          label="New-hire grace (distinct days of activity)"
          description="A rep needs at least this many distinct days of non-Special-Projects activity in the system before lag-eval applies."
          value={draft.min_business_days_in_system}
          min={0}
          max={30}
          onChange={(v) => set('min_business_days_in_system', v)}
          disabled={!isOrgAdmin}
          suffix={draft.min_business_days_in_system === 1 ? 'day' : 'days'}
        />
        <Toggle
          label="Exclude Special Projects from the activity score"
          description={
            specLocked
              ? 'Locked ON per Section 12 / Round 6 Addendum — project work is non-pipeline and would distort the comparison.'
              : 'Spec: Special Projects time does NOT count toward the activity score. Leave this on unless you specifically want projects to count.'
          }
          checked={specLocked ? true : draft.exclude_special_projects}
          onChange={(v) => set('exclude_special_projects', v)}
          disabled={lockedDisable}
        />
      </Section>

      <Section title="Metric & baseline">
        <SelectField
          label="Metric kind"
          description={
            specLocked
              ? 'Locked to activity_count per Section 12 / Round 6 Addendum (each touch = 1 count, no weighting between activity types).'
              : 'What the scan counts per rep. activity_count = events in the Daily Log (default). leads_worked = distinct leads touched by the rep. time_logged_minutes = SUM of call duration + Special Projects time when included.'
          }
          value={specLocked ? 'activity_count' : draft.metric_kind}
          options={[
            { value: 'activity_count', label: 'Activity count (default)' },
            { value: 'leads_worked', label: 'Leads worked (distinct leads)' },
            { value: 'time_logged_minutes', label: 'Time logged (minutes)' },
          ]}
          onChange={(v) => set('metric_kind', v as LagConfigRow['metric_kind'])}
          disabled={lockedDisable}
        />
        <SelectField
          label="Baseline kind"
          description={
            specLocked
              ? 'Locked to team_avg_excl_self per Section 12 / Round 6 Addendum.'
              : 'What the rep is compared against. Average and median exclude the rep being evaluated; top performer compares to the highest peer score.'
          }
          value={specLocked ? 'team_avg_excl_self' : draft.baseline_kind}
          options={[
            { value: 'team_avg_excl_self', label: 'Team average, excluding self (default)' },
            { value: 'team_median_excl_self', label: 'Team median, excluding self' },
            { value: 'top_performer_pct', label: 'Top performer × target %' },
          ]}
          onChange={(v) => set('baseline_kind', v as LagConfigRow['baseline_kind'])}
          disabled={lockedDisable}
        />
        {!specLocked && draft.baseline_kind === 'top_performer_pct' && (
          <NumberField
            label="Top-performer target (%)"
            description="When the baseline kind is 'top performer × target %', the alert fires when the rep is below (top_performer × this %) × (1 − threshold %). Default 80."
            value={draft.top_performer_pct_target}
            min={5}
            max={100}
            onChange={(v) => set('top_performer_pct_target', v)}
            disabled={!isOrgAdmin}
            suffix="%"
          />
        )}
        <div className="text-xs text-th-text-tertiary bg-surface-secondary rounded-lg p-3">
          <p className="font-medium text-th-text-primary mb-1">Spec defaults — Round 9 confirmation</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Metric: <code>activity_count</code> (excluding Special Projects).</li>
            <li>Baseline: <code>team_avg_excl_self</code>.</li>
            <li>Window: rolling 7 days.</li>
            <li>Threshold: 20%.</li>
          </ul>
          <p className="mt-2">Changing any of these flips the org behaviour live; the next scan honors the new values.</p>
        </div>
      </Section>

      <Section title="Audience">
        <Toggle
          label="Notify the affected rep"
          description="Default on — the rep gets a private notification with their own activity vs the team baseline."
          checked={draft.notify_rep}
          onChange={(v) => set('notify_rep', v)}
          disabled={!isOrgAdmin}
        />
        <Toggle
          label="Notify org admins / owners"
          description="Default on — every active admin or owner receives the alert with a deep-link to the Daily Log Admin View."
          checked={draft.notify_admins}
          onChange={(v) => set('notify_admins', v)}
          disabled={!isOrgAdmin}
        />
        {noAudience && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
            Both audience toggles are off — alerts will be logged but no one will be notified.
          </div>
        )}
      </Section>

      <Section title="Channels">
        <Toggle
          label="In-app notification"
          description="Default on — appears in the notification center with priority 'high'."
          icon={<Bell className="w-4 h-4" />}
          checked={draft.inapp_channel}
          onChange={(v) => set('inapp_channel', v)}
          disabled={!isOrgAdmin}
        />
        <Toggle
          label="Email notification"
          description="Default on — sent through the existing transactional email pipeline."
          icon={<Mail className="w-4 h-4" />}
          checked={draft.email_channel}
          onChange={(v) => set('email_channel', v)}
          disabled={!isOrgAdmin}
        />
        {noChannels && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
            Both channels are off — alerts will be logged silently. Turn at least one on to deliver them.
          </div>
        )}
      </Section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !isOrgAdmin}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-th-accent-600 rounded-lg hover:bg-th-accent-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div className="bg-surface-primary border border-th-border rounded-2xl">
      <div className="px-5 py-3 border-b border-th-border-subtle">
        <p className="text-xs font-semibold uppercase tracking-wider text-th-text-tertiary">
          {title}
        </p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

interface ToggleProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function Toggle({ label, description, icon, checked, onChange, disabled }: ToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2 text-sm font-medium text-th-text-primary">
          {icon}
          {label}
        </div>
        {description && (
          <p className="text-xs text-th-text-tertiary mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}

interface NumberFieldProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  suffix?: string;
}

function NumberField({
  label,
  description,
  value,
  min,
  max,
  onChange,
  disabled,
  suffix,
}: NumberFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-th-text-primary">{label}</label>
      {description && (
        <p className="text-xs text-th-text-tertiary mt-0.5">{description}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const v = Number.parseInt(e.target.value, 10);
            if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          disabled={disabled}
          className="w-32 border border-th-border rounded-lg px-3 py-1.5 text-sm bg-surface-primary"
        />
        {suffix && <span className="text-sm text-th-text-tertiary">{suffix}</span>}
      </div>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}

function metricLabel(kind: LagConfigRow['metric_kind']): string {
  switch (kind) {
    case 'leads_worked':
      return 'distinct-leads-worked count';
    case 'time_logged_minutes':
      return 'time logged (minutes)';
    default:
      return 'activity count';
  }
}

function baselineLabel(
  kind: LagConfigRow['baseline_kind'],
  topPct: number,
): string {
  switch (kind) {
    case 'team_median_excl_self':
      return 'team median (peers only)';
    case 'top_performer_pct':
      return `top performer × ${topPct}%`;
    default:
      return 'team average (peers only)';
  }
}

function SelectField({ label, description, value, options, onChange, disabled }: SelectFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-th-text-primary">{label}</label>
      {description && (
        <p className="text-xs text-th-text-tertiary mt-0.5">{description}</p>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-2 w-full sm:w-72 border border-th-border rounded-lg px-3 py-1.5 text-sm bg-surface-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
