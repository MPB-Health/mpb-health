import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PermissionGate } from '../components/PermissionGate';
import { useOrg } from '../contexts/OrgContext';
import { formatTimeAgo } from '@mpbhealth/crm-core';
import { supabase } from '../lib/supabase';

// Direction filter options
const DIRECTION_OPTIONS = [
  { value: '', label: 'All Directions' },
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'missed', label: 'Missed' },
];

interface CallActivity {
  id: string;
  title: string;
  description: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  created_by: string | null;
  lead_id: string | null;
}

interface CallFilters {
  search?: string;
  direction?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Get direction icon component
function DirectionIcon({ direction }: { direction: string }) {
  switch (direction) {
    case 'inbound':
      return <PhoneIncoming className="w-4 h-4 text-green-600" />;
    case 'missed':
      return <PhoneMissed className="w-4 h-4 text-red-600" />;
    case 'outbound':
    default:
      return <PhoneOutgoing className="w-4 h-4 text-blue-600" />;
  }
}

// Get direction badge colors
function getDirectionColors(direction: string) {
  switch (direction) {
    case 'inbound':
      return { bg: 'bg-green-100', text: 'text-green-700' };
    case 'missed':
      return { bg: 'bg-red-100', text: 'text-red-700' };
    case 'outbound':
    default:
      return { bg: 'bg-blue-100', text: 'text-blue-700' };
  }
}

// Format duration from seconds
function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) return '--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export default function Calls() {
  const { activeOrgId } = useOrg();

  // Inline call service
  const [callService] = useState(() => ({
    getCalls: async (filters: CallFilters, limit: number, offset: number) => {
      let query = supabase
        .from('lead_activities')
        .select('id, title, description, metadata, created_at, created_by, lead_id', { count: 'exact' })
        .eq('activity_type', 'call')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      // Filter by direction client-side if specified (stored in metadata)
      let calls = data || [];
      if (filters.direction) {
        calls = calls.filter((c) => {
          const dir = c.metadata?.direction || 'outbound';
          return dir === filters.direction;
        });
      }

      return { calls, total: filters.direction ? calls.length : (count || 0) };
    },
  }));

  const [calls, setCalls] = useState<CallActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CallFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const pageSize = 20;

  // Load calls
  const loadCalls = useCallback(async () => {
    setLoading(true);
    try {
      const { calls: data, total: count } = await callService.getCalls(
        filters,
        pageSize,
        page * pageSize
      );
      setCalls(data);
      setTotal(count);
    } catch (error) {
      console.error('Failed to load calls:', error);
      toast.error('Failed to load calls');
    } finally {
      setLoading(false);
    }
  }, [callService, filters, page]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleDirectionFilter = (direction: string) => {
    setFilters((prev) => ({ ...prev, direction: direction || undefined }));
    setPage(0);
  };

  const handleDateFromFilter = (dateFrom: string) => {
    setFilters((prev) => ({ ...prev, dateFrom: dateFrom || undefined }));
    setPage(0);
  };

  const handleDateToFilter = (dateTo: string) => {
    setFilters((prev) => ({ ...prev, dateTo: dateTo || undefined }));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      const { calls: allCalls } = await callService.getCalls(filters, 10000, 0);
      const headers = ['Title', 'Direction', 'Duration', 'Contact', 'Description', 'Created'];
      const rows = allCalls.map((call) => [
        call.title || '',
        call.metadata?.direction || 'outbound',
        formatDuration(call.metadata?.duration_seconds),
        call.metadata?.contact_name || call.lead_id || '',
        call.description || '',
        new Date(call.created_at).toLocaleDateString(),
      ]);
      const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calls-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export started');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export calls');
    }
  };

  const handleNewCall = () => {
    toast('Log calls from lead or contact detail pages', { icon: '\u{260E}' });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Calls</h1>
          <p className="text-th-text-tertiary text-sm mt-1">{total} total calls</p>
        </div>
        <div className="flex items-center space-x-3">
          <PermissionGate permission="activities.read">
            <button
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </PermissionGate>
          <PermissionGate permission="activities.write">
            <button
              onClick={handleNewCall}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Call</span>
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
              placeholder="Search by title or description..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          {/* Direction filter */}
          <div className="relative">
            <select
              value={filters.direction || ''}
              onChange={(e) => handleDirectionFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              {DIRECTION_OPTIONS.map((opt) => (
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

        {/* Expanded date filters */}
        {showFilters && (
          <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-th-border">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-th-text-tertiary">From:</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleDateFromFilter(e.target.value)}
                className="bg-surface-primary border border-th-border rounded-lg px-3 py-2 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-th-text-tertiary">To:</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleDateToFilter(e.target.value)}
                className="bg-surface-primary border border-th-border rounded-lg px-3 py-2 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Calls table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <Phone className="w-12 h-12 mb-4 opacity-50" />
            <p>No calls logged</p>
            <p className="text-sm mt-1">Log your first call from a lead or contact page</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="w-12 text-left px-4 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    {/* Direction icon column */}
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {calls.map((call) => {
                  const direction = (call.metadata?.direction as string) || 'outbound';
                  const dirColors = getDirectionColors(direction);

                  return (
                    <tr
                      key={call.id}
                      className="hover:bg-surface-secondary"
                    >
                      <td className="w-12 px-4 py-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dirColors.bg}`}>
                          <DirectionIcon direction={direction} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-th-text-primary">
                          {call.title || 'Untitled Call'}
                        </span>
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${dirColors.bg} ${dirColors.text}`}>
                          {direction.charAt(0).toUpperCase() + direction.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary truncate block max-w-[200px]">
                          {call.description || '--'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-sm text-th-text-secondary">
                          <Clock className="w-3.5 h-3.5 text-th-text-tertiary" />
                          <span>{formatDuration(call.metadata?.duration_seconds)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-secondary">
                          {call.metadata?.contact_name || (call.lead_id ? call.lead_id.slice(0, 8) + '...' : '--')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-th-text-tertiary">
                          {call.created_by ? call.created_by.slice(0, 8) + '...' : '--'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-tertiary">
                        {formatTimeAgo(call.created_at)}
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
    </div>
  );
}
