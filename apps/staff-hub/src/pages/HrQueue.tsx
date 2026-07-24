import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ClipboardList, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@mpbhealth/database';
import { useTenant } from '@mpbhealth/auth';
import {
  checkIsStaffHr,
  decideRequest,
  listAllForHr,
  listPendingForHr,
  type StaffTimeRequest,
} from '../lib/hr';
import { HrBezel, HrPageHeader, HrPrimaryButton, HrSecondaryButton } from '../components/hr/HrChrome';
import { StatusBadge, TypeBadge } from '../components/hr/StatusBadge';

export default function HrQueue() {
  const { orgId, loading: tenantLoading } = useTenant();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [pending, setPending] = useState<StaffTimeRequest[]>([]);
  const [recent, setRecent] = useState<StaffTimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const reload = async () => {
    const [p, all] = await Promise.all([listPendingForHr(), listAllForHr()]);
    setPending(p);
    setRecent(all.filter((r) => r.status !== 'pending').slice(0, 40));
  };

  useEffect(() => {
    if (tenantLoading || !orgId) return;
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const hr = checkIsStaffHr(user?.email);
      if (!cancelled) setAllowed(hr);
      if (!hr) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        await reload();
      } catch {
        toast.error('Could not load HR queue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantLoading, orgId]);

  const onDecide = async (id: string, status: 'approved' | 'denied') => {
    setActingId(id);
    try {
      const { notifyDelayed } = await decideRequest(id, { status });
      await reload();
      toast.success(
        notifyDelayed
          ? `Marked ${status}. Email may be delayed.`
          : `Request ${status}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActingId(null);
    }
  };

  if (allowed === false) {
    return <Navigate to="/time-off" replace />;
  }

  if (loading || allowed === null) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#0A4E8E]" />
      </div>
    );
  }

  return (
    <div className="hr-surface animate-fade-up space-y-8">
      <HrPageHeader
        title="HR queue"
        subtitle="Review pending time-off and leave requests. Approvals notify the employee by email."
      />

      <HrBezel>
        <div className="p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#0A4E8E]" />
            <h2 className="text-sm font-semibold text-slate-800">
              Pending ({pending.length})
            </h2>
          </div>
          {pending.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">All caught up - no pending requests.</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((r) => (
                <li
                  key={r.id}
                  className="rounded-2xl bg-slate-50/80 p-4 ring-1 ring-slate-200/70"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-2">
                        <TypeBadge type={r.type} />
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{r.employee_name}</p>
                      <p className="text-xs text-slate-500">{r.employee_email}</p>
                      <p className="text-xs text-slate-600">
                        {format(parseISO(r.starts_at), 'MMM d, yyyy')}
                        {r.all_day
                          ? ' · all day'
                          : ` · ${format(parseISO(r.starts_at), 'h:mm a')} - ${format(parseISO(r.ends_at), 'h:mm a')}`}
                      </p>
                      {r.reason && (
                        <p className="mt-2 line-clamp-2 text-xs text-slate-500">{r.reason}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/time-off/${r.id}`}>
                        <HrSecondaryButton type="button">Open</HrSecondaryButton>
                      </Link>
                      <HrPrimaryButton
                        type="button"
                        disabled={actingId === r.id}
                        className="!bg-emerald-600 hover:!bg-emerald-700"
                        onClick={() => void onDecide(r.id, 'approved')}
                      >
                        Approve
                      </HrPrimaryButton>
                      <HrSecondaryButton
                        type="button"
                        disabled={actingId === r.id}
                        className="!text-rose-700 !ring-rose-200"
                        onClick={() => void onDecide(r.id, 'denied')}
                      >
                        Deny
                      </HrSecondaryButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </HrBezel>

      <HrBezel>
        <div className="p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Recent decisions</h2>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No decisions yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/time-off/${r.id}`}
                    className="flex flex-col gap-2 px-1 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {r.employee_name} · {r.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(parseISO(r.starts_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </HrBezel>
    </div>
  );
}
