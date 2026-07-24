import { REQUEST_TYPE_META, STATUS_META, type StaffTimeRequestStatus, type StaffTimeRequestType } from '../../lib/hr';

export function StatusBadge({ status }: { status: StaffTimeRequestStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

export function TypeBadge({ type }: { type: StaffTimeRequestType }) {
  const meta = REQUEST_TYPE_META[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.bg} ${meta.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}
