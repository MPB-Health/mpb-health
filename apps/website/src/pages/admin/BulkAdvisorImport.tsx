import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowLeft,
  Users,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Send,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface ParsedAdvisor {
  agent_id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  username: string;
  status: 'valid' | 'missing_email' | 'duplicate' | 'missing_name';
  duplicate_of?: string;
}

interface ImportResult {
  email: string;
  agent_id: string;
  status: 'created' | 'skipped' | 'error';
  reason?: string;
}

interface ImportSummary {
  total: number;
  created: number;
  skipped: number;
  errors: number;
}

type Step = 'upload' | 'preview' | 'importing' | 'results';

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function inferNameFromUsername(username: string): { first: string; last: string } {
  const cleaned = username.replace(/[_.-]/g, ' ').trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return {
      first: parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(),
      last: parts
        .slice(1)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' '),
    };
  }
  if (parts.length === 1 && parts[0]) {
    return { first: parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(), last: '' };
  }
  return { first: '', last: '' };
}

function deduplicateAndClean(rows: ParsedAdvisor[]): ParsedAdvisor[] {
  const emailMap = new Map<string, ParsedAdvisor>();
  const result: ParsedAdvisor[] = [];

  for (const row of rows) {
    if (!row.email) {
      result.push({ ...row, status: 'missing_email' });
      continue;
    }

    const key = row.email.toLowerCase().trim();
    const existing = emailMap.get(key);

    if (existing) {
      // Keep the record with more complete data
      const existingScore =
        (existing.first_name ? 1 : 0) + (existing.last_name ? 1 : 0) + (existing.company_name ? 1 : 0);
      const newScore = (row.first_name ? 1 : 0) + (row.last_name ? 1 : 0) + (row.company_name ? 1 : 0);

      if (newScore > existingScore) {
        emailMap.set(key, { ...row, status: 'valid' });
      }
      continue;
    }

    emailMap.set(key, { ...row, status: 'valid' });
  }

  // Build the final list: valid unique records only
  for (const advisor of emailMap.values()) {
    // Fill missing names from username
    if (!advisor.first_name && advisor.username) {
      const inferred = inferNameFromUsername(advisor.username);
      advisor.first_name = inferred.first;
      if (!advisor.last_name) advisor.last_name = inferred.last;
    }

    if (!advisor.first_name) {
      advisor.status = 'missing_name';
      advisor.first_name = 'Advisor';
    }

    result.push(advisor);
  }

  return result;
}

