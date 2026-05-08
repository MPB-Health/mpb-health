/**
 * Supabase persistence for Concierge Portal (shared roster, logs, weekly extras).
 * Tables are created in migration: 20260430100000_concierge_portal_data.sql
 */
import { supabase } from '@mpbhealth/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
  /** auth.users.id linked to this roster row; null for shared/legacy accounts. */
  userId?: string | null;
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
  /** Server `created_at` — source of truth for today-feed sort (not updated after edits). */
  createdAt?: string;
  updatedAt?: string;
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

/** Collapse DB `date` / timestamptz strings to `YYYY-MM-DD` so ISO week math matches the calendar day users picked. */
export function toYmdOnly(val: unknown): string {
  const s = String(val ?? '').trim();
  const head = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
  return head;
}

// —— Row mappers ———————————————————————————————————————————————————————

function teamRowToMember(r: Record<string, unknown>): TeamMember {
  return {
    id: String(r.id),
    name: String(r.name),
    status: r.status === 'Inactive' ? 'Inactive' : 'Active',
    role: String(r.role ?? 'Concierge'),
    partTime: r.part_time === true,
    userId: r.user_id ? String(r.user_id) : null,
  };
}

/**
 * PostgREST often returns `timestamptz` as `YYYY-MM-DD HH:mm:ss…+00` (space, not `T`).
 * Some engines treat that as Invalid Date, so every row ties on sort and the list looks "random".
 */
export function normalizeConciergeInstant(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  const withT =
    /\d{4}-\d{2}-\d{2}\s+[0-9]/.test(s) && !s.includes('T')
      ? s.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T')
      : s;
  const ms = Date.parse(withT);
  return Number.isFinite(ms) ? withT : undefined;
}

function readOptionalIsoTs(row: Record<string, unknown>, snake: string, camel: string): string | undefined {
  return normalizeConciergeInstant(row[snake] ?? row[camel]);
}

function logRowToEntry(r: Record<string, unknown>): LogEntry {
  return {
    id: String(r.id),
    date: toYmdOnly(r.log_date ?? r.logDate),
    teamMember: String(r.team_member_name ?? r.teamMemberName ?? ''),
    channel: String(r.channel),
    memberName: String(r.member_name ?? r.memberName ?? ''),
    reason: String(r.reason),
    otherNotes: String(r.other_notes ?? r.otherNotes ?? ''),
    crmNotes: r.crm_notes === true || r.crmNotes === true,
    followUp: r.follow_up === true || r.followUp === true,
    reviewLink: r.review_link === true || r.reviewLink === true,
    additionalNotes: String(r.additional_notes ?? r.additionalNotes ?? ''),
    timesSpokeWithMember: Number(r.times_spoke_with_member ?? r.timesSpokeWithMember ?? 1),
    escalatedIssue: r.escalated_issue === true || r.escalatedIssue === true,
    specialProjectDescription: String(r.special_project_description ?? r.specialProjectDescription ?? ''),
    specialProjectDurationMinutes: Number(
      r.special_project_duration_minutes ?? r.specialProjectDurationMinutes ?? 0,
    ),
    touchOverride: r.touch_override === true ? true : r.touch_override === false ? false : undefined,
    createdAt: readOptionalIsoTs(r, 'created_at', 'createdAt'),
    updatedAt: readOptionalIsoTs(r, 'updated_at', 'updatedAt'),
  };
}

/** If the payload has no parseable `created_at`, assign one so newest-first ordering never falls apart. */
export function patchMissingConciergeTimestamps(entry: LogEntry): LogEntry {
  const c0 = normalizeConciergeInstant(entry.createdAt);
  const u0 = normalizeConciergeInstant(entry.updatedAt);
  const base: LogEntry = {
    ...entry,
    ...(c0 ? { createdAt: c0 } : {}),
    ...(u0 ? { updatedAt: u0 } : {}),
  };
  const parsed = base.createdAt ? Date.parse(base.createdAt) : NaN;
  if (Number.isFinite(parsed)) return base;
  const now = new Date().toISOString();
  const uOk = base.updatedAt ? Number.isFinite(Date.parse(base.updatedAt)) : false;
  return {
    ...base,
    createdAt: now,
    updatedAt: uOk ? base.updatedAt : now,
  };
}

