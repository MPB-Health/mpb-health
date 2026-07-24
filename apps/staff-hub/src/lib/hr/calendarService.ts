import { supabase } from '@mpbhealth/database';
import { getStaffHubOrgId } from '../../components/StaffHubOrgSync';
import type { StaffTimeCalendarEntry } from './types';

export async function loadTeamCalendar(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<StaffTimeCalendarEntry[]> {
  const orgId = getStaffHubOrgId();
  const { data, error } = await supabase.rpc('get_staff_time_calendar', {
    p_org_id: orgId,
    p_from: rangeStart.toISOString(),
    p_to: rangeEnd.toISOString(),
  });

  if (error) throw error;
  return (data ?? []) as StaffTimeCalendarEntry[];
}
