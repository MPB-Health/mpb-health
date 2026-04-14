import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  DollarSign,
  TrendingUp,
  Target,
  Building2,
  Calendar,
  User,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { PermissionGate } from '../components/PermissionGate';
import { AddDealModal } from '../components/AddDealModal';
import { GradientHeader } from '@mpbhealth/ui';
import type { DealWithRelations, DealFilters, AccountWithRelations } from '@mpbhealth/crm-core';

export default function Deals() {
  const { dealService, accountService, dealStages } = useCRM();
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DealFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const pageSize = 20;

  // For filter dropdowns
  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);

  // Pipeline stats
  const [pipelineStats, setPipelineStats] = useState({
    totalDeals: 0,
    totalValue: 0,
    weightedValue: 0,
  });

  const loadDeals = useCallback(async () => {
    setLoading(true);
    const [{ deals, total }, stats] = await Promise.all([
      dealService.getDeals(filters, pageSize, page * pageSize),
      dealService.getPipelineStats(),
    ]);
    setDeals(deals);
    setTotal(total);
    setPipelineStats(stats);
    setLoading(false);
  }, [dealService, filters, page]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  // Load accounts for filter
  useEffect(() => {
    accountService.getAccounts({}, 100, 0).then(({ accounts }) => setAccounts(accounts));
  }, [accountService]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleStageFilter = (stageId: string) => {
    setFilters((prev) => ({ ...prev, stage_id: stageId || undefined }));
    setPage(0);
  };

  const handleAccountFilter = (accountId: string) => {
    setFilters((prev) => ({ ...prev, account_id: accountId || undefined }));
    setPage(0);
  };

  const handleDealTypeFilter = (dealType: string) => {
    setFilters((prev) => ({ ...prev, deal_type: dealType || undefined }));
    setPage(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <GradientHeader
        title="Deals"
        subtitle={`${total} total deals`}
        icon={<DollarSign className="w-5 h-5" />}
        size="sm"
        actions={
          <PermissionGate permission="deals.write">
            <button
              onClick={() => setShowAddDeal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-xl text-sm font-medium text-white hover:bg-th-accent-700 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Deal</span>
            </button>
          </PermissionGate>
        }
      />

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Total Deals</p>
              <p className="text-xl font-semibold text-th-text-primary">{pipelineStats.totalDeals}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Total Value</p>
              <p className="text-xl font-semibold text-th-text-primary">
                {formatCurrency(pipelineStats.totalValue)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Weighted Value</p>
              <p className="text-xl font-semibold text-th-text-primary">
                {formatCurrency(pipelineStats.weightedValue)}
              </p>
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
              placeholder="Search deals..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          {/* Stage filter */}
          <div className="relative">
            <select
              value={filters.stage_id || ''}
              onChange={(e) => handleStageFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Stages</option>
              {dealStages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.display_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Account filter */}
          <div className="relative">
            <select
              value={filters.account_id || ''}
              onChange={(e) => handleAccountFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Deal type filter */}
          <div className="relative">
            <select
              value={filters.deal_type || ''}
              onChange={(e) => handleDealTypeFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Types</option>
              <option value="new_business">New Business</option>
              <option value="existing_business">Existing Business</option>
              <option value="renewal">Renewal</option>
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
            {/* Amount range */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Min Amount
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minAmount || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Max Amount
              </label>
              <input
                type="number"
                placeholder="Any"
                value={filters.maxAmount || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Close date range */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Close Date From
              </label>
              <input
                type="date"
                value={filters.closeFrom || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, closeFrom: e.target.value || undefined }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Close Date To
              </label>
              <input
                type="date"
                value={filters.closeTo || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, closeTo: e.target.value || undefined }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {/* Include closed deals */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.includeWon || false}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, includeWon: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-th-border"
                />
                <span className="text-sm text-th-text-secondary">Include Won</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.includeLost || false}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, includeLost: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-th-border"
                />
                <span className="text-sm text-th-text-secondary">Include Lost</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Deals table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <p>No deals found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Deal
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Account
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Close Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Owner
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {deals.map((deal) => {
                  const isOverdue =
                    deal.expected_close_date &&
                    new Date(deal.expected_close_date) < new Date() &&
                    !deal.won_at &&
                    !deal.lost_at;

                  return (
                    <tr key={deal.id} className="hover:bg-surface-secondary cursor-pointer">
                      <td className="px-6 py-4">
                        <Link
                          to={`/deals/${deal.id}`}
                          className="text-sm font-medium text-th-text-primary hover:text-th-accent-600"
                        >
                          {deal.name}
                        </Link>
                        {deal.deal_type && (
                          <p className="text-xs text-th-text-tertiary mt-0.5 capitalize">
                            {deal.deal_type.replace('_', ' ')}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {deal.account ? (
                          <div className="flex items-center gap-2 text-sm text-th-text-secondary">
                            <Building2 className="w-4 h-4 text-th-text-tertiary" />
                            {deal.account.name}
                          </div>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-th-text-primary">
                          {deal.amount
                            ? formatCurrency(deal.amount)
                            : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${deal.stage?.color || '#6B7280'}20`,
                            color: deal.stage?.color || '#6B7280',
                          }}
                        >
                          {deal.stage?.display_name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {deal.expected_close_date ? (
                          <div
                            className={`flex items-center gap-1 text-sm ${
                              isOverdue ? 'text-red-600' : 'text-th-text-secondary'
                            }`}
                          >
                            <Calendar className="w-4 h-4" />
                            {new Date(deal.expected_close_date).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {deal.owner_id ? (
                          <div className="w-8 h-8 bg-th-accent-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-th-accent-700" />
                          </div>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

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

      {/* Add Deal Modal */}
      <AddDealModal
        open={showAddDeal}
        onClose={() => setShowAddDeal(false)}
        onSuccess={() => loadDeals()}
      />
    </div>
  );
}
