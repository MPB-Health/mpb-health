import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { auditService, type AuditLog } from '@mpbhealth/admin-core';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      try {
        const { logs: logsData, total: totalCount } = await auditService.getLogs({
          action: actionFilter || undefined,
          entityType: entityFilter || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          limit: pageSize,
          offset: page * pageSize,
        });
        setLogs(logsData);
        setTotal(totalCount);
      } catch (err) {
        console.error('Failed to load logs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [actionFilter, entityFilter, fromDate, toDate, page]);

  const handleExport = async () => {
    try {
      const csv = await auditService.exportLogs({
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export logs:', err);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'update':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'delete':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'login':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'logout':
        return 'bg-surface-tertiary text-th-text-secondary';
      default:
        return 'bg-surface-tertiary text-th-text-secondary';
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Audit Logs</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Track all system activities and changes
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center space-x-2 px-4 py-2 border border-th-border rounded-lg text-th-text-secondary hover:bg-surface-tertiary transition-colors"
        >
          <Download className="w-5 h-5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="audit-action-filter" className="block text-sm font-medium text-th-text-secondary mb-1">
              Action
            </label>
            <select
              id="audit-action-filter"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(0);
              }}
              className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>
          <div>
            <label htmlFor="audit-entity-filter" className="block text-sm font-medium text-th-text-secondary mb-1">
              Entity Type
            </label>
            <select
              id="audit-entity-filter"
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(0);
              }}
              className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            >
              <option value="">All Entities</option>
              <option value="user">User</option>
              <option value="enrollment">Enrollment</option>
              <option value="blog_post">Blog Post</option>
              <option value="resource">Resource</option>
              <option value="setting">Setting</option>
              <option value="session">Session</option>
            </select>
          </div>
          <div>
            <label htmlFor="audit-from-date" className="block text-sm font-medium text-th-text-secondary mb-1">
              From Date
            </label>
            <input
              id="audit-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
              className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            />
          </div>
          <div>
            <label htmlFor="audit-to-date" className="block text-sm font-medium text-th-text-secondary mb-1">
              To Date
            </label>
            <input
              id="audit-to-date"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              className="w-full px-4 py-2 bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
            />
          </div>
        </div>
      </div>

      {/* Logs table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600"></div>
          </div>
        ) : logs.length > 0 ? (
          <>
            <table className="w-full">
              <thead className="bg-surface-secondary border-b border-th-border">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                    Timestamp
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                    Action
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                    Entity
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-th-text-tertiary">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border-subtle">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-tertiary">
                    <td className="py-3 px-4 text-sm text-th-text-secondary">
                      {format(
                        new Date(log.created_at),
                        'MMM d, yyyy h:mm:ss a'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-surface-tertiary rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-th-text-tertiary" />
                        </div>
                        <span className="text-sm text-th-text-primary">
                          {log.user_email || 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full capitalize ${getActionColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <span className="text-th-text-primary capitalize">
                          {log.entity_type.replace('_', ' ')}
                        </span>
                        {log.entity_id && (
                          <span className="text-th-text-tertiary ml-1">
                            ({log.entity_id.slice(0, 8)}...)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-th-text-tertiary">
                      {log.ip_address && <span>IP: {log.ip_address}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-th-border">
              <p className="text-sm text-th-text-tertiary">
                Showing {page * pageSize + 1} to{' '}
                {Math.min((page + 1) * pageSize, total)} of {total} entries
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  aria-label="Previous page"
                  className="p-2 border border-th-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-tertiary text-th-text-secondary"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-th-text-secondary">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                  aria-label="Next page"
                  className="p-2 border border-th-border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-tertiary text-th-text-secondary"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
            <p className="text-th-text-tertiary">No audit logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
