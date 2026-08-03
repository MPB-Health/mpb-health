import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createInvitation,
  getOrganization,
  launchSso,
  listApps,
  listInvitations,
  listLicenses,
  listMemberships,
} from '@/lib/platformApi';
import type { AppCatalogItem, Organization, OrgAppLicense, OrgInvitation, OrgMembership, OrgRole } from '@/lib/types';
import { isEntitledNow } from '@/lib/types';

export default function OrganizationDetail() {
  const { orgId = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Organization | null>(null);
  const [apps, setApps] = useState<AppCatalogItem[]>([]);
  const [licenses, setLicenses] = useState<OrgAppLicense[]>([]);
  const [members, setMembers] = useState<OrgMembership[]>([]);
  const [invites, setInvites] = useState<OrgInvitation[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('member');
  const [launching, setLaunching] = useState<string | null>(null);

  const licenseByApp = useMemo(() => {
    const map = new Map<string, OrgAppLicense>();
    for (const lic of licenses) map.set(lic.app_slug, lic);
    return map;
  }, [licenses]);

  const reload = async () => {
    const [organization, appRows, licRows, memRows, invRows] = await Promise.all([
      getOrganization(orgId),
      listApps(),
      listLicenses(orgId),
      listMemberships(orgId),
      listInvitations(orgId),
    ]);
    setOrg(organization);
    setApps(appRows);
    setLicenses(licRows);
    setMembers(memRows);
    setInvites(invRows);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load org');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const onInvite = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createInvitation({ orgId, email, role });
      toast.success('Invitation created');
      setEmail('');
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invite failed');
    }
  };

  const onLaunch = async (app: AppCatalogItem) => {
    setLaunching(app.slug);
    try {
      const url = await launchSso(orgId, app);
      window.open(url, '_blank', 'noopener,noreferrer');
      toast.success(`Launching ${app.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'SSO launch failed');
    } finally {
      setLaunching(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-ink-muted">Organization not found (or RLS blocked).</p>
        <Link to="/organizations" className="mt-4 inline-block text-accent-deep hover:underline">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pcc-enter">
      <div>
        <Link to="/organizations" className="text-sm text-ink-muted hover:text-ink">
          ← Organizations
        </Link>
        <h1 className="mt-2 font-display text-3xl tracking-tight">{org.name}</h1>
        <p className="mt-1 font-mono text-xs text-ink-muted">
          slug=<span className="text-ink">{org.slug}</span> · org_id=
          <span className="text-ink">{org.id}</span>
        </p>
      </div>

      <section>
        <h2 className="text-lg font-semibold">SSO launch</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Uses <code className="font-mono text-xs">create_sso_ticket(org_id, app_slug)</code>. Disabled
          when not entitled or app has no base_url.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {apps.map((app) => {
            const lic = licenseByApp.get(app.slug);
            const entitled = lic ? isEntitledNow(lic) : false;
            const canLaunch = entitled && Boolean(app.base_url) && app.status === 'available';
            return (
              <div
                key={app.slug}
                className="rounded-xl border border-surface-line bg-surface-raised p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{app.name}</p>
                    <p className="text-xs text-ink-muted">{app.tagline}</p>
                    <p className="mt-2 font-mono text-[11px] text-ink-muted">
                      {lic
                        ? `${lic.status}${lic.trial_ends_at ? ` · trial ${new Date(lic.trial_ends_at).toLocaleString()}` : ''}`
                        : 'no license'}
                      {entitled ? ' · entitled' : ' · not entitled'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!canLaunch || launching === app.slug}
                    onClick={() => onLaunch(app)}
                    className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {launching === app.slug ? '…' : 'Open'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Members ({members.length})</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {members.map((m) => (
            <li
              key={`${m.org_id}-${m.user_id}`}
              className="rounded-lg border border-surface-line bg-surface-raised px-3 py-2 font-mono text-xs"
            >
              {m.user_id} · {m.role} · {m.status}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Invite member</h2>
        <form onSubmit={onInvite} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            required
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border border-surface-line px-3 py-2 text-sm"
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
            Create invite
          </button>
        </form>
        <ul className="mt-4 space-y-2 text-sm">
          {invites.map((inv) => (
            <li
              key={inv.id}
              className="rounded-lg border border-surface-line bg-surface-raised px-3 py-2"
            >
              {inv.email} · {inv.role} · {inv.status}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
