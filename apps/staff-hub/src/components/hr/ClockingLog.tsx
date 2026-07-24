import { differenceInMinutes, format, isToday, isYesterday, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import type { StaffAttendanceSession } from '../../lib/hr';
import { HrBezel } from './HrChrome';

function durationLabel(session: StaffAttendanceSession): string {
  if (!session.clock_out_at) return 'Open';
  const mins = Math.max(
    0,
    differenceInMinutes(parseISO(session.clock_out_at), parseISO(session.clock_in_at)),
  );
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function dayHeading(iso: string): string {
  const d = parseISO(iso);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM d');
}

function groupByDay(sessions: StaffAttendanceSession[]) {
  const groups: { key: string; label: string; rows: StaffAttendanceSession[] }[] = [];
  for (const session of sessions) {
    const key = format(parseISO(session.clock_in_at), 'yyyy-MM-dd');
    const existing = groups.find((g) => g.key === key);
    if (existing) {
      existing.rows.push(session);
    } else {
      groups.push({ key, label: dayHeading(session.clock_in_at), rows: [session] });
    }
  }
  return groups;
}

export function ClockingLog({
  sessions,
  title = 'Your clocking log',
  emptyBody = 'Clock in to start your personal attendance history.',
  subtitle = 'Visible to you. Staff HR can also review org attendance.',
  compact = false,
  showViewAll = false,
  employeeNameByUserId,
}: {
  sessions: StaffAttendanceSession[];
  title?: string;
  emptyBody?: string;
  subtitle?: string | null;
  compact?: boolean;
  showViewAll?: boolean;
  /** When set, shows the staff name for each row (HR floor view). */
  employeeNameByUserId?: Record<string, string>;
}) {
  const groups = groupByDay(sessions);
  const visible = compact ? groups.slice(0, 2) : groups;

  return (
    <HrBezel>
      <div className={compact ? 'p-4 sm:p-5' : 'p-5 sm:p-6'}>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-[color:var(--hr-ink)]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-xs text-[color:var(--hr-muted)]">{subtitle}</p>
            ) : null}
          </div>
          {showViewAll ? (
            <Link
              to="/attendance"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--hr-accent)]"
            >
              Full log
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-[color:var(--hr-mist)]/50 px-4 py-10 text-center">
            <div className="hr-icon-well hr-icon-well-accent mb-3">
              <Clock3 className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-[color:var(--hr-ink)]">No punches yet</p>
            <p className="mt-1 max-w-xs text-xs text-[color:var(--hr-muted)]">{emptyBody}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {visible.map((group) => (
              <div key={group.key}>
                <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--hr-muted)]">
                  {group.label}
                </p>
                <ul className="space-y-2">
                  {group.rows.map((s) => {
                    const name = employeeNameByUserId?.[s.user_id];
                    return (
                      <li key={s.id} className="hub-clock-row">
                        <div className="min-w-0">
                          {name ? (
                            <p className="truncate text-sm font-semibold text-[color:var(--hr-ink)]">
                              {name}
                            </p>
                          ) : null}
                          <p
                            className={`font-mono text-[13px] text-[color:var(--hr-ink)] ${
                              name ? 'mt-0.5' : 'font-medium'
                            }`}
                          >
                            {format(parseISO(s.clock_in_at), 'h:mm a')}
                            {' - '}
                            {s.clock_out_at
                              ? format(parseISO(s.clock_out_at), 'h:mm a')
                              : 'now'}
                          </p>
                          <p className="mt-0.5 text-xs text-[color:var(--hr-muted)]">
                            {s.method === 'remote' ? 'Remote' : 'Office'}
                            {s.clock_in_distance_m != null
                              ? ` · ${Math.round(s.clock_in_distance_m)}m in`
                              : ''}
                            {s.status === 'open' ? ' · in progress' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-semibold tabular-nums text-[color:var(--hr-ink)]">
                            {durationLabel(s)}
                          </p>
                          <p className="mt-0.5 text-[11px] capitalize text-[color:var(--hr-muted)]">
                            {s.status.replace('_', ' ')}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </HrBezel>
  );
}
