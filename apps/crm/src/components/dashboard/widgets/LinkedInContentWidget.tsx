import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCRMService } from '../../../contexts/CRMServiceContext';
import { useOrg } from '../../../contexts/OrgContext';
import { crmQueryKeys } from '../../../query/crmQueryKeys';

const CONTENT_TYPES = [
  { key: 'linkedin_post', label: 'Original Posts', weeklyTarget: 2 },
  { key: 'linkedin_engagement', label: 'Shared Posts', weeklyTarget: 2 },
  { key: 'linkedin_connection_sent', label: 'Connections Sent', weeklyTarget: 8 },
  { key: 'linkedin_message', label: 'Messages Sent', weeklyTarget: 10 },
];

export default function LinkedInContentWidget() {
  const { supabase } = useCRMService();
  const { activeOrgId } = useOrg();

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
    queryKey: [...crmQueryKeys.org(activeOrgId), 'linkedinWeekly', weekStart],
    queryFn: async () => {
      const { data } = await supabase
        .from('lead_activities')
        .select('activity_type')
        .gte('created_at', weekStart)
        .in('activity_type', ['linkedin_post', 'linkedin_engagement', 'linkedin_connection_sent', 'linkedin_message']);

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        counts[row.activity_type] = (counts[row.activity_type] || 0) + 1;
      }
      return counts;
    },
    enabled: !!activeOrgId,
  });

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-th-text-primary">LinkedIn Weekly Content</h3>
      <p className="text-xs text-th-text-tertiary">Target: 6 posts/week (2 original + 2 shared + 2 shorts)</p>
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
