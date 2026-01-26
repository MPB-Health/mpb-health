import { supabase } from './supabase';

export interface ZohoLead {
  First_Name: string;
  Last_Name: string;
  Email: string;
  Phone: string;
  Company?: string;
  Lead_Source: string;
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
  Household_Size?: string;
  Current_Insurance?: string;
  Monthly_Premium?: string;
  Coverage_Preference?: string;
  Primary_Concern?: string;
  Contact_Preference?: string;
  Submitted_From?: string;
}

class ZohoCRMService {
  private edgeFunctionUrl: string;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.edgeFunctionUrl = `${supabaseUrl}/functions/v1/zoho-crm`;
  }

  async createLead(leadData: ZohoLead): Promise<{ success: boolean; leadId?: string; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

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
      console.error('Create lead error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create lead in Zoho CRM',
      };
    }
  }

  async updateLead(leadId: string, updates: Partial<ZohoLead>): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${this.edgeFunctionUrl}?action=update`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ leadId, updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update lead');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Update lead error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update lead in Zoho CRM',
      };
    }
  }

  async searchLeadByEmail(email: string): Promise<{ found: boolean; leadId?: string; lead?: any }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

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
      console.error('Search lead error:', error);
      return { found: false };
    }
  }

  isConfigured(): boolean {
    // Always return true - the edge function will handle its own config check
    // and return appropriate errors if not configured
    return true;
  }

  /**
   * Check if Zoho CRM edge function is properly configured
   * Returns false if the edge function is not deployed or not configured
   */
  async checkConfiguration(): Promise<{ configured: boolean; error?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const headers: HeadersInit = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

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
}

export const zohoCRMService = new ZohoCRMService();
