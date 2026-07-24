import { supabase } from '@mpbhealth/database';
import { getStaffHubOrgId } from '../../../components/StaffHubOrgSync';
import type {
  DecideRemoteInput,
  StaffDepartment,
  StaffOfficeLocation,
  StaffProfile,
  UpdateRosterProfileInput,
} from './types';

const PROFILE_COLUMNS =
  'id, org_id, user_id, department_id, display_name, email, title, remote_status, remote_requested_at, remote_request_note, remote_decided_by, remote_decided_at, remote_decision_note, is_active, metadata, created_at, updated_at';

const DEPT_COLUMNS =
  'id, org_id, name, is_active, sort_order, created_at, updated_at';

const OFFICE_COLUMNS =
  'id, org_id, label, address_line, city, state, postal_code, latitude, longitude, radius_m, max_accuracy_m, accuracy_credit_cap_m, is_active';

async function invokeRemoteNotify(payload: {
  kind: 'remote_submitted' | 'remote_decided';
  profile_id: string;
}): Promise<{ ok: boolean; delayed?: boolean }> {
  try {
    const { error } = await supabase.functions.invoke('notify-hr-time-request', {
      body: payload,
    });
    if (error) {
      console.error('Remote notify failed', error);
      return { ok: false, delayed: true };
    }
    return { ok: true };
  } catch (err) {
    console.error('Remote notify exception', err);
    return { ok: false, delayed: true };
  }
}

export async function ensureMyProfile(): Promise<StaffProfile> {
  const orgId = getStaffHubOrgId();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  const { data, error } = await supabase.rpc('staff_ensure_profile', {
    p_org_id: orgId,
    p_user_id: user.id,
  });

  if (error) throw error;
  return data as StaffProfile;
}

export async function getMyProfile(): Promise<StaffProfile | null> {
  const orgId = getStaffHubOrgId();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  const { data, error } = await supabase
    .from('staff_profiles')
    .select(PROFILE_COLUMNS)
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data as StaffProfile | null;
}

export async function listDepartments(includeInactive = false): Promise<StaffDepartment[]> {
  const orgId = getStaffHubOrgId();
  let q = supabase
    .from('staff_departments')
    .select(DEPT_COLUMNS)
    .eq('org_id', orgId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (!includeInactive) {
    q = q.eq('is_active', true);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as StaffDepartment[];
}

export async function createDepartment(name: string): Promise<StaffDepartment> {
  const orgId = getStaffHubOrgId();
  const { data, error } = await supabase
    .from('staff_departments')
    .insert({
      org_id: orgId,
      name: name.trim(),
      is_active: true,
      sort_order: 100,
    })
    .select(DEPT_COLUMNS)
    .single();

  if (error) throw error;
  return data as StaffDepartment;
}

export async function updateDepartment(
  id: string,
  patch: { name?: string; is_active?: boolean; sort_order?: number },
): Promise<StaffDepartment> {
  const { data, error } = await supabase
    .from('staff_departments')
    .update({
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.is_active !== undefined ? { is_active: patch.is_active } : {}),
      ...(patch.sort_order !== undefined ? { sort_order: patch.sort_order } : {}),
    })
    .eq('id', id)
    .select(DEPT_COLUMNS)
    .single();

  if (error) throw error;
  return data as StaffDepartment;
}

export async function listRoster(includeInactive = false): Promise<StaffProfile[]> {
  const orgId = getStaffHubOrgId();
  let q = supabase
    .from('staff_profiles')
    .select(`${PROFILE_COLUMNS}, department:staff_departments(${DEPT_COLUMNS})`)
    .eq('org_id', orgId)
    .order('display_name', { ascending: true });

  if (!includeInactive) {
    q = q.eq('is_active', true);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as StaffProfile[];
}

export async function listPendingRemoteProfiles(): Promise<StaffProfile[]> {
  const orgId = getStaffHubOrgId();
  const { data, error } = await supabase
    .from('staff_profiles')
    .select(PROFILE_COLUMNS)
    .eq('org_id', orgId)
    .eq('remote_status', 'pending')
    .order('remote_requested_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as StaffProfile[];
}

export async function updateRosterProfile(
  profileId: string,
  input: UpdateRosterProfileInput,
): Promise<StaffProfile> {
  const { data, error } = await supabase
    .from('staff_profiles')
    .update({
      ...(input.department_id !== undefined ? { department_id: input.department_id } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.display_name !== undefined ? { display_name: input.display_name.trim() } : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
    })
    .eq('id', profileId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw error;
  return data as StaffProfile;
}

export async function requestStandingRemote(
  note?: string,
): Promise<{ profile: StaffProfile; notifyDelayed: boolean }> {
  const profile = await ensureMyProfile();

  if (profile.remote_status === 'approved') {
    return { profile, notifyDelayed: false };
  }
  if (profile.remote_status === 'pending') {
    return { profile, notifyDelayed: false };
  }

  const { data, error } = await supabase
    .from('staff_profiles')
    .update({
      remote_status: 'pending',
      remote_requested_at: new Date().toISOString(),
      remote_request_note: note?.trim() || null,
      remote_decided_by: null,
      remote_decided_at: null,
      remote_decision_note: null,
    })
    .eq('id', profile.id)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw error;

  const notify = await invokeRemoteNotify({
    kind: 'remote_submitted',
    profile_id: data.id,
  });

  return { profile: data as StaffProfile, notifyDelayed: Boolean(notify.delayed) };
}

export async function decideStandingRemote(
  profileId: string,
  input: DecideRemoteInput,
): Promise<{ profile: StaffProfile; notifyDelayed: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  const remoteStatus =
    input.status === 'approved'
      ? 'approved'
      : input.status === 'revoked'
        ? 'revoked'
        : 'ineligible';

  const { data, error } = await supabase
    .from('staff_profiles')
    .update({
      remote_status: remoteStatus,
      remote_decided_by: user.id,
      remote_decided_at: new Date().toISOString(),
      remote_decision_note: input.decision_note?.trim() || null,
    })
    .eq('id', profileId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) throw error;

  const notify = await invokeRemoteNotify({
    kind: 'remote_decided',
    profile_id: data.id,
  });

  return { profile: data as StaffProfile, notifyDelayed: Boolean(notify.delayed) };
}

export async function getActiveOffice(): Promise<StaffOfficeLocation | null> {
  const orgId = getStaffHubOrgId();
  const { data, error } = await supabase
    .from('staff_office_locations')
    .select(OFFICE_COLUMNS)
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as StaffOfficeLocation | null;
}
