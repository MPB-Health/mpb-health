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
  ChevronDown,
  X,
  Check,
  Copy,
  Mail,
  FileSpreadsheet,
  Phone,
  FileText,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  role: string;
  notes: string;
}

interface DailyLogEntry {
  id: string;
  date: string;
  teamMember: string;
  inhouseLeads: number;
  selfGenLeads: number;
  outboundCalls: number;
  inboundCalls: number;
  voicemailsLeft: number;
  phoneTime: number;
  textsSent: number;
  emailsSent: number;
  emailsReceived: number;
  liBusinesses: number;
  liAgencies: number;
  liAgents: number;
  liGroups: number;
  liDMsSent: number;
  liReplies: number;
  liEngagement: number;
  meetings: number;
  proposalsSent: number;
  followUps: number;
  referralsAsked: number;
  dealsClosed: number;
  revenue: number;
  networkingEvents: number;
  communityOutreach: number;
  contentPosted: boolean;
  notes: string;
}

interface ColdCallEntry {
  id: string;
  date: string;
  teamMember: string;
  totalDialed: number;
  connected: number;
  voicemails: number;
  noAnswer: number;
  meetingsBooked: number;
  targetAudience: string;
  notes: string;
}

interface ContentEntry {
  id: string;
  date: string;
  teamMember: string;
  type: 'Article' | 'MPB Blog Repost' | 'Short Post/Photo';
  platform: string;
  topic: string;
  link: string;
  engagement: string;
  notes: string;
}

// ── Constants ──────────────────────────────────────────────────────────

const CONTENT_TYPES = ['Article', 'MPB Blog Repost', 'Short Post/Photo'] as const;
const PLATFORMS = ['LinkedIn', 'Facebook', 'Instagram', 'Twitter/X', 'Blog', 'Other'] as const;

const TABS = [
  { id: 'daily', label: 'Daily Log', icon: ClipboardList },
  { id: 'coldcall', label: 'Cold Calls', icon: Phone },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'weekly', label: 'Weekly Report', icon: BarChart3 },
  { id: 'monthly', label: 'Monthly', icon: CalendarDays },
  { id: 'performance', label: 'Performance', icon: TrendingUp },
  { id: 'analytics', label: 'Analytics', icon: PieChart },
  { id: 'team', label: 'Team', icon: Users },
] as const;

type TabId = (typeof TABS)[number]['id'];

const SK_DAILY = 'sales-daily-logs';
const SK_COLD = 'sales-cold-call-logs';
const SK_CONTENT = 'sales-content-logs';
const SK_TEAM = 'sales-team-members';

