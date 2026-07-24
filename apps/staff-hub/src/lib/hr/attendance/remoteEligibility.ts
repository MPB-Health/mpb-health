import { supabase } from '@mpbhealth/database';
import type { StaffProfile } from './types';
import { ensureMyProfile, getMyProfile } from './rosterService';

export async function checkRemoteEligible(at?: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc('staff_is_remote_eligible', {
    p_user_id: user.id,
    p_at: at ?? new Date().toISOString(),
  });

  if (error) {
    console.error('staff_is_remote_eligible failed', error);
    return false;
  }
  return Boolean(data);
}

export async function loadAttendanceContext(): Promise<{
  profile: StaffProfile;
  remoteEligible: boolean;
}> {
  let profile = await getMyProfile();
  if (!profile) {
    profile = await ensureMyProfile();
  }
  const remoteEligible = await checkRemoteEligible();
  return { profile, remoteEligible };
}
