import { useEffect, useRef } from 'react';
import { useCRMService } from '../contexts/CRMServiceContext';

/**
 * CRM rebuild Section 6 — auto-capture "time on profile" while a rep has the
 * Lead Profile tab focused. Pings every `intervalMs` (default 30 s) into
 * `crm_lead_time_entries` with `source = 'profile'`. Pauses on tab blur and
 * resumes on focus so background tabs don't accumulate phantom seconds.
 *
 * The hook is a no-op until both `leadId` and the active org context are
 * available, so it's safe to mount it unconditionally at the top of
 * LeadDetail.
 */
export function useProfileTimeTracker(
  leadId: string | null | undefined,
  orgId: string | null | undefined,
  options: { intervalMs?: number } = {}
) {
  const { supabase } = useCRMService();
  const intervalMs = options.intervalMs ?? 30_000;
  const tickRef = useRef<number | null>(null);
  const focusedRef = useRef<boolean>(typeof document !== 'undefined' ? !document.hidden : true);
  const inflightRef = useRef<boolean>(false);

  useEffect(() => {
    if (!leadId || !orgId) return;

    const onVisibility = () => {
      focusedRef.current = !document.hidden;
    };

    const tick = async () => {
      if (!focusedRef.current || inflightRef.current) return;
      inflightRef.current = true;
      try {
        await supabase.from('crm_lead_time_entries').insert({
          org_id: orgId,
          lead_id: leadId,
          source: 'profile',
          duration_seconds: Math.round(intervalMs / 1000),
          description: 'auto: profile open',
        });
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('useProfileTimeTracker insert failed', err);
        }
      } finally {
        inflightRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    tickRef.current = window.setInterval(tick, intervalMs);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [leadId, orgId, intervalMs, supabase]);
}
