export const HR_TIME_OFF_ENABLED = true;

export const HR_NOTIFY_EMAILS = [
  'accounting@mympb.com',
  'catherine@mympb.com',
  'dayra@mympb.com',
] as const;

export const STAFF_HUB_PORTAL_URL = 'https://staff.mpb.health';

export const HR_DOCUMENTS_BUCKET = 'staff-hr-documents';
export const HR_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const HR_ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ARYX_APPS = [
  {
    key: 'aryx-crm',
    name: 'ARYX CRM (MPB)',
    description: 'MPB revenue OS - leads, pipeline, and customer operations',
    url: 'https://mpb.crm.aryx.pro/login',
  },
  {
    key: 'enrollflow',
    name: 'EnrollFlow (MPB)',
    description: 'ARYX enrollment workflows for MPB members and groups',
    url: 'https://enrollflow.aryx.pro/admin/signin',
  },
] as const;

export type StaffTimeRequestType =
  | 'pto'
  | 'sick'
  | 'doctor_appointment'
  | 'leave_early'
  | 'arrive_late'
  | 'remote'
  | 'bereavement'
  | 'jury_duty'
  | 'unpaid_leave'
  | 'personal'
  | 'parental'
  | 'other';

export type StaffTimeRequestStatus = 'pending' | 'approved' | 'denied' | 'cancelled';

export type StaffTimeDocumentKind = 'doctors_note' | 'supporting';

export const REQUEST_TYPE_META: Record<
  StaffTimeRequestType,
  { label: string; color: string; bg: string; dot: string; border: string }
> = {
  pto: {
    label: 'Paid time off',
    color: 'text-sky-800',
    bg: 'bg-sky-100',
    dot: 'bg-sky-500',
    border: 'border-sky-300',
  },
  sick: {
    label: 'Sick day',
    color: 'text-rose-800',
    bg: 'bg-rose-100',
    dot: 'bg-rose-500',
    border: 'border-rose-300',
  },
  doctor_appointment: {
    label: 'Doctor appointment',
    color: 'text-fuchsia-800',
    bg: 'bg-fuchsia-100',
    dot: 'bg-fuchsia-500',
    border: 'border-fuchsia-300',
  },
  leave_early: {
    label: 'Leave early',
    color: 'text-amber-800',
    bg: 'bg-amber-100',
    dot: 'bg-amber-500',
    border: 'border-amber-300',
  },
  arrive_late: {
    label: 'Arrive late',
    color: 'text-orange-800',
    bg: 'bg-orange-100',
    dot: 'bg-orange-500',
    border: 'border-orange-300',
  },
  remote: {
    label: 'Remote / WFH',
    color: 'text-emerald-800',
    bg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
    border: 'border-emerald-300',
  },
  bereavement: {
    label: 'Bereavement',
    color: 'text-slate-800',
    bg: 'bg-slate-200',
    dot: 'bg-slate-600',
    border: 'border-slate-400',
  },
  jury_duty: {
    label: 'Jury duty',
    color: 'text-indigo-800',
    bg: 'bg-indigo-100',
    dot: 'bg-indigo-500',
    border: 'border-indigo-300',
  },
  unpaid_leave: {
    label: 'Unpaid leave',
    color: 'text-stone-800',
    bg: 'bg-stone-100',
    dot: 'bg-stone-500',
    border: 'border-stone-300',
  },
  personal: {
    label: 'Personal day',
    color: 'text-teal-800',
    bg: 'bg-teal-100',
    dot: 'bg-teal-500',
    border: 'border-teal-300',
  },
  parental: {
    label: 'Parental leave',
    color: 'text-blue-900',
    bg: 'bg-blue-100',
    dot: 'bg-blue-600',
    border: 'border-blue-300',
  },
  other: {
    label: 'Other',
    color: 'text-zinc-800',
    bg: 'bg-zinc-100',
    dot: 'bg-zinc-500',
    border: 'border-zinc-300',
  },
};

export const STATUS_META: Record<
  StaffTimeRequestStatus,
  { label: string; className: string }
> = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-800 ring-amber-200' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  denied: { label: 'Denied', className: 'bg-rose-50 text-rose-800 ring-rose-200' },
  cancelled: { label: 'Cancelled', className: 'bg-slate-50 text-slate-600 ring-slate-200' },
};

export function isHrEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (HR_NOTIFY_EMAILS as readonly string[]).includes(normalized);
}

export function defaultTitleForType(type: StaffTimeRequestType): string {
  return REQUEST_TYPE_META[type].label;
}
