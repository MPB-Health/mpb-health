import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCRMService } from '../../../contexts/CRMServiceContext';
import { useOrg } from '../../../contexts/OrgContext';
import { crmQueryKeys } from '../../../query/crmQueryKeys';
import { supabase as authSupabase } from '../../../lib/supabase';

// Sales Plan 2026 spec: LinkedIn content target is 2 + 2 + 2 = 6/week *per rep*.
// Connections/messages are tracked separately on the Sales Activity dashboard;
// this widget is strictly about the 6/week posting cadence so reps can tell
// at a glance whether they're on target for the week.
const CONTENT_TYPES = [
  { key: 'linkedin_post', label: 'Original Posts', weeklyTarget: 2 },
  { key: 'linkedin_engagement', label: 'Shared Posts', weeklyTarget: 2 },
  { key: 'linkedin_short', label: 'Shorts / Videos', weeklyTarget: 2 },
] as const;

export default function LinkedInContentWidget() {
  const { supabase } = useCRMService();
  const { activeOrgId } = useOrg();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    authSupabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const weekStart = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  }, []);

  const { data: activities } = useQuery({
    queryKey: [...crmQueryKeys.org(activeOrgId), 'linkedinWeekly', weekStart, userId],
    queryFn: async () => {
      // Per-rep filter: the spec calls out 6/week "per rep", not org-wide,
      // so we scope to the signed-in rep's own activity rows.
      let query = supabase
        .from('lead_activities')
        .select('activity_type')
        .gte('created_at', weekStart)
        .in('activity_type', ['linkedin_post', 'linkedin_engagement', 'linkedin_short']);

      if (userId) query = query.eq('created_by', userId);

      const { data } = await query;

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        counts[row.activity_type] = (counts[row.activity_type] || 0) + 1;
      }
      return counts;
    },
    enabled: !!activeOrgId && !!userId,
  });

  const total = (activities?.linkedin_post ?? 0)
    + (activities?.linkedin_engagement ?? 0)
    + (activities?.linkedin_short ?? 0);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-th-text-primary">LinkedIn Weekly Content</h3>
        <span
          className={
            total >= 6
              ? 'text-xs font-semibold text-green-600'
              : 'text-xs font-medium text-th-text-tertiary'
          }
        >
          {total}/6 this week
        </span>
      </div>
      <p className="text-xs text-th-text-tertiary">Target: 2 original + 2 shared + 2 shorts (per rep)</p>
      <div className="space-y-2">
        {CONTENT_TYPES.map(({ key, label, weeklyTarget }) => {
          const actual = activities?.[key] || 0;
          const pct = Math.min(100, Math.round((actual / weeklyTarget) * 100));
          const onTrack = actual >= weeklyTarget;

          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-th-text-secondary">{label}</span>
                <span className={onTrack ? 'text-green-600 font-medium' : 'text-th-text-tertiary'}>
                  {actual}/{weeklyTarget}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    onTrack ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-orange-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
