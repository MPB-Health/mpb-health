import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  DollarSign,
  FileText,
  Building2,
  Calendar,
  Briefcase,
  BarChart3,
  Zap,
  ArrowLeftRight,
  TrendingUp,
  CheckSquare,
  Layout,
  ShieldCheck,
  Clock,
  Brain,
  Target,
  History,
  Download,
} from 'lucide-react';
import {
  QuoteAnalyticsModal,
  QuoteVelocityModal,
  QuoteComparisonModal,
  QuoteForecastModal,
  BulkQuoteActionModal,
  QuoteTemplateModal,
  QuoteApprovalModal,
  QuoteExpiryTrackerModal,
  QuotePricingOptimizerModal,
  QuoteWinProbabilityModal,
  QuoteRevisionHistoryModal,
  QuoteExportBuilderModal,
} from '../components/quotes';
import toast from 'react-hot-toast';
import { HelpBanner } from '../components/help';
import { useCRM } from '../contexts/CRMContext';
import { useOrg } from '../contexts/OrgContext';
import { PermissionGate } from '../components/PermissionGate';
import { Modal } from '../components/Modal';
import { logAuditEvent, AUDIT_ACTIONS } from '@mpbhealth/auth';
import type {
  QuoteWithRelations,
  QuoteFilters,
  QuoteStatus,
  AccountWithRelations,
  DealWithRelations,
} from '@mpbhealth/crm-core';

const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

const QUOTE_STATUSES: { value: QuoteStatus | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
  { value: 'revised', label: 'Revised' },
];

