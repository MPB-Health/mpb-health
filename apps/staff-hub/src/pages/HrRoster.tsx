import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Loader2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTenant } from '@mpbhealth/auth';
import {
  checkIsStaffHr,
  createDepartment,
  decideStandingRemote,
  listDepartments,
  listRoster,
  updateRosterProfile,
  type StaffDepartment,
  type StaffProfile,
} from '../lib/hr';
import { HrBezel, HrPageHeader, HrPrimaryButton, HrSecondaryButton } from '../components/hr/HrChrome';
import { RemoteStatusBadge } from '../components/hr/RemoteStatusBadge';

export default function HrRoster() {
  const { orgId, loading: tenantLoading } = useTenant();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<StaffProfile[]>([]);
  const [departments, setDepartments] = useState<StaffDepartment[]>([]);
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [newDept, setNewDept] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const reload = async () => {
    const [people, depts] = await Promise.all([
      listRoster(true),
      listDepartments(true),
    ]);
    setRoster(people);
    setDepartments(depts);
  };

  useEffect(() => {
    if (tenantLoading || !orgId) return;
    let cancelled = false;
    (async () => {
      const hr = await checkIsStaffHr();
      if (!cancelled) setAllowed(hr);
      if (!hr) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        await reload();
      } catch {
        toast.error('Could not load roster');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantLoading, orgId]);

  const filtered = useMemo(() => {
    if (deptFilter === 'all') return roster;
    if (deptFilter === 'none') return roster.filter((p) => !p.department_id);
    return roster.filter((p) => p.department_id === deptFilter);
  }, [roster, deptFilter]);

  const onDeptChange = async (profileId: string, departmentId: string) => {
    setActingId(profileId);
    try {
      await updateRosterProfile(profileId, {
        department_id: departmentId || null,
      });
      await reload();
      toast.success('Department updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActingId(null);
    }
  };

  const onRemote = async (profileId: string, status: 'approved' | 'denied' | 'revoked') => {
    setActingId(profileId);
    try {
      const { notifyDelayed } = await decideStandingRemote(profileId, { status });
      await reload();
      toast.success(
        notifyDelayed
          ? `Remote ${status}. Email may be delayed.`
          : `Remote ${status}`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setActingId(null);
    }
  };

  const onAddDept = async () => {
    if (!newDept.trim()) return;
    setActingId('dept');
    try {
      await createDepartment(newDept.trim());
      setNewDept('');
      await reload();
      toast.success('Department added');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add department');
    } finally {
      setActingId(null);
    }
  };

  if (allowed === false) {
    return <Navigate to="/attendance" replace />;
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
        title="Staff roster"
        subtitle="Full team directory, departments, and standing remote approvals."
        action={
          <Link to="/hr">
            <HrSecondaryButton type="button">HR queue</HrSecondaryButton>
          </Link>
        }
      />

      <HrBezel>
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Users className="h-4 w-4 text-[#0A4E8E]" />
                Team ({filtered.length})
              </h2>
              <label className="mt-2 block text-xs text-slate-500">
                Department filter
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm sm:w-56"
                >
                  <option value="all">All departments</option>
                  <option value="none">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {!d.is_active ? ' (inactive)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              <input
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                placeholder="New department"
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <HrPrimaryButton
                type="button"
                disabled={actingId === 'dept' || !newDept.trim()}
                onClick={() => void onAddDept()}
              >
                Add
              </HrPrimaryButton>
            </div>
          </div>

          <ul className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{p.display_name}</p>
                    <RemoteStatusBadge status={p.remote_status} />
                    {!p.is_active ? (
                      <span className="text-[11px] text-rose-600">Inactive</span>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">{p.email}</p>
                  {p.title ? <p className="text-xs text-slate-600">{p.title}</p> : null}
                  {p.remote_status === 'pending' && p.remote_request_note ? (
                    <p className="text-xs text-amber-800">{p.remote_request_note}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={p.department_id ?? ''}
                    disabled={actingId === p.id}
                    onChange={(e) => void onDeptChange(p.id, e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  >
                    <option value="">No department</option>
                    {departments
                      .filter((d) => d.is_active || d.id === p.department_id)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>

                  {p.remote_status === 'pending' ? (
                    <>
                      <HrPrimaryButton
                        type="button"
                        disabled={actingId === p.id}
                        className="!bg-emerald-600 hover:!bg-emerald-700"
                        onClick={() => void onRemote(p.id, 'approved')}
                      >
                        Approve remote
                      </HrPrimaryButton>
                      <HrSecondaryButton
                        type="button"
                        disabled={actingId === p.id}
                        className="!text-rose-700 !ring-rose-200"
                        onClick={() => void onRemote(p.id, 'denied')}
                      >
                        Deny
                      </HrSecondaryButton>
                    </>
                  ) : null}

                  {p.remote_status === 'approved' ? (
                    <HrSecondaryButton
                      type="button"
                      disabled={actingId === p.id}
                      className="!text-rose-700 !ring-rose-200"
                      onClick={() => void onRemote(p.id, 'revoked')}
                    >
                      Revoke remote
                    </HrSecondaryButton>
                  ) : null}

                  {(p.remote_status === 'ineligible' || p.remote_status === 'revoked') ? (
                    <HrSecondaryButton
                      type="button"
                      disabled={actingId === p.id}
                      onClick={() => void onRemote(p.id, 'approved')}
                    >
                      Mark remote
                    </HrSecondaryButton>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </HrBezel>
    </div>
  );
}
