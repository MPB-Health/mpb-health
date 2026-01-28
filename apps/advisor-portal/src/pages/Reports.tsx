// ============================================================================
// Reports Page — Saved reports, templates, and report history
// ============================================================================

import { useState } from 'react';
import {
  FileText,
  Plus,
  Play,
  Clock,
  Download,
  Trash2,
  MoreHorizontal,
  Calendar,
  Users,
  BarChart3,
  Shield,
  Activity,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react';
import { useSavedReports, useReportRuns } from '../hooks/useAnalytics';
import type { ReportType, CreateReportInput, ReportConfig } from '@mpbhealth/champion-core';

const REPORT_TYPE_ICONS: Record<ReportType, typeof FileText> = {
  performance: BarChart3,
  leads: Users,
  compliance: Shield,
  activity: Activity,
  custom: FileText,
};

const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  performance: 'bg-blue-100 text-blue-600',
  leads: 'bg-purple-100 text-purple-600',
  compliance: 'bg-green-100 text-green-600',
  activity: 'bg-orange-100 text-orange-600',
  custom: 'bg-gray-100 text-gray-600',
};

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export default function Reports() {
  const { reports, templates, loading, error, createReport, deleteReport, runReport } = useSavedReports();
  const { runs } = useReportRuns();

  const [activeTab, setActiveTab] = useState<'reports' | 'templates' | 'history'>('reports');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState<Partial<CreateReportInput>>({
    name: '',
    description: '',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-th-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      setActionLoading('create');
      await createReport({
        name: createForm.name || selectedTemplate.name,
        description: createForm.description || selectedTemplate.description,
        report_type: selectedTemplate.type,
        config: selectedTemplate.config as ReportConfig,
      });
      setShowCreateModal(false);
      setSelectedTemplate(null);
      setCreateForm({ name: '', description: '' });
    } catch (err) {
      console.error('Failed to create report:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunReport = async (reportId: string) => {
    try {
      setActionLoading(reportId);
      await runReport(reportId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      setActionLoading(reportId);
      await deleteReport(reportId);
    } finally {
      setActionLoading(null);
      setMenuOpen(null);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-th-text-primary">Reports</h1>
            <p className="text-th-text-secondary mt-1">
              Generate and schedule performance reports
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Report
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'reports'
                ? 'bg-th-accent-600 text-white'
                : 'bg-surface-secondary text-th-text-secondary hover:bg-surface-tertiary'
            }`}
          >
            <FileText className="w-4 h-4" />
            My Reports ({reports.length})
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-th-accent-600 text-white'
                : 'bg-surface-secondary text-th-text-secondary hover:bg-surface-tertiary'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Templates
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-th-accent-600 text-white'
                : 'bg-surface-secondary text-th-text-secondary hover:bg-surface-tertiary'
            }`}
          >
            <Clock className="w-4 h-4" />
            History
          </button>
        </div>

        {/* My Reports Tab */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => {
              const Icon = REPORT_TYPE_ICONS[report.report_type as ReportType] || FileText;
              const colorClass = REPORT_TYPE_COLORS[report.report_type as ReportType] || REPORT_TYPE_COLORS.custom;

              return (
                <div
                  key={report.id}
                  className="bg-surface-primary rounded-xl border border-th-border-primary p-5 hover:border-th-accent-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === report.id ? null : report.id)}
                        className="p-1 text-th-text-muted hover:text-th-text-primary rounded"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {menuOpen === report.id && (
                        <div className="absolute right-0 top-full mt-1 w-36 bg-surface-primary rounded-lg border border-th-border-primary shadow-lg z-10">
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-th-text-primary mb-1">{report.name}</h3>
                  {report.description && (
                    <p className="text-sm text-th-text-secondary mb-3 line-clamp-2">
                      {report.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-th-text-muted mb-4">
                    <Clock className="w-3.5 h-3.5" />
                    {report.last_run_at ? `Last run ${formatRelativeTime(report.last_run_at)}` : 'Never run'}
                    <span className="mx-1">•</span>
                    {report.run_count} runs
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRunReport(report.id)}
                      disabled={actionLoading === report.id}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {actionLoading === report.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Run
                        </>
                      )}
                    </button>
                    <button className="p-2 text-th-text-muted hover:text-th-text-primary hover:bg-surface-secondary rounded-lg transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {reports.length === 0 && (
              <div className="col-span-full bg-surface-primary rounded-xl border border-th-border-primary p-12 text-center">
                <FileText className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
                <p className="text-th-text-secondary">No saved reports</p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="mt-4 text-th-accent-600 hover:text-th-accent-700 font-medium"
                >
                  Create from template
                </button>
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => {
              const Icon = REPORT_TYPE_ICONS[template.type] || FileText;
              const colorClass = REPORT_TYPE_COLORS[template.type] || REPORT_TYPE_COLORS.custom;

              return (
                <div
                  key={template.id}
                  className="bg-surface-primary rounded-xl border border-th-border-primary p-5 hover:border-th-accent-300 transition-colors"
                >
                  <div className={`p-2 rounded-lg w-fit ${colorClass} mb-3`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="font-semibold text-th-text-primary mb-1">{template.name}</h3>
                  <p className="text-sm text-th-text-secondary mb-4">{template.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {template.config.metrics.slice(0, 3).map((metric) => (
                      <span
                        key={metric}
                        className="px-2 py-0.5 bg-surface-secondary rounded text-xs text-th-text-muted"
                      >
                        {metric.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {template.config.metrics.length > 3 && (
                      <span className="px-2 py-0.5 bg-surface-secondary rounded text-xs text-th-text-muted">
                        +{template.config.metrics.length - 3} more
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowCreateModal(true);
                    }}
                    className="w-full py-2 text-sm font-medium text-th-accent-600 hover:bg-th-accent-50 rounded-lg transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-surface-primary rounded-xl border border-th-border-primary overflow-hidden">
            <div className="divide-y divide-th-border-primary">
              {runs.map((run) => {
                const StatusIcon =
                  run.status === 'ready'
                    ? CheckCircle
                    : run.status === 'failed'
                    ? XCircle
                    : run.status === 'generating'
                    ? Loader2
                    : Clock;
                const statusColor =
                  run.status === 'ready'
                    ? 'text-green-600'
                    : run.status === 'failed'
                    ? 'text-red-600'
                    : run.status === 'generating'
                    ? 'text-yellow-600'
                    : 'text-gray-500';

                return (
                  <div key={run.id} className="p-4 flex items-center gap-4">
                    <div className={statusColor}>
                      <StatusIcon
                        className={`w-5 h-5 ${run.status === 'generating' ? 'animate-spin' : ''}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-th-text-primary truncate">
                        Report #{run.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-th-text-secondary">
                        {formatDate(run.started_at)}
                        {run.row_count !== null && ` • ${run.row_count} rows`}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        run.status === 'ready'
                          ? 'bg-green-100 text-green-700'
                          : run.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : run.status === 'generating'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {run.status}
                    </span>

                    {run.export_url && (
                      <a
                        href={run.export_url}
                        download
                        className="p-2 text-th-text-muted hover:text-th-accent-600 transition-colors"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                );
              })}

              {runs.length === 0 && (
                <div className="p-12 text-center">
                  <Clock className="w-12 h-12 text-th-text-muted mx-auto mb-4" />
                  <p className="text-th-text-secondary">No report history</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary rounded-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-th-border-primary">
              <h2 className="text-lg font-semibold text-th-text-primary">Create Report</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedTemplate(null);
                  setCreateForm({ name: '', description: '' });
                }}
                className="p-1 text-th-text-muted hover:text-th-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="p-3 bg-surface-secondary rounded-lg">
                <p className="text-xs text-th-text-muted mb-1">Template</p>
                <p className="font-medium text-th-text-primary">{selectedTemplate.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Report Name
                </label>
                <input
                  type="text"
                  value={createForm.name || ''}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder={selectedTemplate.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  value={createForm.description || ''}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-th-border-primary bg-surface-secondary text-th-text-primary focus:ring-2 focus:ring-th-accent-500 focus:border-transparent"
                  placeholder={selectedTemplate.description}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-th-border-primary">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedTemplate(null);
                  setCreateForm({ name: '', description: '' });
                }}
                className="px-4 py-2 text-th-text-secondary hover:text-th-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFromTemplate}
                disabled={actionLoading === 'create'}
                className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'create' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
