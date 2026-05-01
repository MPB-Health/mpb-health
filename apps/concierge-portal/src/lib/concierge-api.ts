/**
 * Supabase persistence for Concierge Portal (shared roster, logs, weekly extras).
 * Tables are created in migration: 20260430100000_concierge_portal_data.sql
 */
import { supabase } from '@mpbhealth/database';

/** Typed escape hatch until `pnpm db:generate` includes concierge tables. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- remote schema not in generated Database yet
const db = supabase as any;

const T_TEAM = 'concierge_team_members';
const T_LOGS = 'concierge_daily_log_entries';
const T_OFF = 'concierge_member_off_days';
const T_ESC = 'concierge_escalations';
const T_WEEK = 'concierge_weekly_report_extras';

// —— App shapes (mirror DailyLogs.tsx) —————————————————————————————————

export interface TeamMember {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  role: string;
  partTime?: boolean;
}

export interface LogEntry {
  id: string;
  date: string;
  teamMember: string;
  channel: string;
  memberName: string;
  reason: string;
  otherNotes: string;
  crmNotes: boolean;
  followUp: boolean;
  reviewLink: boolean;
  additionalNotes: string;
  timesSpokeWithMember: number;
  escalatedIssue: boolean;
  specialProjectDescription: string;
  specialProjectDurationMinutes: number;
  touchOverride?: boolean;
}

export interface EscalationItem {
  id: string;
  memberName: string;
  summary: string;
  openedAt: string;
  logEntryId?: string;
  status: 'open' | 'complete';
  completedAt?: string;
}

export interface WeeklyReportExtras {
  callTimesByMemberId: Record<string, string>;
  teamMembersHelped: string;
}

// —— Row mappers ———————————————————————————————————————————————————————

function teamRowToMember(r: Record<string, unknown>): TeamMember {
  return {
    id: String(r.id),
    name: String(r.name),
    status: r.status === 'Inactive' ? 'Inactive' : 'Active',
    role: String(r.role ?? 'Concierge'),
    partTime: r.part_time === true,
  };
}

function logRowToEntry(r: Record<string, unknown>): LogEntry {
  return {
    id: String(r.id),
    date: String(r.log_date),
    teamMember: String(r.team_member_name),
    channel: String(r.channel),
    memberName: String(r.member_name),
    reason: String(r.reason),
    otherNotes: String(r.other_notes ?? ''),
    crmNotes: r.crm_notes === true,
    followUp: r.follow_up === true,
    reviewLink: r.review_link === true,
    additionalNotes: String(r.additional_notes ?? ''),
    timesSpokeWithMember: Number(r.times_spoke_with_member ?? 1),
    escalatedIssue: r.escalated_issue === true,
    specialProjectDescription: String(r.special_project_description ?? ''),
    specialProjectDurationMinutes: Number(r.special_project_duration_minutes ?? 0),
    touchOverride: r.touch_override === true ? true : r.touch_override === false ? false : undefined,
  };
}

function logEntryToInsert(entry: LogEntry, id: string): Record<string, unknown> {
  return {
    id,
    log_date: entry.date,
    team_member_name: entry.teamMember,
    channel: entry.channel,
    member_name: entry.memberName,
    reason: entry.reason,
    other_notes: entry.otherNotes,
    crm_notes: entry.crmNotes,
    follow_up: entry.followUp,
    review_link: entry.reviewLink,
    additional_notes: entry.additionalNotes,
    times_spoke_with_member: entry.timesSpokeWithMember,
    escalated_issue: entry.escalatedIssue,
    special_project_description: entry.specialProjectDescription,
    special_project_duration_minutes: entry.specialProjectDurationMinutes,
    touch_override: entry.touchOverride === true ? true : entry.touchOverride === false ? false : null,
  };
}

function escRowToItem(r: Record<string, unknown>): EscalationItem {
  return {
    id: String(r.id),
    memberName: String(r.member_name),
    summary: String(r.summary),
    openedAt: String(r.opened_at),
    logEntryId: r.log_entry_id ? String(r.log_entry_id) : undefined,
    status: r.status === 'complete' ? 'complete' : 'open',
    completedAt: r.completed_at ? String(r.completed_at) : undefined,
  };
}

// —— Fetch —————————————————————————————————————————————————————————————

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await db.from(T_TEAM).select('*').order('display_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(teamRowToMember);
}

export async function fetchLogEntries(): Promise<LogEntry[]> {
  const { data, error } = await db
    .from(T_LOGS)
    .select('*')
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(logRowToEntry);
}

export async function fetchMemberOffDays(): Promise<Record<string, string[]>> {
  const { data, error } = await db.from(T_OFF).select('team_member_id, off_date');
  if (error) throw error;
  const out: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const mid = String((row as { team_member_id: string }).team_member_id);
    const d = String((row as { off_date: string }).off_date).slice(0, 10);
    if (!out[mid]) out[mid] = [];
    out[mid].push(d);
  }
  for (const k of Object.keys(out)) out[k].sort();
  return out;
}

export async function fetchEscalations(): Promise<EscalationItem[]> {
  const { data, error } = await db.from(T_ESC).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(escRowToItem);
}

export async function fetchWeeklyReportExtrasMap(): Promise<Record<string, WeeklyReportExtras>> {
  const { data, error } = await db.from(T_WEEK).select('*');
  if (error) throw error;
  const map: Record<string, WeeklyReportExtras> = {};
  for (const row of data ?? []) {
    const r = row as {
      report_key: string;
      call_times_by_member_id: Record<string, string>;
      team_members_helped: string;
    };
    map[r.report_key] = {
      callTimesByMemberId: (r.call_times_by_member_id as Record<string, string>) ?? {},
      teamMembersHelped: r.team_members_helped ?? '',
    };
  }
  return map;
}

// —— Team CRUD ——————————————————————————————————————————————————————————

export async function insertTeamMember(
  m: Omit<TeamMember, 'id'> & { id?: string },
  displayOrder = 0,
): Promise<TeamMember> {
  const { data, error } = await db
    .from(T_TEAM)
    .insert({
      ...(m.id && /^[0-9a-f-]{36}$/i.test(m.id) ? { id: m.id } : {}),
      name: m.name,
      status: m.status,
      role: m.role,
      part_time: m.partTime === true,
      display_order: displayOrder,
    })
    .select('*')
    .single();
  if (error) throw error;
  return teamRowToMember(data);
}

export async function updateTeamMember(m: TeamMember, displayOrder?: number): Promise<void> {
  const { error } = await db
    .from(T_TEAM)
    .update({
      name: m.name,
      status: m.status,
      role: m.role,
      part_time: m.partTime === true,
      ...(typeof displayOrder === 'number' ? { display_order: displayOrder } : {}),
    })
    .eq('id', m.id);
  if (error) throw error;
}

export async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await db.from(T_TEAM).delete().eq('id', id);
  if (error) throw error;
}

/** Upsert full roster: insert/update by id, delete DB rows not present in `team`. */
export async function syncTeamRoster(team: TeamMember[]): Promise<void> {
  const { data: existing, error: selErr } = await db.from(T_TEAM).select('id');
  if (selErr) throw selErr;
  const nextIds = new Set(team.map((t) => t.id));
  for (const row of existing ?? []) {
    const id = String((row as { id: string }).id);
    if (!nextIds.has(id)) await deleteTeamMember(id);
  }
  for (let i = 0; i < team.length; i++) {
    const m = team[i];
    const found = (existing ?? []).some((row: { id: string }) => String(row.id) === m.id);
    if (found) await updateTeamMember(m, i);
    else
      await insertTeamMember(
        { name: m.name, status: m.status, role: m.role, partTime: m.partTime },
        i,
      );
  }
}

