import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, ChevronDown, FileInput } from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { SubmissionDetail } from '../components/forms/SubmissionDetail';
import type { WebForm, WebFormSubmission, SubmissionStatus, FormField } from '@mpbhealth/crm-core';

const statusColors: Record<SubmissionStatus, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-100', text: 'text-blue-700' },
  converted: { bg: 'bg-green-100', text: 'text-green-700' },
  duplicate: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  spam: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function FormSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formService } = useCRM();

  const [form, setForm] = useState<WebForm | null>(null);
  const [submissions, setSubmissions] = useState<WebFormSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | ''>('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Detail drawer
  const [selectedSubmission, setSelectedSubmission] = useState<WebFormSubmission | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [formResult, subResult] = await Promise.all([
      formService.getForm(id),
      formService.getSubmissions(id, {
        status: statusFilter || undefined,
      }, pageSize, page * pageSize),
    ]);

    setForm(formResult);
    setSubmissions(subResult.submissions);
    setTotal(subResult.total);
    setLoading(false);
  }, [id, formService, statusFilter, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConvert = async (submissionId: string) => {
    const result = await formService.convertSubmission(submissionId);
    if (result.success) {
      loadData();
      setSelectedSubmission(null);
    }
  };

  const handleExportCSV = () => {
    if (!form || submissions.length === 0) return;

    const fields = (form.fields || []).filter(
      (f) => f.type !== 'heading' && f.type !== 'paragraph'
    );
    const headers = ['Status', 'Date', ...fields.map((f) => f.label)];

    const rows = submissions.map((sub) => {
      const data = sub.data as Record<string, unknown>;
      return [
        sub.status,
        new Date(sub.created_at).toISOString(),
        ...fields.map((f) => String(data[f.id] ?? '')),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.name}-submissions.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(total / pageSize);
  const formFields: FormField[] = (form?.fields || []).filter(
    (f) => f.type !== 'heading' && f.type !== 'paragraph' && f.type !== 'hidden'
  );
  // Show up to 4 field columns
  const visibleFields = formFields.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/web-forms')}
            className="p-1.5 rounded-lg hover:bg-surface-secondary text-th-text-tertiary"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">
              {form?.name || 'Submissions'}
            </h1>
            <p className="text-th-text-tertiary text-sm mt-0.5">
              {total} submission{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/web-forms/${id}/edit`}
            className="px-3 py-2 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-secondary"
          >
            Edit Form
          </Link>
          <button
            onClick={handleExportCSV}
            disabled={submissions.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-secondary disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as SubmissionStatus | ''); setPage(0); }}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="converted">Converted</option>
              <option value="duplicate">Duplicate</option>
              <option value="spam">Spam</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <FileInput className="w-12 h-12 mb-4 opacity-50" />
            <p>No submissions yet</p>
            <p className="text-sm mt-1">Submissions will appear here when people fill out this form</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-secondary border-b border-th-border">
                    <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                      Date
                    </th>
                    {visibleFields.map((field) => (
                      <th
                        key={field.id}
                        className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider"
                      >
                        {field.label}
                      </th>
                    ))}
                    <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-th-border">
                  {submissions.map((sub) => {
                    const data = sub.data as Record<string, unknown>;
                    const sStyle = statusColors[sub.status] || statusColors.new;

                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-surface-secondary cursor-pointer"
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sStyle.bg} ${sStyle.text}`}
                          >
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-th-text-secondary whitespace-nowrap">
                          {formatDate(sub.created_at)}
                        </td>
                        {visibleFields.map((field) => (
                          <td
                            key={field.id}
                            className="px-6 py-4 text-sm text-th-text-primary truncate max-w-[200px]"
                          >
                            {data[field.id] !== undefined ? String(data[field.id]) : '-'}
                          </td>
                        ))}
                        <td className="px-6 py-4">
                          {sub.status === 'new' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConvert(sub.id);
                              }}
                              className="text-sm text-th-accent-600 hover:text-th-accent-700 font-medium"
                            >
                              Convert
                            </button>
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

      {/* Submission detail drawer */}
      <SubmissionDetail
        open={selectedSubmission !== null}
        onClose={() => setSelectedSubmission(null)}
        submission={selectedSubmission}
        fields={form?.fields || []}
        onConvert={handleConvert}
      />
    </div>
  );
}
