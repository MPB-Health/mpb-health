import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, X, Check } from 'lucide-react';
import type { Lead, CRMDashboardStats, PipelineStage } from '../../../lib/crmService';
import { crmService } from '../../../lib/crmService';
import { pdfExportService } from '../../../lib/pdfExportService';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads?: Lead[];
  stats?: CRMDashboardStats;
  stages?: PipelineStage[];
  leadsByStage?: Record<string, Lead[]>;
  exportType?: 'leads' | 'pipeline' | 'single';
  singleLead?: Lead;
}

const availableColumns = [
  { key: 'first_name', label: 'First Name', default: true },
  { key: 'last_name', label: 'Last Name', default: true },
  { key: 'email', label: 'Email', default: true },
  { key: 'phone', label: 'Phone', default: true },
  { key: 'zip_code', label: 'ZIP Code', default: true },
  { key: 'pipeline_stage', label: 'Pipeline Stage', default: true },
  { key: 'priority', label: 'Priority', default: true },
  { key: 'lead_score', label: 'Lead Score', default: false },
  { key: 'source_cta', label: 'Source CTA', default: true },
  { key: 'source_page', label: 'Source Page', default: false },
  { key: 'utm_source', label: 'UTM Source', default: false },
  { key: 'utm_medium', label: 'UTM Medium', default: false },
  { key: 'utm_campaign', label: 'UTM Campaign', default: false },
  { key: 'current_insurance', label: 'Current Insurance', default: false },
  { key: 'monthly_premium', label: 'Monthly Premium', default: false },
  { key: 'coverage_preference', label: 'Coverage Preference', default: false },
  { key: 'primary_concern', label: 'Primary Concern', default: false },
  { key: 'contact_preference', label: 'Contact Preference', default: false },
  { key: 'tags', label: 'Tags', default: true },
  { key: 'created_at', label: 'Created Date', default: true },
  { key: 'last_contacted_at', label: 'Last Contacted', default: false },
  { key: 'next_followup_at', label: 'Next Follow-up', default: false },
  { key: 'zoho_sync_status', label: 'Zoho Status', default: false },
  { key: 'zoho_lead_id', label: 'Zoho Lead ID', default: false },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  leads = [],
  stats,
  stages = [],
  leadsByStage = {},
  exportType = 'leads',
  singleLead,
}) => {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    availableColumns.filter(c => c.default).map(c => c.key)
  );
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    setSelectedColumns(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelectedColumns(availableColumns.map(c => c.key));
  };

  const selectNone = () => {
    setSelectedColumns([]);
  };

  const selectDefault = () => {
    setSelectedColumns(availableColumns.filter(c => c.default).map(c => c.key));
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      if (exportType === 'single' && singleLead) {
        // Export single lead report
        const activities = await crmService.getActivities(singleLead.id, 20);
        const tasks = await crmService.getTasks(singleLead.id, true);
        
        pdfExportService.exportLeadReport({
          lead: singleLead,
          activities,
          tasks,
        });
      } else if (exportType === 'pipeline' && stats && stages.length > 0) {
        // Export pipeline summary
        pdfExportService.exportPipelineSummary(stats, stages, leadsByStage);
      } else if (format === 'csv') {
        // Export leads as CSV
        const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
        crmService.downloadCSV(leads, filename, selectedColumns);
      } else {
        // Export leads as PDF
        pdfExportService.exportLeadsList(leads, {
          title: `Leads Report (${leads.length} leads)`,
          columns: selectedColumns,
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export. Please try again.');
    }

    setIsExporting(false);
    onClose();
  };

  const getExportDescription = () => {
    if (exportType === 'single') {
      return `Export detailed report for ${singleLead?.first_name} ${singleLead?.last_name}`;
    }
    if (exportType === 'pipeline') {
      return 'Export pipeline summary with stage breakdown and metrics';
    }
    return `Export ${leads.length} lead${leads.length !== 1 ? 's' : ''} to ${format.toUpperCase()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Export Data</h2>
            <p className="text-sm text-neutral-500 mt-0.5">{getExportDescription()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Format Selection (not for single lead) */}
          {exportType !== 'single' && exportType !== 'pipeline' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormat('csv')}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border-2 transition-colors',
                    format === 'csv'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-lg',
                    format === 'csv' ? 'bg-primary-100' : 'bg-neutral-100'
                  )}>
                    <FileSpreadsheet className={cn(
                      'h-6 w-6',
                      format === 'csv' ? 'text-primary-600' : 'text-neutral-500'
                    )} />
                  </div>
                  <div className="text-left">
                    <p className={cn(
                      'font-medium',
                      format === 'csv' ? 'text-primary-900' : 'text-neutral-700'
                    )}>CSV</p>
                    <p className="text-xs text-neutral-500">Excel compatible</p>
                  </div>
                  {format === 'csv' && (
                    <Check className="h-5 w-5 text-primary-500 ml-auto" />
                  )}
                </button>

                <button
                  onClick={() => setFormat('pdf')}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border-2 transition-colors',
                    format === 'pdf'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <div className={cn(
                    'p-2 rounded-lg',
                    format === 'pdf' ? 'bg-primary-100' : 'bg-neutral-100'
                  )}>
                    <FileText className={cn(
                      'h-6 w-6',
                      format === 'pdf' ? 'text-primary-600' : 'text-neutral-500'
                    )} />
                  </div>
                  <div className="text-left">
                    <p className={cn(
                      'font-medium',
                      format === 'pdf' ? 'text-primary-900' : 'text-neutral-700'
                    )}>PDF</p>
                    <p className="text-xs text-neutral-500">Formatted report</p>
                  </div>
                  {format === 'pdf' && (
                    <Check className="h-5 w-5 text-primary-500 ml-auto" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Column Selection (only for CSV and leads export) */}
          {exportType === 'leads' && format === 'csv' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-neutral-700">
                  Columns to Include
                </label>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={selectAll}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Select All
                  </button>
                  <span className="text-neutral-300">|</span>
                  <button
                    onClick={selectNone}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    None
                  </button>
                  <span className="text-neutral-300">|</span>
                  <button
                    onClick={selectDefault}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Default
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                {availableColumns.map((column) => (
                  <label
                    key={column.key}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                      selectedColumns.includes(column.key)
                        ? 'bg-primary-50'
                        : 'hover:bg-neutral-50'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(column.key)}
                      onChange={() => toggleColumn(column.key)}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className={cn(
                      'text-sm',
                      selectedColumns.includes(column.key)
                        ? 'text-primary-700 font-medium'
                        : 'text-neutral-600'
                    )}>
                      {column.label}
                    </span>
                  </label>
                ))}
              </div>

              <p className="mt-3 text-xs text-neutral-500">
                {selectedColumns.length} of {availableColumns.length} columns selected
              </p>
            </div>
          )}

          {/* PDF Preview Info */}
          {(format === 'pdf' || exportType === 'pipeline' || exportType === 'single') && (
            <div className="bg-neutral-50 rounded-lg p-4">
              <h4 className="font-medium text-neutral-900 mb-2">PDF will include:</h4>
              <ul className="space-y-1 text-sm text-neutral-600">
                {exportType === 'single' ? (
                  <>
                    <li>• Contact information</li>
                    <li>• Lead status and scoring</li>
                    <li>• Coverage preferences</li>
                    <li>• Recent activities (up to 8)</li>
                    <li>• Open tasks</li>
                  </>
                ) : exportType === 'pipeline' ? (
                  <>
                    <li>• Key metrics overview</li>
                    <li>• Pipeline stage breakdown</li>
                    <li>• Priority distribution</li>
                    <li>• Conversion analytics</li>
                  </>
                ) : (
                  <>
                    <li>• MPB Health branding</li>
                    <li>• Lead table with key columns</li>
                    <li>• Summary statistics</li>
                    <li>• Page numbers and timestamps</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            {exportType === 'leads' && (
              <>
                {leads.length} lead{leads.length !== 1 ? 's' : ''} will be exported
              </>
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || (exportType === 'leads' && format === 'csv' && selectedColumns.length === 0)}
            >
              {isExporting ? (
                <>Exporting...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
