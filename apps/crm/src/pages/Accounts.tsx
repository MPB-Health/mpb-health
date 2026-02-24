import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  Building2,
  Phone,
  Globe,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { AddAccountModal } from '../components/AddAccountModal';
import { useOrg } from '../contexts/OrgContext';
import {
  createAccountService,
  formatTimeAgo,
  type AccountWithRelations,
  type AccountFilters,
} from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

// Account type options
const ACCOUNT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'customer', label: 'Customer' },
  { value: 'partner', label: 'Partner' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'other', label: 'Other' },
];

// Rating options
const RATING_OPTIONS = [
  { value: '', label: 'All Ratings' },
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
];

// Get rating badge colors
function getRatingColors(rating: string | null) {
  switch (rating) {
    case 'hot':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    case 'warm':
      return { bg: 'bg-orange-100', text: 'text-orange-700' };
    case 'cold':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

// Get account type badge colors
function getTypeColors(type: string) {
  switch (type) {
    case 'customer':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'prospect':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'partner':
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
    case 'vendor':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

export default function Accounts() {
  const navigate = useNavigate();
  const { activeOrgId } = useOrg();

  // Initialize account service
  const [accountService] = useState(() => createAccountService(supabase));

  const [accounts, setAccounts] = useState<AccountWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AccountFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [industries, setIndustries] = useState<string[]>([]);
  const pageSize = 20;

  // Bulk selection state
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

  // Load accounts
  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const { accounts: data, total: count } = await accountService.getAccounts(
        filters,
        pageSize,
        page * pageSize
      );
      setAccounts(data);
      setTotal(count);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [accountService, filters, page]);

  // Load industries for filter dropdown
  const loadIndustries = useCallback(async () => {
    const data = await accountService.getIndustries();
    setIndustries(data);
  }, [accountService]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    loadIndustries();
  }, [loadIndustries]);

  // Clear selection when filters or page change
  useEffect(() => {
    setSelectedAccounts(new Set());
  }, [filters, page]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleTypeFilter = (account_type: string) => {
    setFilters((prev) => ({ ...prev, account_type: account_type || undefined }));
    setPage(0);
  };

  const handleIndustryFilter = (industry: string) => {
    setFilters((prev) => ({ ...prev, industry: industry || undefined }));
    setPage(0);
  };

  const handleRatingFilter = (rating: string) => {
    setFilters((prev) => ({ ...prev, rating: rating || undefined }));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const exportAccounts = await accountService.getAccountsForExport(undefined, filters);
      const csv = generateAccountCSV(exportAccounts);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accounts-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export accounts');
    }
  };

  const handleExportSelected = async () => {
    try {
      const ids = Array.from(selectedAccounts);
      const exportAccounts = await accountService.getAccountsForExport(ids);
      const csv = generateAccountCSV(exportAccounts);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accounts-selected-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export accounts');
    }
  };

  // Generate CSV from accounts
  function generateAccountCSV(data: AccountWithRelations[]) {
    const headers = ['Name', 'Type', 'Industry', 'Phone', 'Website', 'Rating', 'Created'];
    const rows = data.map((account) => [
      account.name,
      account.account_type,
      account.industry || '',
      account.phone || '',
      account.website || '',
      account.rating || '',
      new Date(account.created_at).toLocaleDateString(),
    ]);
    return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
  }

  const toggleSelectAll = useCallback(() => {
    if (selectedAccounts.size === accounts.length) {
      setSelectedAccounts(new Set());
    } else {
      setSelectedAccounts(new Set(accounts.map((a) => a.id)));
    }
  }, [accounts, selectedAccounts.size]);

  const toggleSelectAccount = useCallback((accountId: string) => {
    setSelectedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  }, []);

  const handleRowClick = (accountId: string) => {
    navigate(`/accounts/${accountId}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Bulk Actions Toolbar */}
      {selectedAccounts.size > 0 && (
        <div className="bg-th-accent-50 border border-th-accent-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-th-accent-700">
            {selectedAccounts.size} account{selectedAccounts.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-3">
            <PermissionGate permission="accounts.read">
              <button
                onClick={handleExportSelected}
                className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium"
              >
                Export Selected
              </button>
            </PermissionGate>
            <button
              onClick={() => setSelectedAccounts(new Set())}
              className="text-sm text-th-text-tertiary hover:text-th-text-secondary"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Accounts</h1>
          <p className="text-th-text-tertiary text-sm mt-1">{total} total accounts</p>
        </div>
        <div className="flex items-center space-x-3">
          <PermissionGate permission="accounts.read">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="accounts.write">
            <button
              onClick={() => setShowAddAccount(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Account</span>
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 flex items-center bg-surface-tertiary rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-th-text-tertiary mr-2" />
            <input
              type="text"
              placeholder="Search by name, industry, or website..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          {/* Account Type filter */}
          <div className="relative">
            <select
              value={filters.account_type || ''}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Industry filter */}
          <div className="relative">
            <select
              value={filters.industry || ''}
              onChange={(e) => handleIndustryFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Industries</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* Rating filter */}
          <div className="relative">
            <select
              value={filters.rating || ''}
              onChange={(e) => handleRatingFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              {RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* More filters toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'border-th-accent-500 text-th-accent-700 bg-th-accent-50'
                : 'border-th-border text-th-text-secondary hover:bg-surface-secondary'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Accounts table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <Building2 className="w-12 h-12 mb-4 opacity-50" />
            <p>No accounts found</p>
            <p className="text-sm mt-1">Try adjusting your filters or create a new account</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.size === accounts.length && accounts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-th-border"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {accounts.map((account) => {
                  const typeColors = getTypeColors(account.account_type);
                  const ratingColors = getRatingColors(account.rating);
                  const isSelected = selectedAccounts.has(account.id);

                  return (
                    <tr
                      key={account.id}
                      className={`hover:bg-surface-secondary cursor-pointer ${
                        isSelected ? 'bg-th-accent-50' : ''
                      }`}
                      onClick={() => handleRowClick(account.id)}
                    >
                      <td
                        className="w-12 px-4 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectAccount(account.id)}
                          className="w-4 h-4 rounded border-th-border"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-th-accent-100 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-th-accent-700" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                              {account.name}
                            </p>
                            {account.website && (
                              <a
                                href={account.website.startsWith('http') ? account.website : `https://${account.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-xs text-th-text-tertiary hover:text-th-accent-600"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Globe className="w-3 h-3 mr-1" />
                                {account.website}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors.bg} ${typeColors.text}`}
                        >
                          {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {account.industry || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {account.phone ? (
                          <a
                            href={`tel:${account.phone}`}
                            className="flex items-center text-sm text-th-text-secondary hover:text-th-accent-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            {account.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-th-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {account.owner?.email || account.owner?.full_name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-tertiary">
                        {formatTimeAgo(account.created_at)}
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
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total}
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

      {/* Add Account Modal */}
      <AddAccountModal
        open={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onSuccess={() => loadAccounts()}
      />
    </div>
  );
}
