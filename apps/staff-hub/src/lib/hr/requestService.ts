import { supabase } from '@mpbhealth/database';
import { getStaffHubOrgId } from '../../components/StaffHubOrgSync';
import {
  HR_ALLOWED_MIME,
  HR_DOCUMENTS_BUCKET,
  HR_MAX_UPLOAD_BYTES,
  defaultTitleForType,
  type StaffTimeDocumentKind,
} from './constants';
import type {
  CreateTimeRequestInput,
  DecideTimeRequestInput,
  StaffTimeDocument,
  StaffTimeRequest,
  UploadDocumentInput,
} from './types';

const REQUEST_COLUMNS =
  'id, org_id, user_id, employee_name, employee_email, type, status, starts_at, ends_at, all_day, title, reason, metadata, decided_by, decided_at, decision_note, created_at, updated_at';

const DOCUMENT_COLUMNS =
  'id, request_id, org_id, uploaded_by, storage_path, file_name, mime_type, byte_size, kind, created_at';

function buildIdempotencyKey(
  userId: string,
  type: string,
  startsAt: string,
  endsAt: string,
): string {
  return `${userId}:${type}:${startsAt}:${endsAt}`;
}

async function resolveEmployeeProfile(userId: string, fallbackEmail: string) {
  const { data } = await supabase
    .from('admin_users')
    .select('first_name, last_name, email')
    .eq('id', userId)
    .maybeSingle();

  const first = data?.first_name?.trim() ?? '';
  const last = data?.last_name?.trim() ?? '';
  const name = [first, last].filter(Boolean).join(' ') || fallbackEmail || 'Staff member';
  const email = data?.email?.trim() || fallbackEmail;

  return { name, email };
}

async function logEvent(
  requestId: string,
  orgId: string,
  actorId: string,
  action: string,
  detail: Record<string, unknown> = {},
) {
  await supabase.from('staff_time_request_events').insert({
    request_id: requestId,
    org_id: orgId,
    actor_id: actorId,
    action,
    detail,
  });
}

async function invokeHrNotify(payload: {
  kind: 'submitted' | 'decided';
  request_id: string;
}): Promise<{ ok: boolean; delayed?: boolean }> {
  try {
    const { error } = await supabase.functions.invoke('notify-hr-time-request', {
      body: payload,
    });
    if (error) {
      console.error('HR notify failed', error);
      return { ok: false, delayed: true };
    }
    return { ok: true };
  } catch (err) {
    console.error('HR notify exception', err);
    return { ok: false, delayed: true };
  }
}

