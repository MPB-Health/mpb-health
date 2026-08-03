import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { createOrganization, listOrganizations } from '@/lib/platformApi';
import type { Organization } from '@/lib/types';

export default function Organizations() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);

  const reload = async () => {
    const data = await listOrganizations();
    setOrgs(data);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await reload();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load orgs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createOrganization(name, slug);
      toast.success('Organization created');
      setName('');
      setSlug('');
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pcc-enter">
      <h1 className="font-display text-3xl tracking-tight">Organizations</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Canonical Accounts org id + slug. Pass <code className="font-mono text-xs">org_id</code>{' '}
        across products — never rely on slug alone for entitlement.
      </p>

      <form
        onSubmit={onCreate}
        className="mt-6 grid gap-3 rounded-xl border border-surface-line bg-surface-raised p-4 sm:grid-cols-[1fr_1fr_auto]"
      >
        <input
          required
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-surface-line px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="slug (Accounts canonical)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          pattern="[a-z0-9-]+"
          className="rounded-lg border border-surface-line px-3 py-2 font-mono text-sm"
        />
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-deep disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-xl border border-surface-line bg-surface-raised">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-surface-line bg-surface text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Org ID</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-b border-surface-line last:border-0">
                <td className="px-4 py-3">
                  <Link className="font-medium text-accent-deep hover:underline" to={`/organizations/${org.id}`}>
                    {org.name}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{org.slug}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">{org.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
