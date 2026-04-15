import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  Download,
  Send,
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
}

// ── Constants ──────────────────────────────────────────────────────────

const CHANNELS = ['Phone', 'Email', 'SalesIQ', 'Chat', 'In-Person'];

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
  'Preventive/Billing',
  'Follow Up',
  'Other',
];

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

const DEFAULT_TEAM: TeamMember[] = [
  { id: '1', name: 'Acelyn', status: 'Active', role: 'Concierge' },
  { id: '2', name: 'Adam', status: 'Active', role: 'Concierge' },
  { id: '3', name: 'Ryan', status: 'Active', role: 'Concierge' },
];

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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

// ── Share Modal ────────────────────────────────────────────────────────

function ShareModal({
  onClose,
  logs,
  team,
  weekNumber,
}: {
  onClose: () => void;
  logs: LogEntry[];
  team: TeamMember[];
  weekNumber: number;
}) {
  const [emails, setEmails] = useState('');
  const [includeWeekly, setIncludeWeekly] = useState(true);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [copied, setCopied] = useState(false);

  const weekLogs = logs.filter((l) => {
    const d = new Date(l.date);
    return !isNaN(d.getTime()) && getISOWeek(d) === weekNumber;
  });

  const buildReportText = useCallback(() => {
    const activeMembers = team.filter((m) => m.status === 'Active');
    const lines: string[] = [
      `CONCIERGE WEEKLY REPORT — Week ${weekNumber}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
    ];

    if (includeWeekly) {
      lines.push('═══ PER-REP WEEKLY TOTALS ═══', '');
      lines.push(
        'Team Member | Total | Phone | Email | SalesIQ | Follow-ups | Rx | Labs | Imaging | Appt',
      );
      lines.push('-'.repeat(95));

      let teamTotal = 0;
      for (const member of activeMembers) {
        const ml = weekLogs.filter((l) => l.teamMember === member.name);
        const total = ml.length;
        teamTotal += total;
        const phone = ml.filter((l) => l.channel === 'Phone').length;
        const email = ml.filter((l) => l.channel === 'Email').length;
        const salesiq = ml.filter((l) => l.channel === 'SalesIQ').length;
        const followups = ml.filter((l) => l.followUp).length;
        const rx = ml.filter((l) => l.reason === 'Rx Request').length;
        const labs = ml.filter((l) => l.reason === 'Labs Request').length;
        const imaging = ml.filter((l) => l.reason === 'Imaging Request').length;
        const appt = ml.filter((l) => l.reason === 'Appt Scheduling').length;
        lines.push(
          `${member.name.padEnd(14)}| ${String(total).padStart(5)} | ${String(phone).padStart(5)} | ${String(email).padStart(5)} | ${String(salesiq).padStart(7)} | ${String(followups).padStart(10)} | ${String(rx).padStart(2)} | ${String(labs).padStart(4)} | ${String(imaging).padStart(7)} | ${String(appt).padStart(4)}`,
        );
      }
      lines.push('-'.repeat(95));
      lines.push(`TEAM TOTAL   | ${String(teamTotal).padStart(5)}`);
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
  }, [weekLogs, team, weekNumber, includeWeekly, includeAnalytics]);

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
    const subject = encodeURIComponent(`Concierge Weekly Report — Week ${weekNumber}`);
    const body = encodeURIComponent(buildReportText());
    window.open(`mailto:${recipients.join(',')}?subject=${subject}&body=${body}`);
    toast.success('Opening email client...');
    onClose();
  };

  const handleExportCSV = () => {
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
    ];
    const rows = weekLogs.map((l) => [
      String(getISOWeek(new Date(l.date))),
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
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `concierge-report-week-${weekNumber}.csv`;
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
              <p className="text-sm text-[#5B6B2E]">Week {weekNumber} summary</p>
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

// ── Daily Log Tab ──────────────────────────────────────────────────────

function DailyLogTab({
  logs,
  setLogs,
  activeMembers,
}: {
  logs: LogEntry[];
  setLogs: (fn: (prev: LogEntry[]) => LogEntry[]) => void;
  activeMembers: TeamMember[];
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
  });

  const handleAdd = () => {
    if (!form.date || !form.teamMember || !form.memberName.trim()) {
      toast.error('Please fill in Date, Team Member, and Member Name');
      return;
    }
    setLogs((prev) => [{ ...form, id: uid() }, ...prev]);
    setForm((f) => ({ ...f, memberName: '', otherNotes: '', additionalNotes: '', crmNotes: false, followUp: false, reviewLink: false }));
    toast.success('Log entry added');
  };

  const handleDelete = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    toast.success('Entry removed');
  };

  const recentLogs = logs.slice(0, 50);

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
            <label className="block text-xs font-medium text-slate-600 mb-1">Member Name</label>
            <input
              type="text"
              value={form.memberName}
              onChange={(e) => setForm((f) => ({ ...f, memberName: e.target.value }))}
              placeholder="Member's name"
              className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Reason</label>
            <select
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-[#A8B8AC]/40 bg-white focus:border-[#4A7C8A] focus:ring-2 focus:ring-[#4A7C8A]/15 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
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
              placeholder="Optional notes..."
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
            Review Link Sent?
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
        <div className="p-4 border-b border-[#A8B8AC]/20">
          <h3 className="text-base font-bold text-[#2F3E2F]">
            Recent Entries <span className="text-sm font-normal text-slate-500">({logs.length} total)</span>
          </h3>
        </div>
        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No entries yet. Add your first log entry above.
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
                  <th className="px-4 py-3">CRM</th>
                  <th className="px-4 py-3">F/U</th>
                  <th className="px-4 py-3">Rev</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#A8B8AC]/15">
                {recentLogs.map((log) => {
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
                      <td className="px-4 py-2.5 text-slate-600">{log.reason}</td>
                      <td className="px-4 py-2.5 text-center">{log.crmNotes ? <Check className="w-4 h-4 text-[#5B6B2E] mx-auto" /> : '–'}</td>
                      <td className="px-4 py-2.5 text-center">{log.followUp ? <Check className="w-4 h-4 text-[#5B6B2E] mx-auto" /> : '–'}</td>
                      <td className="px-4 py-2.5 text-center">{log.reviewLink ? <Check className="w-4 h-4 text-[#5B6B2E] mx-auto" /> : '–'}</td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => handleDelete(log.id)} className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Weekly Report Tab ──────────────────────────────────────────────────

function WeeklyReportTab({
  logs,
  activeMembers,
  weekNumber,
}: {
  logs: LogEntry[];
  activeMembers: TeamMember[];
  weekNumber: number;
}) {
  const weekLogs = useMemo(
    () =>
      logs.filter((l) => {
        const d = new Date(l.date);
        return !isNaN(d.getTime()) && getISOWeek(d) === weekNumber;
      }),
    [logs, weekNumber],
  );

  const rows = useMemo(() => {
    return activeMembers.map((m) => {
      const ml = weekLogs.filter((l) => l.teamMember === m.name);
      return {
        name: m.name,
        total: ml.length,
        phone: ml.filter((l) => l.channel === 'Phone').length,
        email: ml.filter((l) => l.channel === 'Email').length,
        salesiq: ml.filter((l) => l.channel === 'SalesIQ').length,
        followups: ml.filter((l) => l.followUp).length,
        rx: ml.filter((l) => l.reason === 'Rx Request').length,
        labs: ml.filter((l) => l.reason === 'Labs Request').length,
        imaging: ml.filter((l) => l.reason === 'Imaging Request').length,
        appt: ml.filter((l) => l.reason === 'Appt Scheduling').length,
        crmPct: ml.length ? Math.round((ml.filter((l) => l.crmNotes).length / ml.length) * 100) : 0,
        reviewPct: ml.length ? Math.round((ml.filter((l) => l.reviewLink).length / ml.length) * 100) : 0,
      };
    });
  }, [weekLogs, activeMembers]);

  const teamAvg = rows.length ? Math.round(rows.reduce((s, r) => s + r.total, 0) / rows.length) : 0;

  return (
    <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 overflow-hidden">
      <div className="p-5 border-b border-[#A8B8AC]/20">
        <h3 className="text-base font-bold text-[#2F3E2F]">
          Per-Rep Weekly Totals — Week {weekNumber}
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          {weekLogs.length} total contacts · Team avg {teamAvg}/rep
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#A8B8AC]/10 text-left text-xs font-medium text-[#2F3E2F] uppercase tracking-wide">
              <th className="px-4 py-3">Team Member</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Phone</th>
              <th className="px-4 py-3 text-right">Email</th>
              <th className="px-4 py-3 text-right">SalesIQ</th>
              <th className="px-4 py-3 text-right">Follow-ups</th>
              <th className="px-4 py-3 text-right">Rx</th>
              <th className="px-4 py-3 text-right">Labs</th>
              <th className="px-4 py-3 text-right">Imaging</th>
              <th className="px-4 py-3 text-right">Appt</th>
              <th className="px-4 py-3 text-right">CRM %</th>
              <th className="px-4 py-3 text-right">Review %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#A8B8AC]/15">
            {rows.map((r) => {
              const belowAvg = teamAvg > 0 && r.total < teamAvg;
              const farBelow = teamAvg > 0 && r.total < teamAvg * 0.75;
              const rowClass = farBelow
                ? 'bg-red-50/50'
                : belowAvg
                  ? 'bg-yellow-50/50'
                  : '';
              return (
                <tr key={r.name} className={`${rowClass} hover:bg-[#A8B8AC]/5 transition-colors`}>
                  <td className="px-4 py-3 font-medium text-[#2F3E2F]">{r.name}</td>
                  <td className="px-4 py-3 text-right font-bold">{r.total}</td>
                  <td className="px-4 py-3 text-right">{r.phone}</td>
                  <td className="px-4 py-3 text-right">{r.email}</td>
                  <td className="px-4 py-3 text-right">{r.salesiq}</td>
                  <td className="px-4 py-3 text-right">{r.followups}</td>
                  <td className="px-4 py-3 text-right">{r.rx}</td>
                  <td className="px-4 py-3 text-right">{r.labs}</td>
                  <td className="px-4 py-3 text-right">{r.imaging}</td>
                  <td className="px-4 py-3 text-right">{r.appt}</td>
                  <td className="px-4 py-3 text-right">{r.crmPct}%</td>
                  <td className="px-4 py-3 text-right">{r.reviewPct}%</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-[#2F3E2F]/5 font-bold text-[#2F3E2F]">
              <td className="px-4 py-3">TEAM TOTAL</td>
              <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.total, 0)}</td>
              <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.phone, 0)}</td>
              <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.email, 0)}</td>
              <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.salesiq, 0)}</td>
              <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.followups, 0)}</td>
              <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.rx, 0)}</td>
              <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.labs, 0)}</td>
              <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.imaging, 0)}</td>
              <td className="px-4 py-3 text-right">{rows.reduce((s, r) => s + r.appt, 0)}</td>
              <td className="px-4 py-3 text-right"></td>
              <td className="px-4 py-3 text-right"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="p-4 border-t border-[#A8B8AC]/20 flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" /> Below team avg</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> &gt;25% below avg</span>
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
  const weeks = [weekNumber - 4, weekNumber - 3, weekNumber - 2, weekNumber - 1, weekNumber];

  const getWeekCount = useCallback(
    (name: string, wk: number) =>
      logs.filter((l) => {
        const d = new Date(l.date);
        return !isNaN(d.getTime()) && l.teamMember === name && getISOWeek(d) === wk;
      }).length,
    [logs],
  );

  const data = useMemo(
    () =>
      activeMembers.map((m) => {
        const counts = weeks.map((wk) => getWeekCount(m.name, wk));
        const avg = Math.round(counts.reduce((s, c) => s + c, 0) / counts.length);
        return { name: m.name, counts, avg };
      }),
    [activeMembers, weeks, getWeekCount],
  );

  const maxCount = Math.max(1, ...data.flatMap((d) => d.counts));

  return (
    <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 overflow-hidden">
      <div className="p-5 border-b border-[#A8B8AC]/20">
        <h3 className="text-base font-bold text-[#2F3E2F]">5-Week Rolling Performance Comparison</h3>
        <p className="text-sm text-slate-500 mt-0.5">Weeks {weeks[0]} – {weeks[4]}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#A8B8AC]/10 text-left text-xs font-medium text-[#2F3E2F] uppercase tracking-wide">
              <th className="px-4 py-3">Team Member</th>
              {weeks.map((wk, i) => (
                <th key={wk} className="px-4 py-3 text-right">
                  {i === 4 ? <span className="text-[#4A7C8A]">Wk {wk} ★</span> : `Wk ${wk}`}
                </th>
              ))}
              <th className="px-4 py-3 text-right">5-Wk Avg</th>
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

function AnalyticsTab({ logs, weekNumber }: { logs: LogEntry[]; weekNumber: number }) {
  const weekLogs = useMemo(
    () =>
      logs.filter((l) => {
        const d = new Date(l.date);
        return !isNaN(d.getTime()) && getISOWeek(d) === weekNumber;
      }),
    [logs, weekNumber],
  );

  const prevWeeks = [weekNumber - 4, weekNumber - 3, weekNumber - 2, weekNumber - 1];
  const prevLogs = useMemo(
    () =>
      logs.filter((l) => {
        const d = new Date(l.date);
        if (isNaN(d.getTime())) return false;
        const wk = getISOWeek(d);
        return prevWeeks.includes(wk);
      }),
    [logs, prevWeeks],
  );

  const rows = useMemo(() => {
    const total = weekLogs.length || 1;
    return REASONS.map((reason) => {
      const count = weekLogs.filter((l) => l.reason === reason).length;
      const prevCount = prevLogs.filter((l) => l.reason === reason).length;
      const prevAvg = prevCount / (prevWeeks.length || 1);
      const spike = prevAvg > 0 ? ((count - prevAvg) / prevAvg) * 100 : 0;
      return { reason, count, pct: (count / total) * 100, spike, prevAvg };
    }).sort((a, b) => b.count - a.count);
  }, [weekLogs, prevLogs, prevWeeks.length]);

  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  return (
    <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 overflow-hidden">
      <div className="p-5 border-b border-[#A8B8AC]/20">
        <h3 className="text-base font-bold text-[#2F3E2F]">Reason for Contact — Week {weekNumber}</h3>
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
              <th className="px-4 py-3 text-right">vs 4-Wk Avg</th>
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
          Red = current week is 50%+ higher than 4-week average (possible systemic issue)
        </span>
      </div>
    </div>
  );
}

// ── Member Trends Tab ──────────────────────────────────────────────────

function TrendsTab({ logs }: { logs: LogEntry[] }) {
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
    <div className="bg-white rounded-2xl border border-[#A8B8AC]/30 overflow-hidden">
      <div className="p-5 border-b border-[#A8B8AC]/20">
        <h3 className="text-base font-bold text-[#2F3E2F]">Member Trends — Repeat Contacts (Last 30 Days)</h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Members who contacted 3+ times for the same reason. May need proactive outreach or escalation.
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
                <th className="px-4 py-3 text-right">30-Day Count</th>
                <th className="px-4 py-3">Flagged</th>
                <th className="px-4 py-3">Last Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#A8B8AC]/15">
              {flagged.map((f, i) => (
                <tr key={i} className="hover:bg-[#A8B8AC]/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#2F3E2F]">{f.memberName}</td>
                  <td className="px-4 py-3 text-slate-600">{f.reason}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">{f.count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Yes
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

  const [logs, setLogsRaw] = useState<LogEntry[]>(() => loadFromStorage(STORAGE_KEY_LOGS, []));
  const [team, setTeamRaw] = useState<TeamMember[]>(() =>
    loadFromStorage(STORAGE_KEY_TEAM, DEFAULT_TEAM),
  );

  const setLogs: typeof setLogsRaw = useCallback((fn) => {
    setLogsRaw((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
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

  useEffect(() => {
    setWeekNumber(getISOWeek(new Date()));
  }, [activeTab]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2F3E2F] to-[#4A7C8A] flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2F3E2F]">Daily Logs & Reports</h1>
            <p className="text-sm text-[#5B6B2E]">Track contacts, view reports, and share with management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">Week:</label>
            <div className="flex items-center border border-[#A8B8AC]/40 rounded-lg overflow-hidden">
              <button
                onClick={() => setWeekNumber((w) => w - 1)}
                className="px-2 py-1.5 hover:bg-[#A8B8AC]/10 text-slate-600 transition-colors"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <span className="px-3 py-1.5 text-sm font-bold text-[#2F3E2F] tabular-nums bg-[#A8B8AC]/5 min-w-[40px] text-center">
                {weekNumber}
              </span>
              <button
                onClick={() => setWeekNumber((w) => w + 1)}
                className="px-2 py-1.5 hover:bg-[#A8B8AC]/10 text-slate-600 transition-colors"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4A7C8A] text-white text-sm font-medium hover:bg-[#3D6773] transition-colors"
          >
            <Send className="w-4 h-4" />
            Share Report
          </button>

          <button
            onClick={() => {
              const headers = ['Week', 'Date', 'Team Member', 'Channel', 'Member Name', 'Reason', 'Other/Notes', 'CRM Notes', 'Follow-up', 'Review Link', 'Additional Notes'];
              const rows = logs.map((l) => [
                String(isNaN(new Date(l.date).getTime()) ? '' : getISOWeek(new Date(l.date))),
                l.date, l.teamMember, l.channel, l.memberName, l.reason, l.otherNotes,
                l.crmNotes ? 'Yes' : 'No', l.followUp ? 'Yes' : 'No', l.reviewLink ? 'Yes' : 'No', l.additionalNotes,
              ]);
              const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
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

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[#A8B8AC]/30 pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
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
      {activeTab === 'log' && <DailyLogTab logs={logs} setLogs={setLogs} activeMembers={activeMembers} />}
      {activeTab === 'weekly' && <WeeklyReportTab logs={logs} activeMembers={activeMembers} weekNumber={weekNumber} />}
      {activeTab === 'performance' && <PerformanceTab logs={logs} activeMembers={activeMembers} weekNumber={weekNumber} />}
      {activeTab === 'analytics' && <AnalyticsTab logs={logs} weekNumber={weekNumber} />}
      {activeTab === 'trends' && <TrendsTab logs={logs} />}
      {activeTab === 'team' && <TeamTab team={team} setTeam={setTeam} />}

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          onClose={() => setShowShare(false)}
          logs={logs}
          team={team}
          weekNumber={weekNumber}
        />
      )}
    </div>
  );
}
