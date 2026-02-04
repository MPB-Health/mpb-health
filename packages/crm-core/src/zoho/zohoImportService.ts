import { supabase } from '@mpbhealth/database';

export interface ZohoLeadData {
  id: string;
  First_Name: string;
  Last_Name: string;
  Email: string;
  Phone: string;
  Company?: string;
  Lead_Source?: string;
  Lead_Status?: string;
  Description?: string;
  Street?: string;
  City?: string;
  State?: string;
  Zip_Code?: string;
  Country?: string;
  Industry?: string;
  Annual_Revenue?: string;
  No_of_Employees?: string;
  Website?: string;
  Created_Time?: string;
  Modified_Time?: string;
  Owner?: {
    id: string;
    name: string;
    email?: string;
  };
  // MPB Health custom fields
  Household_Size?: string;
  Current_Insurance?: string;
  Monthly_Premium?: string;
  Coverage_Preference?: string;
  Primary_Concern?: string;
  Contact_Preference?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface ZohoSyncStatus {
  connected: boolean;
  configured: boolean;
  lastSync?: string;
  error?: string;
}

class ZohoImportService {
  private edgeFunctionUrl: string;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/zoho-crm`;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  }

  /**
   * Check Zoho connection status
   */
  async checkConnection(): Promise<ZohoSyncStatus> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.edgeFunctionUrl}?action=health`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          connected: false,
          configured: data.configured || false,
          error: data.error || 'Failed to connect to Zoho',
        };
      }

      const data = await response.json();
      return {
        connected: data.connected || false,
        configured: data.configured || false,
      };
    } catch (error) {
      return {
        connected: false,
        configured: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Fetch leads from Zoho CRM
   */
  async fetchZohoLeads(options?: {
    page?: number;
    per_page?: number;
    modified_since?: string;
  }): Promise<{ success: boolean; leads: ZohoLeadData[]; info?: any; error?: string }> {
    try {
      const headers = await this.getHeaders();
      const params = new URLSearchParams({ action: 'list' });
      if (options?.page) params.set('page', options.page.toString());
      if (options?.per_page) params.set('per_page', (options.per_page || 50).toString());
      if (options?.modified_since) params.set('modified_since', options.modified_since);

      const response = await fetch(`${this.edgeFunctionUrl}?${params}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch leads');
      }

      const result = await response.json();
      return {
        success: true,
        leads: result.data || [],
        info: result.info,
      };
    } catch (error) {
      console.error('Fetch Zoho leads error:', error);
      return {
        success: false,
        leads: [],
        error: error instanceof Error ? error.message : 'Failed to fetch leads',
      };
    }
  }

  /**
   * Check if a lead already exists in the local database by email
   */
  async checkExistingLead(email: string, orgId: string): Promise<string | null> {
    const { data } = await supabase
      .from('zoho_lead_submissions')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    return data?.id || null;
  }

  /**
   * Import a single lead from Zoho to local database
   */
  async importLead(
    zohoLead: ZohoLeadData,
    orgId: string,
    userId: string
  ): Promise<{ success: boolean; localId?: string; error?: string }> {
    try {
      // Check if already exists
      const existing = await this.checkExistingLead(zohoLead.Email, orgId);
      if (existing) {
        return { success: false, error: 'Lead already exists', localId: existing };
      }

      // Insert into zoho_lead_submissions
      const { data, error } = await supabase
        .from('zoho_lead_submissions')
        .insert({
          first_name: zohoLead.First_Name || '',
          last_name: zohoLead.Last_Name || '',
          email: zohoLead.Email?.toLowerCase() || '',
          phone: zohoLead.Phone || '',
          household_size: zohoLead.Household_Size ? parseInt(zohoLead.Household_Size) : null,
          current_insurance: zohoLead.Current_Insurance,
          monthly_premium: zohoLead.Monthly_Premium,
          coverage_preference: zohoLead.Coverage_Preference,
          zip_code: zohoLead.Zip_Code,
          primary_concern: zohoLead.Primary_Concern,
          contact_preference: zohoLead.Contact_Preference || 'phone',
          source_page: zohoLead.Lead_Source || 'Zoho Import',
          zoho_lead_id: zohoLead.id,
          zoho_sync_status: 'success',
          zoho_last_sync_at: new Date().toISOString(),
          form_data: {
            imported_from: 'zoho',
            zoho_created: zohoLead.Created_Time,
            zoho_modified: zohoLead.Modified_Time,
            company: zohoLead.Company,
            description: zohoLead.Description,
            city: zohoLead.City,
            state: zohoLead.State,
            country: zohoLead.Country,
            industry: zohoLead.Industry,
          },
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, localId: data.id };
    } catch (error) {
      console.error('Import lead error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import lead',
      };
    }
  }

  /**
   * Bulk import leads from Zoho
   */
  async importLeads(
    zohoLeads: ZohoLeadData[],
    orgId: string,
    userId: string,
    onProgress?: (imported: number, total: number) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < zohoLeads.length; i++) {
      const lead = zohoLeads[i];

      if (!lead.Email) {
        result.skipped++;
        result.errors.push(`Lead ${lead.First_Name} ${lead.Last_Name}: Missing email`);
        continue;
      }

      const importResult = await this.importLead(lead, orgId, userId);

      if (importResult.success) {
        result.imported++;
      } else if (importResult.error?.includes('already exists')) {
        result.skipped++;
      } else {
        result.errors.push(`${lead.Email}: ${importResult.error}`);
      }

      if (onProgress) {
        onProgress(i + 1, zohoLeads.length);
      }

      // Small delay to avoid rate limiting
      if (i < zohoLeads.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return result;
  }

  /**
   * Get import history/stats
   */
  async getImportStats(): Promise<{
    totalImported: number;
    lastImportDate?: string;
    syncedLeads: number;
    failedLeads: number;
  }> {
    const { data: stats } = await supabase
      .from('zoho_lead_submissions')
      .select('zoho_sync_status, zoho_last_sync_at')
      .not('zoho_lead_id', 'is', null);

    const totalImported = stats?.length || 0;
    const syncedLeads = stats?.filter(s => s.zoho_sync_status === 'success').length || 0;
    const failedLeads = stats?.filter(s => s.zoho_sync_status === 'failed').length || 0;
    const lastImportDate = stats?.reduce((latest, s) => {
      if (!s.zoho_last_sync_at) return latest;
      return !latest || new Date(s.zoho_last_sync_at) > new Date(latest)
        ? s.zoho_last_sync_at
        : latest;
    }, '' as string);

    return {
      totalImported,
      lastImportDate: lastImportDate || undefined,
      syncedLeads,
      failedLeads,
    };
  }
}

export const zohoImportService = new ZohoImportService();
