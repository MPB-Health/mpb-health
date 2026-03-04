import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Tag,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import type { QuoteSubmission } from '@mpbhealth/crm-core';

const PAGE_SIZE = 20;

export default function QuickRateEstimateLeads() {
  const navigate = useNavigate();
  const { importService } = useCRM();

  const [submissions, setSubmissions] = useState<QuoteSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [syncFilter, setSyncFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail view
  const [selectedSubmission, setSelectedSubmission] = useState<QuoteSubmission | null>(null);

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const { leads: data, total: count } = await importService.getQuickRateEstimateLeads(
        {
          search: searchTerm || undefined,
          syncStatus: syncFilter || undefined,
        },
        PAGE_SIZE,
        (page - 1) * PAGE_SIZE
      );
      setSubmissions(data);
      setTotal(count);
    } catch (error) {
      console.error('Failed to load quick rate estimate leads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [importService, searchTerm, syncFilter, page]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSubmissions();
  };

  const handleSelectAll = () => {
    if (selectedIds.size === submissions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(submissions.map((s) => s.id)));
    }
  };

  const handleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleLabelAsQuickRateEstimate = async () => {
    if (selectedIds.size === 0) return;

    try {
      const result = await importService.importQuoteSubmissionsAsLeads(Array.from(selectedIds));
      if (result.success) {
        setSelectedIds(new Set());
        loadSubmissions();
      }
    } catch (error) {
      console.error('Failed to label leads:', error);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Synced
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'failed':
      case 'retrying':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <AlertCircle className="w-3 h-3" />
            {status === 'retrying' ? 'Retrying' : 'Failed'}
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-th-accent-100 rounded-lg">
            <Calculator className="w-6 h-6 text-th-accent-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">Quick Rate Estimate Leads</h1>
            <p className="text-sm text-th-text-secondary">
              Leads from the hero calculator and Quick Rate Estimate forms
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl border border-th-border mb-6">
        <div className="p-4 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 border border-th-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh submissions"
            className="p-2 border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-th-text-tertiary ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleLabelAsQuickRateEstimate}
              className="flex items-center gap-2 px-3 py-2 bg-th-accent-600 text-white rounded-lg text-sm hover:bg-th-accent-700"
            >
              <Tag className="w-4 h-4" />
              Label as Quick Rate Estimate ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-th-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-secondary">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === submissions.length && submissions.length > 0}
                    onChange={handleSelectAll}
                    aria-label="Select all submissions"
                    className="h-4 w-4 rounded border-th-border text-th-accent-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-th-text-secondary uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-th-text-secondary uppercase">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-th-text-secondary uppercase">
                  Coverage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-th-text-secondary uppercase">
                  Source
                </th>
                {zohoConfigured && (
                <th className="px-4 py-3 text-left text-xs font-medium text-th-text-secondary uppercase">
                  Status
                </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-th-text-secondary uppercase">
                  Date
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-th-border">
              {loading ? (
                <tr>
                  <td colSpan={zohoConfigured ? 8 : 7} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-th-text-tertiary">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-th-accent-600" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={zohoConfigured ? 8 : 7} className="px-4 py-12 text-center">
                    <Calculator className="w-12 h-12 mx-auto text-th-text-tertiary mb-3" />
                    <p className="text-th-text-secondary">No quote submissions found</p>
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-surface-secondary cursor-pointer"
                    onClick={() => setSelectedSubmission(sub)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(sub.id)}
                        onChange={() => handleSelectRow(sub.id)}
                        aria-label={`Select ${sub.first_name} ${sub.last_name}`}
                        className="h-4 w-4 rounded border-th-border text-th-accent-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-th-text-primary">
                        {sub.first_name} {sub.last_name}
                      </div>
                      {sub.household_size && (
                        <div className="text-xs text-th-text-tertiary">
                          Household: {sub.household_size}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-sm">
                        <span className="text-th-text-primary">{sub.email}</span>
                        {sub.phone && (
                          <span className="text-th-text-tertiary text-xs">{sub.phone}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary">
                      {sub.coverage_preference || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-th-text-secondary">
                      {sub.source_cta || sub.source_page || '-'}
                    </td>
                    {zohoConfigured && (
                    <td className="px-4 py-3">
                      {getSyncStatusBadge(sub.zoho_sync_status)}
                    </td>
                    )}
                    <td className="px-4 py-3 text-sm text-th-text-tertiary">
                      {formatDate(sub.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubmission(sub);
                        }}
                        aria-label={`View details for ${sub.first_name} ${sub.last_name}`}
                        className="p-1 rounded hover:bg-gray-200"
                      >
                        <Eye className="w-4 h-4 text-th-text-tertiary" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-4 py-3 border-t border-th-border flex items-center justify-between">
            <p className="text-sm text-th-text-tertiary">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
                className="p-1.5 border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-th-text-secondary">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                aria-label="Next page"
                className="p-1.5 border border-th-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setSelectedSubmission(null)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-th-text-primary">
                  Submission Details
                </h3>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  aria-label="Close details panel"
                  className="p-1 rounded hover:bg-surface-secondary"
                >
                  <ChevronRight className="w-5 h-5 text-th-text-tertiary" />
                </button>
              </div>

              {/* Contact Info */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-th-text-secondary mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-th-accent-100 flex items-center justify-center">
                      <span className="text-th-accent-600 font-semibold">
                        {selectedSubmission.first_name?.[0]}{selectedSubmission.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-th-text-primary">
                        {selectedSubmission.first_name} {selectedSubmission.last_name}
                      </div>
                      {zohoConfigured && (
                      <div className="text-sm text-th-text-tertiary">
                        {getSyncStatusBadge(selectedSubmission.zoho_sync_status)}
                      </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-th-text-tertiary" />
                      <a href={`mailto:${selectedSubmission.email}`} className="text-th-accent-600 hover:underline">
                        {selectedSubmission.email}
                      </a>
                    </div>
                    {selectedSubmission.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-th-text-tertiary" />
                        <a href={`tel:${selectedSubmission.phone}`} className="text-th-accent-600 hover:underline">
                          {selectedSubmission.phone}
                        </a>
                      </div>
                    )}
                    {selectedSubmission.zip_code && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-th-text-tertiary" />
                        <span className="text-th-text-primary">ZIP: {selectedSubmission.zip_code}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-th-text-tertiary" />
                      <span className="text-th-text-primary">{formatDate(selectedSubmission.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-th-text-secondary mb-3">Quote Request Details</h4>
                <div className="bg-surface-secondary rounded-lg p-4 space-y-2 text-sm">
                  {selectedSubmission.household_size && (
                    <div className="flex justify-between">
                      <span className="text-th-text-tertiary">Household Size</span>
                      <span className="text-th-text-primary font-medium">{selectedSubmission.household_size}</span>
                    </div>
                  )}
                  {selectedSubmission.current_insurance && (
                    <div className="flex justify-between">
                      <span className="text-th-text-tertiary">Current Insurance</span>
                      <span className="text-th-text-primary font-medium">{selectedSubmission.current_insurance}</span>
                    </div>
                  )}
                  {selectedSubmission.monthly_premium && (
                    <div className="flex justify-between">
                      <span className="text-th-text-tertiary">Monthly Premium</span>
                      <span className="text-th-text-primary font-medium">${selectedSubmission.monthly_premium}</span>
                    </div>
                  )}
                  {selectedSubmission.coverage_preference && (
                    <div className="flex justify-between">
                      <span className="text-th-text-tertiary">Coverage Preference</span>
                      <span className="text-th-text-primary font-medium">{selectedSubmission.coverage_preference}</span>
                    </div>
                  )}
                  {selectedSubmission.primary_concern && (
                    <div className="flex justify-between">
                      <span className="text-th-text-tertiary">Primary Concern</span>
                      <span className="text-th-text-primary font-medium">{selectedSubmission.primary_concern}</span>
                    </div>
                  )}
                  {selectedSubmission.contact_preference && (
                    <div className="flex justify-between">
                      <span className="text-th-text-tertiary">Contact Preference</span>
                      <span className="text-th-text-primary font-medium capitalize">{selectedSubmission.contact_preference}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Attribution */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-th-text-secondary mb-3">Attribution</h4>
                <div className="bg-surface-secondary rounded-lg p-4 space-y-2 text-sm">
                  {selectedSubmission.source_page && (
                    <div className="flex justify-between">
                      <span className="text-th-text-tertiary">Source Page</span>
                      <span className="text-th-text-primary">{selectedSubmission.source_page}</span>
                    </div>
                  )}
                  {selectedSubmission.source_cta && (
                    <div className="flex justify-between">
                      <span className="text-th-text-tertiary">Source CTA</span>
                      <span className="text-th-text-primary">{selectedSubmission.source_cta}</span>
                    </div>
                  )}
                  {selectedSubmission.utm_source && (
                    <div className="flex justify-between">
                      <span className="text-th-text-tertiary">UTM Source</span>
                      <span className="text-th-text-primary">{selectedSubmission.utm_source}</span>
                    </div>
                  )}
                  {selectedSubmission.utm_medium && (
                    <div className="flex justify-between">
                      <span className="text-th-text-tertiary">UTM Medium</span>
                      <span className="text-th-text-primary">{selectedSubmission.utm_medium}</span>
                    </div>
                  )}
                  {selectedSubmission.utm_campaign && (
                    <div className="flex justify-between">
                      <span className="text-th-text-tertiary">UTM Campaign</span>
                      <span className="text-th-text-primary">{selectedSubmission.utm_campaign}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Zoho Link — only when Zoho is configured */}
              {zohoConfigured && selectedSubmission.zoho_lead_id && (
                <div className="mb-6">
                  <a
                    href={`https://crm.zoho.com/crm/org/tab/Leads/${selectedSubmission.zoho_lead_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-th-accent-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View in Zoho CRM
                  </a>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    importService.importQuoteSubmissionsAsLeads([selectedSubmission.id]);
                    setSelectedSubmission(null);
                    loadSubmissions();
                  }}
                  className="flex-1 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700"
                >
                  Label as Quick Rate Estimate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
