import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowUpRight, CalendarPlus, Plus } from 'lucide-react';
import { useTenant } from '@mpbhealth/auth';
import { listMyRequests, type StaffTimeRequest } from '../lib/hr';
import {
  HrBezel,
  HrEmptyState,
  HrPageHeader,
  HrPrimaryButton,
  HrSkeletonRows,
} from '../components/hr/HrChrome';
import { StatusBadge, TypeBadge } from '../components/hr/StatusBadge';

function formatRange(r: StaffTimeRequest): string {
  const start = parseISO(r.starts_at);
  const end = parseISO(r.ends_at);
  if (r.all_day) {
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  }
  return `${format(start, 'MMM d, yyyy h:mm a')} - ${format(end, 'MMM d h:mm a')}`;
}

export default function TimeOff() {
  const { orgId, loading: tenantLoading } = useTenant();
  const [requests, setRequests] = useState<StaffTimeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenantLoading || !orgId) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await listMyRequests();
        if (!cancelled) setRequests(rows);
      } catch {
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantLoading, orgId]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="hr-surface animate-fade-up">
      <HrPageHeader
        title="Time off"
        subtitle="Request leave with dates and times. HR gets an email on every submit. Notes stay private."
        meta={
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--hr-muted)]">
            Workforce leave
          </p>
        }
        action={
          <Link to="/time-off/new">
            <HrPrimaryButton type="button">
              New request
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <Plus className="h-3.5 w-3.5" />
              </span>
            </HrPrimaryButton>
          </Link>
        }
      />

      {!loading && requests.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-3 text-sm">
          <div className="rounded-2xl bg-white px-4 py-3 shadow-[inset_0_0_0_1px_var(--hr-line)]">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[color:var(--hr-muted)]">
              Total
            </p>
            <p className="hr-display mt-0.5 text-xl font-semibold text-[color:var(--hr-ink)]">
              {requests.length}
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50/80 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.2)]">
            <p className="text-[11px] font-medium uppercase tracking-wide text-amber-800/70">
              Pending
            </p>
            <p className="hr-display mt-0.5 text-xl font-semibold text-amber-900">{pendingCount}</p>
          </div>
        </div>
      )}

      <HrBezel>
        {loading ? (
          <HrSkeletonRows rows={5} />
        ) : requests.length === 0 ? (
          <HrEmptyState
            icon={<CalendarPlus className="h-6 w-6" />}
            title="No requests yet"
            body="Create your first PTO, sick day, or appointment request. Attachments stay between you and HR."
            action={
              <Link to="/time-off/new">
                <HrPrimaryButton type="button">
                  Create request
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </HrPrimaryButton>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-[color:var(--hr-line)]">
            {requests.map((r, i) => (
              <li
                key={r.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <Link
                  to={`/time-off/${r.id}`}
                  className="group flex flex-col gap-3 px-4 py-4 transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[color:var(--hr-mist)]/60 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <TypeBadge type={r.type} />
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="truncate text-sm font-semibold text-[color:var(--hr-ink)]">
                      {r.title}
                    </p>
                    <p className="font-mono text-[11px] text-[color:var(--hr-muted)]">
                      {formatRange(r)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--hr-accent)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                    Open
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </HrBezel>
    </div>
  );
}
