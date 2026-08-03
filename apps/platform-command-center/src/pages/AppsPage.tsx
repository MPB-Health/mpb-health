import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { listApps } from '@/lib/platformApi';
import type { AppCatalogItem } from '@/lib/types';

export default function AppsPage() {
  const [apps, setApps] = useState<AppCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listApps();
        if (!cancelled) setApps(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load apps');
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
      <h1 className="font-display text-3xl tracking-tight">App catalog</h1>
      <p className="mt-2 text-sm text-ink-muted">
        From Accounts <code className="font-mono text-xs">apps</code>. Billing is out of scope for
        v1.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {apps.map((app, i) => (
          <article
            key={app.slug}
            className="pcc-enter-delay rounded-xl border border-surface-line bg-surface-raised p-5"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{app.name}</h2>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                {app.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">{app.tagline}</p>
            <p className="mt-3 font-mono text-xs text-ink-muted">slug={app.slug}</p>
            <p className="mt-1 break-all font-mono text-xs text-ink-muted">
              {app.base_url ?? 'base_url not set'}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
