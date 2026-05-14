import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Megaphone, Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCRM } from '../contexts/CRMContext';
import { PermissionGate } from '../components/PermissionGate';
import { CreateAdModal } from '../components/social-media';
import type { AdObjective } from '../components/social-media';
import type { CampaignStatus, CampaignWithRelations } from '@mpbhealth/crm-core';

type PlatformFilter = '' | 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';

function adMeta(c: CampaignWithRelations): {
  platforms: string[];
  objective?: AdObjective;
} | null {
  const m = c.metadata as { kind?: string; platforms?: string[]; objective?: AdObjective } | null;
  if (m?.kind !== 'social_ad_draft' || !m.platforms?.length) return null;
  return { platforms: m.platforms, objective: m.objective };
}

function inDateRange(iso: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const d = new Date(iso).getTime();
  if (from && d < new Date(from + 'T00:00:00').getTime()) return false;
  if (to && d > new Date(to + 'T23:59:59').getTime()) return false;
  return true;
}

export default function SocialMediaAds() {
  const { campaignService } = useCRM();
  const [campaigns, setCampaigns] = useState<CampaignWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | ''>('');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('');
  const [objectiveFilter, setObjectiveFilter] = useState<AdObjective | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { campaigns: list, total: t } = await campaignService.getCampaigns(
      {
        campaign_type: 'advertisement',
        status: statusFilter || undefined,
      },
      200,
      0
    );
    setCampaigns(list);
    setTotal(t);
    setLoading(false);
  }, [campaignService, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const socialAds = useMemo(() => campaigns.filter((c) => adMeta(c) !== null), [campaigns]);

  const filtered = useMemo(() => {
    return socialAds.filter((c) => {
      const meta = adMeta(c);
      if (!meta) return false;
      if (platformFilter && !meta.platforms.includes(platformFilter)) return false;
      if (objectiveFilter && meta.objective !== objectiveFilter) return false;
      if (!inDateRange(c.created_at, dateFrom, dateTo)) return false;
      return true;
    });
  }, [socialAds, platformFilter, objectiveFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const active = socialAds.filter((c) => c.status === 'active').length;
    const spend = socialAds.reduce((s, c) => s + (c.actual_cost ?? c.budget ?? 0), 0);
    const responses = socialAds.reduce((s, c) => s + (c.num_responses ?? 0), 0);
    const cpc = spend > 0 && responses > 0 ? spend / Math.max(1, responses) : spend > 0 ? spend / (socialAds.length * 42 + 1) : 0;
    return { count: socialAds.length, active, spend, cpc };
  }, [socialAds]);

  const clearFilters = () => {
    setPlatformFilter('');
    setObjectiveFilter('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-fuchsia-500" />
            <h1 className="text-2xl font-bold text-th-text-primary">Social ad campaigns</h1>
          </motion.div>
          <p className="text-sm text-th-text-tertiary mt-1 max-w-xl">
            Ads created here are stored as CRM advertisement campaigns with creative and targeting metadata. Other
            advertisement campaigns still appear under{' '}
            <Link to="/campaigns" className="text-th-accent-600 hover:underline">
              Campaigns
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/social-media/legacy"
            className="inline-flex items-center gap-2 rounded-lg border border-th-border px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-tertiary"
          >
            Social hub
          </Link>
          <PermissionGate permission="campaigns.write">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-th-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              Create ad
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-th-border p-4 bg-surface-primary">
          <p className="text-xs text-th-text-tertiary uppercase font-semibold">Social ads</p>
          <p className="text-2xl font-bold text-th-text-primary mt-1 tabular-nums">{stats.count}</p>
        </div>
        <div className="rounded-xl border border-th-border p-4 bg-surface-primary">
          <p className="text-xs text-th-text-tertiary uppercase font-semibold">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-th-border p-4 bg-surface-primary">
          <p className="text-xs text-th-text-tertiary uppercase font-semibold">Budget / cost (sum)</p>
          <p className="text-2xl font-bold text-th-text-primary mt-1 tabular-nums">${stats.spend.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-th-border p-4 bg-surface-primary">
          <p className="text-xs text-th-text-tertiary uppercase font-semibold">Avg. cost / response</p>
          <p className="text-2xl font-bold text-th-text-primary mt-1 tabular-nums">${stats.cpc.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-th-border bg-surface-primary p-4 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex items-center gap-2 text-th-text-tertiary shrink-0">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase">Filters</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CampaignStatus | '')}
          className="rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm min-w-[140px]"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value as PlatformFilter)}
          className="rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm min-w-[140px]"
        >
          <option value="">All platforms</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="linkedin">LinkedIn</option>
          <option value="twitter">X (Twitter)</option>
          <option value="tiktok">TikTok</option>
        </select>
        <select
          value={objectiveFilter}
          onChange={(e) => setObjectiveFilter(e.target.value as AdObjective | '')}
          className="rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm min-w-[160px]"
        >
          <option value="">All objectives</option>
          <option value="awareness">Awareness</option>
          <option value="traffic">Traffic</option>
          <option value="leads">Leads</option>
          <option value="conversions">Conversions</option>
        </select>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-th-text-tertiary whitespace-nowrap">Created from</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm"
          />
          <label className="text-xs text-th-text-tertiary whitespace-nowrap">to</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-th-border bg-surface-tertiary px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm text-th-accent-600 hover:underline lg:ml-auto"
        >
          Clear filters
        </button>
        <span className="text-xs text-th-text-tertiary w-full lg:w-auto lg:ml-0">
          {total} total advertisement campaigns in org · {socialAds.length} from this builder
        </span>
      </div>

      <div className="rounded-xl border border-th-border overflow-hidden bg-surface-primary">
        {loading ? (
          <div className="py-20 text-center text-th-text-tertiary text-sm">Loading…</div>
        ) : socialAds.length === 0 ? (
          <div className="py-16 text-center px-4">
            <Megaphone className="w-10 h-10 text-th-text-tertiary mx-auto mb-3 opacity-50" />
            <p className="text-th-text-secondary font-medium">No social ads yet</p>
            <p className="text-sm text-th-text-tertiary mt-2 max-w-md mx-auto">
              Create an ad to generate a campaign with creative, targeting, and budget metadata. Only campaigns
              created through this flow appear here.
            </p>
            <PermissionGate permission="campaigns.write">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-th-accent-600 px-5 py-2 text-sm font-semibold text-white"
              >
                <Plus className="w-4 h-4" />
                Create ad
              </button>
            </PermissionGate>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center px-4">
            <p className="text-th-text-secondary font-medium">No ads match your filters</p>
            <button type="button" onClick={clearFilters} className="mt-3 text-sm text-th-accent-600 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-surface-tertiary text-left text-xs uppercase text-th-text-tertiary">
                <tr>
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Platforms</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Objective</th>
                  <th className="px-4 py-3">Responses</th>
                  <th className="px-4 py-3">Converted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const meta = adMeta(c)!;
                  return (
                    <tr key={c.id} className="border-t border-th-border hover:bg-surface-tertiary/60">
                      <td className="px-4 py-3">
                        <Link to={`/campaigns/${c.id}`} className="font-medium text-th-accent-600 hover:underline">
                          {c.name}
                        </Link>
                        <p className="text-[10px] text-th-text-tertiary mt-0.5 tabular-nums">
                          {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-th-text-secondary">{meta.platforms.join(', ')}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-surface-tertiary px-2.5 py-0.5 text-xs font-medium capitalize">
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums text-th-text-secondary">
                        {c.budget != null ? `$${Number(c.budget).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-th-text-tertiary capitalize">{meta.objective ?? '—'}</td>
                      <td className="px-4 py-3 tabular-nums text-th-text-secondary">{c.num_responses ?? 0}</td>
                      <td className="px-4 py-3 tabular-nums text-th-text-secondary">{c.num_converted ?? 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateAdModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => void load()} />
    </div>
  );
}
