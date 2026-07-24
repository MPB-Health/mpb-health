import type {
  StaffTimeDocumentKind,
  StaffTimeRequestStatus,
  StaffTimeRequestType,
} from './constants';

export interface StaffTimeRequest {
  id: string;
  org_id: string;
  user_id: string;
  employee_name: string;
  employee_email: string;
  type: StaffTimeRequestType;
  status: StaffTimeRequestStatus;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  title: string;
  reason: string | null;
  metadata: Record<string, unknown>;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffTimeDocument {
  id: string;
  request_id: string;
  org_id: string;
  uploaded_by: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  byte_size: number;
  kind: StaffTimeDocumentKind;
  created_at: string;
}

export interface StaffTimeCalendarEntry {
  id: string;
  org_id: string;
  user_id: string;
  employee_name: string;
  type: StaffTimeRequestType;
  status: Extract<StaffTimeRequestStatus, 'pending' | 'approved'>;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  title: string;
}

export interface CreateTimeRequestInput {
  type: StaffTimeRequestType;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  title?: string;
  reason?: string;
}

export interface DecideTimeRequestInput {
  status: 'approved' | 'denied';
  decision_note?: string;
}

export interface UploadDocumentInput {
  file: File;
  kind: StaffTimeDocumentKind;
}

export interface StaffTimeRequestEvent {
  id: string;
  request_id: string;
  org_id: string;
  actor_id: string | null;
  action: string;
  detail: Record<string, unknown>;
  created_at: string;
  actor_name?: string | null;
  actor_email?: string | null;
}

export interface AddCommentInput {
  body: string;
}
