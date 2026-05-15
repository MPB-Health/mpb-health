import { useTrackedReps } from '../../hooks/useTrackedReps';
import { useIsLeadManager } from '../../hooks/useIsLeadManager';
import { useAuth } from '../../contexts/AuthContext';

interface ReportRepFilterProps {
  value: string[] | null;
  onChange: (reps: string[] | null) => void;
  label?: string;
}

/**
 * Rep filter for the 2026 monthly reports.
 *
 * Sales Plan 2026 RBAC rule: a rep who isn't a Lead Manager can only see
 * themselves. This component enforces that by hiding the dropdown and
 * clamping `value` to `[currentUser.id]` when the viewer lacks the
 * `lead_manager` permission.
 *
 * 2026-05-15 — the dropdown now only lists inside-sales reps tracked in
 * reports (users with a `crm_user_conversation_goal_overrides` row).
 * Per the Round 12 Addendum that's currently Adam + Tupac. When no
 * overrides exist yet (fresh org), we fall back to every active org
 * member so the dropdown isn't empty.
 *
 * Lead Managers see those tracked reps plus a "Team Total" option
 * (represented by `value = null`).
 */
export function ReportRepFilter({ value, onChange, label = 'Rep' }: ReportRepFilterProps) {
  const { reps, isLoading, isFallback } = useTrackedReps();
  const isLeadManager = useIsLeadManager();
  const { user } = useAuth();
  const currentUser = user ? { id: user.id } : null;

  if (!isLeadManager) {
    return (
      <div className="flex items-center gap-2 text-sm text-th-text-tertiary">
        <span className="font-medium text-th-text-secondary">{label}:</span>
        <span>My data only</span>
      </div>
    );
  }

  const selected = value && value.length === 1 ? value[0] : 'all';

  return (
    <label className="flex items-center gap-2 text-sm text-th-text-secondary">
      <span className="font-medium">{label}:</span>
      <select
        value={selected}
        disabled={isLoading}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'all') onChange(null);
          else if (v === 'mine' && currentUser?.id) onChange([currentUser.id]);
          else onChange([v]);
        }}
        className="border border-th-border rounded-lg px-3 py-1.5 bg-surface-primary text-sm"
      >
        <option value="all">Team total (tracked reps)</option>
        {currentUser?.id && <option value="mine">My data only</option>}
        {reps.map((r) => (
          <option key={r.user_id} value={r.user_id}>
            {r.display_name}
          </option>
        ))}
      </select>
      {isFallback && (
        <span
          className="text-[11px] text-th-text-tertiary"
          title="No inside-sales reps configured yet. Seed Adam + Tupac in Settings → Daily Log → Conversation goals to scope reports to the tracked roster."
        >
          (showing all org members — seed tracked roster in Settings)
        </span>
      )}
    </label>
  );
}