function getStatusColor(status: QuoteStatus): { bg: string; text: string } {
  switch (status) {
    case 'draft':
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
    case 'pending':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    case 'sent':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'accepted':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'rejected':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    case 'expired':
      return { bg: 'bg-orange-100', text: 'text-orange-700' };
    case 'revised':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

export default function Quotes() {
  const { quoteService, accountService, dealService } = useCRM();
  const { activeOrgId } = useOrg();

  const [quotes, setQuotes] = useState<QuoteWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<QuoteFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddQuote, setShowAddQuote] = useState(false);
  const pageSize = 20;

  // Power modal state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showVelocity, setShowVelocity] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [showExpiryTracker, setShowExpiryTracker] = useState(false);
  const [showPricingOptimizer, setShowPricingOptimizer] = useState(false);
  const [showWinProbability, setShowWinProbability] = useState(false);
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);
  const [showExportBuilder, setShowExportBuilder] = useState(false);

  const TOOLBAR_ACTIONS = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-blue-500', action: () => setShowAnalytics(true) },
    { id: 'velocity', label: 'Velocity', icon: Zap, color: 'text-green-500', action: () => setShowVelocity(true) },
    { id: 'compare', label: 'Compare', icon: ArrowLeftRight, color: 'text-violet-500', action: () => setShowComparison(true) },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp, color: 'text-amber-500', action: () => setShowForecast(true) },
    { id: 'bulk', label: 'Bulk Actions', icon: CheckSquare, color: 'text-pink-500', action: () => setShowBulkActions(true) },
    { id: 'templates', label: 'Templates', icon: Layout, color: 'text-cyan-500', action: () => setShowTemplates(true) },
    { id: 'approval', label: 'Approvals', icon: ShieldCheck, color: 'text-emerald-500', action: () => setShowApproval(true) },
    { id: 'expiry', label: 'Expiry', icon: Clock, color: 'text-red-500', action: () => setShowExpiryTracker(true) },
    { id: 'pricing', label: 'AI Pricing', icon: Brain, color: 'text-fuchsia-500', action: () => setShowPricingOptimizer(true) },
    { id: 'winprob', label: 'Win Prob', icon: Target, color: 'text-teal-500', action: () => setShowWinProbability(true) },
    { id: 'revisions', label: 'Revisions', icon: History, color: 'text-orange-500', action: () => setShowRevisionHistory(true) },
    { id: 'export', label: 'Export', icon: Download, color: 'text-indigo-500', action: () => setShowExportBuilder(true) },
  ];

  // For filter dropdowns
  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);
  const [deals, setDeals] = useState<DealWithRelations[]>([]);

  // Stats
  const [stats, setStats] = useState({
    totalQuotes: 0,
    totalValue: 0,
    pendingValue: 0,
    acceptedValue: 0,
  });

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    const { quotes, total } = await quoteService.getQuotes(filters, pageSize, page * pageSize);
    setQuotes(quotes);
    setTotal(total);

    // Calculate stats
    const allQuotes = await quoteService.getQuotes({}, 1000, 0);
    const pendingQuotes = allQuotes.quotes.filter(
      (q) => q.status === 'sent' || q.status === 'pending'
    );
    const acceptedQuotes = allQuotes.quotes.filter((q) => q.status === 'accepted');

    setStats({
      totalQuotes: allQuotes.total,
      totalValue: allQuotes.quotes.reduce((sum, q) => sum + (q.total || 0), 0),
      pendingValue: pendingQuotes.reduce((sum, q) => sum + (q.total || 0), 0),
      acceptedValue: acceptedQuotes.reduce((sum, q) => sum + (q.total || 0), 0),
    });

    setLoading(false);
  }, [quoteService, filters, page]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Load accounts and deals for filters
  useEffect(() => {
    Promise.all([
      accountService.getAccounts({}, 100, 0),
      dealService.getDeals({}, 100, 0),
    ]).then(([accountsResult, dealsResult]) => {
      setAccounts(accountsResult.accounts);
      setDeals(dealsResult.deals);
    });
  }, [accountService, dealService]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status: (status as QuoteStatus) || undefined }));
    setPage(0);
  };

  const handleAccountFilter = (accountId: string) => {
    setFilters((prev) => ({ ...prev, account_id: accountId || undefined }));
    setPage(0);
  };

  const handleDealFilter = (dealId: string) => {
    setFilters((prev) => ({ ...prev, deal_id: dealId || undefined }));
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Quotes</h1>
          <p className="text-th-text-tertiary text-sm mt-1">{total} total quotes</p>
        </div>
        <PermissionGate permission="quotes.write">
          <button
            onClick={() => setShowAddQuote(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Quote</span>
          </button>
        </PermissionGate>
      </div>

      <HelpBanner pageKey="quotes" title="Welcome to Quotes" tip="Create professional quotes for your clients. Add products, set pricing, and send quotes directly from the CRM. Track quote status from draft to accepted." />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Total Quotes</p>
              <p className="text-xl font-semibold text-th-text-primary">{stats.totalQuotes}</p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Total Value</p>
              <p className="text-xl font-semibold text-th-text-primary">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Pending Value</p>
              <p className="text-xl font-semibold text-th-text-primary">
                {formatCurrency(stats.pendingValue)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface-primary rounded-xl border border-th-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-th-text-tertiary">Accepted Value</p>
              <p className="text-xl font-semibold text-th-text-primary">
                {formatCurrency(stats.acceptedValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Power Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-th-border bg-surface-primary p-2">
        {TOOLBAR_ACTIONS.map((a) => (
          <button key={a.id} onClick={a.action} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-th-text-secondary hover:text-th-text-primary hover:bg-surface-tertiary/80 transition-colors">
            <a.icon className={cn('w-3.5 h-3.5', a.color)} />
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[250px] flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
            <input
              type="text"
              placeholder="Search quotes by name or number..."
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
              {QUOTE_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
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

          {/* Deal filter */}
          <div className="relative">
            <select
              value={filters.deal_id || ''}
              onChange={(e) => handleDealFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Deals</option>
              {deals.map((deal) => (
                <option key={deal.id} value={deal.id}>
                  {deal.name}
                </option>
              ))}
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
          <div className="mt-4 pt-4 border-t border-th-border grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Min Total */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Min Total
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minTotal || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    minTotal: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {/* Max Total */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Max Total
              </label>
              <input
                type="number"
                placeholder="Any"
                value={filters.maxTotal || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    maxTotal: e.target.value ? parseFloat(e.target.value) : undefined,
                  }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {/* Valid From */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Valid From
              </label>
              <input
                type="date"
                value={filters.validFrom || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, validFrom: e.target.value || undefined }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            {/* Valid To */}
            <div>
              <label className="block text-sm font-medium text-th-text-secondary mb-1">
                Valid To
              </label>
              <input
                type="date"
                value={filters.validTo || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, validTo: e.target.value || undefined }))
                }
                className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Quotes table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <FileText className="w-12 h-12 mb-3 opacity-50" />
            <p>No quotes found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new quote</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Quote
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Account
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Deal
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Valid Until
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {quotes.map((quote) => {
                  const statusColors = getStatusColor(quote.status);
                  const expired = isExpired(quote.valid_until) && quote.status !== 'accepted';

                  return (
                    <tr key={quote.id} className="hover:bg-surface-secondary">
                      <td className="px-6 py-4">
                        <Link
                          to={`/quotes/legacy/${quote.id}`}
                          className="block"
                        >
                          <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                            {quote.name}
                          </p>
                          <p className="text-xs text-th-text-tertiary mt-0.5">
                            {quote.quote_number}
                          </p>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {quote.account ? (
                          <Link
                            to={`/accounts/${quote.account.id}`}
                            className="flex items-center gap-2 text-sm text-th-text-secondary hover:text-th-accent-600"
                          >
                            <Building2 className="w-4 h-4 text-th-text-tertiary" />
                            {quote.account.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {quote.deal ? (
                          <Link
                            to={`/deals/${quote.deal.id}`}
                            className="flex items-center gap-2 text-sm text-th-text-secondary hover:text-th-accent-600"
                          >
                            <Briefcase className="w-4 h-4 text-th-text-tertiary" />
                            {quote.deal.name}
                          </Link>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-th-text-primary">
                          {formatCurrency(quote.total)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors.bg} ${statusColors.text}`}
                        >
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {quote.valid_until ? (
                          <div
                            className={`flex items-center gap-1 text-sm ${
                              expired ? 'text-red-600' : 'text-th-text-secondary'
                            }`}
                          >
                            <Calendar className="w-4 h-4" />
                            {formatDate(quote.valid_until)}
                            {expired && (
                              <span className="ml-1 text-xs font-medium">(Expired)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
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

      {/* Add Quote Modal */}
      <AddQuoteModal
        open={showAddQuote}
        onClose={() => setShowAddQuote(false)}
        onSuccess={() => loadQuotes()}
      />

      {/* ---- Quote Power Modals ---- */}
      <QuoteAnalyticsModal open={showAnalytics} onClose={() => setShowAnalytics(false)} totalQuotes={stats.totalQuotes} totalValue={stats.totalValue} pendingValue={stats.pendingValue} acceptedValue={stats.acceptedValue} />
      <QuoteVelocityModal open={showVelocity} onClose={() => setShowVelocity(false)} />
      <QuoteComparisonModal open={showComparison} onClose={() => setShowComparison(false)} />
      <QuoteForecastModal open={showForecast} onClose={() => setShowForecast(false)} pendingValue={stats.pendingValue} />
      <BulkQuoteActionModal open={showBulkActions} onClose={() => setShowBulkActions(false)} />
      <QuoteTemplateModal open={showTemplates} onClose={() => setShowTemplates(false)} />
      <QuoteApprovalModal open={showApproval} onClose={() => setShowApproval(false)} />
      <QuoteExpiryTrackerModal open={showExpiryTracker} onClose={() => setShowExpiryTracker(false)} />
      <QuotePricingOptimizerModal open={showPricingOptimizer} onClose={() => setShowPricingOptimizer(false)} />
      <QuoteWinProbabilityModal open={showWinProbability} onClose={() => setShowWinProbability(false)} />
      <QuoteRevisionHistoryModal open={showRevisionHistory} onClose={() => setShowRevisionHistory(false)} />
      <QuoteExportBuilderModal open={showExportBuilder} onClose={() => setShowExportBuilder(false)} />
    </div>
  );
}

// Add Quote Modal Component
interface AddQuoteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (quoteId: string) => void;
}

function AddQuoteModal({ open, onClose, onSuccess }: AddQuoteModalProps) {
  const { quoteService, accountService, contactService, dealService } = useCRM();
  const { activeOrgId } = useOrg();

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState('');
  const [dealId, setDealId] = useState('');
  const [contactId, setContactId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Load accounts and deals
  useEffect(() => {
    if (!open) return;

    Promise.all([
      accountService.getAccounts({}, 100, 0),
      dealService.getDeals({}, 100, 0),
    ]).then(([accountsResult, dealsResult]) => {
      setAccounts(accountsResult.accounts);
      setDeals(dealsResult.deals);
    });

    // Reset form
    setName('');
    setDescription('');
    setAccountId('');
    setDealId('');
    setContactId('');
    setValidUntil('');
    setTerms('');
    setNotes('');
  }, [open, accountService, dealService]);

  // Load contacts when account changes
  useEffect(() => {
    if (!accountId) {
      setContacts([]);
      return;
    }

    contactService.getContacts({ account_id: accountId }, 100, 0).then(({ contacts }) => {
      setContacts(contacts);
    });
  }, [accountId, contactService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Quote name is required');
      return;
    }

    setLoading(true);

    const result = await quoteService.createQuote({
      name: name.trim(),
      description: description || undefined,
      account_id: accountId || undefined,
      deal_id: dealId || undefined,
      contact_id: contactId || undefined,
      valid_until: validUntil || undefined,
      terms_and_conditions: terms || undefined,
      notes: notes || undefined,
    });

    setLoading(false);

    if (result.success && result.quoteId) {
      toast.success('Quote created');
      logAuditEvent({
        orgId: activeOrgId || '',
        action: AUDIT_ACTIONS.QUOTE_CREATED || 'quote.created',
        entityType: 'quote',
        entityId: result.quoteId,
        after: { name },
      }).catch(console.error);
      onSuccess?.(result.quoteId);
      onClose();
    } else {
      toast.error(result.error || 'Failed to create quote');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Quote"
      description="Create a new quote"
      variant="slideOver"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quote Name */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Quote Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter quote name"
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={2}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Account */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Account
          </label>
          <select
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setContactId('');
            }}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          >
            <option value="">Select an account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Contact
          </label>
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            disabled={!accountId}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500 disabled:opacity-50"
          >
            <option value="">{accountId ? 'Select a contact' : 'Select an account first'}</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.first_name} {contact.last_name}
                {contact.email ? ` (${contact.email})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Deal */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Related Deal
          </label>
          <select
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          >
            <option value="">Select a deal (optional)</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.name}
              </option>
            ))}
          </select>
        </div>

        {/* Valid Until */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Valid Until
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Terms & Conditions */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Terms & Conditions
          </label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Add terms and conditions..."
            rows={3}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-th-text-secondary mb-1">
            Internal Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add internal notes..."
            rows={2}
            className="w-full border border-th-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-th-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-th-text-secondary hover:bg-surface-secondary rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-th-accent-600 hover:bg-th-accent-700 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Quote'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
