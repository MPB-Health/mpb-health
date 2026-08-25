import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Users,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  UserPlus,
  Trash2,
  Link2,
  Search,
  Loader2,
  X,
  Ban,
  RotateCcw,
  Settings2,
  Lock,
  UserCircle2,
  Activity as ActivityIcon,
  Plus,
} from 'lucide-react';
import {
  CONCIERGE_FEATURES,
  CONCIERGE_FEATURE_GROUPS,
  type ConciergeFeatureGroup,
} from '@mpbhealth/concierge-core';
import { useConciergeAccess } from '../hooks/useConciergeAccess';
import {
  fetchDirectoryUsers,
  fetchConciergeAccessRows,
  fetchConciergeAuditLog,
  countLogsSince,
  countOpenEscalations,
  createConciergeUser,
  grantConciergeRole,
  revokeConciergeRole,
  setConciergeUserStatus,
  deleteConciergeUser,
  setConciergeFeatures,
  linkRosterToUser,
  type DirectoryUser,
  type ConciergeAccessRow,
} from '../lib/concierge-admin-api';
import {
  fetchTeamMembers,
  insertTeamMember,
  updateTeamMember,
  deleteTeamMember,
  type TeamMember,
} from '../lib/concierge-api';

type TabId = 'people' | 'access' | 'roster' | 'activity';

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: 'people', label: 'People', icon: Users },
  { id: 'access', label: 'Access', icon: ShieldCheck },
  { id: 'roster', label: 'Roster', icon: ClipboardList },
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
];

function startOfWeekYmd(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function isConciergeRelevant(u: DirectoryUser, rosterUserIds: Set<string>): boolean {
  return (
    u.roles.includes('concierge') ||
    u.roles.includes('admin') ||
    u.roles.includes('super_admin') ||
    rosterUserIds.has(u.id)
  );
}

// ── KPI card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, tone = 'teal' }: { label: string; value: number | string; icon: typeof Users; tone?: 'teal' | 'forest' | 'amber' | 'slate' }) {
  const tones: Record<string, string> = {
    teal: 'from-brand-teal/15 to-brand-teal/5 text-brand-teal',
    forest: 'from-brand-forest/15 to-brand-forest/5 text-brand-forest',
    amber: 'from-amber-100 to-amber-50 text-amber-700',
    slate: 'from-slate-100 to-slate-50 text-slate-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tones[tone]} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-[#2F3E2F] leading-tight">{value}</p>
        <p className="text-xs text-slate-500 truncate">{label}</p>
      </div>
    </div>
  );
}

