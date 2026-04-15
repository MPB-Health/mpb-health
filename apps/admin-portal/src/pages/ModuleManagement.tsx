import React, { useState, useEffect } from 'react';
import { useAdmin } from '../contexts/AdminContext';
import type {
  ProductModule,
  OrgModuleLicenseWithModule,
  OrgLicenseSummary,
} from '@mpbhealth/licensing';
import { licensingService } from '@mpbhealth/licensing';

type TabId = 'modules' | 'features' | 'tenants';

export default function ModuleManagement() {
  const { user } = useAdmin();
  const orgId = user?.org_id;
  const [activeTab, setActiveTab] = useState<TabId>('modules');
  const [modules, setModules] = useState<ProductModule[]>([]);
  const [licenses, setLicenses] = useState<OrgModuleLicenseWithModule[]>([]);
  const [summary, setSummary] = useState<OrgLicenseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [orgId]);

  async function loadData() {
    if (!orgId) return;
    try {
      setLoading(true);
      const [allModules, orgLicenses, orgSummary] = await Promise.all([
        licensingService.getAvailableModules({ includePrivate: true }),
        licensingService.getOrgLicenses(orgId),
        licensingService.getOrgLicenseSummary(orgId),
      ]);
      setModules(allModules);
      setLicenses(orgLicenses);
      setSummary(orgSummary);
    } catch (err) {
      console.error('Failed to load module data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleActivateModule(moduleSlug: string) {
    if (!orgId) return;
    try {
      await licensingService.activateModule({
        org_id: orgId,
        module_slug: moduleSlug as any,
        license_source: 'addon',
      });
      await loadData();
    } catch (err) {
      console.error('Failed to activate module:', err);
    }
  }

  async function handleDeactivateModule(moduleSlug: string) {
    if (!orgId) return;
    try {
      await licensingService.deactivateModule(orgId, moduleSlug as any);
      await loadData();
    } catch (err) {
      console.error('Failed to deactivate module:', err);
    }
  }

  const licensedSlugs = new Set(licenses.map(l => l.module?.slug));

  const tabs: { id: TabId; label: string }[] = [
    { id: 'modules', label: 'Product Modules' },
    { id: 'features', label: 'Feature Flags' },
    { id: 'tenants', label: 'Tenant Overview' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Module Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage product modules, feature flags, and tenant licensing
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(mod => {
            const isLicensed = licensedSlugs.has(mod.slug);
            return (
              <div
                key={mod.id}
                className={`rounded-xl border p-6 transition-all ${
                  isLicensed
                    ? 'border-teal-200 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-900/20'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: mod.color || '#1a5c5c' }}
                  >
                    {mod.icon ? mod.name.charAt(0) : '📦'}
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      mod.category === 'core'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : mod.category === 'addon'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    }`}
                  >
                    {mod.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {mod.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {mod.description}
                </p>
                {mod.addon_price_monthly && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    <span className="text-xl font-bold text-teal-600">
                      ${mod.addon_price_monthly}
                    </span>
                    <span className="text-gray-400">/mo</span>
                  </p>
                )}
                <div className="flex items-center gap-2">
                  {isLicensed ? (
                    <>
                      <span className="flex items-center gap-1 text-sm text-teal-600 dark:text-teal-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        Active
                      </span>
                      {!mod.included_in_core && (
                        <button
                          onClick={() => handleDeactivateModule(mod.slug)}
                          className="ml-auto text-sm text-red-500 hover:text-red-700"
                        >
                          Deactivate
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleActivateModule(mod.slug)}
                      className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Activate Module
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'features' && summary && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {summary.features.map((f: { slug: string; name: string; category: string; source: string }) => (
                <tr key={f.slug}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {f.name}
                    </div>
                    <div className="text-xs text-gray-400">{f.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {f.category || '--'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {f.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center gap-1 text-sm text-teal-600">
                      <span className="w-2 h-2 rounded-full bg-teal-500" />
                      Enabled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tenants' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏢</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Tenant Management
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            View and manage all tenant organizations, their subscriptions, and module
            licenses from this centralized dashboard. Provision new tenants, adjust
            plans, and monitor usage across the entire SaaS platform.
          </p>
        </div>
      )}
    </div>
  );
}