// —— Logs ———————————————————————————————————————————————————————————————

export async function insertLogEntry(entry: LogEntry): Promise<LogEntry> {
  const id =
    entry.id && /^[0-9a-f-]{36}$/i.test(entry.id) ? entry.id : crypto.randomUUID();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const payload = { ...logEntryToInsert({ ...entry, id }, id), created_by: user?.id ?? null };
  const { data, error } = await db.from(T_LOGS).insert(payload).select('*').single();
  if (error) throw error;
  return logRowToEntry(data);
}

export async function updateLogEntry(entry: LogEntry): Promise<LogEntry> {
  const id = entry.id;
  const payload = logEntryToInsert(entry, id);
  delete (payload as { id?: string }).id;
  const { data, error } = await db.from(T_LOGS).update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return logRowToEntry(data);
}

export async function deleteLogEntry(id: string): Promise<void> {
  const { error } = await db.from(T_LOGS).delete().eq('id', id);
  if (error) throw error;
}

// —— Off days ————————————————————————————————————————————————————————————

export async function replaceMemberOffDays(map: Record<string, string[]>): Promise<void> {
  const { error: delErr } = await db.from(T_OFF).delete().gte('off_date', '1900-01-01');
  if (delErr) throw delErr;

  const rows: { team_member_id: string; off_date: string }[] = [];
  for (const [memberId, dates] of Object.entries(map)) {
    for (const off_date of dates) {
      rows.push({ team_member_id: memberId, off_date: off_date.slice(0, 10) });
    }
  }
  if (rows.length === 0) return;
  const { error: insErr } = await db.from(T_OFF).insert(rows);
  if (insErr) throw insErr;
}

