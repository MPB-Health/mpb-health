import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  Mail,
  Phone,
} from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { PermissionGate } from '../components/PermissionGate';
import { AddLeadModal } from '../components/AddLeadModal';
import { AdvancedFiltersPanel } from '../components/AdvancedFiltersPanel';
import { BulkActionsToolbar } from '../components/BulkActionsToolbar';
import { BulkAssignModal } from '../components/BulkAssignModal';
import { BulkStageModal } from '../components/BulkStageModal';
import { BulkEmailModal } from '../components/BulkEmailModal';
import type { Lead, LeadFilters } from '@mpbhealth/crm-core';
import { formatTimeAgo, getPriorityColor, getPriorityLabel } from '@mpbhealth/crm-core';

export default function LeadsList() {
  const { leadService, pipelineStages } = useCRM();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const pageSize = 20;

  // Bulk selection state
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showBulkStage, setShowBulkStage] = useState(false);
  const [showBulkEmail, setShowBulkEmail] = useState(false);

  const loadLeads = async () => {
    setLoading(true);
    const { leads, total } = await leadService.getLeads(filters, pageSize, page * pageSize);
    setLeads(leads);
    setTotal(total);
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, [filters, page]);

  // Clear selection when filters or page change
  useEffect(() => {
    setSelectedLeads(new Set());
  }, [filters, page]);

  const handleSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
    setPage(0);
  };

  const handleStageFilter = (stage: string) => {
    setFilters((prev) => ({ ...prev, stage: stage || undefined }));
    setPage(0);
  };

  const handleExport = async () => {
    const exportLeads = await leadService.getLeadsForExport(undefined, filters);
    const csv = leadService.generateCSV(exportLeads);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportSelected = async () => {
    const ids = Array.from(selectedLeads);
    const exportLeads = await leadService.getLeadsForExport(ids);
    const csv = leadService.generateCSV(exportLeads);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-selected-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const toggleSelectAll = useCallback(() => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map((l) => l.id)));
    }
  }, [leads, selectedLeads.size]);

  const toggleSelectLead = useCallback((leadId: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) {
        next.delete(leadId);
      } else {
        next.add(leadId);
      }
      return next;
    });
  }, []);

  const handleBulkSuccess = () => {
    setSelectedLeads(new Set());
    loadLeads();
  };

  const selectedIds = Array.from(selectedLeads);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedLeads.size}
        onAssign={() => setShowBulkAssign(true)}
        onChangeStage={() => setShowBulkStage(true)}
        onSendEmail={() => setShowBulkEmail(true)}
        onExport={handleExportSelected}
        onClear={() => setSelectedLeads(new Set())}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Leads</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            {total} total leads
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-surface-primary border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <PermissionGate permission="leads.create">
            <button
              onClick={() => setShowAddLead(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 rounded-lg text-sm font-medium text-white hover:bg-th-accent-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
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
              placeholder="Search by name, email, or phone..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full text-th-text-secondary placeholder-th-text-tertiary"
            />
          </div>

          {/* Stage filter */}
          <div className="relative">
            <select
              value={filters.stage || ''}
              onChange={(e) => handleStageFilter(e.target.value)}
              className="appearance-none bg-surface-primary border border-th-border rounded-lg px-4 py-2 pr-10 text-sm text-th-text-secondary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
            >
              <option value="">All Stages</option>
              {pipelineStages.map((stage) => (
                <option key={stage.id} value={stage.name}>
                  {stage.display_name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
          </div>

          {/* More filters */}
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

      {/* Advanced filters */}
      {showFilters && (
        <AdvancedFiltersPanel
          filters={filters}
          onChange={(newFilters) => {
            setFilters((prev) => ({ ...prev, ...newFilters }));
            setPage(0);
          }}
        />
      )}

      {/* Leads table */}
      <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-th-accent-600" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-th-text-tertiary">
            <p>No leads found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-secondary border-b border-th-border">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedLeads.size === leads.length && leads.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-th-border"
                    />
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-th-text-tertiary uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-th-border">
                {leads.map((lead) => {
                  const stage = pipelineStages.find((s) => s.name === lead.pipeline_stage);
                  const priorityColors = getPriorityColor(lead.priority as any || 'normal');
                  const isSelected = selectedLeads.has(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-surface-secondary ${isSelected ? 'bg-th-accent-50' : ''}`}
                    >
                      <td className="w-12 px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLead(lead.id)}
                          className="w-4 h-4 rounded border-th-border"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="flex items-center space-x-3"
                        >
                          <div className="w-10 h-10 bg-th-accent-100 rounded-full flex items-center justify-center">
                            <span className="text-th-accent-700 font-medium text-sm">
                              {lead.first_name.charAt(0)}
                              {lead.last_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-th-text-primary hover:text-th-accent-600">
                              {lead.first_name} {lead.last_name}
                            </p>
                            {lead.zip_code && (
                              <p className="text-xs text-th-text-tertiary">
                                {lead.zip_code}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center text-sm text-th-text-secondary hover:text-th-accent-600"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            {lead.email}
                          </a>
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="flex items-center text-sm text-th-text-secondary hover:text-th-accent-600"
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              {lead.phone}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${stage?.color}20`,
                            color: stage?.color,
                          }}
                        >
                          {stage?.display_name || lead.pipeline_stage}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors.bg} ${priorityColors.text}`}
                        >
                          {getPriorityLabel(lead.priority as any || 'normal')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-th-text-tertiary">
                        {formatTimeAgo(lead.created_at)}
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
                  Showing {page * pageSize + 1} to{' '}
                  {Math.min((page + 1) * pageSize, total)} of {total}
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

      {/* Modals */}
      <AddLeadModal
        open={showAddLead}
        onClose={() => setShowAddLead(false)}
        onSuccess={() => loadLeads()}
      />
      <BulkAssignModal
        open={showBulkAssign}
        onClose={() => setShowBulkAssign(false)}
        leadIds={selectedIds}
        onSuccess={handleBulkSuccess}
      />
      <BulkStageModal
        open={showBulkStage}
        onClose={() => setShowBulkStage(false)}
        leadIds={selectedIds}
        onSuccess={handleBulkSuccess}
      />
      <BulkEmailModal
        open={showBulkEmail}
        onClose={() => setShowBulkEmail(false)}
        leadIds={selectedIds}
        onSuccess={handleBulkSuccess}
      />
    </div>
  );
}
