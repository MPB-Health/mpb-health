import type { SupabaseClient } from '@supabase/supabase-js';

export interface ZohoService {
  syncLeadToZoho(leadId: string): Promise<{
    success: boolean;
    leadId?: string;
    zohoLeadId?: string;
    error?: string;
  }>;
  bulkSyncToZoho(leadIds: string[]): Promise<{
    success: boolean;
    synced: number;
    failed: number;
    errors: Array<{ leadId: string; error: string }>;
  }>;
  retryFailedSyncs(): Promise<{ synced: number; failed: number }>;
}

/**
 * Zoho CRM sync service. Invokes Supabase Edge Functions to sync leads to Zoho.
 * Requires edge functions: zoho-sync-lead, zoho-bulk-sync, zoho-retry-failed
 */
export function createZohoService(
  _supabase: SupabaseClient,
  _supabaseUrl: string
): ZohoService {
  const supabase = _supabase;

  return {
    async syncLeadToZoho(leadId: string) {
      try {
        const { data, error } = await supabase.functions.invoke('zoho-sync-lead', {
          body: { leadId },
        });
        if (error) {
          return { success: false, error: error.message || 'Sync failed' };
        }
        const result = data as { success?: boolean; zohoLeadId?: string; error?: string };
        return {
          success: result?.success ?? false,
          leadId,
          zohoLeadId: result?.zohoLeadId,
          error: result?.error,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { success: false, error: msg };
      }
    },

    async bulkSyncToZoho(leadIds: string[]) {
      const errors: Array<{ leadId: string; error: string }> = [];
      let synced = 0;
      try {
        const { data, error } = await supabase.functions.invoke('zoho-bulk-sync', {
          body: { leadIds },
        });
        if (error) {
          return {
            success: false,
            synced: 0,
            failed: leadIds.length,
            errors: leadIds.map((id) => ({ leadId: id, error: error.message || 'Bulk sync failed' })),
          };
        }
        const result = data as {
          synced?: number;
          failed?: number;
          errors?: Array<{ leadId: string; error: string }>;
        };
        synced = result?.synced ?? 0;
        const failed = result?.failed ?? leadIds.length - synced;
        return {
          success: failed === 0,
          synced,
          failed,
          errors: result?.errors ?? errors,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          synced: 0,
          failed: leadIds.length,
          errors: leadIds.map((id) => ({ leadId: id, error: msg })),
        };
      }
    },

    async retryFailedSyncs() {
      try {
        const { data, error } = await supabase.functions.invoke('zoho-retry-failed', {
          body: {},
        });
        if (error) {
          return { synced: 0, failed: 0 };
        }
        const result = data as { synced?: number; failed?: number };
        return {
          synced: result?.synced ?? 0,
          failed: result?.failed ?? 0,
        };
      } catch {
        return { synced: 0, failed: 0 };
      }
    },
  };
}
