import { supabase } from '@mpbhealth/database';

/**
 * Async HR gate matching SQL is_staff_hr() (user_roles.staff_hr).
 * Prefer this over the legacy email allowlist.
 */
export async function checkIsStaffHr(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_staff_hr');
  if (error) {
    console.error('is_staff_hr rpc failed', error);
    return false;
  }
  return Boolean(data);
}
