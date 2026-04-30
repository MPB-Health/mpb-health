import { useState, useMemo, useCallback, useEffect } from 'react';
import { addDays, format, parse as parseDate, setISOWeek, startOfISOWeek } from 'date-fns';
import {
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Download,
  Send,
  Search,
  BarChart3,
  Users,
  TrendingUp,
  PieChart,
  AlertTriangle,
  ChevronDown,
  X,
  Check,
  Copy,
  Mail,
  FileSpreadsheet,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  role: string;
  /** Part-time reps are excluded from peer-average performance alerts. */
  partTime?: boolean;
}

interface LogEntry {
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
  /**
   * Resolved touch count for this row (counts toward weekly totals): from Special Project duration,
   * or a multiplier in Additional notes (e.g. x2), else legacy stored value defaulting to 1.
   */
  timesSpokeWithMember: number;
  escalatedIssue: boolean;
  /** When reason is Special Project: what the work was (stored only for that reason). */
  specialProjectDescription: string;
  /** When reason is Special Project: time spent, minutes (drives touch count: 1 touch per 15 min, min 1). */
  specialProjectDurationMinutes: number;
  /**
   * When true (non–Special Project), `timesSpokeWithMember` is used as the touch count even if additional notes
   * contain an xN multiplier — set when the rep overrides touches in Recent Entries.
   */
  touchOverride?: boolean;
}

interface EscalationItem {
  id: string;
  memberName: string;
  summary: string;
  openedAt: string;
  logEntryId?: string;
  status: 'open' | 'complete';
  completedAt?: string;
}

interface WeeklyReportExtras {
  /** Rep id → phone time / on-phone hours for this report period (shown on weekly table as Phone time (wk)) */
  callTimesByMemberId: Record<string, string>;
  /** Total distinct members helped by the team this period (or notes). */
  teamMembersHelped: string;
}

// ── Constants ──────────────────────────────────────────────────────────

const CHANNELS = ['Phone', 'Email', 'SalesIQ', 'Chat'];

const REASONS = [
  'Sharing Requests',
  'Telehealth Assistance',
  'App Login',
  'Rx Request',
  'Imaging Request',
  'Labs Request',
  'Appt Scheduling',
  'Provider Search',
  'Plan Education',
  'Welcome Call',
  'Zion Portal Log In',
  'Preventive/Billing',
  'Follow Up',
  'Special Project',
  'Other',
];

/** For Special Project logs: minutes ÷ this value (rounded up) = member touches, minimum 1. */
const SPECIAL_PROJECT_MINUTES_PER_TOUCH = 15;

/**
 * If additional notes contain a multiplier like `x2` or `x 2` (case-insensitive), or compact `2x`, return that
 * count; otherwise null. Bounds: 1–999.
 */
function touchesFromAdditionalNotes(text: string): number | null {
  if (!text || !String(text).trim()) return null;
  const s = String(text).toLowerCase();
  const mX = s.match(/\bx\s*(\d{1,3})\b/);
  if (mX) {
    const n = parseInt(mX[1], 10);
    if (n >= 1 && n <= 999) return n;
  }
  const mNumFirst = s.match(/\b(\d{1,3})x\b/);
  if (mNumFirst) {
    const n = parseInt(mNumFirst[1], 10);
    if (n >= 1 && n <= 999) return n;
  }
  return null;
}

/** Touch weight for one log row (weekly totals, exports, UI). */
function resolvedTouches(l: LogEntry): number {
  if (l.reason === 'Special Project' && (l.specialProjectDurationMinutes ?? 0) > 0) {
    return Math.min(
      999,
      Math.max(1, Math.ceil(l.specialProjectDurationMinutes / SPECIAL_PROJECT_MINUTES_PER_TOUCH)),
    );
  }
  if (l.touchOverride === true) {
    const t = l.timesSpokeWithMember;
    return typeof t === 'number' && t >= 1 ? Math.min(999, Math.floor(t)) : 1;
  }
  const fromNotes = touchesFromAdditionalNotes(l.additionalNotes || '');
  if (fromNotes !== null) return fromNotes;
  const t = l.timesSpokeWithMember;
  if (typeof t === 'number' && t >= 1) return Math.min(999, Math.floor(t));
  return 1;
}

/** Whether saving should set `touchOverride` so notes multipliers don't overwrite an explicit touch count. */
function computeTouchOverrideForSave(next: LogEntry): boolean {
  if (next.reason === 'Special Project') return false;
  const auto = resolvedTouches({ ...next, touchOverride: false });
  return next.timesSpokeWithMember !== auto;
}

/** Always treated as part-time for performance alerts (even if roster flag is missing). */
const PART_TIME_NAMES = new Set(['Vanessa Orozco', 'Tupac Manzanarez']);

function isPartTimeMember(m: TeamMember): boolean {
  if (m.partTime === false) return false;
  return m.partTime === true || PART_TIME_NAMES.has(m.name);
}

/** Full-time reps (not part-time) should log this many entries with "Review link sent" per day. */
const REVIEW_LINKS_DAILY_TARGET = 3;

function isFullTimeForReviewBenchmark(m: TeamMember): boolean {
  return !isPartTimeMember(m);
}

const TABS = [
  { id: 'log', label: 'Daily Log', icon: ClipboardList },
  { id: 'weekly', label: 'Weekly Report', icon: BarChart3 },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'analytics', label: 'Reason Analytics', icon: PieChart },
  { id: 'trends', label: 'Member Trends', icon: AlertTriangle },
  { id: 'team', label: 'Team', icon: Users },
] as const;

type TabId = (typeof TABS)[number]['id'];

const STORAGE_KEY_LOGS = 'concierge-daily-logs';
const STORAGE_KEY_TEAM = 'concierge-team-members';
const STORAGE_KEY_MEMBER_OFF_DAYS = 'concierge-member-off-days';
/** Legacy `weekNum:memberId` keys — migrated once into member-id-only storage. */
const STORAGE_KEY_MEMBER_OFF_DAYS_LEGACY = 'concierge-weekly-off-days';
const STORAGE_KEY_ESCALATIONS = 'concierge-escalated-member-issues';
const STORAGE_KEY_WEEKLY_EXTRAS = 'concierge-weekly-report-extras';

const DEFAULT_TEAM: TeamMember[] = [
  { id: '1', name: 'Acelyn Calderon', status: 'Active', role: 'Concierge' },
  { id: '2', name: 'Adam Jordano', status: 'Active', role: 'Concierge' },
  { id: '3', name: 'Ryan Cahill', status: 'Active', role: 'Concierge' },
  { id: '4', name: 'Vanessa Orozco', status: 'Active', role: 'Concierge', partTime: true },
  { id: '5', name: 'Tupac Manzanarez', status: 'Active', role: 'Concierge', partTime: true },
];

/** Migrates earlier roster / log entries that used first names only. */
const LEGACY_TEAM_MEMBER_NAMES: Record<string, string> = {
  Acelyn: 'Acelyn Calderon',
  Adam: 'Adam Jordano',
  Ryan: 'Ryan Cahill',
};

function applyLegacyTeamMemberNamesToLogs(logs: LogEntry[]): LogEntry[] {
  return logs.map((l) => {
    const next = LEGACY_TEAM_MEMBER_NAMES[l.teamMember];
    return next ? { ...l, teamMember: next } : l;
  });
}

function normalizeLogEntry(l: LogEntry): LogEntry {
  const isProject = l.reason === 'Special Project';
  const rawDesc = (l as unknown as { specialProjectDescription?: string }).specialProjectDescription;
  let specialProjectDescription =
    typeof rawDesc === 'string' ? rawDesc.trim().slice(0, 500) : '';
  const rawMin = (l as unknown as { specialProjectDurationMinutes?: number }).specialProjectDurationMinutes;
  let specialProjectDurationMinutes =
    typeof rawMin === 'number' && !Number.isNaN(rawMin)
      ? Math.min(99999, Math.max(0, Math.floor(rawMin)))
      : 0;
  if (!isProject) {
    specialProjectDescription = '';
    specialProjectDurationMinutes = 0;
  }

  const partial: LogEntry = {
    ...l,
    specialProjectDescription,
    specialProjectDurationMinutes,
  };
  const ts = resolvedTouches(partial);
  const touchOverride =
    isProject && specialProjectDurationMinutes > 0
      ? false
      : partial.touchOverride === true;

  return {
    ...partial,
    timesSpokeWithMember: ts,
    touchOverride,
    escalatedIssue: (l as unknown as { escalatedIssue?: boolean }).escalatedIssue === true,
  };
}

function migrateLogsStorage(logs: LogEntry[]): LogEntry[] {
  return applyLegacyTeamMemberNamesToLogs(logs).map(normalizeLogEntry);
}

function buildReportStorageKey(weekNumber: number, refYear: number): string {
  return `iso:${refYear}-W${String(weekNumber).padStart(2, '0')}`;
}

function defaultWeeklyExtras(): WeeklyReportExtras {
  return { callTimesByMemberId: {}, teamMembersHelped: '' };
}

/** Member-touch weight for one row (weekly totals, performance, header strip). */
function metricTouches(l: LogEntry): number {
  return resolvedTouches(l);
}

function sumTouches(ml: LogEntry[]): number {
  return ml.reduce((s, l) => s + metricTouches(l), 0);
}

function refYearForWeek(logs: LogEntry[], weekNum: number): number {
  const hit = logs.find((l) => {
    const d = new Date(l.date + 'T12:00:00');
    return !isNaN(d.getTime()) && getISOWeek(d) === weekNum;
  });
  if (hit) return new Date(hit.date + 'T12:00:00').getFullYear();
  return new Date().getFullYear();
}

function getWeekDateStrings(weekNum: number, refYear: number): string[] {
  const anchor = setISOWeek(new Date(refYear, 5, 15), weekNum);
  const monday = startOfISOWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'));
}

