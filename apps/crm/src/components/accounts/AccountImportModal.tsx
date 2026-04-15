import { useState } from 'react';
import { Modal } from '../Modal';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, Table, Loader2 } from 'lucide-react';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface FieldMapping { csvColumn: string; crmField: string; }
interface AccountImportModalProps { open: boolean; onClose: () => void; onImportComplete?: () => void; }

const CRM_FIELDS = ['name', 'account_type', 'industry', 'phone', 'email', 'website', 'rating', 'description', 'billing_address', 'shipping_address', '— Skip —'];

const MOCK_CSV_COLUMNS = ['Company Name', 'Type', 'Industry', 'Phone Number', 'Email', 'Website', 'Rating'];
const MOCK_PREVIEW = [
  ['Horizon Health', 'customer', 'Healthcare', '555-1234', 'info@horizon.com', 'horizon.com', 'warm'],
  ['Peak Insurance', 'prospect', 'Insurance', '555-5678', 'sales@peak.com', 'peak.com', 'hot'],
  ['Valley Care Group', 'customer', 'Healthcare', '555-9012', 'admin@valley.com', '', 'cold'],
];

const DEFAULT_MAPPINGS: FieldMapping[] = [
  { csvColumn: 'Company Name', crmField: 'name' },
  { csvColumn: 'Type', crmField: 'account_type' },
  { csvColumn: 'Industry', crmField: 'industry' },
  { csvColumn: 'Phone Number', crmField: 'phone' },
  { csvColumn: 'Email', crmField: 'email' },
  { csvColumn: 'Website', crmField: 'website' },
  { csvColumn: 'Rating', crmField: 'rating' },
];

export function AccountImportModal({ open, onClose, onImportComplete }: AccountImportModalProps) {
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'importing' | 'done'>('upload');
  const [mappings, setMappings] = useState(DEFAULT_MAPPINGS);
  const [importResult, setImportResult] = useState({ success: 0, errors: 0 });

  const handleFileSelect = () => {
    setStep('map');
  };

  const handleStartImport = async () => {
    setStep('importing');
    await new Promise((r) => setTimeout(r, 1500));
    setImportResult({ success: 3, errors: 0 });
    setStep('done');
    onImportComplete?.();
  };

  const updateMapping = (idx: number, crmField: string) => {
    setMappings((prev) => prev.map((m, i) => i === idx ? { ...m, crmField } : m));
  };

  const handleClose = () => {
    setStep('upload');
    setMappings(DEFAULT_MAPPINGS);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Accounts" size="xl">
      <div className="space-y-4">
        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {['Upload', 'Map Fields', 'Preview', 'Import'].map((s, i) => {
            const stepIdx = ['upload', 'map', 'preview', 'importing'].indexOf(step);
            const isDone = i < stepIdx || step === 'done';
            const isActive = i === stepIdx;
            return (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className={cn('w-6 h-0.5', isDone ? 'bg-green-500' : 'bg-surface-tertiary')} />}
                <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium',
                  isDone ? 'bg-green-500/10 text-green-500' : isActive ? 'bg-th-accent-500/10 text-th-accent-500' : 'text-th-text-tertiary'
                )}>
                  {isDone ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border text-center text-[8px] leading-3">{i + 1}</span>}
                  {s}
                </div>
              </div>
            );
          })}
        </div>

        {step === 'upload' && (
          <div className="py-8">
            <button onClick={handleFileSelect}
              className="w-full py-10 rounded-xl border-2 border-dashed border-th-border/50 flex flex-col items-center gap-3 hover:border-th-accent-500/50 hover:bg-th-accent-500/5 transition-all">
              <Upload className="w-8 h-8 text-th-text-tertiary" />
              <div className="text-center">
                <p className="text-sm font-medium text-th-text-primary">Drop CSV file here or click to browse</p>
                <p className="text-xs text-th-text-tertiary mt-1">Supports .csv and .xlsx files up to 10MB</p>
              </div>
            </button>
          </div>
        )}

        {step === 'map' && (
          <>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-xs text-blue-700 dark:text-blue-300">Found {MOCK_CSV_COLUMNS.length} columns and {MOCK_PREVIEW.length} rows in your file</span>
            </div>

            <div className="rounded-xl border border-th-border/50 overflow-hidden">
              <div className="px-3 py-2 bg-surface-secondary/50 flex items-center">
                <span className="flex-1 text-[10px] font-semibold text-th-text-tertiary uppercase">CSV Column</span>
                <ArrowRight className="w-3 h-3 text-th-text-tertiary mx-2" />
                <span className="flex-1 text-[10px] font-semibold text-th-text-tertiary uppercase">CRM Field</span>
              </div>
              {mappings.map((m, idx) => (
                <div key={m.csvColumn} className="flex items-center px-3 py-2 border-t border-th-border/30">
                  <span className="flex-1 text-xs text-th-text-primary font-medium">{m.csvColumn}</span>
                  <ArrowRight className="w-3 h-3 text-th-text-tertiary mx-2" />
                  <select value={m.crmField} onChange={(e) => updateMapping(idx, e.target.value)}
                    className="flex-1 text-xs rounded-lg border border-th-border/50 bg-surface-primary px-2 py-1.5 focus:outline-none">
                    {CRM_FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep('upload')} className="px-4 py-2 rounded-xl border border-th-border text-xs font-medium text-th-text-secondary">Back</button>
              <div className="flex-1" />
              <button onClick={() => setStep('preview')} className="px-4 py-2 rounded-xl bg-th-accent-500 text-white text-xs font-medium hover:bg-th-accent-600">
                Preview Import
              </button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="rounded-xl border border-th-border/50 overflow-hidden overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-secondary/50">
                    {mappings.filter((m) => m.crmField !== '— Skip —').map((m) => (
                      <th key={m.csvColumn} className="text-left px-3 py-2 font-medium text-th-text-tertiary">{m.crmField}</th>
                    ))}
                    <th className="text-center px-3 py-2 font-medium text-th-text-tertiary">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PREVIEW.map((row, idx) => (
                    <tr key={idx} className="border-t border-th-border/30">
                      {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-th-text-primary">{cell || '—'}</td>)}
                      <td className="px-3 py-2 text-center">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setStep('map')} className="px-4 py-2 rounded-xl border border-th-border text-xs font-medium text-th-text-secondary">Back</button>
              <div className="flex-1" />
              <button onClick={handleStartImport} className="px-4 py-2 rounded-xl bg-th-accent-500 text-white text-xs font-medium hover:bg-th-accent-600">
                Import {MOCK_PREVIEW.length} Accounts
              </button>
            </div>
          </>
        )}

        {step === 'importing' && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-th-accent-500 mx-auto animate-spin" />
            <p className="text-sm font-medium text-th-text-primary">Importing accounts...</p>
            <p className="text-xs text-th-text-tertiary">This may take a moment</p>
          </div>
        )}

        {step === 'done' && (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <p className="text-lg font-bold text-th-text-primary">Import Complete</p>
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm text-green-500 font-medium">{importResult.success} imported</span>
              {importResult.errors > 0 && <span className="text-sm text-red-500 font-medium">{importResult.errors} errors</span>}
            </div>
            <button onClick={handleClose}
              className="px-6 py-2.5 rounded-xl bg-th-accent-500 text-white text-sm font-medium hover:bg-th-accent-600">Done</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
