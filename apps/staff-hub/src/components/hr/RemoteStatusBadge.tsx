import { REMOTE_STATUS_META, type StaffRemoteStatus } from '../../lib/hr';

export function RemoteStatusBadge({ status }: { status: StaffRemoteStatus }) {
  const meta = REMOTE_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