const DEFAULT_TEAM: TeamMember[] = [
  { id: '1', name: 'Adam Jordano', status: 'Active', role: 'Inside Sales Rep', notes: '' },
  { id: '2', name: 'Leonardo Moraes', status: 'Active', role: 'Inside Sales / Lead Mgmt', notes: '' },
  { id: '3', name: 'Tupac Manzanarez', status: 'Active', role: 'Inside Sales Rep', notes: '' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Helpers ─────────────────────────────────────────────────────────────

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

function numField(value: number, onChange: (v: number) => void, label: string, placeholder?: string) {
  return (
    <div>
      <label className="block text-xs font-medium text-th-text-secondary mb-1">{label}</label>
      <input
        type="number"
        min={0}
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        placeholder={placeholder || '0'}
        className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm"
      />
    </div>
  );
}

// ── Share Modal ────────────────────────────────────────────────────────

function ShareModal({
  onClose,
  dailyLogs,
  coldLogs,
  contentLogs,
  team,
  weekNumber,
}: {
  onClose: () => void;
  dailyLogs: DailyLogEntry[];
  coldLogs: ColdCallEntry[];
  contentLogs: ContentEntry[];
  team: TeamMember[];
  weekNumber: number;
}) {
  const [emails, setEmails] = useState('');
  const [includeWeekly, setIncludeWeekly] = useState(true);
  const [includeContent, setIncludeContent] = useState(true);
  const [copied, setCopied] = useState(false);

  const weekDailyLogs = dailyLogs.filter((l) => {
    const d = new Date(l.date);
    return !isNaN(d.getTime()) && getISOWeek(d) === weekNumber;
  });

  const weekColdLogs = coldLogs.filter((l) => {
    const d = new Date(l.date);
    return !isNaN(d.getTime()) && getISOWeek(d) === weekNumber;
  });

  const weekContentLogs = contentLogs.filter((l) => {
    const d = new Date(l.date);
    return !isNaN(d.getTime()) && getISOWeek(d) === weekNumber;
  });

  const buildReportText = useCallback(() => {
    const activeMembers = team.filter((m) => m.status === 'Active');
    const lines: string[] = [
      `SALES TEAM WEEKLY REPORT — Week ${weekNumber}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
    ];

    if (includeWeekly) {
      lines.push('═══ PER-REP WEEKLY TOTALS ═══', '');
      lines.push('Team Member      | Leads | Calls Out | Calls In | Emails | LI DMs | Meetings | Proposals | Deals | Revenue');
      lines.push('-'.repeat(110));
      for (const member of activeMembers) {
        const ml = weekDailyLogs.filter((l) => l.teamMember === member.name);
        const leads = ml.reduce((s, l) => s + l.inhouseLeads + l.selfGenLeads, 0);
        const callsOut = ml.reduce((s, l) => s + l.outboundCalls, 0);
        const callsIn = ml.reduce((s, l) => s + l.inboundCalls, 0);
        const emailsS = ml.reduce((s, l) => s + l.emailsSent, 0);
        const liDMs = ml.reduce((s, l) => s + l.liDMsSent, 0);
        const mtgs = ml.reduce((s, l) => s + l.meetings, 0);
        const props = ml.reduce((s, l) => s + l.proposalsSent, 0);
        const deals = ml.reduce((s, l) => s + l.dealsClosed, 0);
        const rev = ml.reduce((s, l) => s + l.revenue, 0);
        lines.push(
          `${member.name.padEnd(17)}| ${String(leads).padStart(5)} | ${String(callsOut).padStart(9)} | ${String(callsIn).padStart(8)} | ${String(emailsS).padStart(6)} | ${String(liDMs).padStart(6)} | ${String(mtgs).padStart(8)} | ${String(props).padStart(9)} | ${String(deals).padStart(5)} | $${rev.toLocaleString()}`,
        );
      }
      lines.push('');

      const totalDialed = weekColdLogs.reduce((s, l) => s + l.totalDialed, 0);
      const totalConnected = weekColdLogs.reduce((s, l) => s + l.connected, 0);
      const totalMeetings = weekColdLogs.reduce((s, l) => s + l.meetingsBooked, 0);
      lines.push('═══ COLD CALL SUMMARY ═══', '');
      lines.push(`Total Dialed: ${totalDialed}  |  Connected: ${totalConnected}  |  Meetings Booked: ${totalMeetings}`);
      lines.push(`Connect Rate: ${totalDialed ? ((totalConnected / totalDialed) * 100).toFixed(1) : '0'}%  |  Meeting Conv: ${totalConnected ? ((totalMeetings / totalConnected) * 100).toFixed(1) : '0'}%`);
      lines.push('');
    }

    if (includeContent) {
      lines.push('═══ CONTENT COMPLIANCE ═══', '');
      for (const member of activeMembers) {
        const mc = weekContentLogs.filter((l) => l.teamMember === member.name);
        const articles = mc.filter((l) => l.type === 'Article').length;
        const reposts = mc.filter((l) => l.type === 'MPB Blog Repost').length;
        const shorts = mc.filter((l) => l.type === 'Short Post/Photo').length;
        const status = articles >= 2 && reposts >= 2 && shorts >= 2 ? 'PASS' : 'BELOW TARGET';
        lines.push(`${member.name}: Articles ${articles}/2, Reposts ${reposts}/2, Short ${shorts}/2 — ${status}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }, [weekDailyLogs, weekColdLogs, weekContentLogs, team, weekNumber, includeWeekly, includeContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(buildReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Report copied to clipboard');
  };

  const handleEmail = () => {
    const recipients = emails.split(/[,;\s]+/).map((e) => e.trim()).filter(Boolean);
    if (recipients.length === 0) { toast.error('Please enter at least one email address'); return; }
    const subject = encodeURIComponent(`Sales Team Weekly Report — Week ${weekNumber}`);
    const body = encodeURIComponent(buildReportText());
    window.open(`mailto:${recipients.join(',')}?subject=${subject}&body=${body}`);
    toast.success('Opening email client...');
    onClose();
  };

  const handleExportCSV = () => {
    const headers = ['Week', 'Date', 'Team Member', 'Inhouse Leads', 'Self-Gen Leads', 'Outbound Calls', 'Inbound Calls', 'Voicemails', 'Phone Time', 'Texts', 'Emails Sent', 'Emails Recv', 'LI Businesses', 'LI Agencies', 'LI Agents', 'LI Groups', 'LI DMs', 'LI Replies', 'LI Engagement', 'Meetings', 'Proposals', 'Follow-ups', 'Referrals', 'Deals', 'Revenue', 'Networking', 'Community', 'Content?', 'Notes'];
    const rows = weekDailyLogs.map((l) => [
      String(getISOWeek(new Date(l.date))), l.date, l.teamMember,
      l.inhouseLeads, l.selfGenLeads, l.outboundCalls, l.inboundCalls, l.voicemailsLeft, l.phoneTime,
      l.textsSent, l.emailsSent, l.emailsReceived,
      l.liBusinesses, l.liAgencies, l.liAgents, l.liGroups, l.liDMsSent, l.liReplies, l.liEngagement,
      l.meetings, l.proposalsSent, l.followUps, l.referralsAsked,
      l.dealsClosed, l.revenue, l.networkingEvents, l.communityOutreach,
      l.contentPosted ? 'Yes' : 'No', l.notes,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-week-${weekNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-th-bg-primary rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-th-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-th-accent-600 to-th-accent-500 flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-th-text-primary">Share Report</h2>
              <p className="text-sm text-th-text-tertiary">Week {weekNumber} summary</p>
            </div>
          </div>
          <button onClick={onClose} title="Close" className="p-2 hover:bg-surface-secondary rounded-lg transition-colors">
            <X className="w-5 h-5 text-th-text-tertiary" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-th-text-secondary mb-1">Include in report</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={includeWeekly} onChange={(e) => setIncludeWeekly(e.target.checked)} className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500/30" />
                Weekly Totals
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={includeContent} onChange={(e) => setIncludeContent(e.target.checked)} className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500/30" />
                Content Compliance
              </label>
            </div>
          </div>
          <div>
            <label htmlFor="share-emails" className="block text-sm font-medium text-th-text-secondary mb-1">Email to management</label>
            <input id="share-emails" type="text" value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="manager@mympb.com, director@mympb.com" className="w-full px-3 py-2.5 rounded-lg border border-th-border focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm transition-colors" />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button onClick={handleEmail} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-th-accent-600 text-white text-sm font-medium hover:bg-th-accent-700 transition-colors">
              <Mail className="w-4 h-4" /> Email
            </button>
            <button onClick={handleCopy} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-th-border text-th-text-primary text-sm font-medium hover:bg-surface-secondary transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-th-border text-th-text-primary text-sm font-medium hover:bg-surface-secondary transition-colors">
              <FileSpreadsheet className="w-4 h-4" /> CSV
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
  logs: DailyLogEntry[];
  setLogs: (fn: (prev: DailyLogEntry[]) => DailyLogEntry[]) => void;
  activeMembers: TeamMember[];
}) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<Omit<DailyLogEntry, 'id'>>({
    date: today, teamMember: activeMembers[0]?.name || '',
    inhouseLeads: 0, selfGenLeads: 0, outboundCalls: 0, inboundCalls: 0, voicemailsLeft: 0, phoneTime: 0,
    textsSent: 0, emailsSent: 0, emailsReceived: 0,
    liBusinesses: 0, liAgencies: 0, liAgents: 0, liGroups: 0, liDMsSent: 0, liReplies: 0, liEngagement: 0,
    meetings: 0, proposalsSent: 0, followUps: 0, referralsAsked: 0,
    dealsClosed: 0, revenue: 0, networkingEvents: 0, communityOutreach: 0,
    contentPosted: false, notes: '',
  });

  const upd = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.date || !form.teamMember) { toast.error('Date and Team Member are required'); return; }
    setLogs((prev) => [{ ...form, id: uid() }, ...prev]);
    setForm((f) => ({
      ...f, inhouseLeads: 0, selfGenLeads: 0, outboundCalls: 0, inboundCalls: 0, voicemailsLeft: 0, phoneTime: 0,
      textsSent: 0, emailsSent: 0, emailsReceived: 0,
      liBusinesses: 0, liAgencies: 0, liAgents: 0, liGroups: 0, liDMsSent: 0, liReplies: 0, liEngagement: 0,
      meetings: 0, proposalsSent: 0, followUps: 0, referralsAsked: 0,
      dealsClosed: 0, revenue: 0, networkingEvents: 0, communityOutreach: 0,
      contentPosted: false, notes: '',
    }));
    toast.success('Daily log entry added');
  };

  const recentLogs = logs.slice(0, 50);

  return (
    <div className="space-y-6">
      <div className="bg-th-bg-primary rounded-2xl border border-th-border p-5">
        <h3 className="text-base font-bold text-th-text-primary mb-4">New Daily Log Entry</h3>

        {/* Row 1: Date + Team Member */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label htmlFor="daily-date" className="block text-xs font-medium text-th-text-secondary mb-1">Date</label>
            <input id="daily-date" type="date" value={form.date} onChange={(e) => upd('date', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm" />
          </div>
          <div>
            <label htmlFor="daily-member" className="block text-xs font-medium text-th-text-secondary mb-1">Team Member</label>
            <select id="daily-member" value={form.teamMember} onChange={(e) => upd('teamMember', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm">
              {activeMembers.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
        </div>

        {/* Section: Leads */}
        <fieldset className="border border-th-border/50 rounded-xl p-4 mb-4">
          <legend className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wide px-2">Leads</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {numField(form.inhouseLeads, (v) => upd('inhouseLeads', v), 'Inhouse Leads')}
            {numField(form.selfGenLeads, (v) => upd('selfGenLeads', v), 'Self-Gen Leads')}
          </div>
        </fieldset>

        {/* Section: Calls */}
        <fieldset className="border border-th-border/50 rounded-xl p-4 mb-4">
          <legend className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wide px-2">Calls</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {numField(form.outboundCalls, (v) => upd('outboundCalls', v), 'Outbound Calls')}
            {numField(form.inboundCalls, (v) => upd('inboundCalls', v), 'Inbound Calls')}
            {numField(form.voicemailsLeft, (v) => upd('voicemailsLeft', v), 'Voicemails Left')}
            {numField(form.phoneTime, (v) => upd('phoneTime', v), 'Phone Time (min)')}
          </div>
        </fieldset>

        {/* Section: Messaging */}
        <fieldset className="border border-th-border/50 rounded-xl p-4 mb-4">
          <legend className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wide px-2">Messaging</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {numField(form.textsSent, (v) => upd('textsSent', v), 'Texts Sent')}
            {numField(form.emailsSent, (v) => upd('emailsSent', v), 'Emails Sent')}
            {numField(form.emailsReceived, (v) => upd('emailsReceived', v), 'Emails Received')}
          </div>
        </fieldset>

        {/* Section: LinkedIn */}
        <fieldset className="border border-th-border/50 rounded-xl p-4 mb-4">
          <legend className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wide px-2">LinkedIn Activity</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {numField(form.liBusinesses, (v) => upd('liBusinesses', v), 'Businesses/DMs')}
            {numField(form.liAgencies, (v) => upd('liAgencies', v), 'Agencies')}
            {numField(form.liAgents, (v) => upd('liAgents', v), 'Agents')}
            {numField(form.liGroups, (v) => upd('liGroups', v), 'Groups')}
            {numField(form.liDMsSent, (v) => upd('liDMsSent', v), 'DMs Sent')}
            {numField(form.liReplies, (v) => upd('liReplies', v), 'Replies')}
            {numField(form.liEngagement, (v) => upd('liEngagement', v), 'Engagement')}
          </div>
        </fieldset>

        {/* Section: Pipeline */}
        <fieldset className="border border-th-border/50 rounded-xl p-4 mb-4">
          <legend className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wide px-2">Pipeline</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {numField(form.meetings, (v) => upd('meetings', v), 'Meetings/Presentations')}
            {numField(form.proposalsSent, (v) => upd('proposalsSent', v), 'Proposals Sent')}
            {numField(form.followUps, (v) => upd('followUps', v), 'Follow-ups Done')}
            {numField(form.referralsAsked, (v) => upd('referralsAsked', v), 'Referrals Asked')}
          </div>
        </fieldset>

        {/* Section: Sales */}
        <fieldset className="border border-th-border/50 rounded-xl p-4 mb-4">
          <legend className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wide px-2">Sales</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {numField(form.dealsClosed, (v) => upd('dealsClosed', v), 'Deals Closed')}
            {numField(form.revenue, (v) => upd('revenue', v), 'Revenue ($)')}
          </div>
        </fieldset>

        {/* Section: Activities + Notes */}
        <fieldset className="border border-th-border/50 rounded-xl p-4 mb-4">
          <legend className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wide px-2">Activities</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {numField(form.networkingEvents, (v) => upd('networkingEvents', v), 'Networking Events')}
            {numField(form.communityOutreach, (v) => upd('communityOutreach', v), 'Community Outreach')}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.contentPosted} onChange={(e) => upd('contentPosted', e.target.checked)} className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500/30" />
              Content Posted Today?
            </label>
          </div>
        </fieldset>

        <div className="mb-4">
          <label className="block text-xs font-medium text-th-text-secondary mb-1">Notes</label>
          <input type="text" value={form.notes} onChange={(e) => upd('notes', e.target.value)} placeholder="Optional notes..." className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm" />
        </div>

        <div className="flex justify-end">
          <button onClick={handleAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-th-accent-600 text-white text-sm font-medium hover:bg-th-accent-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Entry
          </button>
        </div>
      </div>

      {/* Recent Entries Table */}
      <div className="bg-th-bg-primary rounded-2xl border border-th-border overflow-hidden">
        <div className="p-4 border-b border-th-border">
          <h3 className="text-base font-bold text-th-text-primary">
            Recent Entries <span className="text-sm font-normal text-th-text-tertiary">({logs.length} total)</span>
          </h3>
        </div>
        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-th-text-tertiary text-sm">No entries yet. Add your first daily log above.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-secondary uppercase tracking-wide">
                  <th className="px-3 py-3">Wk</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Rep</th>
                  <th className="px-3 py-3 text-right">Leads</th>
                  <th className="px-3 py-3 text-right">Calls</th>
                  <th className="px-3 py-3 text-right">Emails</th>
                  <th className="px-3 py-3 text-right">LI</th>
                  <th className="px-3 py-3 text-right">Mtgs</th>
                  <th className="px-3 py-3 text-right">Deals</th>
                  <th className="px-3 py-3 text-right">Rev</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border/50">
                {recentLogs.map((log) => {
                  const d = new Date(log.date);
                  const wk = isNaN(d.getTime()) ? '–' : getISOWeek(d);
                  return (
                    <tr key={log.id} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-3 py-2.5 text-th-text-tertiary">{wk}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{log.date}</td>
                      <td className="px-3 py-2.5 font-medium text-th-text-primary">{log.teamMember}</td>
                      <td className="px-3 py-2.5 text-right">{log.inhouseLeads + log.selfGenLeads}</td>
                      <td className="px-3 py-2.5 text-right">{log.outboundCalls + log.inboundCalls}</td>
                      <td className="px-3 py-2.5 text-right">{log.emailsSent}</td>
                      <td className="px-3 py-2.5 text-right">{log.liDMsSent + log.liEngagement}</td>
                      <td className="px-3 py-2.5 text-right">{log.meetings}</td>
                      <td className="px-3 py-2.5 text-right">{log.dealsClosed}</td>
                      <td className="px-3 py-2.5 text-right font-medium">${log.revenue.toLocaleString()}</td>
                      <td className="px-3 py-2.5">
                        <button title="Delete entry" onClick={() => setLogs((prev) => prev.filter((l) => l.id !== log.id))} className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-th-text-tertiary hover:text-red-500 transition-colors">
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

// ── Cold Call Log Tab ──────────────────────────────────────────────────

function ColdCallTab({
  logs,
  setLogs,
  activeMembers,
}: {
  logs: ColdCallEntry[];
  setLogs: (fn: (prev: ColdCallEntry[]) => ColdCallEntry[]) => void;
  activeMembers: TeamMember[];
}) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<Omit<ColdCallEntry, 'id'>>({
    date: today, teamMember: activeMembers[0]?.name || '',
    totalDialed: 0, connected: 0, voicemails: 0, noAnswer: 0, meetingsBooked: 0,
    targetAudience: '', notes: '',
  });

  const upd = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.date || !form.teamMember) { toast.error('Date and Team Member are required'); return; }
    setLogs((prev) => [{ ...form, id: uid() }, ...prev]);
    setForm((f) => ({ ...f, totalDialed: 0, connected: 0, voicemails: 0, noAnswer: 0, meetingsBooked: 0, targetAudience: '', notes: '' }));
    toast.success('Cold call session added');
  };

  const recent = logs.slice(0, 50);

  return (
    <div className="space-y-6">
      <div className="bg-th-bg-primary rounded-2xl border border-th-border p-5">
        <h3 className="text-base font-bold text-th-text-primary mb-4">New Cold Call Session</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label htmlFor="cold-date" className="block text-xs font-medium text-th-text-secondary mb-1">Date</label>
            <input id="cold-date" type="date" value={form.date} onChange={(e) => upd('date', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm" />
          </div>
          <div>
            <label htmlFor="cold-member" className="block text-xs font-medium text-th-text-secondary mb-1">Team Member</label>
            <select id="cold-member" value={form.teamMember} onChange={(e) => upd('teamMember', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm">
              {activeMembers.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          {numField(form.totalDialed, (v) => upd('totalDialed', v), 'Total Dialed')}
          {numField(form.connected, (v) => upd('connected', v), '# Connected (Live)')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {numField(form.voicemails, (v) => upd('voicemails', v), 'Voicemails Left')}
          {numField(form.noAnswer, (v) => upd('noAnswer', v), 'No Answer / DC')}
          {numField(form.meetingsBooked, (v) => upd('meetingsBooked', v), 'Meetings Booked')}
          <div>
            <label className="block text-xs font-medium text-th-text-secondary mb-1">Target Audience</label>
            <input type="text" value={form.targetAudience} onChange={(e) => upd('targetAudience', e.target.value)} placeholder="e.g. Small businesses" className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm" />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium text-th-text-secondary mb-1">Notes</label>
          <input type="text" value={form.notes} onChange={(e) => upd('notes', e.target.value)} placeholder="Optional notes..." className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm text-th-text-tertiary">
            <span>Connect Rate: <strong className="text-th-text-primary">{form.totalDialed ? ((form.connected / form.totalDialed) * 100).toFixed(1) : '0'}%</strong></span>
            <span>Meeting Conv: <strong className="text-th-text-primary">{form.connected ? ((form.meetingsBooked / form.connected) * 100).toFixed(1) : '0'}%</strong></span>
          </div>
          <button onClick={handleAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-th-accent-600 text-white text-sm font-medium hover:bg-th-accent-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Session
          </button>
        </div>
      </div>

      <div className="bg-th-bg-primary rounded-2xl border border-th-border overflow-hidden">
        <div className="p-4 border-b border-th-border">
          <h3 className="text-base font-bold text-th-text-primary">Recent Sessions <span className="text-sm font-normal text-th-text-tertiary">({logs.length} total)</span></h3>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-th-text-tertiary text-sm">No cold call sessions yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-secondary uppercase tracking-wide">
                  <th className="px-3 py-3">Wk</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Rep</th>
                  <th className="px-3 py-3 text-right">Dialed</th><th className="px-3 py-3 text-right">Connected</th>
                  <th className="px-3 py-3 text-right">VMs</th><th className="px-3 py-3 text-right">Mtgs</th>
                  <th className="px-3 py-3 text-right">Conn %</th><th className="px-3 py-3 text-right">Mtg %</th>
                  <th className="px-3 py-3">Audience</th><th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border/50">
                {recent.map((l) => {
                  const d = new Date(l.date);
                  const wk = isNaN(d.getTime()) ? '–' : getISOWeek(d);
                  const connRate = l.totalDialed ? ((l.connected / l.totalDialed) * 100).toFixed(1) : '0';
                  const mtgRate = l.connected ? ((l.meetingsBooked / l.connected) * 100).toFixed(1) : '0';
                  return (
                    <tr key={l.id} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-3 py-2.5 text-th-text-tertiary">{wk}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{l.date}</td>
                      <td className="px-3 py-2.5 font-medium text-th-text-primary">{l.teamMember}</td>
                      <td className="px-3 py-2.5 text-right">{l.totalDialed}</td>
                      <td className="px-3 py-2.5 text-right">{l.connected}</td>
                      <td className="px-3 py-2.5 text-right">{l.voicemails}</td>
                      <td className="px-3 py-2.5 text-right">{l.meetingsBooked}</td>
                      <td className="px-3 py-2.5 text-right">{connRate}%</td>
                      <td className="px-3 py-2.5 text-right">{mtgRate}%</td>
                      <td className="px-3 py-2.5 text-th-text-tertiary truncate max-w-[120px]">{l.targetAudience}</td>
                      <td className="px-3 py-2.5">
                        <button title="Delete entry" onClick={() => setLogs((prev) => prev.filter((x) => x.id !== l.id))} className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-th-text-tertiary hover:text-red-500 transition-colors">
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

// ── Content Log Tab ───────────────────────────────────────────────────

function ContentTab({
  logs,
  setLogs,
  activeMembers,
  weekNumber,
}: {
  logs: ContentEntry[];
  setLogs: (fn: (prev: ContentEntry[]) => ContentEntry[]) => void;
  activeMembers: TeamMember[];
  weekNumber: number;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<Omit<ContentEntry, 'id'>>({
    date: today, teamMember: activeMembers[0]?.name || '',
    type: 'Article', platform: 'LinkedIn', topic: '', link: '', engagement: '', notes: '',
  });

  const upd = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleAdd = () => {
    if (!form.date || !form.teamMember || !form.topic.trim()) { toast.error('Date, Team Member, and Topic are required'); return; }
    setLogs((prev) => [{ ...form, id: uid() }, ...prev]);
    setForm((f) => ({ ...f, topic: '', link: '', engagement: '', notes: '' }));
    toast.success('Content entry added');
  };

  const weekLogs = useMemo(() => logs.filter((l) => {
    const d = new Date(l.date);
    return !isNaN(d.getTime()) && getISOWeek(d) === weekNumber;
  }), [logs, weekNumber]);

  const complianceByMember = useMemo(() => {
    return activeMembers.map((m) => {
      const ml = weekLogs.filter((l) => l.teamMember === m.name);
      const articles = ml.filter((l) => l.type === 'Article').length;
      const reposts = ml.filter((l) => l.type === 'MPB Blog Repost').length;
      const shorts = ml.filter((l) => l.type === 'Short Post/Photo').length;
      return { name: m.name, articles, reposts, shorts, total: articles + reposts + shorts };
    });
  }, [weekLogs, activeMembers]);

  const recent = logs.slice(0, 50);

  return (
    <div className="space-y-6">
      {/* Weekly Content Compliance */}
      <div className="bg-th-bg-primary rounded-2xl border border-th-border p-5">
        <h3 className="text-base font-bold text-th-text-primary mb-3">Content Compliance — Week {weekNumber} <span className="text-sm font-normal text-th-text-tertiary">(Target: 2 Articles + 2 Reposts + 2 Short = 6/week)</span></h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {complianceByMember.map((m) => {
            const passed = m.articles >= 2 && m.reposts >= 2 && m.shorts >= 2;
            const partial = m.total > 0 && !passed;
            const bg = passed ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : partial ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20';
            return (
              <div key={m.name} className={`rounded-xl border p-3 ${bg}`}>
                <p className="font-medium text-th-text-primary text-sm mb-1">{m.name}</p>
                <div className="flex gap-3 text-xs text-th-text-secondary">
                  <span>Articles: <strong>{m.articles}/2</strong></span>
                  <span>Reposts: <strong>{m.reposts}/2</strong></span>
                  <span>Short: <strong>{m.shorts}/2</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-th-bg-primary rounded-2xl border border-th-border p-5">
        <h3 className="text-base font-bold text-th-text-primary mb-4">New Content Entry</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label htmlFor="content-date" className="block text-xs font-medium text-th-text-secondary mb-1">Date</label>
            <input id="content-date" type="date" value={form.date} onChange={(e) => upd('date', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm" />
          </div>
          <div>
            <label htmlFor="content-member" className="block text-xs font-medium text-th-text-secondary mb-1">Team Member</label>
            <select id="content-member" value={form.teamMember} onChange={(e) => upd('teamMember', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm">
              {activeMembers.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="content-type" className="block text-xs font-medium text-th-text-secondary mb-1">Type</label>
            <select id="content-type" value={form.type} onChange={(e) => upd('type', e.target.value as ContentEntry['type'])} className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm">
              {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="content-platform" className="block text-xs font-medium text-th-text-secondary mb-1">Platform</label>
            <select id="content-platform" value={form.platform} onChange={(e) => upd('platform', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm">
              {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-th-text-secondary mb-1">Topic / Title</label>
            <input type="text" value={form.topic} onChange={(e) => upd('topic', e.target.value)} placeholder="What was it about?" className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-th-text-secondary mb-1">Link to Post</label>
            <input type="url" value={form.link} onChange={(e) => upd('link', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-th-text-secondary mb-1">Engagement (likes/cmts/views)</label>
            <input type="text" value={form.engagement} onChange={(e) => upd('engagement', e.target.value)} placeholder="e.g. 45 likes, 3 comments" className="w-full px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm" />
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleAdd} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-th-accent-600 text-white text-sm font-medium hover:bg-th-accent-700 transition-colors">
            <Plus className="w-4 h-4" /> Add Content
          </button>
        </div>
      </div>

      {/* Recent Content */}
      <div className="bg-th-bg-primary rounded-2xl border border-th-border overflow-hidden">
        <div className="p-4 border-b border-th-border">
          <h3 className="text-base font-bold text-th-text-primary">Recent Content <span className="text-sm font-normal text-th-text-tertiary">({logs.length} total)</span></h3>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-th-text-tertiary text-sm">No content entries yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-secondary uppercase tracking-wide">
                  <th className="px-3 py-3">Wk</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Rep</th>
                  <th className="px-3 py-3">Type</th><th className="px-3 py-3">Platform</th><th className="px-3 py-3">Topic</th>
                  <th className="px-3 py-3">Engagement</th><th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border/50">
                {recent.map((l) => {
                  const d = new Date(l.date);
                  const wk = isNaN(d.getTime()) ? '–' : getISOWeek(d);
                  return (
                    <tr key={l.id} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-3 py-2.5 text-th-text-tertiary">{wk}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{l.date}</td>
                      <td className="px-3 py-2.5 font-medium text-th-text-primary">{l.teamMember}</td>
                      <td className="px-3 py-2.5"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-th-accent-500/10 text-th-accent-600">{l.type}</span></td>
                      <td className="px-3 py-2.5 text-th-text-secondary">{l.platform}</td>
                      <td className="px-3 py-2.5 truncate max-w-[200px]">{l.link ? <a href={l.link} target="_blank" rel="noopener noreferrer" className="text-th-accent-600 hover:underline">{l.topic}</a> : l.topic}</td>
                      <td className="px-3 py-2.5 text-th-text-tertiary">{l.engagement}</td>
                      <td className="px-3 py-2.5">
                        <button title="Delete entry" onClick={() => setLogs((prev) => prev.filter((x) => x.id !== l.id))} className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-th-text-tertiary hover:text-red-500 transition-colors">
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

// ── Weekly Report Tab ─────────────────────────────────────────────────

const WEEKLY_METRICS: { key: string; label: string; getter: (l: DailyLogEntry) => number }[] = [
  { key: 'inhouseLeads', label: 'Inhouse Leads', getter: (l) => l.inhouseLeads },
  { key: 'selfGenLeads', label: 'Self-Gen Leads', getter: (l) => l.selfGenLeads },
  { key: 'outboundCalls', label: 'Outbound Calls', getter: (l) => l.outboundCalls },
  { key: 'inboundCalls', label: 'Inbound Calls', getter: (l) => l.inboundCalls },
  { key: 'voicemailsLeft', label: 'Voicemails Left', getter: (l) => l.voicemailsLeft },
  { key: 'phoneTime', label: 'Phone Time (min)', getter: (l) => l.phoneTime },
  { key: 'textsSent', label: 'Texts Sent', getter: (l) => l.textsSent },
  { key: 'emailsSent', label: 'Emails Sent', getter: (l) => l.emailsSent },
  { key: 'emailsReceived', label: 'Emails Recv\'d', getter: (l) => l.emailsReceived },
  { key: 'liBusinesses', label: 'LI: Businesses', getter: (l) => l.liBusinesses },
  { key: 'liAgencies', label: 'LI: Agencies', getter: (l) => l.liAgencies },
  { key: 'liAgents', label: 'LI: Agents', getter: (l) => l.liAgents },
  { key: 'liGroups', label: 'LI: Groups', getter: (l) => l.liGroups },
  { key: 'liDMsSent', label: 'LI: DMs Sent', getter: (l) => l.liDMsSent },
  { key: 'liReplies', label: 'LI: Replies', getter: (l) => l.liReplies },
  { key: 'liEngagement', label: 'LI: Engagement', getter: (l) => l.liEngagement },
  { key: 'meetings', label: 'Meetings/Pres.', getter: (l) => l.meetings },
  { key: 'proposalsSent', label: 'Proposals Sent', getter: (l) => l.proposalsSent },
  { key: 'followUps', label: 'Follow-ups', getter: (l) => l.followUps },
  { key: 'referralsAsked', label: 'Referrals Asked', getter: (l) => l.referralsAsked },
  { key: 'dealsClosed', label: 'Deals Closed', getter: (l) => l.dealsClosed },
  { key: 'revenue', label: 'Revenue ($)', getter: (l) => l.revenue },
  { key: 'networkingEvents', label: 'Networking Events', getter: (l) => l.networkingEvents },
  { key: 'communityOutreach', label: 'Community Activities', getter: (l) => l.communityOutreach },
];

function WeeklyReportTab({
  dailyLogs, coldLogs, contentLogs, activeMembers, weekNumber,
}: {
  dailyLogs: DailyLogEntry[];
  coldLogs: ColdCallEntry[];
  contentLogs: ContentEntry[];
  activeMembers: TeamMember[];
  weekNumber: number;
}) {
  const weekDaily = useMemo(() => dailyLogs.filter((l) => {
    const d = new Date(l.date);
    return !isNaN(d.getTime()) && getISOWeek(d) === weekNumber;
  }), [dailyLogs, weekNumber]);

  const weekCold = useMemo(() => coldLogs.filter((l) => {
    const d = new Date(l.date);
    return !isNaN(d.getTime()) && getISOWeek(d) === weekNumber;
  }), [coldLogs, weekNumber]);

  const weekContent = useMemo(() => contentLogs.filter((l) => {
    const d = new Date(l.date);
    return !isNaN(d.getTime()) && getISOWeek(d) === weekNumber;
  }), [contentLogs, weekNumber]);

  const metricRows = useMemo(() => {
    return WEEKLY_METRICS.map((metric) => {
      const perMember = activeMembers.map((m) => {
        const ml = weekDaily.filter((l) => l.teamMember === m.name);
        return ml.reduce((s, l) => s + metric.getter(l), 0);
      });
      const total = perMember.reduce((s, v) => s + v, 0);
      return { label: metric.label, perMember, total };
    });
  }, [weekDaily, activeMembers]);

  const coldRows = useMemo(() => {
    const defs: { label: string; getter: (l: ColdCallEntry) => number }[] = [
      { label: 'Cold Calls Dialed', getter: (l) => l.totalDialed },
      { label: 'Cold Calls Connected', getter: (l) => l.connected },
      { label: 'Cold Voicemails', getter: (l) => l.voicemails },
      { label: 'Cold No-Answer', getter: (l) => l.noAnswer },
      { label: 'Meetings from Cold', getter: (l) => l.meetingsBooked },
    ];
    return defs.map((def) => {
      const perMember = activeMembers.map((m) => {
        const ml = weekCold.filter((l) => l.teamMember === m.name);
        return ml.reduce((s, l) => s + def.getter(l), 0);
      });
      return { label: def.label, perMember, total: perMember.reduce((s, v) => s + v, 0) };
    });
  }, [weekCold, activeMembers]);

  const contentCompliance = useMemo(() => {
    return activeMembers.map((m) => {
      const mc = weekContent.filter((l) => l.teamMember === m.name);
      return {
        articles: mc.filter((l) => l.type === 'Article').length,
        reposts: mc.filter((l) => l.type === 'MPB Blog Repost').length,
        shorts: mc.filter((l) => l.type === 'Short Post/Photo').length,
        total: mc.length,
      };
    });
  }, [weekContent, activeMembers]);

  const teamAvgs = useMemo(() => {
    const n = activeMembers.length || 1;
    return metricRows.map((r) => Math.round(r.total / n));
  }, [metricRows, activeMembers.length]);

  return (
    <div className="space-y-6">
      <div className="bg-th-bg-primary rounded-2xl border border-th-border overflow-hidden">
        <div className="p-5 border-b border-th-border">
          <h3 className="text-base font-bold text-th-text-primary">Per-Rep Weekly Totals — Week {weekNumber}</h3>
          <p className="text-sm text-th-text-tertiary mt-0.5">{weekDaily.length} daily log entries this week</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-secondary uppercase tracking-wide">
                <th className="px-4 py-3 sticky left-0 bg-surface-secondary z-10">Metric</th>
                {activeMembers.map((m) => <th key={m.id} className="px-4 py-3 text-right">{m.name}</th>)}
                <th className="px-4 py-3 text-right font-bold">Team Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border/50">
              {metricRows.map((row, ri) => (
                <tr key={row.label} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-th-text-primary sticky left-0 bg-th-bg-primary">{row.label}</td>
                  {row.perMember.map((val, mi) => {
                    const avg = teamAvgs[ri];
                    const below = avg > 0 && val < avg;
                    const farBelow = avg > 0 && val < avg * 0.75;
                    const cls = farBelow ? 'text-red-600 dark:text-red-400' : below ? 'text-amber-600 dark:text-amber-400' : '';
                    return <td key={mi} className={`px-4 py-2.5 text-right tabular-nums ${cls}`}>{row.label === 'Revenue ($)' ? `$${val.toLocaleString()}` : val}</td>;
                  })}
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">{row.label === 'Revenue ($)' ? `$${row.total.toLocaleString()}` : row.total}</td>
                </tr>
              ))}
              {/* Cold Call section */}
              <tr><td colSpan={activeMembers.length + 2} className="px-4 py-2 bg-surface-secondary text-xs font-bold text-th-text-secondary uppercase tracking-wide">Cold Call Totals</td></tr>
              {coldRows.map((row) => (
                <tr key={row.label} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-th-text-primary sticky left-0 bg-th-bg-primary">{row.label}</td>
                  {row.perMember.map((val, mi) => <td key={mi} className="px-4 py-2.5 text-right tabular-nums">{val}</td>)}
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">{row.total}</td>
                </tr>
              ))}
              {/* Connect Rate */}
              <tr className="hover:bg-surface-secondary/50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-th-text-primary sticky left-0 bg-th-bg-primary">Connect Rate %</td>
                {activeMembers.map((_, mi) => {
                  const dialed = coldRows[0]?.perMember[mi] || 0;
                  const connected = coldRows[1]?.perMember[mi] || 0;
                  const rate = dialed ? ((connected / dialed) * 100).toFixed(1) : '0';
                  return <td key={mi} className="px-4 py-2.5 text-right tabular-nums">{rate}%</td>;
                })}
                <td className="px-4 py-2.5 text-right font-bold tabular-nums">
                  {coldRows[0]?.total ? ((coldRows[1]?.total / coldRows[0]?.total) * 100).toFixed(1) : '0'}%
                </td>
              </tr>
              {/* Content Compliance section */}
              <tr><td colSpan={activeMembers.length + 2} className="px-4 py-2 bg-surface-secondary text-xs font-bold text-th-text-secondary uppercase tracking-wide">Content Compliance (Target: 2/2/2 = 6)</td></tr>
              {(['Articles (target: 2)', 'MPB Reposts (target: 2)', 'Short Posts (target: 2)', 'Total Content (target: 6)'] as const).map((label, idx) => (
                <tr key={label} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-2.5 font-medium text-th-text-primary sticky left-0 bg-th-bg-primary">{label}</td>
                  {contentCompliance.map((c, mi) => {
                    const val = idx === 0 ? c.articles : idx === 1 ? c.reposts : idx === 2 ? c.shorts : c.total;
                    const target = idx === 3 ? 6 : 2;
                    const cls = val >= target ? 'text-emerald-600 dark:text-emerald-400' : val > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
                    return <td key={mi} className={`px-4 py-2.5 text-right tabular-nums font-medium ${cls}`}>{val}</td>;
                  })}
                  <td className="px-4 py-2.5 text-right font-bold tabular-nums">{contentCompliance.reduce((s, c) => s + (idx === 0 ? c.articles : idx === 1 ? c.reposts : idx === 2 ? c.shorts : c.total), 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-th-border flex flex-wrap items-center gap-4 text-xs text-th-text-tertiary">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40" /> Below team avg</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/40" /> &gt;25% below avg</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40" /> Content target hit</span>
        </div>
      </div>
    </div>
  );
}

// ── Monthly Aggregate Tab ─────────────────────────────────────────────

function MonthlyTab({
  dailyLogs, coldLogs, activeMembers,
}: {
  dailyLogs: DailyLogEntry[];
  coldLogs: ColdCallEntry[];
  activeMembers: TeamMember[];
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const monthDaily = useMemo(() => dailyLogs.filter((l) => {
    const d = new Date(l.date);
    return !isNaN(d.getTime()) && d.getMonth() + 1 === month && d.getFullYear() === year;
  }), [dailyLogs, month, year]);

  const monthCold = useMemo(() => coldLogs.filter((l) => {
    const d = new Date(l.date);
    return !isNaN(d.getTime()) && d.getMonth() + 1 === month && d.getFullYear() === year;
  }), [coldLogs, month, year]);

  const allMetrics = useMemo(() => {
    const dailyRows = WEEKLY_METRICS.map((metric) => {
      const perMember = activeMembers.map((m) => monthDaily.filter((l) => l.teamMember === m.name).reduce((s, l) => s + metric.getter(l), 0));
      return { label: metric.label, perMember, total: perMember.reduce((s, v) => s + v, 0) };
    });
    const coldDefs: { label: string; getter: (l: ColdCallEntry) => number }[] = [
      { label: 'Cold Calls Dialed', getter: (l) => l.totalDialed },
      { label: 'Cold Connected', getter: (l) => l.connected },
      { label: 'Meetings from Cold', getter: (l) => l.meetingsBooked },
    ];
    const coldMetricRows = coldDefs.map((def) => {
      const perMember = activeMembers.map((m) => monthCold.filter((l) => l.teamMember === m.name).reduce((s, l) => s + def.getter(l), 0));
      return { label: def.label, perMember, total: perMember.reduce((s, v) => s + v, 0) };
    });
    return [...dailyRows, ...coldMetricRows];
  }, [monthDaily, monthCold, activeMembers]);

  return (
    <div className="bg-th-bg-primary rounded-2xl border border-th-border overflow-hidden">
      <div className="p-5 border-b border-th-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-th-text-primary">Monthly Aggregate — {MONTHS[month - 1]} {year}</h3>
          <p className="text-sm text-th-text-tertiary mt-0.5">{monthDaily.length} daily log entries this month</p>
        </div>
        <div className="flex items-center gap-2">
          <select title="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary text-sm">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input title="Year" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24 px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary text-sm" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-secondary uppercase tracking-wide">
              <th className="px-4 py-3 sticky left-0 bg-surface-secondary z-10">Metric</th>
              {activeMembers.map((m) => <th key={m.id} className="px-4 py-3 text-right">{m.name}</th>)}
              <th className="px-4 py-3 text-right font-bold">Team Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-th-border/50">
            {allMetrics.map((row) => (
              <tr key={row.label} className="hover:bg-surface-secondary/50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-th-text-primary sticky left-0 bg-th-bg-primary">{row.label}</td>
                {row.perMember.map((val, mi) => (
                  <td key={mi} className="px-4 py-2.5 text-right tabular-nums">{row.label === 'Revenue ($)' ? `$${val.toLocaleString()}` : val}</td>
                ))}
                <td className="px-4 py-2.5 text-right font-bold tabular-nums">{row.label === 'Revenue ($)' ? `$${row.total.toLocaleString()}` : row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Performance Comparison Tab ────────────────────────────────────────

const PERF_SECTIONS: { title: string; getter: (l: DailyLogEntry) => number }[] = [
  { title: 'Total Activity (Calls + Emails + LI)', getter: (l) => l.outboundCalls + l.inboundCalls + l.emailsSent + l.liDMsSent + l.liEngagement },
  { title: 'Outbound Calls', getter: (l) => l.outboundCalls },
  { title: 'Self-Generated Leads', getter: (l) => l.selfGenLeads },
  { title: 'Meetings/Presentations', getter: (l) => l.meetings },
  { title: 'Deals Closed', getter: (l) => l.dealsClosed },
  { title: 'Revenue ($)', getter: (l) => l.revenue },
];

function PerformanceTab({ dailyLogs, activeMembers, weekNumber }: { dailyLogs: DailyLogEntry[]; activeMembers: TeamMember[]; weekNumber: number }) {
  const weeks = [weekNumber - 4, weekNumber - 3, weekNumber - 2, weekNumber - 1, weekNumber];

  const getWeekSum = useCallback((name: string, wk: number, getter: (l: DailyLogEntry) => number) =>
    dailyLogs.filter((l) => {
      const d = new Date(l.date);
      return !isNaN(d.getTime()) && l.teamMember === name && getISOWeek(d) === wk;
    }).reduce((s, l) => s + getter(l), 0),
  [dailyLogs]);

  return (
    <div className="space-y-6">
      {PERF_SECTIONS.map((section) => {
        const data = activeMembers.map((m) => {
          const counts = weeks.map((wk) => getWeekSum(m.name, wk, section.getter));
          const avg = Math.round(counts.reduce((s, c) => s + c, 0) / counts.length);
          return { name: m.name, counts, avg };
        });
        const maxCount = Math.max(1, ...data.flatMap((d) => d.counts));
        const isRevenue = section.title.includes('Revenue');

        return (
          <div key={section.title} className="bg-th-bg-primary rounded-2xl border border-th-border overflow-hidden">
            <div className="p-5 border-b border-th-border">
              <h3 className="text-base font-bold text-th-text-primary">{section.title}</h3>
              <p className="text-sm text-th-text-tertiary mt-0.5">Weeks {weeks[0]} – {weeks[4]}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-secondary uppercase tracking-wide">
                    <th className="px-4 py-3">Team Member</th>
                    {weeks.map((wk, i) => (
                      <th key={wk} className="px-4 py-3 text-right">
                        {i === 4 ? <span className="text-th-accent-600">Wk {wk} *</span> : `Wk ${wk}`}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right">5-Wk Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border/50">
                  {data.map((row) => (
                    <tr key={row.name} className="hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-th-text-primary">{row.name}</td>
                      {row.counts.map((count, i) => (
                        <td key={i} className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-th-border/30 rounded-full h-2 hidden lg:block">
                              <div className="bg-th-accent-500 h-2 rounded-full transition-all" style={{ width: `${(count / maxCount) * 100}%` }} />
                            </div>
                            <span className="tabular-nums">{isRevenue ? `$${count.toLocaleString()}` : count}</span>
                          </div>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right font-bold tabular-nums">{isRevenue ? `$${row.avg.toLocaleString()}` : row.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Activity Analytics Tab ────────────────────────────────────────────

function AnalyticsTab({ dailyLogs, coldLogs, activeMembers }: { dailyLogs: DailyLogEntry[]; coldLogs: ColdCallEntry[]; activeMembers: TeamMember[] }) {
  const linkedinData = useMemo(() => activeMembers.map((m) => {
    const ml = dailyLogs.filter((l) => l.teamMember === m.name);
    const businesses = ml.reduce((s, l) => s + l.liBusinesses, 0);
    const agencies = ml.reduce((s, l) => s + l.liAgencies, 0);
    const agents = ml.reduce((s, l) => s + l.liAgents, 0);
    const groups = ml.reduce((s, l) => s + l.liGroups, 0);
    return { name: m.name, businesses, agencies, agents, groups, total: businesses + agencies + agents + groups };
  }), [dailyLogs, activeMembers]);

  const coldData = useMemo(() => activeMembers.map((m) => {
    const ml = coldLogs.filter((l) => l.teamMember === m.name);
    const dialed = ml.reduce((s, l) => s + l.totalDialed, 0);
    const connected = ml.reduce((s, l) => s + l.connected, 0);
    const mtgs = ml.reduce((s, l) => s + l.meetingsBooked, 0);
    return {
      name: m.name, dialed, connected, mtgs,
      connRate: dialed ? ((connected / dialed) * 100).toFixed(1) : '0',
      mtgRate: connected ? ((mtgs / connected) * 100).toFixed(1) : '0',
    };
  }), [coldLogs, activeMembers]);

  const leadData = useMemo(() => activeMembers.map((m) => {
    const ml = dailyLogs.filter((l) => l.teamMember === m.name);
    const inhouse = ml.reduce((s, l) => s + l.inhouseLeads, 0);
    const selfGen = ml.reduce((s, l) => s + l.selfGenLeads, 0);
    const total = inhouse + selfGen;
    return {
      name: m.name, inhouse, selfGen, total,
      inhousePct: total ? ((inhouse / total) * 100).toFixed(1) : '0',
      selfGenPct: total ? ((selfGen / total) * 100).toFixed(1) : '0',
    };
  }), [dailyLogs, activeMembers]);

  return (
    <div className="space-y-6">
      {/* LinkedIn Breakdown */}
      <div className="bg-th-bg-primary rounded-2xl border border-th-border overflow-hidden">
        <div className="p-5 border-b border-th-border">
          <h3 className="text-base font-bold text-th-text-primary">LinkedIn Connections Breakdown (All-Time)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-secondary uppercase tracking-wide">
                <th className="px-4 py-3">Team Member</th>
                <th className="px-4 py-3 text-right">Businesses/DMs</th>
                <th className="px-4 py-3 text-right">Agencies</th>
                <th className="px-4 py-3 text-right">Agents</th>
                <th className="px-4 py-3 text-right">Groups</th>
                <th className="px-4 py-3 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border/50">
              {linkedinData.map((r) => (
                <tr key={r.name} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-th-text-primary">{r.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.businesses}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.agencies}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.agents}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.groups}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{r.total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface-secondary font-bold text-th-text-primary">
                <td className="px-4 py-3">TEAM TOTAL</td>
                <td className="px-4 py-3 text-right">{linkedinData.reduce((s, r) => s + r.businesses, 0)}</td>
                <td className="px-4 py-3 text-right">{linkedinData.reduce((s, r) => s + r.agencies, 0)}</td>
                <td className="px-4 py-3 text-right">{linkedinData.reduce((s, r) => s + r.agents, 0)}</td>
                <td className="px-4 py-3 text-right">{linkedinData.reduce((s, r) => s + r.groups, 0)}</td>
                <td className="px-4 py-3 text-right">{linkedinData.reduce((s, r) => s + r.total, 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Cold Call Performance */}
      <div className="bg-th-bg-primary rounded-2xl border border-th-border overflow-hidden">
        <div className="p-5 border-b border-th-border">
          <h3 className="text-base font-bold text-th-text-primary">Cold Call Performance (All-Time)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-secondary uppercase tracking-wide">
                <th className="px-4 py-3">Team Member</th>
                <th className="px-4 py-3 text-right">Total Dialed</th>
                <th className="px-4 py-3 text-right">Connected</th>
                <th className="px-4 py-3 text-right">Meetings</th>
                <th className="px-4 py-3 text-right">Connect Rate</th>
                <th className="px-4 py-3 text-right">Meeting Conv</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border/50">
              {coldData.map((r) => (
                <tr key={r.name} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-th-text-primary">{r.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.dialed}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.connected}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.mtgs}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.connRate}%</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.mtgRate}%</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-surface-secondary font-bold text-th-text-primary">
                <td className="px-4 py-3">TEAM TOTAL</td>
                <td className="px-4 py-3 text-right">{coldData.reduce((s, r) => s + r.dialed, 0)}</td>
                <td className="px-4 py-3 text-right">{coldData.reduce((s, r) => s + r.connected, 0)}</td>
                <td className="px-4 py-3 text-right">{coldData.reduce((s, r) => s + r.mtgs, 0)}</td>
                <td className="px-4 py-3 text-right">{(() => { const d = coldData.reduce((s, r) => s + r.dialed, 0); const c = coldData.reduce((s, r) => s + r.connected, 0); return d ? ((c / d) * 100).toFixed(1) : '0'; })()}%</td>
                <td className="px-4 py-3 text-right">{(() => { const c = coldData.reduce((s, r) => s + r.connected, 0); const m = coldData.reduce((s, r) => s + r.mtgs, 0); return c ? ((m / c) * 100).toFixed(1) : '0'; })()}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Lead Source Mix */}
      <div className="bg-th-bg-primary rounded-2xl border border-th-border overflow-hidden">
        <div className="p-5 border-b border-th-border">
          <h3 className="text-base font-bold text-th-text-primary">Lead Source Mix — Inhouse vs Self-Generated (All-Time)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-secondary uppercase tracking-wide">
                <th className="px-4 py-3">Team Member</th>
                <th className="px-4 py-3 text-right">Inhouse</th>
                <th className="px-4 py-3 text-right">Self-Gen</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Mix</th>
                <th className="px-4 py-3 text-right">Inhouse %</th>
                <th className="px-4 py-3 text-right">Self-Gen %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border/50">
              {leadData.map((r) => (
                <tr key={r.name} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-th-text-primary">{r.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.inhouse}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.selfGen}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{r.total}</td>
                  <td className="px-4 py-3">
                    {r.total > 0 && (
                      <div className="flex w-full h-3 rounded-full overflow-hidden bg-th-border/30">
                        <div className="bg-blue-500 h-full transition-all" style={{ width: `${r.inhousePct}%` }} />
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${r.selfGenPct}%` }} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.inhousePct}%</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.selfGenPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-th-border flex items-center gap-4 text-xs text-th-text-tertiary">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500" /> Inhouse</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Self-Generated</span>
        </div>
      </div>
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────

function TeamTab({
  team,
  setTeam,
}: {
  team: TeamMember[];
  setTeam: (fn: (prev: TeamMember[]) => TeamMember[]) => void;
}) {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Inside Sales Rep');

  const handleAdd = () => {
    if (!newName.trim()) { toast.error('Enter a name'); return; }
    setTeam((prev) => [...prev, { id: uid(), name: newName.trim(), status: 'Active', role: newRole, notes: '' }]);
    setNewName('');
    toast.success('Team member added');
  };

  const toggleStatus = (id: string) => {
    setTeam((prev) => prev.map((m) => m.id === id ? { ...m, status: m.status === 'Active' ? 'Inactive' : 'Active' } : m));
  };

  return (
    <div className="space-y-6">
      <div className="bg-th-bg-primary rounded-2xl border border-th-border p-5">
        <h3 className="text-base font-bold text-th-text-primary mb-4">Add Team Member</h3>
        <div className="flex flex-wrap gap-3">
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" className="flex-1 min-w-[180px] px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm" />
          <input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Role" className="w-48 px-3 py-2 rounded-lg border border-th-border bg-th-bg-primary focus:border-th-accent-500 focus:ring-2 focus:ring-th-accent-500/15 text-sm" />
          <button onClick={handleAdd} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-th-accent-600 text-white text-sm font-medium hover:bg-th-accent-700 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className="bg-th-bg-primary rounded-2xl border border-th-border overflow-hidden">
        <div className="p-4 border-b border-th-border">
          <h3 className="text-base font-bold text-th-text-primary">Sales Team Roster</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-secondary text-left text-xs font-medium text-th-text-secondary uppercase tracking-wide">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-th-border/50">
            {team.map((m) => (
              <tr key={m.id} className="hover:bg-surface-secondary/50 transition-colors">
                <td className="px-4 py-3 font-medium text-th-text-primary">{m.name}</td>
                <td className="px-4 py-3 text-th-text-secondary">{m.role}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(m.id)} className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${m.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-500/15 text-gray-500 dark:text-gray-400'}`}>
                    {m.status}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button title="Remove member" onClick={() => setTeam((prev) => prev.filter((x) => x.id !== m.id))} className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded text-th-text-tertiary hover:text-red-500 transition-colors">
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

export default function SalesDailyLogs() {
  const [activeTab, setActiveTab] = useState<TabId>('daily');
  const [showShare, setShowShare] = useState(false);
  const [weekNumber, setWeekNumber] = useState(() => getISOWeek(new Date()));

  const [dailyLogs, setDailyLogsRaw] = useState<DailyLogEntry[]>(() => loadFromStorage(SK_DAILY, []));
  const [coldLogs, setColdLogsRaw] = useState<ColdCallEntry[]>(() => loadFromStorage(SK_COLD, []));
  const [contentLogs, setContentLogsRaw] = useState<ContentEntry[]>(() => loadFromStorage(SK_CONTENT, []));
  const [team, setTeamRaw] = useState<TeamMember[]>(() => loadFromStorage(SK_TEAM, DEFAULT_TEAM));

  const setDailyLogs: typeof setDailyLogsRaw = useCallback((fn) => {
    setDailyLogsRaw((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      localStorage.setItem(SK_DAILY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setColdLogs: typeof setColdLogsRaw = useCallback((fn) => {
    setColdLogsRaw((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      localStorage.setItem(SK_COLD, JSON.stringify(next));
      return next;
    });
  }, []);

  const setContentLogs: typeof setContentLogsRaw = useCallback((fn) => {
    setContentLogsRaw((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      localStorage.setItem(SK_CONTENT, JSON.stringify(next));
      return next;
    });
  }, []);

  const setTeam: typeof setTeamRaw = useCallback((fn) => {
    setTeamRaw((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      localStorage.setItem(SK_TEAM, JSON.stringify(next));
      return next;
    });
  }, []);

  const activeMembers = useMemo(() => team.filter((m) => m.status === 'Active'), [team]);

  useEffect(() => {
    setWeekNumber(getISOWeek(new Date()));
  }, [activeTab]);

  const handleExportAll = () => {
    const headers = ['Week', 'Date', 'Team Member', 'Inhouse Leads', 'Self-Gen Leads', 'Outbound Calls', 'Inbound Calls', 'Voicemails', 'Phone Time', 'Texts', 'Emails Sent', 'Emails Recv', 'LI Businesses', 'LI Agencies', 'LI Agents', 'LI Groups', 'LI DMs', 'LI Replies', 'LI Engagement', 'Meetings', 'Proposals', 'Follow-ups', 'Referrals', 'Deals', 'Revenue', 'Networking', 'Community', 'Content?', 'Notes'];
    const rows = dailyLogs.map((l) => [
      String(isNaN(new Date(l.date).getTime()) ? '' : getISOWeek(new Date(l.date))),
      l.date, l.teamMember,
      l.inhouseLeads, l.selfGenLeads, l.outboundCalls, l.inboundCalls, l.voicemailsLeft, l.phoneTime,
      l.textsSent, l.emailsSent, l.emailsReceived,
      l.liBusinesses, l.liAgencies, l.liAgents, l.liGroups, l.liDMsSent, l.liReplies, l.liEngagement,
      l.meetings, l.proposalsSent, l.followUps, l.referralsAsked,
      l.dealsClosed, l.revenue, l.networkingEvents, l.communityOutreach,
      l.contentPosted ? 'Yes' : 'No', l.notes,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-daily-log-all.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Full log exported');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-th-accent-700 to-th-accent-500 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">Sales Daily Logs & Reports</h1>
            <p className="text-sm text-th-text-tertiary">Track advisor/agent daily activities, view reports, and share with management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-th-text-secondary">Week:</label>
            <div className="flex items-center border border-th-border rounded-lg overflow-hidden">
              <button title="Previous week" onClick={() => setWeekNumber((w) => w - 1)} className="px-2 py-1.5 hover:bg-surface-secondary text-th-text-secondary transition-colors">
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <span className="px-3 py-1.5 text-sm font-bold text-th-text-primary tabular-nums bg-surface-secondary min-w-[40px] text-center">{weekNumber}</span>
              <button title="Next week" onClick={() => setWeekNumber((w) => w + 1)} className="px-2 py-1.5 hover:bg-surface-secondary text-th-text-secondary transition-colors">
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
          <button onClick={() => setShowShare(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-th-accent-600 text-white text-sm font-medium hover:bg-th-accent-700 transition-colors">
            <Send className="w-4 h-4" /> Share Report
          </button>
          <button onClick={handleExportAll} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-th-border text-th-text-primary text-sm font-medium hover:bg-surface-secondary transition-colors">
            <Download className="w-4 h-4" /> Export All
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-th-border pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? 'border-th-accent-600 text-th-accent-600'
                  : 'border-transparent text-th-text-tertiary hover:text-th-text-primary hover:border-th-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'daily' && <DailyLogTab logs={dailyLogs} setLogs={setDailyLogs} activeMembers={activeMembers} />}
      {activeTab === 'coldcall' && <ColdCallTab logs={coldLogs} setLogs={setColdLogs} activeMembers={activeMembers} />}
      {activeTab === 'content' && <ContentTab logs={contentLogs} setLogs={setContentLogs} activeMembers={activeMembers} weekNumber={weekNumber} />}
      {activeTab === 'weekly' && <WeeklyReportTab dailyLogs={dailyLogs} coldLogs={coldLogs} contentLogs={contentLogs} activeMembers={activeMembers} weekNumber={weekNumber} />}
      {activeTab === 'monthly' && <MonthlyTab dailyLogs={dailyLogs} coldLogs={coldLogs} activeMembers={activeMembers} />}
      {activeTab === 'performance' && <PerformanceTab dailyLogs={dailyLogs} activeMembers={activeMembers} weekNumber={weekNumber} />}
      {activeTab === 'analytics' && <AnalyticsTab dailyLogs={dailyLogs} coldLogs={coldLogs} activeMembers={activeMembers} />}
      {activeTab === 'team' && <TeamTab team={team} setTeam={setTeam} />}

      {/* Share Modal */}
      {showShare && (
        <ShareModal
          onClose={() => setShowShare(false)}
          dailyLogs={dailyLogs}
          coldLogs={coldLogs}
          contentLogs={contentLogs}
          team={team}
          weekNumber={weekNumber}
        />
      )}
    </div>
  );
}