/** Full-time-only average for weekly totals (excludes part-time). */
function fullTimeWeekAvg(
  activeMembers: TeamMember[],
  rows: { name: string; total: number }[],
): number {
  const ft = rows.filter((r) => {
    const m = activeMembers.find((x) => x.name === r.name);
    return m && !isPartTimeMember(m);
  });
  if (ft.length === 0) return 0;
  return Math.round(ft.reduce((s, r) => s + r.total, 0) / ft.length);
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatOffDayForReport(isoDate: string): string {
  const d = parseDate(isoDate, 'yyyy-MM-dd', new Date());
  return isNaN(d.getTime()) ? isoDate : format(d, 'EEE MMM d');
}

/** date-fns `format` throws on Invalid Date — use for UI that must not crash. */
function safeFormatWeekdayFromIso(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return isNaN(d.getTime()) ? '—' : format(d, 'EEE');
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function normalizeStoredTeam(stored: TeamMember[]): TeamMember[] {
  const renamed = stored.map((m) => {
    const next = LEGACY_TEAM_MEMBER_NAMES[m.name];
    return next ? { ...m, name: next } : { ...m };
  });
  const byName = new Map(renamed.map((m) => [m.name, m]));
  const merged = [...renamed];
  for (const def of DEFAULT_TEAM) {
    if (!byName.has(def.name)) {
      merged.push({ ...def, id: uid() });
    } else {
      const idx = merged.findIndex((x) => x.name === def.name);
      if (idx >= 0 && def.partTime) {
        merged[idx] = { ...merged[idx], partTime: true };
      }
    }
  }
  return merged;
}

/** Load off-days keyed by member id; migrate legacy weekly-keyed storage if still present. */
function loadMemberOffDaysFromStorage(): Record<string, string[]> {
  try {
    const v2raw = localStorage.getItem(STORAGE_KEY_MEMBER_OFF_DAYS);
    let merged: Record<string, string[]> = {};
    if (v2raw) {
      const parsed = JSON.parse(v2raw) as Record<string, string[]>;
      if (parsed && typeof parsed === 'object') {
        merged = { ...parsed };
      }
    }

    const legacyRaw = localStorage.getItem(STORAGE_KEY_MEMBER_OFF_DAYS_LEGACY);
    if (legacyRaw) {
      const raw = JSON.parse(legacyRaw) as Record<string, string[]>;
      for (const [key, dates] of Object.entries(raw)) {
        if (!Array.isArray(dates)) continue;
        const colon = key.indexOf(':');
        const memberId = colon >= 0 ? key.slice(colon + 1) : key;
        if (!merged[memberId]) merged[memberId] = [];
        for (const dt of dates) {
          if (typeof dt === 'string' && !merged[memberId].includes(dt)) merged[memberId].push(dt);
        }
      }
      localStorage.removeItem(STORAGE_KEY_MEMBER_OFF_DAYS_LEGACY);
    }

    for (const id of Object.keys(merged)) {
      merged[id].sort();
    }
    localStorage.setItem(STORAGE_KEY_MEMBER_OFF_DAYS, JSON.stringify(merged));
    return merged;
  } catch {
    return {};
  }
}

// ── Share Modal ────────────────────────────────────────────────────────

function ShareModal({
  onClose,
  weekLogs,
  team,
  periodTitle,
  weeklyExtras,
}: {
  onClose: () => void;
  weekLogs: LogEntry[];
  team: TeamMember[];
  periodTitle: string;
  weeklyExtras: WeeklyReportExtras;
}) {
  const [emails, setEmails] = useState('');
  const [includeWeekly, setIncludeWeekly] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [copied, setCopied] = useState(false);

  const buildReportText = useCallback(() => {
    const activeMembers = team.filter((m) => m.status === 'Active');
    const lines: string[] = [
      `CONCIERGE WEEKLY REPORT — ${periodTitle}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
    ];

    if (includeWeekly) {
      lines.push('═══ PER-REP WEEKLY TOTALS ═══', '');
      lines.push(
        'Team Member | Touches | Rows | Phone | Phone time (wk) | Email | SalesIQ | Follow-ups | Rx | Labs | Imaging | Appt',
      );
      lines.push('-'.repeat(140));

      let teamTotalTouches = 0;
      for (const member of activeMembers) {
        const ml = weekLogs.filter((l) => l.teamMember === member.name);
        const totalTouches = sumTouches(ml);
        teamTotalTouches += totalTouches;
        const rowCount = ml.length;
        const phone = ml.filter((l) => l.channel === 'Phone').length;
        const email = ml.filter((l) => l.channel === 'Email').length;
        const salesiq = ml.filter((l) => l.channel === 'SalesIQ').length;
        const followups = ml.filter((l) => l.reason === 'Follow Up').length;
        const rx = ml.filter((l) => l.reason === 'Rx Request').length;
        const labs = ml.filter((l) => l.reason === 'Labs Request').length;
        const imaging = ml.filter((l) => l.reason === 'Imaging Request').length;
        const appt = ml.filter((l) => l.reason === 'Appt Scheduling').length;
        const phoneTimeWk = weeklyExtras.callTimesByMemberId[member.id]?.trim() || '—';
        const phoneTimeCol =
          phoneTimeWk.length > 22 ? `${phoneTimeWk.slice(0, 20)}…` : phoneTimeWk.padEnd(22);
        lines.push(
          `${member.name.slice(0, 12).padEnd(12)}| ${String(totalTouches).padStart(7)} | ${String(rowCount).padStart(4)} | ${String(phone).padStart(5)} | ${phoneTimeCol} | ${String(email).padStart(5)} | ${String(salesiq).padStart(7)} | ${String(followups).padStart(10)} | ${String(rx).padStart(2)} | ${String(labs).padStart(4)} | ${String(imaging).padStart(7)} | ${String(appt).padStart(4)}`,
        );
      }
      lines.push('-'.repeat(140));
      lines.push(`TEAM TOUCHES | ${String(teamTotalTouches).padStart(7)}`);
      if (weeklyExtras.teamMembersHelped.trim()) {
        lines.push(`Team members helped (entered): ${weeklyExtras.teamMembersHelped.trim()}`);
      }
      lines.push('');
    }

    if (includeAnalytics) {
      lines.push('═══ REASON ANALYTICS ═══', '');
      const reasonCounts: Record<string, number> = {};
      for (const r of REASONS) reasonCounts[r] = 0;
      for (const l of weekLogs) {
        reasonCounts[l.reason] = (reasonCounts[l.reason] || 0) + 1;
      }
      const total = weekLogs.length || 1;
      lines.push('Reason                  | Count | % of Total');
      lines.push('-'.repeat(50));
      for (const r of REASONS) {
        const count = reasonCounts[r] || 0;
        const pct = ((count / total) * 100).toFixed(1);
        lines.push(`${r.padEnd(24)}| ${String(count).padStart(5)} | ${pct}%`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }, [weekLogs, team, periodTitle, includeWeekly, includeAnalytics, weeklyExtras]);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Report copied to clipboard');
  };

  const handleEmail = () => {
    const recipients = emails
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (recipients.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }
    const subject = encodeURIComponent(`Concierge Weekly Report — ${periodTitle}`);
    const body = encodeURIComponent(buildReportText());
    window.open(`mailto:${recipients.join(',')}?subject=${subject}&body=${body}`);
    toast.success('Opening email client...');
    onClose();
  };

  const handleExportCSV = () => {
    const headers = [
      'Period',
      'Date',
      'Team Member',
      'Channel',
      'Member Name',
      'Reason',
      'Other/Notes',
      'CRM Notes',
      'Follow-up',
      'Review Link',
      'Additional Notes',
      'Touches',
      'Escalated issue',
      'Special project',
      'Special project (min)',
    ];
    const rows = weekLogs.map((l) => [
      periodTitle,
      l.date,
      l.teamMember,
      l.channel,
      l.memberName,
      l.reason,
      l.otherNotes,
      l.crmNotes ? 'Yes' : 'No',
      l.followUp ? 'Yes' : 'No',
      l.reviewLink ? 'Yes' : 'No',
      l.additionalNotes,
      String(metricTouches(l)),
      l.escalatedIssue ? 'Yes' : 'No',
      l.reason === 'Special Project' ? l.specialProjectDescription : '',
      l.reason === 'Special Project' ? String(l.specialProjectDurationMinutes || '') : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safe = periodTitle.replace(/[^\w-]+/g, '_').slice(0, 80);
    a.download = `concierge-report-${safe}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-[#A8B8AC]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2F3E2F] to-[#4A7C8A] flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#2F3E2F]">Share Report</h2>
              <p className="text-sm text-[#5B6B2E]">{periodTitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#A8B8AC]/20 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Include in report
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWeekly}
                  onChange={(e) => setIncludeWeekly(e.target.checked)}
                  className="rounded border-[#A8B8AC] text-[#4A7C8A] focus:ring-[#4A7C8A]/30"
                />
                Weekly Totals
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAnalytics}
                  onChange={(e) => setIncludeAnalytics(e.target.checked)}
                  className="rounded border-[#A8B8AC] text-[#4A7C8A] focus:ring-[#4A7C8A]/30"
                />
                Reason Analytics
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="share-emails" className="block text-sm font-medium text-slate-700 mb-1">
              Email to management
            </label>
            <input
              id="share-emails"
              type="text"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="manager@mympb.com, director@mympb.com"
              className="w-full px-3 py-2.5 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm transition-colors"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={handleEmail}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#4A7C8A] text-white text-sm font-medium hover:bg-[#3D6773] transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#A8B8AC]/40 text-[#2F3E2F] text-sm font-medium hover:bg-[#A8B8AC]/10 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#A8B8AC]/40 text-[#2F3E2F] text-sm font-medium hover:bg-[#A8B8AC]/10 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit log entry (from Recent Entries) ───────────────────────────────

function EditLogEntryModal({
  log,
  activeMembers,
  onClose,
  onSave,
  onEscalationFromLog,
}: {
  log: LogEntry;
  activeMembers: TeamMember[];
  onClose: () => void;
  onSave: (next: LogEntry) => void;
  onEscalationFromLog: (item: EscalationItem) => void;
}) {
  const prevEscalated = log.escalatedIssue === true;
  const [date, setDate] = useState(log.date);
  const [teamMember, setTeamMember] = useState(log.teamMember);
  const [channel, setChannel] = useState(log.channel);
  const [memberName, setMemberName] = useState(log.memberName);
  const [reason, setReason] = useState(log.reason);
  const [otherNotes, setOtherNotes] = useState(log.otherNotes);
  const [additionalNotes, setAdditionalNotes] = useState(log.additionalNotes);
  const [timesSpoke, setTimesSpoke] = useState(() => String(metricTouches(log)));
  const [crmNotes, setCrmNotes] = useState(log.crmNotes);
  const [followUp, setFollowUp] = useState(log.followUp);
  const [reviewLink, setReviewLink] = useState(log.reviewLink);
  const [escalatedIssue, setEscalatedIssue] = useState(log.escalatedIssue);
  const [specialProjectDescription, setSpecialProjectDescription] = useState(log.specialProjectDescription);
  const [specialProjectDurationMinutes, setSpecialProjectDuration] = useState(
    log.specialProjectDurationMinutes || 0,
  );

  const handleSave = () => {
    if (!date || !teamMember) {
      toast.error('Please fill in Date and Team Member');
      return;
    }
    if (reason === 'Special Project') {
      if (!specialProjectDescription.trim()) {
        toast.error('Please describe the special project');
        return;
      }
      if (Math.floor(Number(specialProjectDurationMinutes) || 0) < 1) {
        toast.error('Enter time spent (minutes), at least 1');
        return;
      }
    } else if (!memberName.trim()) {
      toast.error('Please fill in Member Name');
      return;
    }
    const memberNameNorm =
      reason === 'Special Project' && !memberName.trim() ? '—' : memberName.trim();
    const parsedTouches = Math.min(
      999,
      Math.max(1, Math.floor(Number(timesSpoke) || 1)),
    );
    const mins =
      reason === 'Special Project'
        ? Math.min(99999, Math.max(1, Math.floor(Number(specialProjectDurationMinutes) || 0)))
        : 0;
    const merged: LogEntry = {
      ...log,
      date,
      teamMember,
      channel,
      memberName: memberNameNorm,
      reason,
      otherNotes: reason === 'Other' ? otherNotes : '',
      additionalNotes,
      timesSpokeWithMember: reason === 'Special Project' ? log.timesSpokeWithMember : parsedTouches,
      crmNotes,
      followUp,
      reviewLink,
      escalatedIssue,
      specialProjectDescription: reason === 'Special Project' ? specialProjectDescription.trim() : '',
      specialProjectDurationMinutes: mins,
    };
    const touchOverride = computeTouchOverrideForSave({ ...merged, touchOverride: false });
    const next = normalizeLogEntry({ ...merged, touchOverride });
    onSave(next);
    if (next.escalatedIssue && !prevEscalated) {
      const summary =
        next.reason === 'Special Project'
          ? [next.specialProjectDescription, next.additionalNotes].filter((x) => x.trim()).join(' — ') ||
            'Escalated member issue'
          : [next.reason, next.additionalNotes].filter((x) => x.trim()).join(' — ') || 'Escalated member issue';
      onEscalationFromLog({
        id: uid(),
        memberName: next.memberName.trim(),
        summary,
        openedAt: next.date,
        logEntryId: next.id,
        status: 'open',
      });
    }
    onClose();
    toast.success('Entry updated');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#A8B8AC]/30 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-[#2F3E2F]">Edit log entry</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-[#A8B8AC]/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Team Member</label>
              <select
                value={teamMember}
                onChange={(e) => setTeamMember(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 bg-white focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
              >
                {!activeMembers.some((m) => m.name === teamMember) && teamMember ? (
                  <option value={teamMember}>{teamMember}</option>
                ) : null}
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 bg-white focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => {
                  const r = e.target.value;
                  setReason(r);
                  if (r !== 'Special Project') {
                    setSpecialProjectDescription('');
                    setSpecialProjectDuration(0);
                  }
                  if (r !== 'Other') setOtherNotes('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 bg-white focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Member Name{reason === 'Special Project' ? ' (optional)' : ''}
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder={
                  reason === 'Special Project' ? "Member, or leave blank for internal project" : "Member's name"
                }
                className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
              />
            </div>
            {reason === 'Special Project' && (
              <>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Special project — description</label>
                  <input
                    type="text"
                    value={specialProjectDescription}
                    onChange={(e) => setSpecialProjectDescription(e.target.value)}
                    placeholder="What you worked on (required)"
                    className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Time spent (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={99999}
                    value={specialProjectDurationMinutes === 0 ? '' : specialProjectDurationMinutes}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSpecialProjectDuration(
                        v === '' ? 0 : Math.min(99999, Math.max(1, Math.floor(Number(v) || 0))),
                      );
                    }}
                    placeholder="e.g. 90"
                    className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm tabular-nums"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Touches follow time (1 per {SPECIAL_PROJECT_MINUTES_PER_TOUCH} min, rounded up).
                  </p>
                </div>
              </>
            )}
            {reason === 'Other' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Other / Notes</label>
                <input
                  type="text"
                  value={otherNotes}
                  onChange={(e) => setOtherNotes(e.target.value)}
                  placeholder="Describe..."
                  className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
                />
              </div>
            )}
            {reason !== 'Special Project' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Touches (for weekly totals)</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={timesSpoke}
                  onChange={(e) => setTimesSpoke(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm tabular-nums"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Overrides an x2-style multiplier in additional notes only if you change this away from the note-based
                  count.
                </p>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Additional Notes</label>
              <input
                type="text"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Context; optional x2-style multipliers still apply unless touches are overridden above."
                className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-[#A8B8AC]/15">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={crmNotes}
                onChange={(e) => setCrmNotes(e.target.checked)}
                className="rounded border-[#A8B8AC] text-[#4A7C8A] focus:ring-[#4A7C8A]/30"
              />
              Notes in CRM?
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={followUp}
                onChange={(e) => setFollowUp(e.target.checked)}
                className="rounded border-[#A8B8AC] text-[#4A7C8A] focus:ring-[#4A7C8A]/30"
              />
              Follow-up Task?
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={reviewLink}
                onChange={(e) => setReviewLink(e.target.checked)}
                className="rounded border-[#A8B8AC] text-[#4A7C8A] focus:ring-[#4A7C8A]/30"
              />
              Review Link Sent?
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={escalatedIssue}
                onChange={(e) => setEscalatedIssue(e.target.checked)}
                className="rounded border-[#A8B8AC] text-[#4A7C8A] focus:ring-[#4A7C8A]/30"
              />
              ESCALATED MEMBER ISSUE
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#A8B8AC]/40 text-sm font-medium text-[#2F3E2F] hover:bg-[#A8B8AC]/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-[#4A7C8A] text-white text-sm font-medium hover:bg-[#3D6773]"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Daily Log Tab ──────────────────────────────────────────────────────

function DailyLogTab({
  logs,
  setLogs,
  activeMembers,
  onEscalationFromLog,
}: {
  logs: LogEntry[];
  setLogs: (fn: (prev: LogEntry[]) => LogEntry[]) => void;
  activeMembers: TeamMember[];
  onEscalationFromLog: (item: EscalationItem) => void;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<Omit<LogEntry, 'id'>>({
    date: today,
    teamMember: activeMembers[0]?.name || '',
    channel: 'Phone',
    memberName: '',
    reason: 'Sharing Requests',
    otherNotes: '',
    crmNotes: false,
    followUp: false,
    reviewLink: false,
    additionalNotes: '',
    timesSpokeWithMember: 1,
    escalatedIssue: false,
    specialProjectDescription: '',
    specialProjectDurationMinutes: 0,
  });

  const handleAdd = () => {
    if (!form.date || !form.teamMember) {
      toast.error('Please fill in Date and Team Member');
      return;
    }
    if (form.reason === 'Special Project') {
      if (!form.specialProjectDescription.trim()) {
        toast.error('Please describe the special project');
        return;
      }
      const mins = Math.floor(Number(form.specialProjectDurationMinutes) || 0);
      if (mins < 1) {
        toast.error('Enter time spent (minutes), at least 1');
        return;
      }
    } else if (!form.memberName.trim()) {
      toast.error('Please fill in Date, Team Member, and Member Name');
      return;
    }
    const id = uid();
    const memberNameNorm =
      form.reason === 'Special Project' && !form.memberName.trim()
        ? '—'
        : form.memberName.trim();
    const entry: LogEntry = normalizeLogEntry({
      ...form,
      id,
      memberName: memberNameNorm,
      timesSpokeWithMember: 1,
      escalatedIssue: form.escalatedIssue === true,
      specialProjectDescription: form.specialProjectDescription.trim(),
      specialProjectDurationMinutes:
        form.reason === 'Special Project'
          ? Math.min(99999, Math.max(1, Math.floor(Number(form.specialProjectDurationMinutes) || 0)))
          : 0,
    });
    setLogs((prev) => [entry, ...prev]);
    if (entry.escalatedIssue) {
      const summary =
        entry.reason === 'Special Project'
          ? [entry.specialProjectDescription, entry.additionalNotes].filter((x) => x.trim()).join(' — ') ||
            'Escalated member issue'
          : [entry.reason, entry.additionalNotes].filter((x) => x.trim()).join(' — ') || 'Escalated member issue';
      onEscalationFromLog({
        id: uid(),
        memberName: entry.memberName.trim(),
        summary,
        openedAt: entry.date,
        logEntryId: entry.id,
        status: 'open',
      });
    }
    setForm((f) => ({
      ...f,
      memberName: '',
      otherNotes: '',
      additionalNotes: '',
      crmNotes: false,
      followUp: false,
      reviewLink: false,
      timesSpokeWithMember: 1,
      escalatedIssue: false,
      specialProjectDescription: '',
      specialProjectDurationMinutes: 0,
    }));
    toast.success('Log entry added');
  };

  const [search, setSearch] = useState('');

  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);

  const handleDelete = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    if (editingLog?.id === id) setEditingLog(null);
    toast.success('Entry removed');
  };

  useEffect(() => {
    if (activeMembers.length === 0) return;
    setForm((f) =>
      f.teamMember && activeMembers.some((m) => m.name === f.teamMember)
        ? f
        : { ...f, teamMember: activeMembers[0].name },
    );
  }, [activeMembers]);

  const query = search.toLowerCase().trim();
  const filteredLogs = useMemo(() => {
    if (!query) return logs.slice(0, 50);
    return logs.filter(
      (l) =>
        l.memberName.toLowerCase().includes(query) ||
        l.teamMember.toLowerCase().includes(query) ||
        (l.specialProjectDescription || '').toLowerCase().includes(query) ||
        (l.additionalNotes || '').toLowerCase().includes(query) ||
        (l.otherNotes || '').toLowerCase().includes(query) ||
        l.reason.toLowerCase().includes(query) ||
        l.channel.toLowerCase().includes(query),
    );
  }, [logs, query]);

  return (
    <div className="space-y-6">
      {/* Entry Form */}
      <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 p-5">
        <h3 className="text-base font-bold text-[#2F3E2F] mb-4">New Log Entry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Team Member</label>
            <select
              value={form.teamMember}
              onChange={(e) => setForm((f) => ({ ...f, teamMember: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 bg-white focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
            >
              {activeMembers.map((m) => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Channel</label>
            <select
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 bg-white focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reason</label>
            <select
              value={form.reason}
              onChange={(e) => {
                const reason = e.target.value;
                setForm((f) => ({
                  ...f,
                  reason,
                  ...(reason !== 'Special Project'
                    ? { specialProjectDescription: '', specialProjectDurationMinutes: 0 }
                    : {}),
                  ...(reason !== 'Other' ? { otherNotes: '' } : {}),
                }));
              }}
              className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 bg-white focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Member Name{form.reason === 'Special Project' ? ' (optional)' : ''}
            </label>
            <input
              type="text"
              value={form.memberName}
              onChange={(e) => setForm((f) => ({ ...f, memberName: e.target.value }))}
              placeholder={
                form.reason === 'Special Project' ? "Member, or leave blank for internal project" : "Member's name"
              }
              className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
            />
          </div>
          {form.reason === 'Special Project' && (
            <>
              <div className="sm:col-span-2 lg:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Special project — description</label>
                <input
                  type="text"
                  value={form.specialProjectDescription}
                  onChange={(e) => setForm((f) => ({ ...f, specialProjectDescription: e.target.value }))}
                  placeholder="What you worked on (required)"
                  className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Time spent (minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={99999}
                  value={form.specialProjectDurationMinutes === 0 ? '' : form.specialProjectDurationMinutes}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({
                      ...f,
                      specialProjectDurationMinutes:
                        v === '' ? 0 : Math.min(99999, Math.max(1, Math.floor(Number(v) || 0))),
                    }));
                  }}
                  placeholder="e.g. 90"
                  className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm tabular-nums"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Counts toward weekly totals in the Touches column (1 per {SPECIAL_PROJECT_MINUTES_PER_TOUCH} min
                  worked, rounded up, min 1).
                </p>
              </div>
            </>
          )}
          {form.reason === 'Other' && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Other / Notes</label>
              <input
                type="text"
                value={form.otherNotes}
                onChange={(e) => setForm((f) => ({ ...f, otherNotes: e.target.value }))}
                placeholder="Describe..."
                className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
              />
            </div>
          )}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">Additional Notes</label>
            <input
              type="text"
              value={form.additionalNotes}
              onChange={(e) => setForm((f) => ({ ...f, additionalNotes: e.target.value }))}
              placeholder="Optional context. For multiple touches on the same day, include a multiplier (e.g. x2) — counts in weekly totals."
              className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.crmNotes}
              onChange={(e) => setForm((f) => ({ ...f, crmNotes: e.target.checked }))}
              className="rounded border-[#A8B8AC] text-[#4A7C8A] focus:ring-[#4A7C8A]/30"
            />
            Notes in CRM?
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.followUp}
              onChange={(e) => setForm((f) => ({ ...f, followUp: e.target.checked }))}
              className="rounded border-[#A8B8AC] text-[#4A7C8A] focus:ring-[#4A7C8A]/30"
            />
            Follow-up Task?
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.reviewLink}
              onChange={(e) => setForm((f) => ({ ...f, reviewLink: e.target.checked }))}
              className="rounded border-[#A8B8AC] text-[#4A7C8A] focus:ring-[#4A7C8A]/30"
            />
            <span>
              Review Link Sent?{' '}
              <span className="text-xs text-slate-500 font-normal">
                (full-time benchmark: {REVIEW_LINKS_DAILY_TARGET}/day)
              </span>
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.escalatedIssue}
              onChange={(e) => setForm((f) => ({ ...f, escalatedIssue: e.target.checked }))}
              className="rounded border-[#A8B8AC] text-[#4A7C8A] focus:ring-[#4A7C8A]/30"
            />
            ESCALATED MEMBER ISSUE
          </label>
          <button
            onClick={handleAdd}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4A7C8A] text-white text-sm font-medium hover:bg-[#3D6773] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 overflow-hidden">
        <div className="p-4 border-b border-[#A8B8AC]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-base font-bold text-[#2F3E2F]">
            {query ? 'Search Results' : 'Recent Entries'}{' '}
            <span className="text-sm font-normal text-slate-500">
              ({query ? `${filteredLogs.length} match${filteredLogs.length !== 1 ? 'es' : ''}` : `${logs.length} total`})
            </span>
          </h3>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member, rep, notes, channel, reason, or special project…"
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-[#A8B8AC]/20 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {query ? `No entries found for "${search}"` : 'No entries yet. Add your first log entry above.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#A8B8AC]/10 text-left text-xs font-medium text-[#2F3E2F] uppercase tracking-wide">
                  <th className="px-4 py-3">Wk</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Rep</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Touches</th>
                  <th className="px-4 py-3 text-center">Esc</th>
                  <th className="px-4 py-3">CRM</th>
                  <th className="px-4 py-3">F/U</th>
                  <th className="px-4 py-3">Rev</th>
                  <th className="px-4 py-3 text-center w-[5.5rem]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A8B8AC]/15">
                {filteredLogs.map((log) => {
                  const d = new Date(log.date);
                  const wk = isNaN(d.getTime()) ? '–' : getISOWeek(d);
                  return (
                    <tr key={log.id} className="hover:bg-[#A8B8AC]/5 transition-colors">
                      <td className="px-4 py-2.5 text-slate-500">{wk}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">{log.date}</td>
                      <td className="px-4 py-2.5 font-medium text-[#2F3E2F]">{log.teamMember}</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#4A7C8A]/10 text-[#4A7C8A]">
                          {log.channel}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{log.memberName}</td>
                      <td
                        className="px-4 py-2.5 text-slate-600 max-w-[14rem] truncate"
                        title={
                          log.reason === 'Special Project' ? log.specialProjectDescription || undefined : undefined
                        }
                      >
                        {log.reason === 'Special Project' && log.specialProjectDescription
                          ? `Special Project: ${log.specialProjectDescription}`
                          : log.reason}
                      </td>
                      <td
                        className="px-4 py-2.5 text-right tabular-nums font-semibold text-[#2F3E2F]"
                        title={
                          log.reason === 'Special Project' && log.specialProjectDurationMinutes > 0
                            ? `${log.specialProjectDurationMinutes} min → ${metricTouches(log)} touch(es)`
                            : log.touchOverride === true
                              ? `${metricTouches(log)} touch(es) (manual override)`
                              : touchesFromAdditionalNotes(log.additionalNotes || '') !== null
                                ? `${metricTouches(log)} touch(es) from multiplier in additional notes`
                                : undefined
                        }
                      >
                        {metricTouches(log)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {log.escalatedIssue ? (
                          <span title="Escalated">
                            <AlertTriangle className="w-4 h-4 text-amber-600 mx-auto" />
                          </span>
                        ) : (
                          '–'
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">{log.crmNotes ? <Check className="w-4 h-4 text-[#5B6B2E] mx-auto" /> : '–'}</td>
                      <td className="px-4 py-2.5 text-center">{log.followUp ? <Check className="w-4 h-4 text-[#5B6B2E] mx-auto" /> : '–'}</td>
                      <td className="px-4 py-2.5 text-center">{log.reviewLink ? <Check className="w-4 h-4 text-[#5B6B2E] mx-auto" /> : '–'}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => setEditingLog(log)}
                            className="p-1 hover:bg-[#4A7C8A]/10 rounded text-slate-400 hover:text-[#4A7C8A] transition-colors"
                            aria-label="Edit entry"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(log.id)}
                            className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                            aria-label="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {editingLog && (
        <EditLogEntryModal
          key={editingLog.id}
          log={editingLog}
          activeMembers={activeMembers}
          onClose={() => setEditingLog(null)}
          onSave={(next) => {
            setLogs((prev) => prev.map((l) => (l.id === next.id ? next : l)));
          }}
          onEscalationFromLog={onEscalationFromLog}
        />
      )}
    </div>
  );
}

// ── Member off days (any calendar date) ────────────────────────────────

function MemberOffDaysPanel({
  activeMembers,
  memberOffDays,
  setMemberOffDays,
}: {
  activeMembers: TeamMember[];
  memberOffDays: Record<string, string[]>;
  setMemberOffDays: (fn: (prev: Record<string, string[]>) => Record<string, string[]>) => void;
}) {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedId, setSelectedId] = useState('');
  const [offDate, setOffDate] = useState(today);

  useEffect(() => {
    if (activeMembers.length === 0) return;
    setSelectedId((prev) =>
      prev && activeMembers.some((m) => m.id === prev) ? prev : activeMembers[0].id,
    );
  }, [activeMembers]);

  const addOff = () => {
    if (!selectedId) {
      toast.error('Choose an employee');
      return;
    }
    if (!offDate) {
      toast.error('Pick a date');
      return;
    }
    const cur = memberOffDays[selectedId] || [];
    if (cur.includes(offDate)) {
      toast.error('That day is already marked off for this employee');
      return;
    }
    setMemberOffDays((prev) => ({
      ...prev,
      [selectedId]: [...(prev[selectedId] || []), offDate].sort(),
    }));
    toast.success('Off day saved');
  };

  const removeOff = (memberId: string, dateStr: string) => {
    setMemberOffDays((prev) => {
      const cur = prev[memberId] || [];
      const next = cur.filter((x) => x !== dateStr);
      const out = { ...prev };
      if (next.length === 0) delete out[memberId];
      else out[memberId] = next;
      return out;
    });
    toast.success('Off day removed');
  };

  const allEntries = useMemo(() => {
    const out: { member: TeamMember; date: string }[] = [];
    for (const m of activeMembers) {
      for (const d of memberOffDays[m.id] || []) {
        out.push({ member: m, date: d });
      }
    }
    out.sort(
      (a, b) => a.date.localeCompare(b.date) || a.member.name.localeCompare(b.member.name),
    );
    return out;
  }, [activeMembers, memberOffDays]);

  return (
    <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 p-5">
      <h3 className="text-base font-bold text-[#2F3E2F] mb-1">Days Marked Off</h3>
      <p className="text-sm text-slate-500 mb-4">
        PTO and other non-working days. Off days for the selected week also appear in the weekly table above.
      </p>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
        <div className="min-w-[200px] flex-1 sm:flex-initial sm:max-w-xs">
          <label htmlFor="off-employee" className="block text-xs font-medium text-slate-600 mb-1">
            Employee
          </label>
          <select
            id="off-employee"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 bg-white focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
          >
            {activeMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[160px]">
          <label htmlFor="off-date" className="block text-xs font-medium text-slate-600 mb-1">
            Date
          </label>
          <input
            id="off-date"
            type="date"
            value={offDate}
            onChange={(e) => setOffDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={addOff}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#4A7C8A] text-white text-sm font-medium hover:bg-[#3D6773] transition-colors sm:shrink-0"
        >
          <Plus className="w-4 h-4" />
          Mark off
        </button>
      </div>

      {allEntries.length > 0 ? (
        <div className="mt-5 pt-4 border-t border-[#A8B8AC]/20">
          <p className="text-xs font-medium text-slate-600 mb-2">All scheduled off days (click to remove)</p>
          <div className="flex flex-wrap gap-1.5">
            {allEntries.map(({ member, date }) => (
              <button
                key={`${member.id}-${date}`}
                type="button"
                onClick={() => removeOff(member.id, date)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-slate-200/80 text-[#2F3E2F] hover:bg-red-100 hover:text-red-700 transition-colors"
                title="Remove this off day"
              >
                <span className="font-semibold">{member.name}</span>
                <span className="text-slate-500">·</span>
                {date}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-400">No off days recorded yet.</p>
      )}
    </div>
  );
}

// ── Review Link Benchmark (full-time) ────────────────────────────────

function ReviewLinkBenchmarkCard({
  activeMembers,
  weekLogs,
  weekDates,
  memberOffDays,
}: {
  activeMembers: TeamMember[];
  weekLogs: LogEntry[];
  weekDates: string[];
  memberOffDays: Record<string, string[]>;
}) {
  const fullTime = useMemo(
    () => activeMembers.filter((m) => m.status === 'Active' && isFullTimeForReviewBenchmark(m)),
    [activeMembers],
  );

  const rows = useMemo(() => {
    return fullTime.map((m) => {
      const ml = weekLogs.filter((l) => l.teamMember === m.name);
      const offs = memberOffDays[m.id] || [];
      const cells = weekDates.map((d) => {
        const off = offs.includes(d);
        const c = ml.filter((l) => l.date === d && l.reviewLink).length;
        return { d, off, c };
      });
      let met = 0;
      let denom = 0;
      for (const { off, c } of cells) {
        if (off) continue;
        denom += 1;
        if (c >= REVIEW_LINKS_DAILY_TARGET) met += 1;
      }
      return { m, cells, met, denom };
    });
  }, [fullTime, weekLogs, weekDates, memberOffDays]);

  if (fullTime.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 overflow-hidden">
      <div className="p-5 border-b border-[#A8B8AC]/20">
        <h3 className="text-base font-bold text-[#2F3E2F]">Review Link Benchmark — Full-Time</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Each full-time rep (Acelyn Calderon, Adam Jordano, Ryan Cahill, and any non–part-time teammate) should log{' '}
          <strong>{REVIEW_LINKS_DAILY_TARGET}</strong> entries per day with <strong>Review Link Sent?</strong>{' '}
          checked. Days marked <strong>off</strong> (see <strong>Days Marked Off</strong> on this tab) do not count toward
          the goal or the denominator. Cells show review-link count for that calendar day.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-[#A8B8AC]/10 text-left text-xs font-medium text-[#2F3E2F] uppercase tracking-wide">
              <th className="px-3 py-3">Rep</th>
              {weekDates.map((d) => (
                <th key={d} className="px-1.5 py-3 text-center font-normal normal-case">
                  <span className="block text-[10px] text-slate-500 leading-tight">{d.slice(5)}</span>
                  <span className="text-[10px] text-slate-400">{safeFormatWeekdayFromIso(d)}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-right font-normal normal-case">Days met</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#A8B8AC]/15">
            {rows.map(({ m, cells, met, denom }) => (
              <tr key={m.id} className="hover:bg-[#A8B8AC]/5 transition-colors">
                <td className="px-3 py-2.5 font-medium text-[#2F3E2F] whitespace-nowrap">{m.name}</td>
                {cells.map(({ d, off, c }) => (
                  <td key={d} className="px-1 py-2 text-center align-middle">
                    {off ? (
                      <span className="text-[10px] text-slate-400 font-medium">Off</span>
                    ) : (
                      <span
                        className={`inline-flex flex-col items-center justify-center min-w-[2rem] px-1 py-0.5 rounded text-xs font-bold tabular-nums ${
                          c >= REVIEW_LINKS_DAILY_TARGET
                            ? 'bg-[#5B6B2E]/15 text-[#3d4a1f]'
                            : c > 0
                              ? 'bg-amber-100/80 text-amber-900'
                              : 'bg-red-50 text-red-700'
                        }`}
                        title={`${c} review links (goal ${REVIEW_LINKS_DAILY_TARGET})`}
                      >
                        {c}
                        <span className="text-[9px] font-normal opacity-80">/{REVIEW_LINKS_DAILY_TARGET}</span>
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-[#2F3E2F]">
                  {met}/{denom}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-[#A8B8AC]/20 text-xs text-slate-500 flex flex-wrap gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#5B6B2E]/20 border border-[#5B6B2E]/40" />
          ≥{REVIEW_LINKS_DAILY_TARGET} = goal met
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          1–{REVIEW_LINKS_DAILY_TARGET - 1} = below goal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-50 border border-red-200" />0 = none logged
        </span>
      </div>
    </div>
  );
}

// ── Weekly Report Tab ──────────────────────────────────────────────────

function WeeklyReportTab({
  reportLogs,
  weekDates,
  periodLabel,
  activeMembers,
  memberOffDays,
  setMemberOffDays,
  weeklyExtras,
  setWeeklyExtras,
}: {
  reportLogs: LogEntry[];
  weekDates: string[];
  periodLabel: string;
  activeMembers: TeamMember[];
  memberOffDays: Record<string, string[]>;
  setMemberOffDays: (fn: (prev: Record<string, string[]>) => Record<string, string[]>) => void;
  weeklyExtras: WeeklyReportExtras;
  setWeeklyExtras: (fn: (prev: WeeklyReportExtras) => WeeklyReportExtras) => void;
}) {
  const [weeklyCallTimesMemberId, setWeeklyCallTimesMemberId] = useState(() => activeMembers[0]?.id ?? '');

  useEffect(() => {
    if (activeMembers.length === 0) return;
    if (!weeklyCallTimesMemberId || !activeMembers.some((m) => m.id === weeklyCallTimesMemberId)) {
      setWeeklyCallTimesMemberId(activeMembers[0].id);
    }
  }, [activeMembers, weeklyCallTimesMemberId]);

  const resolvedCallTimesMemberId = useMemo(() => {
    if (activeMembers.length === 0) return '';
    if (weeklyCallTimesMemberId && activeMembers.some((m) => m.id === weeklyCallTimesMemberId)) {
      return weeklyCallTimesMemberId;
    }
    return activeMembers[0].id;
  }, [activeMembers, weeklyCallTimesMemberId]);

  const weekDateSet = useMemo(() => new Set(weekDates), [weekDates]);
  const totalTouches = useMemo(() => sumTouches(reportLogs), [reportLogs]);

  const offDaysThisWeekByMember = useMemo(() => {
    return activeMembers
      .map((m) => {
        const off = (memberOffDays[m.id] || [])
          .filter((d) => weekDateSet.has(d))
          .sort();
        if (off.length === 0) return null;
        return {
          name: m.name,
          line: `${m.name}: ${off.map(formatOffDayForReport).join(', ')}`,
        };
      })
      .filter((x): x is { name: string; line: string } => x !== null);
  }, [activeMembers, memberOffDays, weekDateSet]);

  const rows = useMemo(() => {
    return activeMembers.map((m) => {
      const ml = reportLogs.filter((l) => l.teamMember === m.name);
      return {
        member: m,
        name: m.name,
        total: sumTouches(ml),
        rowCount: ml.length,
        phone: ml.filter((l) => l.channel === 'Phone').length,
        email: ml.filter((l) => l.channel === 'Email').length,
        salesiq: ml.filter((l) => l.channel === 'SalesIQ').length,
        followups: ml.filter((l) => l.reason === 'Follow Up').length,
        rx: ml.filter((l) => l.reason === 'Rx Request').length,
        labs: ml.filter((l) => l.reason === 'Labs Request').length,
        imaging: ml.filter((l) => l.reason === 'Imaging Request').length,
        appt: ml.filter((l) => l.reason === 'Appt Scheduling').length,
      };
    });
  }, [reportLogs, activeMembers]);

  const fullTimeAvg = useMemo(
    () => fullTimeWeekAvg(activeMembers, rows.map((r) => ({ name: r.name, total: r.total }))),
    [activeMembers, rows],
  );

  const overallAvg = rows.length ? Math.round(rows.reduce((s, r) => s + r.total, 0) / rows.length) : 0;

  const underperformers = useMemo(() => {
    if (fullTimeAvg <= 0) return [] as string[];
    const names: string[] = [];
    for (const r of rows) {
      if (isPartTimeMember(r.member)) continue;
      if (r.total <= fullTimeAvg * 0.8) names.push(r.name);
    }
    return names;
  }, [rows, fullTimeAvg]);

  useEffect(() => {
    if (underperformers.length === 0) return;
    toast.error(
      `Performance alert (${periodLabel}): ${underperformers.join(', ')} ${
        underperformers.length === 1 ? 'is' : 'are'
      } at or below 80% of the full-time team average. Consider a coaching check-in.`,
      { duration: 10000 },
    );
  }, [periodLabel, underperformers.join('|')]);

  return (
    <div className="space-y-4">
      {underperformers.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 flex gap-3 items-start"
        >
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Below full-time team average (≥20% gap)</p>
            <p className="mt-1 text-amber-900/90">
              Full-time avg for <strong>{periodLabel}</strong> is <strong>{fullTimeAvg}</strong> member touches per rep (part-time excluded from average).
              Flagged: <strong>{underperformers.join(', ')}</strong> — at or under 80% of that average.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 overflow-hidden">
        <div className="p-5 border-b border-[#A8B8AC]/20">
          <h3 className="text-base font-bold text-[#2F3E2F]">Per-Rep Weekly Totals — {periodLabel}</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {reportLogs.length} log rows · <strong>{totalTouches}</strong> total member touches · All-team avg{' '}
            {overallAvg} touches/rep · Full-time avg {fullTimeAvg} touches/rep (used for alerts)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-[#A8B8AC]/10 text-left text-xs font-medium text-[#2F3E2F] uppercase tracking-wide">
                <th className="px-4 py-3">Team Member</th>
                <th className="px-4 py-3 text-right">Touches</th>
                <th className="px-4 py-3 text-right">Phone</th>
                <th className="px-4 py-3 text-left min-w-[9rem]" title="Total phone / on-phone time for the week (entered below)">
                  Phone time (wk)
                </th>
                <th className="px-4 py-3 text-right">Email</th>
                <th className="px-4 py-3 text-right">SalesIQ</th>
                <th className="px-4 py-3 text-right">Follow-ups</th>
                <th className="px-4 py-3 text-right">Rx</th>
                <th className="px-4 py-3 text-right">Labs</th>
                <th className="px-4 py-3 text-right">Imaging</th>
                <th className="px-4 py-3 text-right">Appt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#A8B8AC]/15">
              {rows.map((r) => {
                const part = isPartTimeMember(r.member);
                const belowFtAvg = !part && fullTimeAvg > 0 && r.total < fullTimeAvg;
                const alertRow = !part && fullTimeAvg > 0 && r.total <= fullTimeAvg * 0.8;
                const rowClass = part
                  ? 'bg-slate-50/80'
                  : alertRow
                    ? 'bg-red-50/50'
                    : belowFtAvg
                      ? 'bg-yellow-50/50'
                      : '';
                const phoneTimeWeek = weeklyExtras.callTimesByMemberId[r.member.id]?.trim() || '';
                return (
                  <tr key={r.name} className={`${rowClass} hover:bg-[#A8B8AC]/5 transition-colors`}>
                    <td className="px-4 py-3 font-medium text-[#2F3E2F]">
                      <span className="block">{r.name}</span>
                      {part && (
                        <span className="text-[10px] font-normal text-slate-500 uppercase tracking-wide">
                          Part-time
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold" title={`${r.rowCount} log row(s)`}>
                      {r.total}
                    </td>
                    <td className="px-4 py-3 text-right" title="Log rows with channel Phone">
                      {r.phone}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs max-w-[14rem]">
                      {phoneTimeWeek ? (
                        <span className="line-clamp-3" title={phoneTimeWeek}>
                          {phoneTimeWeek}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{r.email}</td>
                    <td className="px-4 py-3 text-right">{r.salesiq}</td>
                    <td className="px-4 py-3 text-right">{r.followups}</td>
                    <td className="px-4 py-3 text-right">{r.rx}</td>
                    <td className="px-4 py-3 text-right">{r.labs}</td>
                    <td className="px-4 py-3 text-right">{r.imaging}</td>
                    <td className="px-4 py-3 text-right">{r.appt}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#2F3E2F]/5 font-bold text-[#2F3E2F]">
                <td className="px-4 py-3">TEAM TOTAL</td>
                <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.total, 0)}</td>
                <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.phone, 0)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs font-normal">—</td>
                <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.email, 0)}</td>
                <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.salesiq, 0)}</td>
                <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.followups, 0)}</td>
                <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.rx, 0)}</td>
                <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.labs, 0)}</td>
                <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.imaging, 0)}</td>
                <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.appt, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="p-4 border-t border-[#A8B8AC]/20 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" /> Below full-time avg (not yet 20%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> ≥20% below full-time avg
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" /> Part-time (excluded from alert math)
          </span>
        </div>
        {offDaysThisWeekByMember.length > 0 && (
          <div className="px-4 pb-4 border-t border-[#A8B8AC]/15 pt-4">
            <p className="text-xs font-semibold text-[#2F3E2F] uppercase tracking-wide mb-2">Days off this week</p>
            <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
              {offDaysThisWeekByMember.map((item) => (
                <li key={item.name}>{item.line}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-2">
              To add or change off days, use <strong>Days Marked Off</strong> below.
            </p>
          </div>
        )}
        <div className="px-4 pb-4 border-t border-[#A8B8AC]/15 pt-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong>Touches</strong> default to 1 per log row unless <strong>Additional notes</strong> include a multiplier
            (e.g. <strong>x2</strong> for two touches). <strong>Special Project</strong> rows use time spent instead (1
            touch per {SPECIAL_PROJECT_MINUTES_PER_TOUCH} min, rounded up). <strong>Phone</strong> is the count of log
            rows on the Phone channel; <strong>Phone time (wk)</strong> is the total on-phone or scheduled time you enter
            in <strong>Weekly Call Times</strong> at the bottom of this tab. Other channel/reason columns count log rows.
            Part-time reps are not compared for performance alerts.
          </p>
        </div>
      </div>

      <ReviewLinkBenchmarkCard
        activeMembers={activeMembers}
        weekLogs={reportLogs}
        weekDates={weekDates}
        memberOffDays={memberOffDays}
      />

      <MemberOffDaysPanel
        activeMembers={activeMembers}
        memberOffDays={memberOffDays}
        setMemberOffDays={setMemberOffDays}
      />

      <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 p-5">
        <h3 className="text-base font-bold text-[#2F3E2F] mb-3">Weekly Call Times</h3>
        <p className="text-sm text-slate-500 mb-4">
          Choose a rep, enter their weekly call times (hours, schedule, or notes). It shows in{' '}
          <strong>Phone time (wk)</strong> on the report above for <strong>{periodLabel}</strong>.
        </p>
        {activeMembers.length === 0 ? (
          <p className="text-sm text-slate-500">No active team members to log call times for.</p>
        ) : (
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 max-w-2xl">
          <div className="flex-1 min-w-[12rem]">
            <label htmlFor="weekly-call-times-member" className="block text-xs font-medium text-slate-600 mb-1">
              Team member
            </label>
            <select
              id="weekly-call-times-member"
              value={resolvedCallTimesMemberId}
              onChange={(e) => setWeeklyCallTimesMemberId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#A8B8AC]/40 bg-white focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
            >
              {activeMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-[2] min-w-0 w-full">
            <label htmlFor="weekly-call-times-value" className="block text-xs font-medium text-slate-600 mb-1">
              Weekly Call Times
            </label>
            <input
              id="weekly-call-times-value"
              type="text"
              value={weeklyExtras.callTimesByMemberId[resolvedCallTimesMemberId] ?? ''}
              onChange={(e) =>
                setWeeklyExtras((prev) => ({
                  ...prev,
                  callTimesByMemberId: {
                    ...prev.callTimesByMemberId,
                    [resolvedCallTimesMemberId]: e.target.value,
                  },
                }))
              }
              placeholder="e.g. 28 hrs on phone, M–F 8–6 CT"
              className="w-full px-3 py-2.5 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
            />
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

// ── Performance Comparison Tab ─────────────────────────────────────────

function PerformanceTab({
  logs,
  activeMembers,
  weekNumber,
}: {
  logs: LogEntry[];
  activeMembers: TeamMember[];
  weekNumber: number;
}) {
  const isoWeeks = useMemo(
    () => [weekNumber - 4, weekNumber - 3, weekNumber - 2, weekNumber - 1, weekNumber],
    [weekNumber],
  );

  const getISOWeekTouches = useCallback(
    (name: string, wk: number) =>
      sumTouches(
        logs.filter((l) => {
          const d = new Date(l.date);
          return !isNaN(d.getTime()) && l.teamMember === name && getISOWeek(d) === wk;
        }),
      ),
    [logs],
  );

  const periods = useMemo(() => {
    return { kind: 'iso' as const, labels: isoWeeks.map((w) => `Wk ${w}`), keys: isoWeeks };
  }, [isoWeeks]);

  const data = useMemo(() => {
    return activeMembers.map((m) => {
      const counts = (periods.keys as number[]).map((wk) => getISOWeekTouches(m.name, wk));
      const avg = Math.round(counts.reduce((s, c) => s + c, 0) / counts.length);
      return { name: m.name, counts, avg };
    });
  }, [activeMembers, periods, getISOWeekTouches]);

  const maxCount = Math.max(1, ...data.flatMap((d) => d.counts));

  const subtitle = `ISO weeks ${isoWeeks[0]} – ${isoWeeks[4]} (member touches)`;

  return (
    <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 overflow-hidden">
      <div className="p-5 border-b border-[#A8B8AC]/20">
        <h3 className="text-base font-bold text-[#2F3E2F]">5-Period Rolling Performance</h3>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#A8B8AC]/10 text-left text-xs font-medium text-[#2F3E2F] uppercase tracking-wide">
              <th className="px-4 py-3">Team Member</th>
              {periods.labels.map((label, i) => (
                <th key={i} className="px-4 py-3 text-right font-normal normal-case max-w-[7rem]">
                  {i === 4 ? <span className="text-[#4A7C8A] font-semibold">{label} ★</span> : label}
                </th>
              ))}
              <th className="px-4 py-3 text-right">Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#A8B8AC]/15">
            {data.map((row) => (
              <tr key={row.name} className="hover:bg-[#A8B8AC]/5 transition-colors">
                <td className="px-4 py-3 font-medium text-[#2F3E2F]">{row.name}</td>
                {row.counts.map((count, i) => (
                  <td key={i} className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-[#A8B8AC]/15 rounded-full h-2 hidden lg:block">
                        <div
                          className="bg-[#4A7C8A] h-2 rounded-full transition-all"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="tabular-nums">{count}</span>
                    </div>
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-bold">{row.avg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Reason Analytics Tab ───────────────────────────────────────────────

function AnalyticsTab({
  weekLogs,
  comparisonLogs,
  periodLabel,
}: {
  weekLogs: LogEntry[];
  comparisonLogs: LogEntry[];
  periodLabel: string;
}) {
  const prevWeekCount = 4;
  const rows = useMemo(() => {
    const total = weekLogs.length || 1;
    return REASONS.map((reason) => {
      const count = weekLogs.filter((l) => l.reason === reason).length;
      const prevCount = comparisonLogs.filter((l) => l.reason === reason).length;
      const prevAvg = prevCount / (prevWeekCount || 1);
      const spike = prevAvg > 0 ? ((count - prevAvg) / prevAvg) * 100 : 0;
      return { reason, count, pct: (count / total) * 100, spike, prevAvg };
    }).sort((a, b) => b.count - a.count);
  }, [weekLogs, comparisonLogs]);

  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 overflow-hidden">
      <div className="p-5 border-b border-[#A8B8AC]/20">
        <h3 className="text-base font-bold text-[#2F3E2F]">Reason for Contact — {periodLabel}</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Identify which issues are driving the most contacts
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#A8B8AC]/10 text-left text-xs font-medium text-[#2F3E2F] uppercase tracking-wide">
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3 text-right">Count</th>
              <th className="px-4 py-3">Distribution</th>
              <th className="px-4 py-3 text-right">% of Total</th>
              <th className="px-4 py-3 text-right">vs prior 4</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#A8B8AC]/15">
            {rows.map((r) => (
              <tr key={r.reason} className={`hover:bg-[#A8B8AC]/5 transition-colors ${r.spike >= 50 ? 'bg-red-50/40' : ''}`}>
                <td className="px-4 py-3 font-medium text-[#2F3E2F]">{r.reason}</td>
                <td className="px-4 py-3 text-right font-bold tabular-nums">{r.count}</td>
                <td className="px-4 py-3">
                  <div className="w-full bg-[#A8B8AC]/15 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-[#4A7C8A] to-[#8B9B3A] h-2.5 rounded-full transition-all"
                      style={{ width: `${(r.count / maxCount) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{r.pct.toFixed(1)}%</td>
                <td className="px-4 py-3 text-right">
                  {r.prevAvg > 0 ? (
                    <span className={`text-xs font-medium ${r.spike >= 50 ? 'text-red-600' : r.spike > 0 ? 'text-orange-600' : 'text-[#5B6B2E]'}`}>
                      {r.spike > 0 ? '+' : ''}{r.spike.toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">N/A</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#2F3E2F]/5 font-bold text-[#2F3E2F]">
              <td className="px-4 py-3">TOTAL</td>
              <td className="px-4 py-3 text-right">{weekLogs.length}</td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3 text-right">100%</td>
              <td className="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="p-4 border-t border-[#A8B8AC]/20 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          Red = current period is 50%+ higher than average of the prior 4 periods (possible systemic issue)
        </span>
      </div>
    </div>
  );
}

// ── Member Trends Tab ──────────────────────────────────────────────────

function TrendsTab({
  logs,
  escalations,
  setEscalations,
}: {
  logs: LogEntry[];
  escalations: EscalationItem[];
  setEscalations: (fn: (prev: EscalationItem[]) => EscalationItem[]) => void;
}) {
  const openEscalations = useMemo(
    () => escalations.filter((e) => e.status === 'open').sort((a, b) => b.openedAt.localeCompare(a.openedAt)),
    [escalations],
  );
  const doneEscalations = useMemo(
    () =>
      escalations
        .filter((e) => e.status === 'complete')
        .sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || '')),
    [escalations],
  );

  const markComplete = (id: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    setEscalations((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: 'complete' as const, completedAt: today } : e,
      ),
    );
    toast.success('Marked complete');
  };

  const reopen = (id: string) => {
    setEscalations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'open' as const, completedAt: undefined } : e)),
    );
    toast.success('Moved back to open');
  };

  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  }, []);

  const flagged = useMemo(() => {
    const recentLogs = logs.filter((l) => l.date >= thirtyDaysAgo);
    const grouped: Record<string, LogEntry[]> = {};

    for (const log of recentLogs) {
      const key = `${log.memberName.toLowerCase().trim()}::${log.reason}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    }

    return Object.entries(grouped)
      .filter(([, entries]) => entries.length >= 3)
      .map(([, entries]) => {
        const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
        return {
          memberName: sorted[0].memberName,
          reason: sorted[0].reason,
          count: entries.length,
          lastDate: sorted[0].date,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [logs, thirtyDaysAgo]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 overflow-hidden">
        <div className="p-5 border-b border-[#A8B8AC]/20">
          <h3 className="text-base font-bold text-[#2F3E2F]">Escalated member issues</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Tracked from the <strong>ESCALATED MEMBER ISSUE</strong> checkbox on daily logs. Use for ongoing issues,
            reminders, and follow-up until resolved.
          </p>
        </div>
        {openEscalations.length === 0 && doneEscalations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No escalations recorded yet.</div>
        ) : (
          <div className="divide-y divide-[#A8B8AC]/15">
            {openEscalations.length > 0 && (
              <div className="p-4">
                <p className="text-xs font-semibold text-[#2F3E2F] uppercase tracking-wide mb-3">Open</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#A8B8AC]/10 text-left text-xs font-medium text-[#2F3E2F] uppercase tracking-wide">
                        <th className="px-4 py-3">Member</th>
                        <th className="px-4 py-3">Summary</th>
                        <th className="px-4 py-3">Opened</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#A8B8AC]/15">
                      {openEscalations.map((e) => (
                        <tr key={e.id} className="hover:bg-[#A8B8AC]/5 transition-colors">
                          <td className="px-4 py-3 font-medium text-[#2F3E2F]">{e.memberName}</td>
                          <td className="px-4 py-3 text-slate-600 max-w-md">{e.summary}</td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{e.openedAt}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => markComplete(e.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#5B6B2E]/15 text-[#3d4a1f] text-xs font-medium hover:bg-[#5B6B2E]/25 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Mark complete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {doneEscalations.length > 0 && (
              <div className="p-4 bg-slate-50/80">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">Completed</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#A8B8AC]/10 text-left text-xs font-medium text-[#2F3E2F] uppercase tracking-wide">
                        <th className="px-4 py-3">Member</th>
                        <th className="px-4 py-3">Summary</th>
                        <th className="px-4 py-3">Completed</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#A8B8AC]/15">
                      {doneEscalations.map((e) => (
                        <tr key={e.id} className="opacity-80 hover:opacity-100 transition-opacity">
                          <td className="px-4 py-3 font-medium text-[#2F3E2F]">{e.memberName}</td>
                          <td className="px-4 py-3 text-slate-600 max-w-md">{e.summary}</td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{e.completedAt || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => reopen(e.id)}
                              className="text-xs font-medium text-[#4A7C8A] hover:underline"
                            >
                              Reopen
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 overflow-hidden">
        <div className="p-5 border-b border-[#A8B8AC]/20">
          <h3 className="text-base font-bold text-[#2F3E2F]">Repeat contacts — same reason (last 30 days)</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            Members who logged 3+ contact rows for the same reason. May need proactive outreach.
          </p>
        </div>
        {flagged.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No repeat-contact patterns detected in the last 30 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#A8B8AC]/10 text-left text-xs font-medium text-[#2F3E2F] uppercase tracking-wide">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">30-Day Rows</th>
                  <th className="px-4 py-3">Last Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A8B8AC]/15">
                {flagged.map((f, i) => (
                  <tr key={i} className="hover:bg-[#A8B8AC]/5 transition-colors">
                    <td className="px-4 py-3 font-medium text-[#2F3E2F]">{f.memberName}</td>
                    <td className="px-4 py-3 text-slate-600">{f.reason}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        {f.count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{f.lastDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Team Tab ───────────────────────────────────────────────────────────

function TeamTab({
  team,
  setTeam,
}: {
  team: TeamMember[];
  setTeam: (fn: (prev: TeamMember[]) => TeamMember[]) => void;
}) {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Concierge');

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error('Enter a name');
      return;
    }
    setTeam((prev) => [
      ...prev,
      { id: uid(), name: newName.trim(), status: 'Active', role: newRole },
    ]);
    setNewName('');
    toast.success('Team member added');
  };

  const toggleStatus = (id: string) => {
    setTeam((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: m.status === 'Active' ? 'Inactive' : 'Active' } : m,
      ),
    );
  };

  const handleRemove = (id: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 p-5">
        <h3 className="text-base font-bold text-[#2F3E2F] mb-4">Add Team Member</h3>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
          />
          <input
            type="text"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="Role"
            className="w-40 px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
          />
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4A7C8A] text-white text-sm font-medium hover:bg-[#3D6773] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 overflow-hidden">
        <div className="p-4 border-b border-[#A8B8AC]/20">
          <h3 className="text-base font-bold text-[#2F3E2F]">Concierge Team Roster</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#A8B8AC]/10 text-left text-xs font-medium text-[#2F3E2F] uppercase tracking-wide">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Schedule</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#A8B8AC]/15">
            {team.map((m) => (
              <tr key={m.id} className="hover:bg-[#A8B8AC]/5 transition-colors">
                <td className="px-4 py-3 font-medium text-[#2F3E2F]">{m.name}</td>
                <td className="px-4 py-3 text-slate-600">{m.role}</td>
                <td className="px-4 py-3">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPartTimeMember(m)}
                      onChange={() =>
                        setTeam((prev) =>
                          prev.map((x) =>
                            x.id === m.id
                              ? { ...x, partTime: isPartTimeMember(x) ? false : true }
                              : x,
                          ),
                        )
                      }
                      className="rounded border-[#A8B8AC] text-[#4A7C8A] focus:ring-[#4A7C8A]/30"
                    />
                    Part-time
                  </label>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(m.id)}
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                      m.status === 'Active'
                        ? 'bg-[#5B6B2E]/10 text-[#5B6B2E]'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {m.status}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────

export default function DailyLogs() {
  const [activeTab, setActiveTab] = useState<TabId>('log');
  const [showShare, setShowShare] = useState(false);
  const [weekNumber, setWeekNumber] = useState(() => getISOWeek(new Date()));

  const [logs, setLogsRaw] = useState<LogEntry[]>(() => {
    const raw = loadFromStorage<LogEntry[]>(STORAGE_KEY_LOGS, []);
    const migrated = migrateLogsStorage(raw);
    try {
      if (JSON.stringify(migrated) !== JSON.stringify(raw)) {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(migrated));
      }
    } catch {
      /* ignore */
    }
    return migrated;
  });
  const [team, setTeamRaw] = useState<TeamMember[]>(() => {
    const raw = loadFromStorage<TeamMember[]>(STORAGE_KEY_TEAM, []);
    const base = raw.length ? raw : DEFAULT_TEAM.map((m) => ({ ...m }));
    const normalized = normalizeStoredTeam(base);
    try {
      if (JSON.stringify(normalized) !== JSON.stringify(raw)) {
        localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(normalized));
      }
    } catch {
      /* ignore */
    }
    return normalized;
  });
  const [memberOffDaysRaw, setMemberOffDaysRaw] = useState<Record<string, string[]>>(() =>
    loadMemberOffDaysFromStorage(),
  );

  const [escalations, setEscalationsRaw] = useState<EscalationItem[]>(() =>
    loadFromStorage<EscalationItem[]>(STORAGE_KEY_ESCALATIONS, []),
  );

  const [weeklyReportExtrasMap, setWeeklyReportExtrasMapRaw] = useState<Record<string, WeeklyReportExtras>>(() =>
    loadFromStorage<Record<string, WeeklyReportExtras>>(STORAGE_KEY_WEEKLY_EXTRAS, {}),
  );

  const setMemberOffDays: typeof setMemberOffDaysRaw = useCallback((fn) => {
    setMemberOffDaysRaw((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      localStorage.setItem(STORAGE_KEY_MEMBER_OFF_DAYS, JSON.stringify(next));
      return next;
    });
  }, []);

  const setEscalations = useCallback(
    (fn: EscalationItem[] | ((prev: EscalationItem[]) => EscalationItem[])) => {
      setEscalationsRaw((prev) => {
        const next = typeof fn === 'function' ? fn(prev) : fn;
        localStorage.setItem(STORAGE_KEY_ESCALATIONS, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const onEscalationFromLog = useCallback(
    (item: EscalationItem) => {
      setEscalations((prev) => [item, ...prev]);
    },
    [setEscalations],
  );

  const setLogs: typeof setLogsRaw = useCallback((fn) => {
    setLogsRaw((prev) => {
      const rawNext = typeof fn === 'function' ? fn(prev) : fn;
      const next = rawNext.map(normalizeLogEntry);
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(next));
      return next;
    });
  }, []);

  const setTeam: typeof setTeamRaw = useCallback((fn) => {
    setTeamRaw((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      localStorage.setItem(STORAGE_KEY_TEAM, JSON.stringify(next));
      return next;
    });
  }, []);

  const activeMembers = useMemo(() => team.filter((m) => m.status === 'Active'), [team]);

  const isoRefYear = useMemo(() => refYearForWeek(logs, weekNumber), [logs, weekNumber]);

  const reportLogs = useMemo(() => {
    return logs.filter((l) => {
      const d = new Date(l.date);
      return !isNaN(d.getTime()) && getISOWeek(d) === weekNumber;
    });
  }, [logs, weekNumber]);

  const weekDates = useMemo(() => getWeekDateStrings(weekNumber, isoRefYear), [weekNumber, isoRefYear]);

  const periodLabel = useMemo(() => `ISO Week ${weekNumber}`, [weekNumber]);

  const reportStorageKey = useMemo(
    () => buildReportStorageKey(weekNumber, isoRefYear),
    [weekNumber, isoRefYear],
  );

  const currentWeeklyExtras = weeklyReportExtrasMap[reportStorageKey] ?? defaultWeeklyExtras();

  const setWeeklyExtras = useCallback(
    (fn: (prev: WeeklyReportExtras) => WeeklyReportExtras) => {
      setWeeklyReportExtrasMapRaw((prev) => {
        const cur = prev[reportStorageKey] ?? defaultWeeklyExtras();
        const nextEntry = fn(cur);
        const next = { ...prev, [reportStorageKey]: nextEntry };
        try {
          localStorage.setItem(STORAGE_KEY_WEEKLY_EXTRAS, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [reportStorageKey],
  );

  const analyticsComparisonLogs = useMemo(() => {
    const prevWeeks = [weekNumber - 4, weekNumber - 3, weekNumber - 2, weekNumber - 1];
    return logs.filter((l) => {
      const d = new Date(l.date);
      if (isNaN(d.getTime())) return false;
      return prevWeeks.includes(getISOWeek(d));
    });
  }, [logs, weekNumber]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2F3E2F] to-[#4A7C8A] flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#2F3E2F]">Daily Logs & Reports</h1>
              <p className="text-sm text-[#5B6B2E]">
                Track contacts, ISO weekly reports, and share with management
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">ISO week:</label>
              <div className="flex items-center border border-[#A8B8AC]/40 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setWeekNumber((w) => w - 1)}
                  className="px-2 py-1.5 hover:bg-[#A8B8AC]/10 text-slate-600 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 rotate-90" />
                </button>
                <span className="px-3 py-1.5 text-sm font-bold text-[#2F3E2F] tabular-nums bg-[#A8B8AC]/5 min-w-[40px] text-center">
                  {weekNumber}
                </span>
                <button
                  type="button"
                  onClick={() => setWeekNumber((w) => w + 1)}
                  className="px-2 py-1.5 hover:bg-[#A8B8AC]/10 text-slate-600 transition-colors"
                >
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4A7C8A] text-white text-sm font-medium hover:bg-[#3D6773] transition-colors"
            >
              <Send className="w-4 h-4" />
              Share Report
            </button>

            <button
              type="button"
              onClick={() => {
                const headers = [
                  'Week',
                  'Date',
                  'Team Member',
                  'Channel',
                  'Member Name',
                  'Reason',
                  'Other/Notes',
                  'CRM Notes',
                  'Follow-up',
                  'Review Link',
                  'Additional Notes',
                  'Touches',
                  'Escalated issue',
                  'Special project',
                  'Special project (min)',
                ];
                const rows = logs.map((l) => [
                  String(isNaN(new Date(l.date).getTime()) ? '' : getISOWeek(new Date(l.date))),
                  l.date,
                  l.teamMember,
                  l.channel,
                  l.memberName,
                  l.reason,
                  l.otherNotes,
                  l.crmNotes ? 'Yes' : 'No',
                  l.followUp ? 'Yes' : 'No',
                  l.reviewLink ? 'Yes' : 'No',
                  l.additionalNotes,
                  String(metricTouches(l)),
                  l.escalatedIssue ? 'Yes' : 'No',
                  l.reason === 'Special Project' ? l.specialProjectDescription : '',
                  l.reason === 'Special Project' ? String(l.specialProjectDurationMinutes || '') : '',
                ]);
                const csv = [headers, ...rows]
                  .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
                  .join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `concierge-daily-log-all.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success('Full log exported');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#A8B8AC]/40 text-[#2F3E2F] text-sm font-medium hover:bg-[#A8B8AC]/10 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export All
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 rounded-lg bg-[#A8B8AC]/10 px-3 py-2 border border-[#A8B8AC]/20">
          <strong>Active report:</strong> {periodLabel} · {reportLogs.length} row(s),{' '}
          <strong>{sumTouches(reportLogs)}</strong> touches in view.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[#A8B8AC]/30 pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-[#4A7C8A] text-[#4A7C8A]'
                  : 'border-transparent text-slate-500 hover:text-[#2F3E2F] hover:border-[#A8B8AC]/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'log' && (
        <DailyLogTab
          logs={logs}
          setLogs={setLogs}
          activeMembers={activeMembers}
          onEscalationFromLog={onEscalationFromLog}
        />
      )}
      {activeTab === 'weekly' && (
        <WeeklyReportTab
          reportLogs={reportLogs}
          weekDates={weekDates}
          periodLabel={periodLabel}
          activeMembers={activeMembers}
          memberOffDays={memberOffDaysRaw}
          setMemberOffDays={setMemberOffDays}
          weeklyExtras={currentWeeklyExtras}
          setWeeklyExtras={setWeeklyExtras}
        />
      )}
      {activeTab === 'performance' && (
        <PerformanceTab logs={logs} activeMembers={activeMembers} weekNumber={weekNumber} />
      )}
      {activeTab === 'analytics' && (
        <AnalyticsTab
          weekLogs={reportLogs}
          comparisonLogs={analyticsComparisonLogs}
          periodLabel={periodLabel}
        />
      )}
      {activeTab === 'trends' && (
        <TrendsTab logs={logs} escalations={escalations} setEscalations={setEscalations} />
      )}
      {activeTab === 'team' && <TeamTab team={team} setTeam={setTeam} />}

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          onClose={() => setShowShare(false)}
          weekLogs={reportLogs}
          team={team}
          periodTitle={periodLabel}
          weeklyExtras={currentWeeklyExtras}
        />
      )}
    </div>
  );
}
