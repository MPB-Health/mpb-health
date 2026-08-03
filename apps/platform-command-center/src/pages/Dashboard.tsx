import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { listApps, listInvitations, listLicenses, listOrganizations } from '@/lib/platformApi';
import { isEntitledNow } from '@/lib/types';
import { ACCOUNTS_PROJECT_REF } from '@/lib/accountsClient';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    orgs: 0,
    apps: 0,
    licenses: 0,
    entitled: 0,
    invites: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [orgs, apps, licenses, invites] = await Promise.all([
          listOrganizations(),
          listApps(),
          listLicenses(),
          listInvitations(),
        ]);
        if (cancelled) return;
        setStats({
          orgs: orgs.length,
          apps: apps.length,
          licenses: licenses.length,
          entitled: licenses.filter(isEntitledNow).length,
          invites: invites.filter((i) => i.status === 'pending').length,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
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
      <h1 className="font-display text-3xl tracking-tight">Ecosystem control plane</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-muted">
        Orgs, app catalog, licenses, invitations, and SSO launch — backed by ARYX Accounts (
        <code className="font-mono text-xs">{ACCOUNTS_PROJECT_REF}</code>). Product SoTs
        (CRM, EnrollFlow, MPB ops) stay in their own databases.
      </p>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Organizations', value: stats.orgs, to: '/organizations' },
            { label: 'Apps', value: stats.apps, to: '/apps' },
            { label: 'Entitled licenses', value: `${stats.entitled}/${stats.licenses}`, to: '/licenses' },
            { label: 'Pending invites', value: stats.invites, to: '/invitations' },
          ].map((card) => (
            <Link
              key={card.label}
              to={card.to}
              className="rounded-xl border border-surface-line bg-surface-raised p-5 transition hover:border-accent/40"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {card.label}
              </p>
              <p className="mt-2 font-display text-3xl">{card.value}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
