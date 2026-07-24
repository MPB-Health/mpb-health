import { Loader2, LogIn, LogOut } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { StaffAttendanceSession } from '../../lib/hr';
import { HrPrimaryButton, HrSecondaryButton } from './HrChrome';

export function ClockPunchCard({
  openSession,
  remoteEligible,
  busy,
  onClockIn,
  onClockOut,
}: {
  openSession: StaffAttendanceSession | null;
  remoteEligible: boolean;
  busy: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
}) {
  const clockedIn = Boolean(openSession);

  return (
    <div className="rounded-2xl bg-[color:var(--hr-mist)]/60 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[color:var(--hr-muted)]">
            Time clock
          </p>
          <p className="mt-1 text-lg font-semibold text-[color:var(--hr-ink)]">
            {clockedIn ? 'You are clocked in' : 'Ready to clock in'}
          </p>
          {openSession ? (
            <p className="mt-1 text-sm text-[color:var(--hr-muted)]">
              Since {format(parseISO(openSession.clock_in_at), 'h:mm a')}
              {openSession.method === 'remote' ? ' · remote' : ' · office'}
            </p>
          ) : (
            <p className="mt-1 text-sm text-[color:var(--hr-muted)]">
              {remoteEligible
                ? 'Remote punch — location not required'
                : 'We will confirm you are near the Boca office'}
            </p>
          )}
        </div>

        {clockedIn ? (
          <HrSecondaryButton
            type="button"
            disabled={busy}
            onClick={onClockOut}
            className="inline-flex min-w-[10rem] items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Clock out
          </HrSecondaryButton>
        ) : (
          <HrPrimaryButton
            type="button"
            disabled={busy}
            onClick={onClockIn}
            className="inline-flex min-w-[10rem] items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Clock in
          </HrPrimaryButton>
        )}
      </div>
    </div>
  );
}