function RoleBadges({ roles }: { roles: string[] }) {
  if (!roles.length) return <span className="text-xs text-slate-400">—</span>;
  const tone: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    concierge: 'bg-brand-teal/15 text-brand-teal',
    advisor: 'bg-slate-100 text-slate-600',
    member: 'bg-slate-100 text-slate-500',
    crm_user: 'bg-slate-100 text-slate-500',
    staff_hr: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <span key={r} className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${tone[r] ?? 'bg-slate-100 text-slate-600'}`}>
          {r}
        </span>
      ))}
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────
function Modal({ title, onClose, children, maxW = 'max-w-lg' }: { title: string; onClose: () => void; children: React.ReactNode; maxW?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl w-full ${maxW} my-4`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h3 className="font-semibold text-[#2F3E2F]">{title}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function ManagementCenter() {
  const access = useConciergeAccess();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabId>('people');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [featureUser, setFeatureUser] = useState<DirectoryUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DirectoryUser | null>(null);

  const usersQ = useQuery({ queryKey: ['cmc', 'users'], queryFn: fetchDirectoryUsers, enabled: access.isManager });
  const accessQ = useQuery({ queryKey: ['cmc', 'access'], queryFn: fetchConciergeAccessRows, enabled: access.isManager });
  const rosterQ = useQuery({ queryKey: ['cmc', 'roster'], queryFn: fetchTeamMembers, enabled: access.isManager });
  const auditQ = useQuery({ queryKey: ['cmc', 'audit'], queryFn: () => fetchConciergeAuditLog(60), enabled: access.isManager && tab === 'activity' });
  const kpiQ = useQuery({
    queryKey: ['cmc', 'kpi'],
    queryFn: async () => ({
      logsThisWeek: await countLogsSince(startOfWeekYmd()),
      openEscalations: await countOpenEscalations(),
    }),
    enabled: access.isManager,
  });

  const accessByUser = useMemo(() => {
    const m = new Map<string, ConciergeAccessRow>();
    for (const r of accessQ.data ?? []) m.set(r.userId, r);
    return m;
  }, [accessQ.data]);

  const rosterUserIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of rosterQ.data ?? []) if (r.userId) s.add(r.userId);
    return s;
  }, [rosterQ.data]);

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['cmc'] });
    void access.refresh();
  };

  // ── Permission gate (defensive; route guard already redirects) ─────────────
  if (access.loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
      </div>
    );
  }
  if (!access.isManager) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <h1 className="text-lg font-semibold text-[#2F3E2F]">Managers only</h1>
        <p className="text-sm text-slate-500 mt-1">
          The Management Center is available to concierge managers, admins, and super admins.
        </p>
      </div>
    );
  }

  const directory = usersQ.data ?? [];
  const roster = rosterQ.data ?? [];
  const restrictedCount = (accessQ.data ?? []).filter((r) => r.deniedFeatures.length > 0).length;
  const activeReps = roster.filter((r) => r.status === 'Active').length;
  const linkedAccounts = roster.filter((r) => r.userId).length;

  const searchLc = search.trim().toLowerCase();
  const peopleList = directory
    .filter((u) => (searchLc ? (u.email.toLowerCase().includes(searchLc) || (u.fullName ?? '').toLowerCase().includes(searchLc)) : isConciergeRelevant(u, rosterUserIds)))
    .sort((a, b) => a.email.localeCompare(b.email));

  const conciergeUsers = directory
    .filter((u) => isConciergeRelevant(u, rosterUserIds))
    .sort((a, b) => a.email.localeCompare(b.email));

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2F3E2F] flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-brand-teal" />
            Management Center
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage concierge accounts, access, and the team roster.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-forest text-white text-sm font-medium hover:bg-brand-forest/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add user
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Roster members" value={roster.length} icon={Users} tone="forest" />
        <KpiCard label="Active reps" value={activeReps} icon={UserCircle2} tone="teal" />
        <KpiCard label="Linked accounts" value={linkedAccounts} icon={Link2} tone="teal" />
        <KpiCard label="Restricted users" value={restrictedCount} icon={Lock} tone="amber" />
        <KpiCard label="Logs this week" value={kpiQ.data?.logsThisWeek ?? '—'} icon={ClipboardList} tone="slate" />
        <KpiCard label="Open escalations" value={kpiQ.data?.openEscalations ?? '—'} icon={AlertTriangle} tone="amber" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active ? 'border-brand-teal text-brand-teal' : 'border-transparent text-slate-500 hover:text-brand-forest'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Errors */}
      {(usersQ.isError || accessQ.isError || rosterQ.isError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Failed to load management data. {(usersQ.error as Error)?.message || (accessQ.error as Error)?.message || (rosterQ.error as Error)?.message}
        </div>
      )}

      {/* People */}
      {tab === 'people' && (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all users by name or email…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            />
          </div>
          {usersQ.isLoading ? (
            <TableLoading />
          ) : peopleList.length === 0 ? (
            <EmptyState label={searchLc ? 'No users match your search.' : 'No concierge users yet. Use “Add user” to create one.'} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">User</th>
                    <th className="text-left font-medium px-4 py-2.5">Roles</th>
                    <th className="text-left font-medium px-4 py-2.5">Last sign-in</th>
                    <th className="text-left font-medium px-4 py-2.5">Restrictions</th>
                    <th className="text-right font-medium px-4 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {peopleList.map((u) => (
                    <PersonRow
                      key={u.id}
                      user={u}
                      accessRow={accessByUser.get(u.id)}
                      isSuperAdmin={access.isSuperAdmin}
                      selfId={access.userId}
                      onManage={() => setFeatureUser(u)}
                      onDelete={() => setDeleteTarget(u)}
                      onChanged={refreshAll}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Access */}
      {tab === 'access' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Restrictions are a deny-list — a user keeps every feature unless it’s turned off here. Managers, admins, and super admins are always unrestricted.
          </p>
          {accessQ.isLoading || usersQ.isLoading ? (
            <TableLoading />
          ) : conciergeUsers.length === 0 ? (
            <EmptyState label="No concierge users to configure yet." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {conciergeUsers.map((u) => {
                const row = accessByUser.get(u.id);
                const privileged = u.roles.includes('admin') || u.roles.includes('super_admin');
                return (
                  <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 truncate">{u.fullName || u.email}</p>
                      <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {privileged ? (
                        <span className="text-xs text-slate-400">Always unrestricted</span>
                      ) : row && row.deniedFeatures.length > 0 ? (
                        <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          {row.deniedFeatures.length} restricted
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600">Full access</span>
                      )}
                      {row?.isManager && (
                        <span className="text-xs font-medium text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full">Manager</span>
                      )}
                      <button
                        onClick={() => setFeatureUser(u)}
                        disabled={privileged}
                        className="text-sm px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Roster */}
      {tab === 'roster' && (
        <RosterTab
          roster={roster}
          loading={rosterQ.isLoading}
          directory={directory}
          onChanged={refreshAll}
        />
      )}

      {/* Activity */}
      {tab === 'activity' && (
        <div className="space-y-3">
          {auditQ.isLoading ? (
            <TableLoading />
          ) : (auditQ.data ?? []).length === 0 ? (
            <EmptyState label="No management activity recorded yet, or your role can’t view the audit log." />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {(auditQ.data ?? []).map((a) => (
                <div key={a.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <ActivityIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800">
                      <span className="font-medium">{a.action.replace('concierge.', '')}</span>
                      {a.userEmail ? <span className="text-slate-500"> by {a.userEmail}</span> : null}
                    </p>
                    <p className="text-xs text-slate-400">{new Date(a.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {createOpen && (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            refreshAll();
          }}
        />
      )}
      {featureUser && (
        <FeatureEditorModal
          user={featureUser}
          accessRow={accessByUser.get(featureUser.id)}
          canSetManager={access.isSuperAdmin}
          onClose={() => setFeatureUser(null)}
          onSaved={() => {
            setFeatureUser(null);
            refreshAll();
          }}
        />
      )}
      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            refreshAll();
          }}
        />
      )}
    </div>
  );
}

// ── People row ──────────────────────────────────────────────────────────────
function PersonRow({
  user,
  accessRow,
  isSuperAdmin,
  selfId,
  onManage,
  onDelete,
  onChanged,
}: {
  user: DirectoryUser;
  accessRow: ConciergeAccessRow | undefined;
  isSuperAdmin: boolean;
  selfId: string | null;
  onManage: () => void;
  onDelete: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const isSelf = user.id === selfId;
  const hasConcierge = user.roles.includes('concierge');
  const isPrivileged = user.roles.includes('admin') || user.roles.includes('super_admin');
  const canDestruct = !isSelf && !isPrivileged; // admins/super_admins are managed in the Admin Portal

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="hover:bg-slate-50/60">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800">{user.fullName || user.email.split('@')[0]}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
      </td>
      <td className="px-4 py-3"><RoleBadges roles={user.roles} /></td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never'}
      </td>
      <td className="px-4 py-3">
        {isPrivileged ? (
          <span className="text-xs text-slate-400">—</span>
        ) : accessRow && accessRow.deniedFeatures.length > 0 ? (
          <span className="text-xs font-medium text-amber-700">{accessRow.deniedFeatures.length} restricted</span>
        ) : (
          <span className="text-xs text-emerald-600">Full</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={onManage}
            disabled={busy || isPrivileged}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            title={isPrivileged ? 'Admins are always unrestricted' : 'Configure feature access'}
          >
            Access
          </button>
          {hasConcierge ? (
            <button
              onClick={() => run(() => revokeConciergeRole(user.id, 'concierge'), 'Concierge access removed')}
              disabled={busy || isSelf}
              className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Remove concierge
            </button>
          ) : (
            <button
              onClick={() => run(() => grantConciergeRole(user.id, 'concierge'), 'Concierge access granted')}
              disabled={busy}
              className="text-xs px-2 py-1.5 rounded-lg border border-brand-teal/40 text-brand-teal hover:bg-brand-teal/10 disabled:opacity-40"
            >
              Add concierge
            </button>
          )}
          <button
            onClick={() => run(() => setConciergeUserStatus(user.id, 'deactivate'), 'Account deactivated')}
            disabled={busy || !canDestruct}
            title={canDestruct ? 'Deactivate (block sign-in)' : 'Managed in the Admin Portal'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Ban className="w-4 h-4" />
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => run(() => setConciergeUserStatus(user.id, 'reactivate'), 'Account reactivated')}
              disabled={busy || isSelf}
              title="Reactivate"
              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={busy || !canDestruct}
            title={canDestruct ? 'Permanently delete' : 'Managed in the Admin Portal'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Roster tab ────────────────────────────────────────────────────────────
function RosterTab({
  roster,
  loading,
  directory,
  onChanged,
}: {
  roster: TeamMember[];
  loading: boolean;
  directory: DirectoryUser[];
  onChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Concierge');

  const emailById = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of directory) m.set(u.id, u.email);
    return m;
  }, [directory]);

  const run = async (id: string, fn: () => Promise<unknown>, okMsg: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(okMsg);
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <TableLoading />;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {adding ? (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Full name"
              className="px-2 py-1.5 text-sm rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            />
            <input
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="Role"
              className="px-2 py-1.5 text-sm rounded border border-slate-200 w-28 focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
            />
            <button
              onClick={() =>
                run('new', async () => {
                  if (!newName.trim()) throw new Error('Name is required');
                  await insertTeamMember({ name: newName.trim(), status: 'Active', role: newRole || 'Concierge' }, roster.length);
                  setNewName('');
                  setAdding(false);
                }, 'Roster member added')
              }
              disabled={busyId === 'new'}
              className="text-sm px-3 py-1.5 rounded-lg bg-brand-forest text-white hover:bg-brand-forest/90 disabled:opacity-50"
            >
              {busyId === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
            <button onClick={() => setAdding(false)} className="p-1.5 text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Plus className="w-4 h-4" />
            Add roster member
          </button>
        )}
      </div>

      {roster.length === 0 ? (
        <EmptyState label="No roster members yet." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Name</th>
                <th className="text-left font-medium px-4 py-2.5">Role</th>
                <th className="text-left font-medium px-4 py-2.5">Status</th>
                <th className="text-left font-medium px-4 py-2.5">Linked account</th>
                <th className="text-right font-medium px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roster.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {m.name}
                    {m.partTime && <span className="ml-2 text-[11px] text-slate-400">part-time</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.role}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        run(m.id, () => updateTeamMember({ ...m, status: m.status === 'Active' ? 'Inactive' : 'Active' }), 'Status updated')
                      }
                      disabled={busyId === m.id}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {m.status}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={m.userId ?? ''}
                      onChange={(e) => run(m.id, () => linkRosterToUser(m.id, e.target.value || null), e.target.value ? 'Account linked' : 'Account unlinked')}
                      disabled={busyId === m.id}
                      className="text-xs max-w-[200px] px-2 py-1 rounded border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
                    >
                      <option value="">Not linked</option>
                      {m.userId && !emailById.has(m.userId) && <option value={m.userId}>{`(current) ${m.userId.slice(0, 8)}…`}</option>}
                      {directory.map((u) => (
                        <option key={u.id} value={u.id}>{u.email}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() =>
                          run(m.id, () => updateTeamMember({ ...m, partTime: !m.partTime }), 'Updated')
                        }
                        disabled={busyId === m.id}
                        className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
                      >
                        {m.partTime ? 'Set full-time' : 'Set part-time'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${m.name} from the roster? This does not delete their login.`)) {
                            void run(m.id, () => deleteTeamMember(m.id), 'Roster member removed');
                          }
                        }}
                        disabled={busyId === m.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Create user modal ─────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sendInvite, setSendInvite] = useState(true);
  const [addToRoster, setAddToRoster] = useState(true);
  const [partTime, setPartTime] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await createConciergeUser({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        send_invite: sendInvite,
        add_to_roster: addToRoster,
        part_time: partTime,
      });
      toast.success(res.message || 'Concierge account created');
      if (res.email_error) toast.error(`Invite email failed: ${res.email_error}`);
      onCreated();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create user');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add concierge user" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-slate-500">
          Creates a login with the <strong>concierge</strong> role. To grant admin or super admin, use the Admin Portal.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name"><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} /></Field>
          <Field label="Last name"><input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} /></Field>
        </div>
        <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} /></Field>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={sendInvite} onChange={(e) => setSendInvite(e.target.checked)} />
          Email an invitation with a temporary password
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={addToRoster} onChange={(e) => setAddToRoster(e.target.checked)} />
          Add to the team roster
        </label>
        {addToRoster && (
          <label className="flex items-center gap-2 text-sm text-slate-700 pl-6">
            <input type="checkbox" checked={partTime} onChange={(e) => setPartTime(e.target.checked)} />
            Part-time
          </label>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={submit}
            disabled={busy || !email.trim() || !firstName.trim() || !lastName.trim()}
            className="px-3.5 py-2 text-sm rounded-lg bg-brand-forest text-white hover:bg-brand-forest/90 disabled:opacity-50 flex items-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Create account
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Feature editor modal ──────────────────────────────────────────────────
function FeatureEditorModal({
  user,
  accessRow,
  canSetManager,
  onClose,
  onSaved,
}: {
  user: DirectoryUser;
  accessRow: ConciergeAccessRow | undefined;
  canSetManager: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [denied, setDenied] = useState<Set<string>>(new Set(accessRow?.deniedFeatures ?? []));
  const [isManager, setIsManager] = useState(accessRow?.isManager ?? false);
  const [notes, setNotes] = useState(accessRow?.notes ?? '');
  const [busy, setBusy] = useState(false);

  const toggle = (key: string) => {
    setDenied((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    setBusy(true);
    try {
      await setConciergeFeatures({
        userId: user.id,
        deniedFeatures: Array.from(denied),
        ...(canSetManager ? { isManager } : {}),
        notes: notes.trim() ? notes.trim() : null,
      });
      toast.success('Access updated');
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save access');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Access — ${user.fullName || user.email}`} onClose={onClose} maxW="max-w-xl">
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          Toggle a feature off to restrict it for this user. Everything is allowed by default.
        </p>
        {canSetManager && (
          <label className="flex items-center gap-2 text-sm font-medium text-brand-forest bg-brand-teal/5 border border-brand-teal/20 rounded-lg px-3 py-2">
            <input type="checkbox" checked={isManager} onChange={(e) => setIsManager(e.target.checked)} />
            Concierge manager (full access to the Management Center)
          </label>
        )}
        <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
          {CONCIERGE_FEATURE_GROUPS.map((group: ConciergeFeatureGroup) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">{group}</p>
              <div className="space-y-1.5">
                {CONCIERGE_FEATURES.filter((f) => f.group === group).map((f) => {
                  const allowed = !denied.has(f.key);
                  return (
                    <label key={f.key} className="flex items-start justify-between gap-3 py-1.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <span className="min-w-0">
                        <span className="text-sm text-slate-800">{f.label}</span>
                        <span className="block text-xs text-slate-400">{f.description}{f.rlsEnforced ? ' · enforced server-side' : ''}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => toggle(f.key)}
                        className={`shrink-0 mt-0.5 px-2 py-1 rounded-full text-xs font-medium ${allowed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}
                      >
                        {allowed ? 'Allowed' : 'Denied'}
                      </button>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <Field label="Notes (optional)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} />
        </Field>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={save} disabled={busy} className="px-3.5 py-2 text-sm rounded-lg bg-brand-forest text-white hover:bg-brand-forest/90 disabled:opacity-50 flex items-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Save access
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────
function DeleteUserModal({ user, onClose, onDeleted }: { user: DirectoryUser; onClose: () => void; onDeleted: () => void }) {
  const [confirmEmail, setConfirmEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await deleteConciergeUser(user.id, confirmEmail.trim());
      toast.success(`Deleted ${user.email}`);
      onDeleted();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete user');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Delete account" onClose={onClose}>
      <div className="space-y-3">
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          This permanently deletes <strong>{user.email}</strong> and their login. This cannot be undone.
        </div>
        <Field label={`Type ${user.email} to confirm`}>
          <input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} className={inputCls} placeholder={user.email} />
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={submit}
            disabled={busy || confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()}
            className="px-3.5 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete permanently
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Small shared bits ───────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-teal/30';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

function TableLoading() {
  return (
    <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
      <Loader2 className="w-6 h-6 animate-spin text-brand-teal" />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
