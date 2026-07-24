import { format, parseISO } from 'date-fns';
import { Loader2, LogIn, LogOut, MapPin } from 'lucide-react';
import type { StaffAttendanceSession, StaffProfile } from '../../lib/hr';
import { HrPrimaryButton, HrSecondaryButton } from './HrChrome';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'ST';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function DashboardPresenceHero({
  greeting,
  profile,
  openSession,
  remoteEligible,
  busy,
  loading,
  onClockIn,
  onClockOut,
}: {
  greeting: string;
  profile: StaffProfile | null;
  openSession: StaffAttendanceSession | null;
  remoteEligible: boolean;
  busy: boolean;
  loading: boolean;
  onClockIn: () => void;
  onClockOut: () => void;
}) {
  const name = profile?.display_name?.trim() || 'Staff member';
  const title = profile?.title?.trim() || 'Team member';
  const department = profile?.department?.name?.trim() || 'Unassigned department';
  const clockedIn = Boolean(openSession);

  return (
    <section className="hub-presence animate-fade-up" aria-label="Your presence">
      <div className="hub-presence-bezel">
        <div className="hub-presence-plate">
          <div className="hub-presence-mesh" aria-hidden />

          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="hub-presence-kicker">{greeting}</p>

              <div className="mt-4 flex items-start gap-4">
                <div className="hub-presence-avatar" aria-hidden>
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin opacity-70" />
                  ) : (
                    initials(name)
                  )}
                </div>
                <div className="min-w-0 pt-0.5">
                  <h1 className="hub-presence-name">{name}</h1>
                  <p className="mt-1.5 text-[0.95rem] font-medium text-[color:var(--hr-ink)]/85">
                    {title}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--hr-muted)]">{department}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span
                  className={`hub-presence-chip ${
                    clockedIn ? 'hub-presence-chip-live' : 'hub-presence-chip-idle'
                  }`}
                >
                  <span className="hub-presence-dot" aria-hidden />
                  {clockedIn ? 'On the clock' : 'Not clocked in'}
                </span>
                {openSession ? (
                  <span className="hub-presence-meta font-mono">
                    Since {format(parseISO(openSession.clock_in_at), 'h:mm a')}
                    {openSession.method === 'remote' ? ' · remote' : ' · office'}
                  </span>
                ) : (
                  <span className="hub-presence-meta inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {remoteEligible
                      ? 'Remote punch available'
                      : 'Office geofence required'}
                  </span>
                )}
              </div>
            </div>

            <div className="hub-presence-action">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--hr-muted)]">
                Time clock
              </p>
              <p className="mt-1 text-sm text-[color:var(--hr-muted)]">
                {clockedIn ? 'End your session when you leave.' : 'Start your workday here.'}
              </p>
              <div className="mt-4">
                {clockedIn ? (
                  <HrSecondaryButton
                    type="button"
                    disabled={busy || loading}
                    onClick={onClockOut}
                    className="w-full justify-center !px-6 !py-3.5 text-base sm:min-w-[14rem]"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    Clock out
                  </HrSecondaryButton>
                ) : (
                  <HrPrimaryButton
                    type="button"
                    disabled={busy || loading}
                    onClick={onClockIn}
                    className="w-full justify-center !px-6 !py-3.5 text-base sm:min-w-[14rem]"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogIn className="h-4 w-4" />
                    )}
                    Clock in
                  </HrPrimaryButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