// —— Escalations —————————————————————————————————————————————————————————

export async function insertEscalation(item: EscalationItem): Promise<EscalationItem> {
  const id = item.id && /^[0-9a-f-]{36}$/i.test(item.id) ? item.id : crypto.randomUUID();
  const { data, error } = await db
    .from(T_ESC)
    .insert({
      id,
      member_name: item.memberName,
      summary: item.summary,
      opened_at: item.openedAt.slice(0, 10),
      log_entry_id: item.logEntryId && /^[0-9a-f-]{36}$/i.test(item.logEntryId) ? item.logEntryId : null,
      status: item.status,
      completed_at: item.completedAt ? item.completedAt.slice(0, 10) : null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return escRowToItem(data);
}

export async function updateEscalation(item: EscalationItem): Promise<void> {
  const { error } = await db
    .from(T_ESC)
    .update({
      member_name: item.memberName,
      summary: item.summary,
      opened_at: item.openedAt.slice(0, 10),
      log_entry_id: item.logEntryId && /^[0-9a-f-]{36}$/i.test(item.logEntryId) ? item.logEntryId : null,
      status: item.status,
      completed_at: item.completedAt ? item.completedAt.slice(0, 10) : null,
    })
    .eq('id', item.id);
  if (error) throw error;
}

// —— Weekly extras ———————————————————————————————————————————————————————

export async function upsertWeeklyReportExtras(reportKey: string, extras: WeeklyReportExtras): Promise<void> {
  const { error } = await db.from(T_WEEK).upsert(
    {
      report_key: reportKey,
      call_times_by_member_id: extras.callTimesByMemberId,
      team_members_helped: extras.teamMembersHelped,
    },
    { onConflict: 'report_key' },
  );
  if (error) throw error;
}

// —— One-time browser migration (localStorage → Supabase) —————————————————

const LEGACY = {
  LOGS: 'concierge-daily-logs',
  TEAM: 'concierge-team-members',
  OFF: 'concierge-member-off-days',
  ESC: 'concierge-escalated-member-issues',
  WEEK: 'concierge-weekly-report-extras',
} as const;

function readLegacy<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function clearLegacyKeys(): void {
  try {
    Object.values(LEGACY).forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem('concierge-weekly-off-days');
  } catch {
    /* ignore */
  }
}

/** If Supabase has no log rows but this browser still has legacy keys, upload once then clear keys. */
export async function migrateLegacyLocalStorageIfNeeded(remoteLogCount: number): Promise<void> {
  if (typeof window === 'undefined') return;
  if (remoteLogCount > 0) return;
  const rawLogs = readLegacy<unknown[]>(LEGACY.LOGS, []);
  if (!Array.isArray(rawLogs) || rawLogs.length === 0) return;

  const { data: dbTeam } = await db.from(T_TEAM).select('id, name');
  const nameToId = new Map<string, string>();
  for (const r of dbTeam ?? []) {
    nameToId.set(String((r as { name: string }).name), String((r as { id: string }).id));
  }

  const legacyTeam = readLegacy<TeamMember[]>(LEGACY.TEAM, []);
  const legacyOff = readLegacy<Record<string, string[]>>(LEGACY.OFF, {});
  const remapped: Record<string, string[]> = {};
  for (const [oldId, dates] of Object.entries(legacyOff)) {
    const member = legacyTeam.find((t) => t.id === oldId);
    if (!member) continue;
    const nid = nameToId.get(member.name);
    if (nid) remapped[nid] = dates;
  }
  if (Object.keys(remapped).length > 0) await replaceMemberOffDays(remapped);

  for (const raw of rawLogs) {
    const l = raw as Record<string, unknown>;
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      date: String(l.date ?? '').slice(0, 10),
      teamMember: String(l.teamMember ?? ''),
      channel: String(l.channel ?? 'Phone'),
      memberName: String(l.memberName ?? ''),
      reason: String(l.reason ?? ''),
      otherNotes: String(l.otherNotes ?? ''),
      crmNotes: l.crmNotes === true,
      followUp: l.followUp === true,
      reviewLink: l.reviewLink === true,
      additionalNotes: String(l.additionalNotes ?? ''),
      timesSpokeWithMember: Number(l.timesSpokeWithMember ?? 1),
      escalatedIssue: l.escalatedIssue === true,
      specialProjectDescription: String(l.specialProjectDescription ?? ''),
      specialProjectDurationMinutes: Number(l.specialProjectDurationMinutes ?? 0),
      touchOverride: l.touchOverride === true ? true : undefined,
    };
    if (!entry.date || !entry.teamMember) continue;
    await insertLogEntry(entry);
  }

  const legacyEsc = readLegacy<EscalationItem[]>(LEGACY.ESC, []);
  for (const e of legacyEsc) {
    await insertEscalation({ ...e, logEntryId: undefined });
  }

  const legacyWeek = readLegacy<Record<string, WeeklyReportExtras>>(LEGACY.WEEK, {});
  for (const [k, v] of Object.entries(legacyWeek)) {
    await upsertWeeklyReportExtras(k, v);
  }

  clearLegacyKeys();
}

const DEFAULT_SEED_TEAM: Omit<TeamMember, 'id'>[] = [
  { name: 'Acelyn Calderon', status: 'Active', role: 'Concierge' },
  { name: 'Adam Jordano', status: 'Active', role: 'Concierge' },
  { name: 'Ryan Cahill', status: 'Active', role: 'Concierge' },
  { name: 'Vanessa Orozco', status: 'Active', role: 'Concierge', partTime: true },
  { name: 'Tupac Manzanarez', status: 'Active', role: 'Concierge', partTime: true },
];

export async function loadConciergeWorkspace(): Promise<{
  team: TeamMember[];
  logs: LogEntry[];
  offDays: Record<string, string[]>;
  escalations: EscalationItem[];
  weeklyExtrasMap: Record<string, WeeklyReportExtras>;
}> {
  let team = await fetchTeamMembers();
  if (team.length === 0) {
    for (let i = 0; i < DEFAULT_SEED_TEAM.length; i++) {
      await insertTeamMember(DEFAULT_SEED_TEAM[i], i);
    }
    team = await fetchTeamMembers();
  }

  let logs = await fetchLogEntries();
  if (logs.length === 0) {
    await migrateLegacyLocalStorageIfNeeded(0);
    logs = await fetchLogEntries();
  }

  const offDays = await fetchMemberOffDays();
  const escalations = await fetchEscalations();
  const weeklyExtrasMap = await fetchWeeklyReportExtrasMap();
  return { team, logs, offDays, escalations, weeklyExtrasMap };
}
