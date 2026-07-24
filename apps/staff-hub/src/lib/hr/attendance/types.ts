import type {
  StaffAttendancePunchAction,
  StaffAttendanceSessionStatus,
  StaffPunchMethod,
  StaffRemoteStatus,
} from './constants';

export interface StaffDepartment {
  id: string;
  org_id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StaffProfile {
  id: string;
  org_id: string;
  user_id: string;
  department_id: string | null;
  display_name: string;
  email: string;
  title: string | null;
  remote_status: StaffRemoteStatus;
  remote_requested_at: string | null;
  remote_request_note: string | null;
  remote_decided_by: string | null;
  remote_decided_at: string | null;
  remote_decision_note: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  department?: StaffDepartment | null;
}

export interface StaffOfficeLocation {
  id: string;
  org_id: string;
  label: string;
  address_line: string;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number;
  longitude: number;
  radius_m: number;
  max_accuracy_m: number;
  accuracy_credit_cap_m: number;
  is_active: boolean;
}

export interface StaffAttendanceSession {
  id: string;
  org_id: string;
  user_id: string;
  status: StaffAttendanceSessionStatus;
  method: StaffPunchMethod;
  clock_in_at: string;
  clock_out_at: string | null;
  office_location_id: string | null;
  clock_in_lat: number | null;
  clock_in_lng: number | null;
  clock_in_accuracy_m: number | null;
  clock_in_distance_m: number | null;
  clock_out_lat: number | null;
  clock_out_lng: number | null;
  clock_out_accuracy_m: number | null;
  clock_out_distance_m: number | null;
  client_ts_in: string | null;
  client_ts_out: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy_m: number;
  client_ts: string;
}

export interface PunchResult {
  ok: boolean;
  deduped?: boolean;
  error?: string;
  message?: string;
  distance_m?: number;
  allowed_m?: number;
  accuracy_m?: number;
  max_accuracy_m?: number;
  office_label?: string;
  session?: StaffAttendanceSession;
}

export interface PunchInput {
  action: StaffAttendancePunchAction;
  position?: GeoPosition | null;
  idempotency_key?: string;
}

export interface DecideRemoteInput {
  status: 'approved' | 'denied' | 'revoked';
  decision_note?: string;
}

export interface UpdateRosterProfileInput {
  department_id?: string | null;
  title?: string | null;
  display_name?: string;
  is_active?: boolean;
}
