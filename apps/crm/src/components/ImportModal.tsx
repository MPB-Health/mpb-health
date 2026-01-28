import { useState, useCallback, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import type { ImportFieldMapping, ImportPreview, ImportResult } from '@mpbhealth/crm-core';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'leads' | 'contacts';
  onSuccess?: (result: ImportResult) => void;
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export function ImportModal({ isOpen, onClose, entityType, onSuccess }: ImportModalProps) {
  const { importService } = useCRM();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [csvContent, setCsvContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mappings, setMappings] = useState<ImportFieldMapping[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Options
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [source, setSource] = useState('CSV Import');

  const targetFields = entityType === 'leads'
    ? ['first_name', 'last_name', 'email', 'phone', 'company', 'title', 'source', 'notes']
    : ['first_name', 'last_name', 'email', 'phone', 'mobile', 'title', 'department', 'mailing_address', 'mailing_city', 'mailing_state', 'mailing_zip'];

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);

    try {
      const content = await file.text();
      setCsvContent(content);

      const previewData = importService.parseCSVPreview(content, entityType);
      setPreview(previewData);
      setMappings(previewData.suggestedMappings);
      setStep('mapping');
    } catch (err) {
      setError('Failed to read file. Please ensure it is a valid CSV file.');
    }
  }, [importService, entityType]);

  const handleMappingChange = (index: number, targetField: string) => {
    const newMappings = [...mappings];
    newMappings[index] = { ...newMappings[index], targetField };
    setMappings(newMappings);
  };

  const handleImport = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const options = {
        skipDuplicates,
        duplicateCheckFields: ['email'],
        updateExisting: false,
        defaultValues: {},
        source,
        tags: [],
      };

      let importResult: ImportResult;
      if (entityType === 'leads') {
        importResult = await importService.importLeads(csvContent, mappings, options);
      } else {
        importResult = await importService.importContacts(csvContent, mappings, options);
      }

      setResult(importResult);
      setStep('complete');
      onSuccess?.(importResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAndClose = () => {
    setStep('upload');
    setCsvContent('');
    setFileName('');
    setPreview(null);
    setMappings([]);
    setResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={resetAndClose} />

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-th-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-th-text-primary">
              Import {entityType === 'leads' ? 'Leads' : 'Contacts'}
            </h2>
            <button
              onClick={resetAndClose}
              className="p-1 rounded hover:bg-surface-secondary transition-colors"
            >
              <X className="w-5 h-5 text-th-text-tertiary" />
            </button>
          </div>

          {/* Steps indicator */}
          <div className="px-6 py-3 bg-surface-secondary border-b border-th-border">
            <div className="flex items-center gap-2 text-sm">
              <span className={step === 'upload' ? 'text-th-accent-600 font-medium' : 'text-th-text-tertiary'}>
                1. Upload
              </span>
              <ArrowRight className="w-4 h-4 text-th-text-tertiary" />
              <span className={step === 'mapping' ? 'text-th-accent-600 font-medium' : 'text-th-text-tertiary'}>
                2. Map Fields
              </span>
              <ArrowRight className="w-4 h-4 text-th-text-tertiary" />
              <span className={step === 'importing' || step === 'complete' ? 'text-th-accent-600 font-medium' : 'text-th-text-tertiary'}>
                3. Import
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Step 1: Upload */}
            {step === 'upload' && (
              <div className="text-center py-8">
                <FileSpreadsheet className="w-16 h-16 mx-auto text-th-text-tertiary mb-4" />
                <h3 className="text-lg font-medium text-th-text-primary mb-2">
                  Upload CSV File
                </h3>
                <p className="text-sm text-th-text-secondary mb-6 max-w-md mx-auto">
                  Select a CSV file containing your {entityType}. The first row should contain column headers.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-th-accent-600 text-white rounded-lg hover:bg-th-accent-700 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Select CSV File
                </button>

                <p className="mt-4 text-xs text-th-text-tertiary">
                  Maximum file size: 10MB. Supported format: CSV
                </p>
              </div>
            )}

            {/* Step 2: Mapping */}
            {step === 'mapping' && preview && (
              <div>
                <div className="mb-4">
                  <p className="text-sm text-th-text-secondary">
                    <span className="font-medium">{fileName}</span> - {preview.totalRows} rows detected
                  </p>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-th-text-primary mb-3">Field Mapping</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {mappings.map((mapping, index) => (
                      <div key={index} className="flex items-center gap-4 p-2 bg-surface-secondary rounded-lg">
                        <div className="w-1/3">
                          <span className="text-sm font-medium text-th-text-primary">
                            {mapping.sourceColumn}
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-th-text-tertiary flex-shrink-0" />
                        <div className="flex-1">
                          <select
                            value={mapping.targetField}
                            onChange={(e) => handleMappingChange(index, e.target.value)}
                            className="w-full border border-th-border rounded px-2 py-1 text-sm"
                          >
                            <option value="">-- Skip this column --</option>
                            {targetFields.map((field) => (
                              <option key={field} value={field}>
                                {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-th-text-primary mb-3">Import Options</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={skipDuplicates}
                        onChange={(e) => setSkipDuplicates(e.target.checked)}
                        className="h-4 w-4 rounded border-th-border text-th-accent-600"
                      />
                      <span className="text-sm text-th-text-secondary">Skip duplicate records (based on email)</span>
                    </label>

                    <div>
                      <label className="block text-sm text-th-text-secondary mb-1">Source Label</label>
                      <input
                        type="text"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="w-full border border-th-border rounded-lg px-3 py-2 text-sm"
                        placeholder="e.g., CSV Import, Trade Show 2024"
                      />
                    </div>
                  </div>
                </div>

                {/* Sample data preview */}
                {preview.sampleRows.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-th-text-primary mb-3">Data Preview</h4>
                    <div className="overflow-x-auto border border-th-border rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead className="bg-surface-secondary">
                          <tr>
                            {preview.headers.map((h) => (
                              <th key={h} className="px-3 py-2 text-left text-xs font-medium text-th-text-secondary">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-th-border">
                          {preview.sampleRows.slice(0, 3).map((row, i) => (
                            <tr key={i}>
                              {preview.headers.map((h) => (
                                <td key={h} className="px-3 py-2 text-th-text-primary truncate max-w-[150px]">
                                  {row[h]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Importing */}
            {step === 'importing' && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 mx-auto text-th-accent-600 animate-spin mb-4" />
                <h3 className="text-lg font-medium text-th-text-primary mb-2">
                  Importing...
                </h3>
                <p className="text-sm text-th-text-secondary">
                  Please wait while we process your data.
                </p>
              </div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && result && (
              <div className="text-center py-8">
                {result.successCount > 0 ? (
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                ) : (
                  <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                )}

                <h3 className="text-lg font-medium text-th-text-primary mb-4">
                  Import Complete
                </h3>

                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.successCount}</div>
                    <div className="text-xs text-green-700">Imported</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{result.duplicateCount}</div>
                    <div className="text-xs text-yellow-700">Skipped</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{result.errorCount}</div>
                    <div className="text-xs text-red-700">Errors</div>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="text-left max-h-32 overflow-y-auto border border-th-border rounded-lg p-3 mb-4">
                    <h4 className="text-sm font-medium text-th-text-primary mb-2">Errors:</h4>
                    <ul className="text-xs text-red-600 space-y-1">
                      {result.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>Row {err.row}: {err.message}</li>
                      ))}
                      {result.errors.length > 10 && (
                        <li>...and {result.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-th-border flex items-center justify-end gap-3">
            {step === 'mapping' && (
              <>
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 border border-th-border rounded-lg text-sm font-medium text-th-text-secondary hover:bg-surface-secondary"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setStep('importing');
                    handleImport();
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700 disabled:opacity-50"
                >
                  Start Import
                </button>
              </>
            )}

            {step === 'complete' && (
              <button
                onClick={resetAndClose}
                className="px-4 py-2 bg-th-accent-600 text-white rounded-lg text-sm font-medium hover:bg-th-accent-700"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
