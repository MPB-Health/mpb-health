import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { supabase } from '@mpbhealth/database';
import { useTenant } from '@mpbhealth/auth';
import {
  REQUEST_TYPE_META,
  loadTeamCalendar,
  type StaffTimeCalendarEntry,
  type StaffTimeRequestType,
} from '../lib/hr';
import { HrBezel, HrPageHeader, HrPrimaryButton, HrSecondaryButton } from '../components/hr/HrChrome';

type ViewType = 'month' | 'week' | 'day' | 'agenda';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function overlapsDay(entry: StaffTimeCalendarEntry, day: Date): boolean {
  const start = parseISO(entry.starts_at);
  const end = parseISO(entry.ends_at);
  return start <= endOfDay(day) && end >= startOfDay(day);
}

function entryLabel(entry: StaffTimeCalendarEntry, mine: boolean): string {
  const type = REQUEST_TYPE_META[entry.type].label;
  if (mine) return type;
  return `${entry.employee_name.split(' ')[0]} · ${type}`;
}

export default function StaffCalendar() {
  const navigate = useNavigate();
  const { orgId, loading: tenantLoading } = useTenant();
  const [view, setView] = useState<ViewType>('month');
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [entries, setEntries] = useState<StaffTimeCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [mineOnly, setMineOnly] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<StaffTimeRequestType | 'all'>('all');

  const range = useMemo(() => {
    if (view === 'month') {
      const start = startOfWeek(startOfMonth(cursor));
      const end = endOfWeek(endOfMonth(cursor));
      return { start, end };
    }
    if (view === 'week') {
      return { start: startOfWeek(cursor), end: endOfWeek(cursor) };
    }
    if (view === 'agenda') {
      return { start: startOfDay(cursor), end: addDays(cursor, 30) };
    }
    return { start: startOfDay(cursor), end: endOfDay(cursor) };
  }, [cursor, view]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (tenantLoading || !orgId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const rows = await loadTeamCalendar(range.start, range.end);
        if (!cancelled) setEntries(rows);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantLoading, orgId, range.start, range.end]);

  const visible = useMemo(() => {
    return entries.filter((e) => {
      if (mineOnly && userId && e.user_id !== userId) return false;
      if (typeFilter !== 'all' && e.type !== typeFilter) return false;
      return true;
    });
  }, [entries, mineOnly, userId, typeFilter]);

  const monthDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(cursor)),
      end: endOfWeek(endOfMonth(cursor)),
    });
  }, [cursor]);

  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: startOfWeek(cursor), end: endOfWeek(cursor) });
  }, [cursor]);

  const title = useMemo(() => {
    if (view === 'month') return format(cursor, 'MMMM yyyy');
    if (view === 'week') {
      return `${format(startOfWeek(cursor), 'MMM d')} - ${format(endOfWeek(cursor), 'MMM d, yyyy')}`;
    }
    if (view === 'agenda') return `Next 30 days from ${format(cursor, 'MMM d')}`;
    return format(cursor, 'EEEE, MMM d, yyyy');
  }, [cursor, view]);

  const shift = (dir: -1 | 1) => {
    if (view === 'month') setCursor((d) => addMonths(d, dir));
    else if (view === 'week') setCursor((d) => addDays(d, dir * 7));
    else if (view === 'agenda') setCursor((d) => addDays(d, dir * 30));
    else setCursor((d) => addDays(d, dir));
  };

  return (
    <div className="hr-surface animate-fade-up space-y-6">
      <HrPageHeader
        title="Team calendar"
        subtitle="Pending and approved absences across Staff Hub. Doctor notes stay private."
        action={
          <Link to="/time-off/new">
            <HrPrimaryButton type="button">
              <Plus className="h-4 w-4" />
              Request time off
            </HrPrimaryButton>
          </Link>
        }
      />

      {/* Absence ribbon legend */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(REQUEST_TYPE_META) as StaffTimeRequestType[]).slice(0, 8).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter((prev) => (prev === t ? 'all' : t))}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-opacity ${
              REQUEST_TYPE_META[t].bg
            } ${REQUEST_TYPE_META[t].color} ${
              typeFilter !== 'all' && typeFilter !== t ? 'opacity-40' : ''
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${REQUEST_TYPE_META[t].dot}`} />
            {REQUEST_TYPE_META[t].label}
          </button>
        ))}
      </div>

      <HrBezel>
        <div className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <HrSecondaryButton type="button" onClick={() => shift(-1)} aria-label="Previous">
                <ChevronLeft className="h-4 w-4" />
              </HrSecondaryButton>
              <h2 className="min-w-[10rem] text-center text-base font-semibold text-slate-900 sm:min-w-[14rem]">
                {title}
              </h2>
              <HrSecondaryButton type="button" onClick={() => shift(1)} aria-label="Next">
                <ChevronRight className="h-4 w-4" />
              </HrSecondaryButton>
              <HrSecondaryButton type="button" onClick={() => setCursor(startOfDay(new Date()))}>
                Today
              </HrSecondaryButton>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['month', 'week', 'day', 'agenda'] as ViewType[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                    view === v
                      ? 'bg-[#0A4E8E] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {v}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMineOnly((v) => !v)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  mineOnly
                    ? 'bg-[#A4CC43]/25 text-slate-800 ring-1 ring-[#A4CC43]/50'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {mineOnly ? 'Mine' : 'Team'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#0A4E8E]" />
            </div>
          ) : view === 'month' ? (
            <div>
              <div className="mb-2 grid grid-cols-7 gap-px">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="px-1 py-2 text-center text-[11px] font-medium text-slate-400">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/80">
                {monthDays.map((day) => {
                  const dayEntries = visible.filter((e) => overlapsDay(e, day));
                  const inMonth = isSameMonth(day, cursor);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={day.toISOString()}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setCursor(day);
                        setView('day');
                      }}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault();
                          setCursor(day);
                          setView('day');
                        }
                      }}
                      onDoubleClick={() =>
                        navigate(`/time-off/new?date=${format(day, 'yyyy-MM-dd')}`)
                      }
                      className={`min-h-[5.5rem] cursor-pointer bg-white p-1.5 text-left transition-colors hover:bg-sky-50/50 sm:min-h-[6.5rem] sm:p-2 ${
                        !inMonth ? 'bg-slate-50/80 text-slate-300' : ''
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                          isToday ? 'bg-[#0A4E8E] text-white' : 'text-slate-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEntries.slice(0, 3).map((e) => (
                          <Link
                            key={e.id}
                            to={`/time-off/${e.id}`}
                            onClick={(ev) => ev.stopPropagation()}
                            className={`block truncate rounded-md px-1 py-0.5 text-[10px] font-medium leading-tight ${
                              REQUEST_TYPE_META[e.type].bg
                            } ${REQUEST_TYPE_META[e.type].color}`}
                          >
                            {entryLabel(e, Boolean(userId && e.user_id === userId))}
                          </Link>
                        ))}
                        {dayEntries.length > 3 && (
                          <span className="px-1 text-[10px] text-slate-400">
                            +{dayEntries.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : view === 'week' || view === 'day' ? (
            <div className={`grid gap-2 ${view === 'week' ? 'grid-cols-1 sm:grid-cols-7' : ''}`}>
              {(view === 'week' ? weekDays : [cursor]).map((day) => {
                const dayEntries = visible.filter((e) => overlapsDay(e, day));
                return (
                  <div
                    key={day.toISOString()}
                    className="rounded-2xl bg-slate-50/80 p-3 ring-1 ring-slate-200/60"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">
                        {format(day, view === 'week' ? 'EEE d' : 'EEEE, MMM d')}
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate(`/time-off/new?date=${format(day, 'yyyy-MM-dd')}`)}
                        className="text-xs text-[#0A4E8E]"
                      >
                        + Add
                      </button>
                    </div>
                    {dayEntries.length === 0 ? (
                      <p className="text-xs text-slate-400">No absences</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {dayEntries.map((e) => (
                          <li key={e.id}>
                            <Link
                              to={`/time-off/${e.id}`}
                              className={`block rounded-xl px-2.5 py-2 text-xs ${
                                REQUEST_TYPE_META[e.type].bg
                              } ${REQUEST_TYPE_META[e.type].color}`}
                            >
                              <p className="font-medium">
                                {entryLabel(e, Boolean(userId && e.user_id === userId))}
                              </p>
                              <p className="mt-0.5 opacity-80">
                                {e.all_day
                                  ? 'All day'
                                  : `${format(parseISO(e.starts_at), 'h:mm a')} - ${format(parseISO(e.ends_at), 'h:mm a')}`}
                                {e.status === 'pending' ? ' · pending' : ''}
                              </p>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {visible.length === 0 ? (
                <li className="py-12 text-center text-sm text-slate-400">No upcoming absences</li>
              ) : (
                visible.map((e) => (
                  <li key={e.id}>
                    <Link
                      to={`/time-off/${e.id}`}
                      className="flex flex-col gap-1 px-2 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {entryLabel(e, Boolean(userId && e.user_id === userId))}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(parseISO(e.starts_at), 'MMM d, yyyy')}
                          {e.all_day
                            ? ' · all day'
                            : ` · ${format(parseISO(e.starts_at), 'h:mm a')} - ${format(parseISO(e.ends_at), 'h:mm a')}`}
                        </p>
                      </div>
                      <span
                        className={`self-start rounded-full px-2 py-0.5 text-[11px] ${
                          REQUEST_TYPE_META[e.type].bg
                        } ${REQUEST_TYPE_META[e.type].color}`}
                      >
                        {e.status}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </HrBezel>
    </div>
  );
}
