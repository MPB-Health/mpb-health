import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  RefreshCw,
  Download,
  Columns,
  Grid3X3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  Edit2
} from 'lucide-react';
import { SEOHead } from '../../components/SEOHead';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { Button } from '../../components/ui/button';
import { LeadFilters } from '../../components/admin/crm/LeadFilters';
import { BulkActionsBar } from '../../components/admin/crm/BulkActionsBar';
import { ExportModal } from '../../components/admin/crm/ExportModal';
import { crmService, type Lead, type PipelineStage, type LeadFilters as LeadFiltersType } from '../../lib/crmService';
import { pdfExportService } from '../../lib/pdfExportService';
import { cn } from '../../lib/utils';

type SortField = 'created_at' | 'first_name' | 'last_name' | 'email' | 'pipeline_stage' | 'priority';
type SortDirection = 'asc' | 'desc';

const LeadsList: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFiltersType>({});
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadLeads();
  }, [filters, page]);

  useEffect(() => {
    loadStages();
  }, []);

  const loadStages = async () => {
    const data = await crmService.getPipelineStages();
    setStages(data);
  };

  const loadLeads = async () => {
    setLoading(true);
    try {
      const { leads: leadsData, total } = await crmService.getLeads(
        filters,
        pageSize,
        page * pageSize
      );
      setLeads(leadsData);
      setTotalCount(total);
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    const comparison = String(aVal).localeCompare(String(bVal));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const toggleSelectAll = () => {
    if (selectedLeads.length === sortedLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads([...sortedLeads]);
    }
  };

  const toggleSelectLead = (lead: Lead) => {
    setSelectedLeads(prev => {
      const isSelected = prev.some(l => l.id === lead.id);
      if (isSelected) {
        return prev.filter(l => l.id !== lead.id);
      } else {
        return [...prev, lead];
      }
    });
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    const leadsToExport = selectedLeads.length > 0 ? selectedLeads : leads;
    
    if (format === 'csv') {
      crmService.downloadCSV(leadsToExport, `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    } else {
      pdfExportService.exportLeadsList(leadsToExport);
    }
  };

  const handleQuickStageChange = async (leadId: string, newStage: string) => {
    const result = await crmService.updateLeadStage(leadId, newStage);
    if (result.success) {
      loadLeads();
    }
    setActionMenuId(null);
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600',
  };

  const stageColors: Record<string, string> = stages.reduce((acc, stage) => {
    acc[stage.name] = stage.color;
    return acc;
  }, {} as Record<string, string>);

  const totalPages = Math.ceil(totalCount / pageSize);

  const SortHeader: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-neutral-900 transition-colors"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <AdminLayout activeView="crm-leads" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <SEOHead
        title="All Leads | CRM | MPB Health Admin"
        description="View and manage all leads"
      />

      <div className="p-6 max-w-full">
        <AdminBreadcrumb
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'CRM', href: '/admin/crm' },
            { label: 'All Leads', href: '/admin/crm/leads' },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between mt-4 mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin/crm" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-neutral-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">All Leads</h1>
              <p className="text-neutral-500">
                {totalCount} total lead{totalCount !== 1 ? 's' : ''}
                {selectedLeads.length > 0 && ` (${selectedLeads.length} selected)`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setShowExportModal(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Link to="/admin/crm/pipeline">
              <Button variant="outline">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Pipeline View
              </Button>
            </Link>
            <Button onClick={loadLeads}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <LeadFilters
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              setPage(0);
            }}
            showSearch={true}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
              <Columns className="h-12 w-12 mb-3 text-neutral-300" />
              <p>No leads found</p>
              <p className="text-sm text-neutral-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === sortedLeads.length && sortedLeads.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      <SortHeader field="first_name">Name</SortHeader>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      <SortHeader field="email">Contact</SortHeader>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      <SortHeader field="pipeline_stage">Stage</SortHeader>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      <SortHeader field="priority">Priority</SortHeader>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Zoho
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      <SortHeader field="created_at">Created</SortHeader>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeads.map((lead) => {
                    const isSelected = selectedLeads.some(l => l.id === lead.id);
                    const stageColor = stageColors[lead.pipeline_stage] || '#6B7280';

                    return (
                      <tr
                        key={lead.id}
                        className={cn(
                          'border-b border-neutral-100 hover:bg-neutral-50 transition-colors',
                          isSelected && 'bg-primary-50'
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectLead(lead)}
                            className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/admin/crm/leads/${lead.id}`}
                            className="flex items-center gap-3 hover:text-primary-600"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-xs font-medium">
                              {lead.first_name?.charAt(0)}{lead.last_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-neutral-900">
                                {lead.first_name} {lead.last_name}
                              </p>
                              {lead.zip_code && (
                                <p className="text-xs text-neutral-500">ZIP: {lead.zip_code}</p>
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <a
                              href={`mailto:${lead.email}`}
                              className="flex items-center gap-1 text-sm text-neutral-600 hover:text-primary-600"
                            >
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{lead.email}</span>
                            </a>
                            <a
                              href={`tel:${lead.phone}`}
                              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-primary-600"
                            >
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: stageColor }}
                          >
                            {stages.find(s => s.name === lead.pipeline_stage)?.display_name || lead.pipeline_stage}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            priorityColors[lead.priority || 'medium']
                          )}>
                            {(lead.priority || 'medium').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-600 truncate max-w-[120px] block">
                            {lead.source_cta || 'Direct'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {lead.zoho_sync_status === 'success' ? (
                            <a
                              href={`https://crm.zoho.com/crm/org123/tab/Leads/${lead.zoho_lead_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : lead.zoho_sync_status === 'failed' ? (
                            <span className="flex items-center gap-1 text-red-500" title="Sync failed">
                              <AlertCircle className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="text-neutral-400 text-xs">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-neutral-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button
                              onClick={() => setActionMenuId(actionMenuId === lead.id ? null : lead.id)}
                              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            >
                              <MoreHorizontal className="h-4 w-4 text-neutral-500" />
                            </button>

                            {actionMenuId === lead.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setActionMenuId(null)}
                                />
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20">
                                  <Link
                                    to={`/admin/crm/leads/${lead.id}`}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                                    onClick={() => setActionMenuId(null)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Details
                                  </Link>
                                  <Link
                                    to={`/admin/crm/leads/${lead.id}`}
                                    className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                                    onClick={() => setActionMenuId(null)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                    Edit Lead
                                  </Link>
                                  <div className="border-t border-neutral-100 my-1" />
                                  <div className="px-4 py-1 text-xs font-medium text-neutral-500 uppercase">
                                    Move to Stage
                                  </div>
                                  {stages.filter(s => s.name !== lead.pipeline_stage).slice(0, 5).map((stage) => (
                                    <button
                                      key={stage.name}
                                      onClick={() => handleQuickStageChange(lead.id, stage.name)}
                                      className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 w-full text-left"
                                    >
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: stage.color }}
                                      />
                                      {stage.display_name}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
              <p className="text-sm text-neutral-600">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} leads
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = page < 3 ? i : page - 2 + i;
                  if (pageNum >= totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-sm',
                        page === pageNum
                          ? 'bg-primary-500 text-white'
                          : 'hover:bg-neutral-100 text-neutral-600'
                      )}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedLeads={selectedLeads}
        onClearSelection={() => setSelectedLeads([])}
        onActionComplete={() => {
          loadLeads();
          setSelectedLeads([]);
        }}
        onExport={handleExport}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        leads={selectedLeads.length > 0 ? selectedLeads : leads}
        exportType="leads"
      />
    </AdminLayout>
  );
};

export default LeadsList;
