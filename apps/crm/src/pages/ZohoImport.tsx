import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useOrg } from '../contexts/OrgContext';
import { useAuth } from '../contexts/AuthContext';

interface ZohoLead {
  id: string;
  First_Name: string;
  Last_Name: string;
  Email: string;
  Phone: string;
  Company?: string;
  Lead_Source?: string;
  Lead_Status?: string;
  Created_Time?: string;
  Modified_Time?: string;
}

interface ConnectionStatus {
  connected: boolean;
  configured: boolean;
  error?: string;
}

export default function ZohoImport() {
  const { activeOrgId } = useOrg();
  const { user } = useAuth();

  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<ZohoLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Supabase URL from environment
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/zoho-crm`;

  useEffect(() => {
    checkConnection();
  }, []);

  const getHeaders = async (): Promise<HeadersInit> => {
    const { supabase } = await import('@mpbhealth/database');
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  const checkConnection = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const response = await fetch(`${edgeFunctionUrl}?action=health`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setStatus({
          connected: false,
          configured: data.configured || false,
          error: data.error || 'Failed to connect',
        });
      } else {
        const data = await response.json();
        setStatus({
          connected: data.connected || false,
          configured: data.configured || false,
        });
      }
    } catch (error) {
      setStatus({
        connected: false,
        configured: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async (pageNum: number = 1) => {
    setFetching(true);
    try {
      const headers = await getHeaders();
      const params = new URLSearchParams({
        action: 'list',
        page: pageNum.toString(),
        per_page: '50',
        sort_by: 'Modified_Time',
        sort_order: 'desc',
      });

      const response = await fetch(`${edgeFunctionUrl}?${params}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch leads');
      }

      const result = await response.json();
      const newLeads = result.data || [];

      if (pageNum === 1) {
        setLeads(newLeads);
      } else {
        setLeads(prev => [...prev, ...newLeads]);
      }

      setPage(pageNum);
      setHasMore(result.info?.more_records || false);
      toast.success(`Fetched ${newLeads.length} leads from Zoho`);
    } catch (error) {
      console.error('Fetch leads error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch leads');
    } finally {
      setFetching(false);
    }
  };

  const importSelectedLeads = async () => {
    if (selectedLeads.size === 0) {
      toast.error('Please select leads to import');
      return;
    }

    const leadsToImport = leads.filter(l => selectedLeads.has(l.id));
    setImporting(true);
    setProgress({ current: 0, total: leadsToImport.length });

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    const { supabase } = await import('@mpbhealth/database');

    for (let i = 0; i < leadsToImport.length; i++) {
      const lead = leadsToImport[i];
      setProgress({ current: i + 1, total: leadsToImport.length });

      if (!lead.Email) {
        skipped++;
        errors.push(`${lead.First_Name} ${lead.Last_Name}: Missing email`);
        continue;
      }

      try {
        // Check if exists
        const { data: existing } = await supabase
          .from('zoho_lead_submissions')
          .select('id')
          .eq('email', lead.Email.toLowerCase())
          .single();

        if (existing) {
          skipped++;
          continue;
        }

        // Insert lead
        const { error } = await supabase
          .from('zoho_lead_submissions')
          .insert({
            first_name: lead.First_Name || '',
            last_name: lead.Last_Name || '',
            email: lead.Email.toLowerCase(),
            phone: lead.Phone || '',
            source_page: lead.Lead_Source || 'Zoho Import',
            zoho_lead_id: lead.id,
            zoho_sync_status: 'success',
            zoho_last_sync_at: new Date().toISOString(),
            form_data: {
              imported_from: 'zoho',
              zoho_created: lead.Created_Time,
              zoho_modified: lead.Modified_Time,
              company: lead.Company,
              lead_status: lead.Lead_Status,
            },
          });

        if (error) {
          throw new Error(error.message);
        }

        imported++;
      } catch (error) {
        errors.push(`${lead.Email}: ${error instanceof Error ? error.message : 'Failed'}`);
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setImporting(false);
    setSelectedLeads(new Set());

    if (imported > 0) {
      toast.success(`Imported ${imported} leads${skipped > 0 ? `, skipped ${skipped}` : ''}`);
    } else if (skipped > 0) {
      toast.success(`All ${skipped} leads already existed`);
    }

    if (errors.length > 0) {
      console.error('Import errors:', errors);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLeads(newSelected);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Import from Zoho</h1>
          <p className="text-th-text-tertiary text-sm mt-1">
            Import existing leads from your Zoho CRM account
          </p>
        </div>
        <button
          onClick={checkConnection}
          className="flex items-center gap-2 px-4 py-2 border border-th-border rounded-lg hover:bg-surface-secondary transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </button>
      </div>

      {/* Connection Status */}
      <div className={`p-4 rounded-lg border ${
        status?.connected
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : status?.configured
          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center gap-3">
          {status?.connected ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : status?.configured ? (
            <AlertCircle className="w-5 h-5 text-amber-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <div>
            <p className={`font-medium ${
              status?.connected
                ? 'text-green-800 dark:text-green-200'
                : status?.configured
                ? 'text-amber-800 dark:text-amber-200'
                : 'text-red-800 dark:text-red-200'
            }`}>
              {status?.connected
                ? 'Connected to Zoho CRM'
                : status?.configured
                ? 'Zoho CRM configured but not connected'
                : 'Zoho CRM not configured'}
            </p>
            {status?.error && (
              <p className="text-sm text-th-text-tertiary mt-1">{status.error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {status?.connected && (
        <div className="flex items-center gap-4">
          <button
            onClick={() => fetchLeads(1)}
            disabled={fetching}
            className="flex items-center gap-2 px-4 py-2 bg-th-accent-600 text-white rounded-lg font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
          >
            {fetching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {fetching ? 'Fetching...' : 'Fetch Leads from Zoho'}
          </button>

          {leads.length > 0 && (
            <button
              onClick={importSelectedLeads}
              disabled={importing || selectedLeads.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing {progress.current}/{progress.total}...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Import Selected ({selectedLeads.size})
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Leads List */}
      {leads.length > 0 && (
        <div className="bg-surface-primary rounded-xl border border-th-border overflow-hidden">
          <div className="px-4 py-3 border-b border-th-border bg-surface-secondary flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLeads.size === leads.length}
                onChange={toggleSelectAll}
                className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
              />
              <span className="text-sm font-medium text-th-text-secondary">
                Select All ({leads.length} leads)
              </span>
            </label>
            {hasMore && (
              <button
                onClick={() => fetchLeads(page + 1)}
                disabled={fetching}
                className="text-sm text-th-accent-600 hover:underline"
              >
                Load more...
              </button>
            )}
          </div>

          <div className="divide-y divide-th-border-subtle">
            {leads.map((lead) => (
              <div key={lead.id} className="hover:bg-surface-secondary/50">
                <div
                  className="px-4 py-3 flex items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedLeads.has(lead.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelect(lead.id);
                    }}
                    className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-th-text-tertiary" />
                      <span className="font-medium text-th-text-primary">
                        {lead.First_Name} {lead.Last_Name}
                      </span>
                      {lead.Lead_Status && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          {lead.Lead_Status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-th-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {lead.Email || 'No email'}
                      </span>
                      {lead.Phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {lead.Phone}
                        </span>
                      )}
                      {lead.Company && (
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {lead.Company}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-th-text-tertiary flex items-center gap-2">
                    {lead.Modified_Time && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(lead.Modified_Time).toLocaleDateString()}
                      </span>
                    )}
                    {expandedLead === lead.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedLead === lead.id && (
                  <div className="px-4 py-3 bg-surface-secondary/50 border-t border-th-border-subtle">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-th-text-tertiary">Lead Source</p>
                        <p className="text-th-text-primary">{lead.Lead_Source || '-'}</p>
                      </div>
                      <div>
                        <p className="text-th-text-tertiary">Company</p>
                        <p className="text-th-text-primary">{lead.Company || '-'}</p>
                      </div>
                      <div>
                        <p className="text-th-text-tertiary">Created</p>
                        <p className="text-th-text-primary">
                          {lead.Created_Time
                            ? new Date(lead.Created_Time).toLocaleString()
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-th-text-tertiary">Zoho ID</p>
                        <p className="text-th-text-primary font-mono text-xs">{lead.id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {status?.connected && leads.length === 0 && !fetching && (
        <div className="text-center py-12 bg-surface-primary rounded-xl border border-th-border">
          <Download className="w-12 h-12 text-th-text-tertiary mx-auto mb-4" />
          <p className="text-th-text-secondary">No leads fetched yet</p>
          <p className="text-sm text-th-text-tertiary mt-1">
            Click "Fetch Leads from Zoho" to see available leads
          </p>
        </div>
      )}
    </div>
  );
}
