import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, ListChecks, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';

// CRM Round 9 — Daily Log UI knobs (open-question #1: accordion mode).
// Default values match the implementer assumption (multi-expand,
// fully-collapsed on load) so this tab can be left untouched without
// changing behaviour.

interface DailyLogUiConfigRow {
  org_id: string;
  accordion_mode: 'single' | 'multi';
  default_collapsed: boolean;
  // Section 12 / Round 6 Addendum — when true, the Daily Log accordion
  // is forced to multi-expand and starts fully collapsed regardless of
  // accordion_mode / default_collapsed columns.
  spec_locked: boolean;
}

export function DailyLogUiSettings() {
  const { activeOrgId, orgRole } = useOrg();
  const isOrgAdmin = orgRole === 'admin' || orgRole === 'owner';
  const queryClient = useQueryClient();

  const queryKey = ['dailyLogUiConfig', activeOrgId] as const;

  const { data: config, isLoading } = useQuery({
    queryKey,
    enabled: !!activeOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_daily_log_ui_config')
        .select('*')
        .eq('org_id', activeOrgId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as DailyLogUiConfigRow | null;
    },
    staleTime: 30_000,
  });

  const [draft, setDraft] = useState<DailyLogUiConfigRow | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) setDraft(config);
  }, [config]);

  if (!activeOrgId) {
    return <div className="p-6 text-center text-th-text-tertiary text-sm">No active org selected.</div>;
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
      toast.error('Only org admins can change Daily Log UI settings');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('crm_daily_log_ui_config')
      .update({
        accordion_mode: draft.accordion_mode,
        default_collapsed: draft.default_collapsed,
        spec_locked: draft.spec_locked,
      })
      .eq('org_id', activeOrgId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Daily Log UI settings saved');
    queryClient.invalidateQueries({ queryKey });
  };

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
            {specLocked
              ? 'Daily Log accordion is multi-expand and starts fully collapsed every day. Reps may have any number of sections open simultaneously and the open/closed state persists per user across sessions.'
              : 'You have unlocked the spec-frozen items. The accordion will use whatever values you save below — this deviates from the Section 12 / Round 6 Addendum spec.'}
          </p>
          <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={specLocked}
              onChange={(e) => setDraft({ ...draft, spec_locked: e.target.checked })}
              disabled={!isOrgAdmin}
            />
            <span className={specLocked ? 'text-emerald-900' : 'text-amber-900'}>
              Lock this org to the Section 12 spec values (recommended)
            </span>
          </label>
        </div>
      </div>

      <div className="bg-th-accent-50 border border-th-accent-200 rounded-2xl p-4 flex items-start gap-3">
        <ListChecks className="w-5 h-5 text-th-accent-700 mt-0.5 shrink-0" />
        <div className="text-sm text-th-accent-900">
          <p className="font-semibold">Daily Log accordion behaviour</p>
          <p className="mt-0.5">
            Section 12 / Round 6 Addendum confirms multi-expand with section state persisted per
            user across sessions. The defaults below match that exactly.
          </p>
        </div>
      </div>

      <div className="bg-surface-primary border border-th-border rounded-2xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-th-text-primary">Accordion mode</label>
          <p className="text-xs text-th-text-tertiary mt-0.5">
            {specLocked
              ? 'Locked to multi-expand per Section 12 / Round 6 Addendum.'
              : 'Multi-expand (default) lets reps open any number of sections at once. Single-expand collapses other sections automatically when one is opened.'}
          </p>
          <select
            value={specLocked ? 'multi' : draft.accordion_mode}
            onChange={(e) =>
              setDraft({ ...draft, accordion_mode: e.target.value as DailyLogUiConfigRow['accordion_mode'] })
            }
            disabled={lockedDisable}
            className="mt-2 w-full sm:w-72 border border-th-border rounded-lg px-3 py-1.5 text-sm bg-surface-primary disabled:bg-surface-secondary disabled:text-th-text-tertiary"
          >
            <option value="multi">Multi-expand (default)</option>
            <option value="single">Single-expand (one at a time)</option>
          </select>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={specLocked ? true : draft.default_collapsed}
            onChange={(e) => setDraft({ ...draft, default_collapsed: e.target.checked })}
            disabled={lockedDisable}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-th-text-primary">Start every day fully collapsed</div>
            <p className="text-xs text-th-text-tertiary mt-0.5">
              {specLocked
                ? 'Locked ON per Section 12 / Round 6 Addendum.'
                : 'Spec default: on. The accordion starts fully collapsed each new day; rep-level open state still persists within the day via crm_rep_daily_log_entries.section_open_state.'}
            </p>
          </div>
        </label>
      </div>

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
