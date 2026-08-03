import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { listLicenses, listOrganizations } from '@/lib/platformApi';
import type { Organization, OrgAppLicense } from '@/lib/types';
import { isEntitledNow } from '@/lib/types';

export default function LicensesPage() {
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<OrgAppLicense[]>([]);
  const [orgs, setOrgs] = useState<Record<string, Organization>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [licRows, orgRows] = await Promise.all([listLicenses(), listOrganizations()]);
        if (cancelled) return;
        setLicenses(licRows);
        setOrgs(Object.fromEntries(orgRows.map((o) => [o.id, o])));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load licenses');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pcc-enter">
      <h1 className="font-display text-3xl tracking-tight">Licenses</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Entitlement mirrors Accounts <code className="font-mono text-xs">org_has_app</code>: status
        in (active, trialing) and trial not expired. Status alone can still say{' '}
        <code className="font-mono text-xs">trialing</code> after expiry.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-surface-line bg-surface-raised">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-surface-line bg-surface text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Org</th>
              <th className="px-4 py-3 font-medium">App</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Trial ends</th>
              <th className="px-4 py-3 font-medium">Entitled</th>
            </tr>
          </thead>
          <tbody>
            {licenses.map((lic) => {
              const org = orgs[lic.org_id];
              const entitled = isEntitledNow(lic);
              return (
                <tr key={lic.id} className="border-b border-surface-line last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      to={`/organizations/${lic.org_id}`}
                      className="font-medium text-accent-deep hover:underline"
                    >
                      {org?.name ?? lic.org_id}
                    </Link>
                    <div className="font-mono text-[11px] text-ink-muted">{org?.slug}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{lic.app_slug}</td>
                  <td className="px-4 py-3">{lic.status}</td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {lic.trial_ends_at ? new Date(lic.trial_ends_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        entitled
                          ? 'rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-deep'
                          : 'rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700'
                      }
                    >
                      {entitled ? 'yes' : 'no'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
