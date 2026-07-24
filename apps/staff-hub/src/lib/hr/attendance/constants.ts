export const HR_ATTENDANCE_ENABLED = true;

export const OFFICE_GEO_DEFAULTS = {
  radius_m: 150,
  max_accuracy_m: 100,
  accuracy_credit_cap_m: 50,
} as const;

export type StaffRemoteStatus = 'ineligible' | 'pending' | 'approved' | 'revoked';
export type StaffPunchMethod = 'office_geo' | 'remote' | 'hr_manual';
export type StaffAttendanceSessionStatus = 'open' | 'closed' | 'forced_closed';
export type StaffAttendancePunchAction = 'clock_in' | 'clock_out';

export const REMOTE_STATUS_META: Record<
  StaffRemoteStatus,
  { label: string; className: string }
> = {
  ineligible: {
    label: 'Office required',
    className: 'bg-slate-50 text-slate-700 ring-slate-200',
  },
  pending: {
    label: 'Remote pending',
    className: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  approved: {
    label: 'Remote approved',
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  },
  revoked: {
    label: 'Remote revoked',
    className: 'bg-rose-50 text-rose-800 ring-rose-200',
  },
};