export default function BulkAdvisorImport() {
  const [step, setStep] = useState<Step>('upload');
  const [rawData, setRawData] = useState<ParsedAdvisor[]>([]);
  const [cleanData, setCleanData] = useState<ParsedAdvisor[]>([]);
  const [password, setPassword] = useState('MPBHealth2025!');
  const [showPassword, setShowPassword] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [invitesSent, setInvitesSent] = useState(false);
  const [inviteSummary, setInviteSummary] = useState<{
    total: number;
    sent: number;
    skipped: number;
    errors: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());

      if (lines.length < 2) {
        toast.error('CSV file is empty or has no data rows');
        return;
      }

      // Parse header
      const header = parseCSVLine(lines[0]);
      const agentIdIdx = header.findIndex((h) => h.toLowerCase().includes('agent id'));
      const firstNameIdx = header.findIndex((h) => h.toLowerCase().includes('first name'));
      const lastNameIdx = header.findIndex((h) => h.toLowerCase().includes('last name'));
      const emailIdx = header.findIndex((h) => h.toLowerCase().includes('email'));
      const companyIdx = header.findIndex((h) => h.toLowerCase().includes('company'));
      const usernameIdx = header.findIndex((h) => h.toLowerCase().includes('username'));

      if (emailIdx === -1) {
        toast.error('CSV must contain a column with "Email" in the header');
        return;
      }

      const parsed: ParsedAdvisor[] = [];
      for (let i = 1; i < lines.length; i++) {
        const fields = parseCSVLine(lines[i]);
        parsed.push({
          agent_id: agentIdIdx >= 0 ? fields[agentIdIdx] || '' : '',
          first_name: firstNameIdx >= 0 ? fields[firstNameIdx] || '' : '',
          last_name: lastNameIdx >= 0 ? fields[lastNameIdx] || '' : '',
          email: emailIdx >= 0 ? fields[emailIdx] || '' : '',
          company_name: companyIdx >= 0 ? fields[companyIdx] || '' : '',
          username: usernameIdx >= 0 ? fields[usernameIdx] || '' : '',
          status: 'valid',
        });
      }

      setRawData(parsed);
      const cleaned = deduplicateAndClean(parsed);
      setCleanData(cleaned);
      setStep('preview');
      toast.success(`Parsed ${parsed.length} rows, ${cleaned.filter((r) => r.status === 'valid').length} unique valid records`);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
        handleFileUpload(file);
      } else {
        toast.error('Please upload a .csv file');
      }
    },
    [handleFileUpload],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const removeRecord = (email: string) => {
    setCleanData((prev) => prev.filter((r) => r.email.toLowerCase() !== email.toLowerCase()));
  };

  const validRecords = cleanData.filter((r) => r.status === 'valid');
  const invalidRecords = cleanData.filter((r) => r.status !== 'valid');

  const handleImport = async () => {
    if (validRecords.length === 0) {
      toast.error('No valid records to import');
      return;
    }

    setImporting(true);
    setStep('importing');
    setProgress(0);

    try {
      // Send in batches of 50
      const batchSize = 50;
      const allResults: ImportResult[] = [];
      let totalCreated = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      for (let i = 0; i < validRecords.length; i += batchSize) {
        const batch = validRecords.slice(i, i + batchSize).map((r) => ({
          email: r.email,
          first_name: r.first_name,
          last_name: r.last_name,
          agent_id: r.agent_id,
          company_name: r.company_name,
        }));

        const { data, error } = await supabase.functions.invoke('bulk-create-advisors', {
          body: { advisors: batch, password },
        });

        if (error) {
          toast.error(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`);
          batch.forEach((r) =>
            allResults.push({ email: r.email, agent_id: r.agent_id, status: 'error', reason: error.message }),
          );
          totalErrors += batch.length;
        } else if (data) {
          allResults.push(...(data.results || []));
          totalCreated += data.summary?.created || 0;
          totalSkipped += data.summary?.skipped || 0;
          totalErrors += data.summary?.errors || 0;
        }

        setProgress(Math.min(100, Math.round(((i + batchSize) / validRecords.length) * 100)));
      }

      setResults(allResults);
      setSummary({
        total: validRecords.length,
        created: totalCreated,
        skipped: totalSkipped,
        errors: totalErrors,
      });
      setStep('results');

      if (totalErrors === 0) {
        toast.success(`Successfully created ${totalCreated} advisor accounts!`);
      } else {
        toast(`Created ${totalCreated}, skipped ${totalSkipped}, errors ${totalErrors}`, {
          icon: '⚠️',
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const handleSendInvites = async () => {
    if (!summary || summary.created === 0) {
      toast.error('No newly created accounts to send invites to');
      return;
    }

    setSendingInvites(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-advisor-invites', {
        body: { send_all_pending: true, password },
      });

      if (error) {
        toast.error(`Failed to send invites: ${error.message}`);
        return;
      }

      setInviteSummary(data.summary);
      setInvitesSent(true);

      if (data.summary.errors === 0) {
        toast.success(`Sent ${data.summary.sent} invite emails!`);
      } else {
        toast(`Sent ${data.summary.sent}, ${data.summary.errors} failed`, { icon: '⚠️' });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invites');
    } finally {
      setSendingInvites(false);
    }
  };

  const resetAll = () => {
    setStep('upload');
    setRawData([]);
    setCleanData([]);
    setResults([]);
    setSummary(null);
    setProgress(0);
    setInvitesSent(false);
    setInviteSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to User Management
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Advisor Import</h1>
        <p className="mt-1 text-gray-600">
          Upload a CSV file to create advisor portal accounts in bulk. Each advisor will receive a
          generic password and be prompted to change it on first login.
        </p>
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload CSV file"
          />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Drop your CSV file here or click to browse
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Expected columns: Agent ID, Username, User First Name, User Last Name, User Email
            Address, User Company Name
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            <FileSpreadsheet className="w-4 h-4" />
            Select CSV File
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-500">Raw Rows</p>
              <p className="text-2xl font-bold text-gray-900">{rawData.length}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-500">Valid Unique</p>
              <p className="text-2xl font-bold text-green-600">{validRecords.length}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-500">Dropped/Invalid</p>
              <p className="text-2xl font-bold text-yellow-600">
                {rawData.length - validRecords.length}
              </p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-500">Missing Email</p>
              <p className="text-2xl font-bold text-red-600">{invalidRecords.filter((r) => r.status === 'missing_email').length}</p>
            </div>
          </div>

          {/* Password config */}
          <div className="bg-white border rounded-lg p-4">
            <label htmlFor="generic-password" className="block text-sm font-medium text-gray-700 mb-1.5">
              Generic password for all new accounts
            </label>
            <div className="relative max-w-sm">
              <input
                id="generic-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Advisors will be required to change this password on their first login.
            </p>
          </div>

          {/* Preview table */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Preview — {validRecords.length} accounts will be created
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={resetAll}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border rounded-lg hover:bg-gray-50"
                >
                  Start Over
                </button>
                <button
                  onClick={handleImport}
                  disabled={validRecords.length === 0 || !password}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Import {validRecords.length} Advisors
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Agent ID
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Company
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cleanData.map((row, i) => (
                    <tr
                      key={`${row.email || row.agent_id}-${i}`}
                      className={
                        row.status !== 'valid' ? 'bg-yellow-50/50' : 'hover:bg-gray-50'
                      }
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        {row.status === 'valid' && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        {row.status === 'missing_email' && (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <XCircle className="w-3.5 h-3.5" /> No email
                          </span>
                        )}
                        {row.status === 'missing_name' && (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                            <AlertCircle className="w-3.5 h-3.5" /> Name inferred
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 font-mono">
                        {row.agent_id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {row.first_name} {row.last_name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">{row.email}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {row.company_name || '—'}
                      </td>
                      <td className="px-4 py-2">
                        {row.status === 'valid' && (
                          <button
                            onClick={() => removeRecord(row.email)}
                            className="text-gray-400 hover:text-red-500"
                            title="Remove from import"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="bg-white border rounded-xl p-12 text-center">
          <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating advisor accounts...</h3>
          <p className="text-gray-600 mb-6">
            Processing {validRecords.length} records. Please do not close this page.
          </p>
          <div className="max-w-md mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">{progress}% complete</p>
          </div>
        </div>
      )}

      {/* Step: Results */}
      {step === 'results' && summary && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-500">Total Processed</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            </div>
            <div className="bg-white border-2 border-green-200 rounded-lg p-4 bg-green-50">
              <p className="text-sm text-green-600">Created</p>
              <p className="text-2xl font-bold text-green-700">{summary.created}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-500">Skipped</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.skipped}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-500">Errors</p>
              <p className="text-2xl font-bold text-red-600">{summary.errors}</p>
            </div>
          </div>

          {/* Send Invite Emails */}
          {summary.created > 0 && (
            <div className="bg-white border-2 border-teal-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-50 rounded-lg shrink-0">
                  <Mail className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Send Invite Emails
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Send a welcome email to all {summary.created} newly created advisor accounts with their login credentials
                    and a link to the Advisor Portal. Each email includes their temporary password and instructions to change it.
                  </p>

                  {inviteSummary && (
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-green-700">{inviteSummary.sent}</p>
                        <p className="text-xs text-green-600">Sent</p>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-yellow-700">{inviteSummary.skipped}</p>
                        <p className="text-xs text-yellow-600">Skipped</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-red-700">{inviteSummary.errors}</p>
                        <p className="text-xs text-red-600">Failed</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    {invitesSent ? (
                      <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Invite emails have been sent
                      </div>
                    ) : (
                      <button
                        onClick={handleSendInvites}
                        disabled={sendingInvites}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sendingInvites ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending Invites...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Invite Emails to {summary.created} Advisors
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results table */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Import Results</h3>
              <div className="flex gap-2">
                <button
                  onClick={resetAll}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Import Another CSV
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Agent ID
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r, i) => (
                    <tr
                      key={`${r.email}-${i}`}
                      className={
                        r.status === 'error'
                          ? 'bg-red-50/50'
                          : r.status === 'skipped'
                            ? 'bg-yellow-50/50'
                            : ''
                      }
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        {r.status === 'created' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Created
                          </span>
                        )}
                        {r.status === 'skipped' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Skipped
                          </span>
                        )}
                        {r.status === 'error' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">{r.email}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 font-mono">{r.agent_id}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{r.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