export async function listMyRequests(): Promise<StaffTimeRequest[]> {
  const orgId = getStaffHubOrgId();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  const { data, error } = await supabase
    .from('staff_time_requests')
    .select(REQUEST_COLUMNS)
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .order('starts_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as StaffTimeRequest[];
}

export async function listPendingForHr(): Promise<StaffTimeRequest[]> {
  const orgId = getStaffHubOrgId();
  const { data, error } = await supabase
    .from('staff_time_requests')
    .select(REQUEST_COLUMNS)
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .order('starts_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as StaffTimeRequest[];
}

export async function listAllForHr(): Promise<StaffTimeRequest[]> {
  const orgId = getStaffHubOrgId();
  const { data, error } = await supabase
    .from('staff_time_requests')
    .select(REQUEST_COLUMNS)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) throw error;
  return (data ?? []) as StaffTimeRequest[];
}

export async function getRequest(id: string): Promise<StaffTimeRequest | null> {
  const { data, error } = await supabase
    .from('staff_time_requests')
    .select(REQUEST_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as StaffTimeRequest | null;
}

export async function listDocuments(requestId: string): Promise<StaffTimeDocument[]> {
  const { data, error } = await supabase
    .from('staff_time_documents')
    .select(DOCUMENT_COLUMNS)
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as StaffTimeDocument[];
}

export async function createRequest(
  input: CreateTimeRequestInput,
): Promise<{ request: StaffTimeRequest; notifyDelayed: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  const orgId = getStaffHubOrgId();
  const profile = await resolveEmployeeProfile(user.id, user.email ?? '');
  const idempotencyKey = buildIdempotencyKey(
    user.id,
    input.type,
    input.starts_at,
    input.ends_at,
  );

  const { data: existing } = await supabase
    .from('staff_time_requests')
    .select(REQUEST_COLUMNS)
    .eq('org_id', orgId)
    .contains('metadata', { idempotency_key: idempotencyKey })
    .maybeSingle();

  if (existing) {
    return { request: existing as StaffTimeRequest, notifyDelayed: false };
  }

  const title = input.title?.trim() || defaultTitleForType(input.type);

  const { data, error } = await supabase
    .from('staff_time_requests')
    .insert({
      org_id: orgId,
      user_id: user.id,
      employee_name: profile.name,
      employee_email: profile.email,
      type: input.type,
      status: 'pending',
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      all_day: input.all_day,
      title,
      reason: input.reason?.trim() || null,
      metadata: { idempotency_key: idempotencyKey },
    })
    .select(REQUEST_COLUMNS)
    .single();

  if (error) throw error;

  const request = data as StaffTimeRequest;
  await logEvent(request.id, orgId, user.id, 'created', { type: request.type });

  const notify = await invokeHrNotify({ kind: 'submitted', request_id: request.id });
  if (notify.ok) {
    await supabase
      .from('staff_time_requests')
      .update({
        metadata: {
          ...request.metadata,
          notify_sent_at: new Date().toISOString(),
        },
      })
      .eq('id', request.id);
  }

  return { request, notifyDelayed: Boolean(notify.delayed) };
}

export async function cancelRequest(id: string): Promise<StaffTimeRequest> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  const { data, error } = await supabase
    .from('staff_time_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .select(REQUEST_COLUMNS)
    .single();

  if (error) throw error;
  await logEvent(data.id, data.org_id, user.id, 'cancelled');
  return data as StaffTimeRequest;
}

export async function decideRequest(
  id: string,
  input: DecideTimeRequestInput,
): Promise<{ request: StaffTimeRequest; notifyDelayed: boolean }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  const { data, error } = await supabase
    .from('staff_time_requests')
    .update({
      status: input.status,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
      decision_note: input.decision_note?.trim() || null,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select(REQUEST_COLUMNS)
    .single();

  if (error) throw error;

  await logEvent(data.id, data.org_id, user.id, input.status, {
    decision_note: input.decision_note ?? null,
  });

  const notify = await invokeHrNotify({ kind: 'decided', request_id: data.id });
  return { request: data as StaffTimeRequest, notifyDelayed: Boolean(notify.delayed) };
}

export async function uploadDocument(
  requestId: string,
  input: UploadDocumentInput,
): Promise<StaffTimeDocument> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  if (input.file.size > HR_MAX_UPLOAD_BYTES) {
    throw new Error('File must be 10MB or smaller');
  }
  if (!(HR_ALLOWED_MIME as readonly string[]).includes(input.file.type)) {
    throw new Error('Only PDF, JPG, PNG, or WebP files are allowed');
  }

  const request = await getRequest(requestId);
  if (!request) throw new Error('Request not found');
  if (request.user_id !== user.id) {
    throw new Error('Only the request owner can upload documents');
  }
  if (request.status === 'cancelled') {
    throw new Error('Cannot attach documents to a cancelled request');
  }

  const orgId = request.org_id;
  const ext = input.file.name.split('.').pop()?.toLowerCase() || 'bin';
  const objectName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `${orgId}/${user.id}/${requestId}/${objectName}`;

  const { error: uploadError } = await supabase.storage
    .from(HR_DOCUMENTS_BUCKET)
    .upload(storagePath, input.file, {
      contentType: input.file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('staff_time_documents')
    .insert({
      request_id: requestId,
      org_id: orgId,
      uploaded_by: user.id,
      storage_path: storagePath,
      file_name: input.file.name,
      mime_type: input.file.type,
      byte_size: input.file.size,
      kind: input.kind,
    })
    .select(DOCUMENT_COLUMNS)
    .single();

  if (error) {
    await supabase.storage.from(HR_DOCUMENTS_BUCKET).remove([storagePath]);
    throw error;
  }

  await logEvent(requestId, orgId, user.id, 'document_uploaded', {
    document_id: data.id,
    kind: input.kind,
    file_name: input.file.name,
  });

  return data as StaffTimeDocument;
}

export async function getDocumentSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(HR_DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, 60 * 5);

  if (error || !data?.signedUrl) throw error ?? new Error('Could not create download link');
  return data.signedUrl;
}

export function documentKindForType(
  type: string,
  preferred?: StaffTimeDocumentKind,
): StaffTimeDocumentKind {
  if (preferred) return preferred;
  if (type === 'sick' || type === 'doctor_appointment') return 'doctors_note';
  return 'supporting';
}