/**
 * Merge a realtime or partial row onto what we already have in memory.
 * Postgres/Supabase UPDATE broadcasts often omit unchanged columns; without this, `created_at`
 * would be dropped and the today feed sort falls back to arbitrary id order.
 */
export function mergeConciergeLogEntry(existing: LogEntry | undefined, incoming: LogEntry): LogEntry {
  const merged = !existing
    ? incoming
    : {
        ...existing,
        ...incoming,
        createdAt: incoming.createdAt ?? existing.createdAt,
        updatedAt: incoming.updatedAt ?? existing.updatedAt,
      };
  return patchMissingConciergeTimestamps(merged);
}

/** Maps a Supabase / realtime payload row to `LogEntry` (includes timestamps). */
export function conciergeRemoteRowToLogEntry(row: Record<string, unknown>): LogEntry {
  return patchMissingConciergeTimestamps(logRowToEntry(row));
}

export type ConciergeDailyLogRealtimeEvent =
  | { kind: 'upsert'; entry: LogEntry }
  | { kind: 'delete'; id: string };

/**
 * Supabase Realtime subscription for shared daily log rows (publication configured in migrations).
 */
export function subscribeConciergeDailyLogEntries(
  onEvent: (ev: ConciergeDailyLogRealtimeEvent) => void,
): RealtimeChannel {
  const ch = supabase.channel('concierge_portal_daily_log_entries');
  ch.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: T_LOGS },
    (payload) => {
      if (payload.eventType === 'DELETE') {
        const oldRow = payload.old as { id?: string } | undefined;
        if (oldRow?.id) onEvent({ kind: 'delete', id: String(oldRow.id) });
        return;
      }
      const newRow = payload.new as Record<string, unknown>;
      if (newRow?.id != null) onEvent({ kind: 'upsert', entry: conciergeRemoteRowToLogEntry(newRow) });
    },
  ).subscribe();
  return ch;
}

async function resolveTeamMemberIdByName(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const { data } = await db
    .from(T_TEAM)
    .select('id')
    .eq('name', trimmed)
    .maybeSingle();
  return data?.id ? String(data.id) : null;
}

async function logEntryToInsert(entry: LogEntry, id: string): Promise<Record<string, unknown>> {
  return {
    id,
    log_date: entry.date,
    team_member_name: entry.teamMember,
    team_member_id: await resolveTeamMemberIdByName(entry.teamMember),
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
    openedAt: toYmdOnly(r.opened_at),
    logEntryId: r.log_entry_id ? String(r.log_entry_id) : undefined,
    status: r.status === 'complete' ? 'complete' : 'open',
    completedAt: r.completed_at ? toYmdOnly(r.completed_at) : undefined,
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
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) =>
    patchMissingConciergeTimestamps(logRowToEntry(row)),
  );
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
  const base = await logEntryToInsert({ ...entry, id }, id);
  const payload = { ...base, created_by: user?.id ?? null };
  const { data, error } = await db.from(T_LOGS).insert(payload).select('*').single();
  if (error) throw error;
  return patchMissingConciergeTimestamps(logRowToEntry(data));
}

export async function updateLogEntry(entry: LogEntry): Promise<LogEntry> {
  const id = entry.id;
  const payload = await logEntryToInsert(entry, id);
  delete (payload as { id?: string }).id;
  const { data, error } = await db.from(T_LOGS).update(payload).eq('id', id).select('*').single();
  if (error) throw error;
  return patchMissingConciergeTimestamps(logRowToEntry(data));
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

/**
 * One-time per-browser upload of pre-Supabase localStorage into shared tables.
 *
 * **Important:** Historically this only ran when `remoteLogCount === 0`. That meant whoever
 * opened the app first (e.g. one rep) uploaded their browser’s data; everyone else’s
 * localStorage was never imported because the remote was no longer empty — so only that
 * person’s historical logs appeared in the shared DB. We now key off a local flag instead.
 */
const LEGACY_IMPORT_DONE_KEY = 'concierge_legacy_import_v1_done';

/** If this browser still has legacy daily-log keys, upload once (even if Supabase already has rows), then clear. */
export async function migrateLegacyLocalStorageIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(LEGACY_IMPORT_DONE_KEY) === '1') return;

  const rawLogs = readLegacy<unknown[]>(LEGACY.LOGS, []);
  if (!Array.isArray(rawLogs) || rawLogs.length === 0) {
    localStorage.setItem(LEGACY_IMPORT_DONE_KEY, '1');
    return;
  }

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
  localStorage.setItem(LEGACY_IMPORT_DONE_KEY, '1');
}

