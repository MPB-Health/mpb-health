import type { SupabaseClient } from '@supabase/supabase-js';
import type { Lead } from '../leads/leadTypes';
import type {
  ZohoLead,
  ZohoSyncResult,
  ZohoBulkSyncResult,
  ZohoSyncStats,
} from './types';
import { STAGE_TO_ZOHO_STATUS } from './types';

export class ZohoService {
  private edgeFunctionUrl: string;

  constructor(
    private supabase: SupabaseClient,
    supabaseUrl: string
  ) {
    this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/zoho-crm`;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await this.supabase.auth.getSession();
    const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
    const headers: HeadersInit = {
      'Authorization': `Bearer ${session?.access_token || anonKey}`,
      'Content-Type': 'application/json',
    };
    return headers;
  }

  /**
   * Check if Zoho CRM is configured and accessible
   */
  async checkConfiguration(): Promise<{ configured: boolean; error?: string }> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${this.edgeFunctionUrl}?action=health`, {
        method: 'GET',
        headers,
      });

      if (response.status === 404) {
        return { configured: false, error: 'Edge function not deployed' };
      }

      if (response.status === 500) {
        const data = await response.json();
        return { configured: false, error: data.error || 'Zoho CRM not configured' };
      }

      return { configured: true };
    } catch (_error) {
      return { configured: false, error: 'Unable to reach edge function' };
    }
  }

  /**
   * Create a lead in Zoho CRM
   */
  async createZohoLead(
    leadData: ZohoLead
  ): Promise<{ success: boolean; leadId?: string; error?: string }> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${this.edgeFunctionUrl}?action=create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ leadData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create lead');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Create Zoho lead error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create lead in Zoho CRM',
      };
    }
  }

  /**
   * Update a lead in Zoho CRM
   */
  async updateZohoLead(
    zohoLeadId: string,
    updates: Partial<ZohoLead>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${this.edgeFunctionUrl}?action=update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ leadId: zohoLeadId, updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lead');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Update Zoho lead error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update lead in Zoho CRM',
      };
    }
  }

  /**
   * Search for a lead by email in Zoho CRM
   */
  async searchLeadByEmail(
    email: string
  ): Promise<{ found: boolean; leadId?: string; lead?: unknown }> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(
        `${this.edgeFunctionUrl}?action=search&email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Search Zoho lead error:', error);
      return { found: false };
    }
  }

  /**
   * Sync a local lead to Zoho CRM
   */
  async syncLeadToZoho(leadId: string): Promise<ZohoSyncResult> {
    try {
      // Fetch the lead
      const { data: lead, error: fetchError } = await this.supabase
        .from('zoho_lead_submissions')
        .select('*')
        .eq('id', leadId)
        .single();

      if (fetchError || !lead) {
        return { success: false, error: 'Lead not found' };
      }

      // Check if already synced
      if (lead.zoho_lead_id && lead.zoho_sync_status === 'synced') {
        // Update existing lead in Zoho
        const zohoLead = this.convertToZohoFormat(lead as Lead);
        const updateResult = await this.updateZohoLead(lead.zoho_lead_id, zohoLead);

        if (!updateResult.success) {
          await this.updateSyncStatus(leadId, 'failed');
          return { success: false, error: updateResult.error };
        }

        return { success: true, leadId, zohoLeadId: lead.zoho_lead_id };
      }

      // Create new lead in Zoho
      const zohoLead = this.convertToZohoFormat(lead as Lead);
      const createResult = await this.createZohoLead(zohoLead);

      if (!createResult.success) {
        await this.updateSyncStatus(leadId, 'failed');
        return { success: false, error: createResult.error };
      }

      // Update lead with Zoho ID and sync status
      await this.supabase
        .from('zoho_lead_submissions')
        .update({
          zoho_lead_id: createResult.leadId,
          zoho_sync_status: 'synced',
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      return { success: true, leadId, zohoLeadId: createResult.leadId };
    } catch (error) {
      console.error('Sync to Zoho error:', error);
      await this.updateSyncStatus(leadId, 'failed');
      return { success: false, error: 'Failed to sync lead to Zoho CRM' };
    }
  }

  /**
   * Bulk sync multiple leads to Zoho CRM
   */
  async bulkSyncToZoho(leadIds: string[]): Promise<ZohoBulkSyncResult> {
    const results: ZohoBulkSyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    for (const leadId of leadIds) {
      const result = await this.syncLeadToZoho(leadId);

      if (result.success) {
        results.synced++;
      } else {
        results.failed++;
        results.errors.push({ leadId, error: result.error || 'Unknown error' });
      }
    }

    results.success = results.failed === 0;
    return results;
  }

  /**
   * Retry failed Zoho syncs
   */
  async retryFailedSyncs(): Promise<{ synced: number; failed: number }> {
    try {
      const { data: failedLeads, error } = await this.supabase
        .from('zoho_lead_submissions')
        .select('id')
        .eq('zoho_sync_status', 'failed');

      if (error || !failedLeads || failedLeads.length === 0) {
        return { synced: 0, failed: 0 };
      }

      const leadIds = failedLeads.map((l) => l.id);
      const result = await this.bulkSyncToZoho(leadIds);

      return { synced: result.synced, failed: result.failed };
    } catch (error) {
      console.error('Retry failed syncs error:', error);
      return { synced: 0, failed: 0 };
    }
  }

  /**
   * Get Zoho sync statistics
   */
  async getSyncStats(): Promise<ZohoSyncStats> {
    try {
      const { data, error } = await this.supabase
        .from('zoho_lead_submissions')
        .select('zoho_sync_status');

      if (error || !data) {
        return { pending: 0, failed: 0, synced: 0 };
      }

      return {
        pending: data.filter((l) => l.zoho_sync_status === 'pending').length,
        failed: data.filter((l) => l.zoho_sync_status === 'failed').length,
        synced: data.filter((l) => l.zoho_sync_status === 'synced').length,
      };
    } catch (error) {
      console.error('Get Zoho sync stats error:', error);
      return { pending: 0, failed: 0, synced: 0 };
    }
  }

  /**
   * Convert internal lead format to Zoho format
   */
  private convertToZohoFormat(lead: Lead): ZohoLead {
    return {
      First_Name: lead.first_name,
      Last_Name: lead.last_name,
      Email: lead.email,
      Phone: lead.phone,
      Zip_Code: lead.zip_code || '',
      Lead_Source: lead.source_cta || 'Website',
      Lead_Status: STAGE_TO_ZOHO_STATUS[lead.pipeline_stage] || 'New',
      Household_Size: lead.household_size?.toString() || '',
      Current_Insurance: lead.current_insurance || '',
      Monthly_Premium: lead.monthly_premium || '',
      Coverage_Preference: lead.coverage_preference || '',
      Primary_Concern: lead.primary_concern || '',
      Contact_Preference: lead.contact_preference || '',
      Submitted_From: lead.source_page || 'MPB Health Website',
      Description: `Lead Score: ${lead.lead_score}\nTags: ${(lead.tags || []).join(', ')}\nUTM Source: ${lead.utm_source || 'N/A'}\nUTM Medium: ${lead.utm_medium || 'N/A'}\nUTM Campaign: ${lead.utm_campaign || 'N/A'}`,
    };
  }

  /**
   * Update sync status for a lead
   */
  private async updateSyncStatus(
    leadId: string,
    status: 'pending' | 'synced' | 'failed'
  ): Promise<void> {
    await this.supabase
      .from('zoho_lead_submissions')
      .update({
        zoho_sync_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);
  }
}

// Factory function
export function createZohoService(
  supabase: SupabaseClient,
  supabaseUrl: string
): ZohoService {
  return new ZohoService(supabase, supabaseUrl);
}
