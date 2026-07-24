import { supabase } from '@mpbhealth/database';
import type { GeoPosition, PunchInput, PunchResult, StaffAttendanceSession } from './types';

const SESSION_COLUMNS =
  'id, org_id, user_id, status, method, clock_in_at, clock_out_at, office_location_id, clock_in_lat, clock_in_lng, clock_in_accuracy_m, clock_in_distance_m, clock_out_lat, clock_out_lng, clock_out_accuracy_m, clock_out_distance_m, client_ts_in, client_ts_out, notes, metadata, created_at, updated_at';

export async function getBrowserPosition(
  timeoutMs = 15000,
): Promise<GeoPosition> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not available in this browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy_m: pos.coords.accuracy,
          client_ts: new Date(pos.timestamp).toISOString(),
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Location permission denied. Enable location to clock in at the office.'));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error('Timed out reading your location. Try again outdoors or near a window.'));
        } else {
          reject(new Error('Could not read your location. Try again.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0,
      },
    );
  });
}

export async function punchAttendance(input: PunchInput): Promise<PunchResult> {
  const { data, error } = await supabase.rpc('staff_attendance_punch', {
    p_action: input.action,
    p_lat: input.position?.latitude ?? null,
    p_lng: input.position?.longitude ?? null,
    p_accuracy_m: input.position?.accuracy_m ?? null,
    p_client_ts: input.position?.client_ts ?? null,
    p_idempotency_key: input.idempotency_key ?? null,
  });

  if (error) throw error;
  return data as PunchResult;
}

export async function getOpenSession(): Promise<StaffAttendanceSession | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  const { data, error } = await supabase
    .from('staff_attendance_sessions')
    .select(SESSION_COLUMNS)
    .eq('user_id', user.id)
    .eq('status', 'open')
    .order('clock_in_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as StaffAttendanceSession | null;
}

export async function listMySessions(limit = 30): Promise<StaffAttendanceSession[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  const { data, error } = await supabase
    .from('staff_attendance_sessions')
    .select(SESSION_COLUMNS)
    .eq('user_id', user.id)
    .order('clock_in_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as StaffAttendanceSession[];
}

export async function listTodaySessionsForHr(): Promise<StaffAttendanceSession[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('staff_attendance_sessions')
    .select(SESSION_COLUMNS)
    .gte('clock_in_at', start.toISOString())
    .order('clock_in_at', { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data ?? []) as StaffAttendanceSession[];
}

export async function correctAttendanceSession(input: {
  session_id: string;
  clock_in_at?: string | null;
  clock_out_at?: string | null;
  notes?: string | null;
  force_close?: boolean;
}): Promise<PunchResult> {
  const { data, error } = await supabase.rpc('staff_attendance_correct', {
    p_session_id: input.session_id,
    p_clock_in_at: input.clock_in_at ?? null,
    p_clock_out_at: input.clock_out_at ?? null,
    p_notes: input.notes ?? null,
    p_force_close: input.force_close ?? false,
  });

  if (error) throw error;
  return data as PunchResult;
}