/**
 * Read this browser's `concierge-daily-logs` key without touching anything.
 * Used by the admin "Re-import from this browser" button to show counts before a
 * destructive import.
 */
export function inspectLegacyLocalStorage(): {
  rawLogCount: number;
  importFlagSet: boolean;
} {
  if (typeof window === 'undefined') return { rawLogCount: 0, importFlagSet: false };
  const arr = readLegacy<unknown[]>(LEGACY.LOGS, []);
  return {
    rawLogCount: Array.isArray(arr) ? arr.length : 0,
    importFlagSet: localStorage.getItem(LEGACY_IMPORT_DONE_KEY) === '1',
  };
}

/**
 * Admin-triggered re-import of this browser's localStorage even when the per-browser
 * flag is already set. Clears the flag, runs `migrateLegacyLocalStorageIfNeeded`, and
 * returns how many rows were attempted (caller should re-fetch logs after).
 */
export async function forceLegacyImportFromThisBrowser(): Promise<{ uploaded: number }> {
  if (typeof window === 'undefined') return { uploaded: 0 };
  const { rawLogCount } = inspectLegacyLocalStorage();
  localStorage.removeItem(LEGACY_IMPORT_DONE_KEY);
  await migrateLegacyLocalStorageIfNeeded();
  return { uploaded: rawLogCount };
}

/**
 * Admin path: import legacy log JSON dumped from another rep's browser localStorage.
 *
 * `rawJson` should be the value of their `concierge-daily-logs` key (an array of legacy
 * LogEntry-shaped objects). All inserted rows have `team_member_name` forced to
 * `targetRep` so a misconfigured rep dropdown in the source browser doesn't matter.
 *
 * Returns counts so the admin UI can show "imported X / skipped Y".
 */
export async function importLegacyJsonForMember(
  targetRep: string,
  rawJson: string,
): Promise<{ imported: number; skipped: number }> {
  const trimmedRep = targetRep.trim();
  if (!trimmedRep) throw new Error('Target rep name is required');

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Pasted text is not valid JSON');
  }
  if (!Array.isArray(parsed)) {
    throw new Error(
      'Expected a JSON array of log entries (the value of localStorage["concierge-daily-logs"])',
    );
  }

  let imported = 0;
  let skipped = 0;
  for (const raw of parsed) {
    const l = raw as Record<string, unknown>;
    const date = String(l.date ?? '').slice(0, 10);
    if (!date) {
      skipped++;
      continue;
    }
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      date,
      teamMember: trimmedRep,
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
    try {
      await insertLogEntry(entry);
      imported++;
    } catch {
      skipped++;
    }
  }
  return { imported, skipped };
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
  currentUserId: string | null;
}> {
  let team = await fetchTeamMembers();
  if (team.length === 0) {
    for (let i = 0; i < DEFAULT_SEED_TEAM.length; i++) {
      await insertTeamMember(DEFAULT_SEED_TEAM[i], i);
    }
    team = await fetchTeamMembers();
  }

  let logs = await fetchLogEntries();
  await migrateLegacyLocalStorageIfNeeded();
  logs = await fetchLogEntries();

  const offDays = await fetchMemberOffDays();
  const escalations = await fetchEscalations();
  const weeklyExtrasMap = await fetchWeeklyReportExtrasMap();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    team,
    logs,
    offDays,
    escalations,
    weeklyExtrasMap,
    currentUserId: user?.id ?? null,
  };
}
