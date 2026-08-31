import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createInvitation, listInvitations, listOrganizations } from '@/lib/platformApi';
import type { Organization, OrgInvitation, OrgRole } from '@/lib/types';

export default function InvitationsPage() {
  const [loading, setLoading] = useState(true);
  const [invites, setInvites] = useState<OrgInvitation[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgId, setOrgId] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('member');

  const reload = useCallback(async () => {
    const [invRows, orgRows] = await Promise.all([listInvitations(), listOrganizations()]);
    setInvites(invRows);
    setOrgs(orgRows);
    setOrgId((current) => current || orgRows[0]?.id || '');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load invitations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createInvitation({ orgId, email, role });
      toast.success('Invitation created');
      setEmail('');
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const orgName = (id: string) => orgs.find((o) => o.id === id)?.name ?? id;

  return (
    <div className="mx-auto max-w-5xl pcc-enter">
      <h1 className="font-display text-3xl tracking-tight">Invitations</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Human-gated invites into Accounts orgs. Requires org admin/owner RLS.
      </p>

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-surface-line bg-surface-raised p-4 sm:grid-cols-[1.2fr_1fr_auto_auto]"
      >
        <select
          required
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          className="rounded-lg border border-surface-line px-3 py-2 text-sm"
        >
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.slug})
            </option>
          ))}
        </select>
        <input
          required
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-surface-line px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as OrgRole)}
          className="rounded-lg border border-surface-line px-3 py-2 text-sm"
        >
          <option value="member">member</option>
          <option value="admin">admin</option>
          <option value="owner">owner</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep"
        >
          Invite
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-surface-line bg-surface-raised">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-surface-line bg-surface text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Org</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Expires</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((inv) => (
              <tr key={inv.id} className="border-b border-surface-line last:border-0">
                <td className="px-4 py-3">
                  <Link
                    to={`/organizations/${inv.org_id}`}
                    className="text-accent-deep hover:underline"
                  >
                    {orgName(inv.org_id)}
                  </Link>
                </td>
                <td className="px-4 py-3">{inv.email}</td>
                <td className="px-4 py-3">{inv.role}</td>
                <td className="px-4 py-3">{inv.status}</td>
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {inv.expires_at ? new Date(inv.expires_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
