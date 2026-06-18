import { useCallback, useEffect, useState } from 'react';
import { Building2, Globe, Loader2, Plus, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  tenantAdminService,
  type AdminOrganization,
  type OrgPortalAccessRow,
  type PortalSlug,
} from '@mpbhealth/admin-core';

const PORTAL_LABELS: Record<PortalSlug, string> = {
  admin: 'Admin Portal',
  advisor: 'Advisor Portal',
  concierge: 'Concierge Portal',
  staff_hub: 'Staff Hub',
  crm: 'CRM',
  member: 'Member App',
};

export default function TenantManagement() {
  const [orgs, setOrgs] = useState<AdminOrganization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [portalAccess, setPortalAccess] = useState<OrgPortalAccessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPortal, setSavingPortal] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const list = await tenantAdminService.listOrganizations();
      setOrgs(list);
      if (!selectedOrgId && list.length > 0) {
        setSelectedOrgId(list[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId]);

  const loadPortalAccess = useCallback(async (orgId: string) => {
    try {
      const rows = await tenantAdminService.listPortalAccess(orgId);
      setPortalAccess(rows);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load portal access');
    }
  }, []);

  useEffect(() => {
    void loadOrgs();
  }, [loadOrgs]);

  useEffect(() => {
    if (selectedOrgId) void loadPortalAccess(selectedOrgId);
  }, [selectedOrgId, loadPortalAccess]);

  const selectedOrg = orgs.find((o) => o.id === selectedOrgId) ?? null;

  const handleCreateOrg = async () => {
    if (!newName.trim() || !newSlug.trim()) {
      toast.error('Name and slug are required');
      return;
    }
    setCreating(true);
    try {
      const org = await tenantAdminService.createOrganization({
        name: newName.trim(),
        slug: newSlug.trim(),
      });
      toast.success(`Created ${org.name}`);
      setNewName('');
      setNewSlug('');
      setShowCreate(false);
      setSelectedOrgId(org.id);
      await loadOrgs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const updatePortalRow = (portalSlug: PortalSlug, patch: Partial<OrgPortalAccessRow>) => {
    setPortalAccess((prev) =>
      prev.map((row) => (row.portal_slug === portalSlug ? { ...row, ...patch } : row)),
    );
  };

  const savePortalRow = async (row: OrgPortalAccessRow) => {
    if (!selectedOrgId) return;
    setSavingPortal(row.portal_slug);
    try {
      await tenantAdminService.upsertPortalAccess({
        org_id: selectedOrgId,
        portal_slug: row.portal_slug,
        enabled: row.enabled,
        custom_domain: row.custom_domain,
      });
      toast.success(`${PORTAL_LABELS[row.portal_slug]} saved`);
      await loadPortalAccess(selectedOrgId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSavingPortal(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <Building2 className="h-7 w-7 text-teal-600" />
            Organizations & Tenants
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Command and control for MPB Health, SaudeMAX, and other tenants across advisor, concierge,
            staff hub, and admin portals.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          New organization
        </button>
      </div>

      {showCreate ? (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Create organization</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600 dark:text-gray-400">Company name</span>
              <input
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (!newSlug) setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                placeholder="SaudeMAX"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-gray-600 dark:text-gray-400">Slug</span>
              <input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
                placeholder="saudemax"
              />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={creating}
              onClick={() => void handleCreateOrg()}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-700">
            Organizations
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {orgs.map((org) => (
              <li key={org.id}>
                <button
                  type="button"
                  onClick={() => setSelectedOrgId(org.id)}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                    selectedOrgId === org.id
                      ? 'bg-teal-50 font-semibold text-teal-900 dark:bg-teal-950/40 dark:text-teal-100'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="block truncate">{org.name}</span>
                  <span className="text-xs text-gray-500">{org.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="space-y-4">
          {selectedOrg ? (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  Org ID: <code className="text-xs">{selectedOrg.id}</code>
                </div>
                <h2 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{selectedOrg.name}</h2>
                <p className="text-sm text-gray-500">
                  Tier: {selectedOrg.subscription_tier} · Status: {selectedOrg.subscription_status}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                  <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                    <Globe className="h-5 w-5 text-teal-600" />
                    Portal access & domains
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Enable portals per tenant and map custom domains. Users must belong to this org via
                    org membership.
                  </p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {tenantAdminService.getPortalSlugs().map((slug) => {
                    const row =
                      portalAccess.find((r) => r.portal_slug === slug) ??
                      ({
                        org_id: selectedOrg.id,
                        portal_slug: slug,
                        enabled: false,
                        custom_domain: null,
                        settings: {},
                      } as OrgPortalAccessRow);

                    return (
                      <div key={slug} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                        <div className="min-w-[10rem]">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {PORTAL_LABELS[slug]}
                          </p>
                          <label className="mt-1 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <input
                              type="checkbox"
                              checked={row.enabled}
                              onChange={(e) => updatePortalRow(slug, { enabled: e.target.checked })}
                            />
                            Enabled
                          </label>
                        </div>
                        <input
                          type="text"
                          value={row.custom_domain ?? ''}
                          onChange={(e) => updatePortalRow(slug, { custom_domain: e.target.value || null })}
                          placeholder="concierge.example.com"
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                        />
                        <button
                          type="button"
                          disabled={savingPortal === slug}
                          onClick={() => void savePortalRow(row)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-teal-600 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50 dark:text-teal-300 dark:hover:bg-teal-950/30"
                        >
                          {savingPortal === slug ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Save
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Select an organization to manage portal access.</p>
          )}
        </section>
      </div>
    </div>
  );
}
