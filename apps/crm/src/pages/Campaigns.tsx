import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  Calendar,
  DollarSign,
  Users,
  Target,
  TrendingUp,
  Megaphone,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { PermissionGate } from '../components/PermissionGate';
import { AddCampaignModal } from '../components/AddCampaignModal';
import type { CampaignWithRelations, CampaignFilters, CampaignStatus, CampaignType } from '@mpbhealth/crm-core';

const statusColors: Record<CampaignStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700' },
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  paused: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  completed: { bg: 'bg-purple-100', text: 'text-purple-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
};

const typeLabels: Record<CampaignType, string> = {
  email: 'Email',
  social: 'Social Media',
  event: 'Event',
  webinar: 'Webinar',
  advertisement: 'Advertisement',
  referral: 'Referral',
  other: 'Other',
};

export default function Campaigns() {
  const { campaignService } = useCRM();
  const [campaigns, setCampaigns] = useState<CampaignWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CampaignFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const pageSize = 20;

  // Stats
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalBudget: 0,
    totalMembers: 0,
  });

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    const { campaigns, total } = await campaignService.getCampaigns(filters, pageSize, page * pageSize);
    setCampaigns(campaigns);
    setTotal(total);

    // Calculate stats from all campaigns
    const activeCampaigns = await campaignService.getActiveCampaigns();
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalMembers = campaigns.reduce((sum, c) => sum + (c.members_count || 0), 0);

    setStats({
      totalCampaigns: total,
      activeCampaigns: activeCampaigns.length,
      totalBudget,
      totalMembers,
    });

    setLoading(false);
  }, [campaignService, filters, page]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status: status as CampaignStatus || undefined }));
    setPage(0);
  };

  const handleTypeFilter = (type: string) => {
    setFilters((prev) => ({ ...prev, campaign_type: type as CampaignType || undefined }));
    setPage(0);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Campaigns</h1>
          <p className="text-th-text-tertiary text-sm mt-1">{total} total campaigns</p>
        </div>
        <PermissionGate permission="campaigns.write">
          <button
            onClick={() => setShowAddCampaign(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Campaign</span>
          </button>
        </PermissionGate>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Total Campaigns</p>
              <p className="text-xl font-semibold text-th-text-primary">{stats.totalCampaigns}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Active Campaigns</p>
              <p className="text-xl font-semibold text-th-text-primary">{stats.activeCampaigns}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Total Budget</p>
              <p className="text-xl font-semibold text-th-text-primary">
                {formatCurrency(stats.totalBudget)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Total Members</p>
              <p className="text-xl font-semibold text-th-text-primary">{stats.totalMembers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px] flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Type filter */}
          <div className="relative">
            <select
              value={filters.campaign_type || ''}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Types</option>
              <option value="email">Email</option>
              <option value="social">Social Media</option>
              <option value="event">Event</option>
              <option value="webinar">Webinar</option>
              <option value="advertisement">Advertisement</option>
              <option value="referral">Referral</option>
              <option value="other">Other</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* More filters button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'border-th-accent-500 text-th-accent-700 bg-th-accent-50'
                : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>More</span>
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-th-border grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Budget range */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Min Budget
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minBudget || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    minBudget: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Max Budget
              </label>
              <input
                type="number"
                placeholder="Any"
                value={filters.maxBudget || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxBudget: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Date range */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Start Date From
              </label>
              <input
                type="date"
                value={filters.startDateFrom || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDateFrom: e.target.value || undefined }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Start Date To
              </label>
              <input
                type="date"
                value={filters.startDateTo || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDateTo: e.target.value || undefined }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                End Date From
              </label>
              <input
                type="date"
                value={filters.endDateFrom || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDateFrom: e.target.value || undefined }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                End Date To
              </label>
              <input
                type="date"
                value={filters.endDateTo || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDateTo: e.target.value || undefined }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Campaigns table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <Megaphone className="w-12 h-12 mb-4 opacity-50" />
            <p>No campaigns found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new campaign</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Actual Cost
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Members
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Dates
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {campaigns.map((campaign) => {
                  const statusStyle = statusColors[campaign.status] || statusColors.draft;

                  return (
                    <tr key={campaign.id} className="hover:bg-surface-secondary cursor-pointer">
                      <td className="px-6 py-4">
                        <Link
                          to={`/campaigns/${campaign.id}`}
                          className="block"
                        >
                          <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                            {campaign.name}
                          </p>
                          {campaign.description && (
                            <p className="text-xs text-th-text-tertiary mt-0.5 truncate max-w-xs">
                              {campaign.description}
                            </p>
                          )}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {typeLabels[campaign.campaign_type] || campaign.campaign_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-primary">
                          {formatCurrency(campaign.budget)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {formatCurrency(campaign.actual_cost)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-th-text-secondary">
                          <Users className="w-4 h-4 text-th-text-tertiary" />
                          {campaign.members_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-th-text-secondary">
                          {campaign.start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-th-text-tertiary" />
                              <span>{formatDate(campaign.start_date)}</span>
                            </div>
                          )}
                          {campaign.end_date && (
                            <div className="flex items-center gap-1 text-th-text-tertiary text-xs mt-0.5">
                              <span>to {formatDate(campaign.end_date)}</span>
                            </div>
                          )}
                          {!campaign.start_date && !campaign.end_date && (
                            <span className="text-th-text-tertiary">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-th-border">
                <p className="text-sm text-th-text-tertiary">
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of{' '}
                  {total}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 text-sm border border-th-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 text-sm border border-th-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-secondary"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Campaign Modal */}
      <AddCampaignModal
        open={showAddCampaign}
        onClose={() => setShowAddCampaign(false)}
        onSuccess={() => loadCampaigns()}
      />
    </div>
  );
}
