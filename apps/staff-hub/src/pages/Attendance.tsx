import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTenant } from '@mpbhealth/auth';
import {
  getActiveOffice,
  getBrowserPosition,
  getOpenSession,
  listMySessions,
  loadAttendanceContext,
  punchAttendance,
  requestStandingRemote,
  type StaffAttendanceSession,
  type StaffOfficeLocation,
  type StaffProfile,
} from '../lib/hr';
import { HrBezel, HrPageHeader, HrSecondaryButton } from '../components/hr/HrChrome';
import { ClockPunchCard } from '../components/hr/ClockPunchCard';
import { GeoGateBanner } from '../components/hr/GeoGateBanner';
import { RemoteStatusBadge } from '../components/hr/RemoteStatusBadge';

export default function Attendance() {
  const { orgId, loading: tenantLoading } = useTenant();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [remoteEligible, setRemoteEligible] = useState(false);
  const [office, setOffice] = useState<StaffOfficeLocation | null>(null);
  const [openSession, setOpenSession] = useState<StaffAttendanceSession | null>(null);
  const [history, setHistory] = useState<StaffAttendanceSession[]>([]);
  const [remoteNote, setRemoteNote] = useState('');

  const reload = async () => {
    const [ctx, officeRow, open, sessions] = await Promise.all([
      loadAttendanceContext(),
      getActiveOffice(),
      getOpenSession(),
      listMySessions(20),
    ]);
    setProfile(ctx.profile);
    setRemoteEligible(ctx.remoteEligible);
    setOffice(officeRow);
    setOpenSession(open);
    setHistory(sessions);
  };

  useEffect(() => {
    if (tenantLoading || !orgId) return;
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load attendance');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantLoading, orgId]);

  const runPunch = async (action: 'clock_in' | 'clock_out') => {
    if (busy) return;
    setBusy(true);
    // Stable for this attempt so a network retry cannot double-create a session.
    const idempotencyKey = `${action}:${crypto.randomUUID()}`;
    try {
      let position = null;
      // Always re-check eligibility at punch time via RPC; client only decides whether to prompt GPS.
      if (!remoteEligible) {
        toast.loading('Getting your location…', { id: 'geo' });
        position = await getBrowserPosition();
        toast.dismiss('geo');
      }

      const result = await punchAttendance({
        action,
        position,
        idempotency_key: idempotencyKey,
      });

      if (!result.ok) {
        toast.error(result.message || result.error || 'Punch failed');
        return;
      }

      toast.success(action === 'clock_in' ? 'Clocked in' : 'Clocked out');
      await reload();
    } catch (err) {
      toast.dismiss('geo');
      toast.error(err instanceof Error ? err.message : 'Punch failed');
    } finally {
      setBusy(false);
    }
  };

  const onRequestRemote = async () => {
    setBusy(true);
    try {
      const { notifyDelayed } = await requestStandingRemote(remoteNote);
      await reload();
      toast.success(
        notifyDelayed
          ? 'Remote request submitted. Email may be delayed.'
          : 'Remote request submitted for HR approval',
      );
      setRemoteNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#0A4E8E]" />
      </div>
    );
  }

  return (
    <div className="hr-surface animate-fade-up space-y-8">
      <HrPageHeader
        title="Attendance"
        subtitle="Clock in and out for your workday. Portal login works from anywhere — punches require the office unless HR approves remote."
        meta={profile ? <RemoteStatusBadge status={profile.remote_status} /> : null}
      />

      {profile ? (
        <GeoGateBanner
          remoteEligible={remoteEligible}
          remoteStatus={profile.remote_status}
          office={office}
        />
      ) : null}

      <HrBezel>
        <div className="p-4 sm:p-6">
          <ClockPunchCard
            openSession={openSession}
            remoteEligible={remoteEligible}
            busy={busy}
            onClockIn={() => void runPunch('clock_in')}
            onClockOut={() => void runPunch('clock_out')}
          />
        </div>
      </HrBezel>

      {profile &&
        (profile.remote_status === 'ineligible' || profile.remote_status === 'revoked') && (
          <HrBezel>
            <div className="space-y-3 p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-slate-800">Request standing remote</h2>
              <p className="text-xs text-slate-500">
                HR must approve before you can punch without being at the office. Dated remote
                days can also be requested under Time Off.
              </p>
              <textarea
                value={remoteNote}
                onChange={(e) => setRemoteNote(e.target.value)}
                rows={3}
                placeholder="Optional note for HR"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none ring-sky-200 focus:ring-2"
              />
              <HrSecondaryButton type="button" disabled={busy} onClick={() => void onRequestRemote()}>
                Submit remote request
              </HrSecondaryButton>
            </div>
          </HrBezel>
        )}

      <HrBezel>
        <div className="p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-800">Recent punches</h2>
          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No attendance records yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {format(parseISO(s.clock_in_at), 'EEE, MMM d · h:mm a')}
                      {s.clock_out_at
                        ? ` – ${format(parseISO(s.clock_out_at), 'h:mm a')}`
                        : ' – open'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.method === 'remote' ? 'Remote' : 'Office'}
                      {s.clock_in_distance_m != null
                        ? ` · ${Math.round(s.clock_in_distance_m)}m from office`
                        : ''}
                    </p>
                  </div>
                  <span className="text-xs capitalize text-slate-500">{s.status.replace('_', ' ')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </HrBezel>
    </div>
  );
}
