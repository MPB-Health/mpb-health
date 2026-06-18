import { supabase } from '@mpbhealth/database';
import { getAdminOrgId } from '../operations/adminOrgScope';

export interface PortalSetting {
  key: string;
  value: string | null;
  updated_at: string;
  description?: string | null;
}

export class PortalSettingsAdminService {
  async getAll(): Promise<PortalSetting[]> {
    const { data, error } = await supabase
      .from('advisor_portal_settings')
      .select('key, value, updated_at, description')
      .eq('org_id', getAdminOrgId())
      .order('key', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as PortalSetting[];
  }

  async get(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('advisor_portal_settings')
      .select('value')
      .eq('key', key)
      .eq('org_id', getAdminOrgId())
      .maybeSingle();
    if (error) throw error;
    return data?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_portal_settings')
      .upsert(
        { key, value, org_id: getAdminOrgId(), updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );
    if (error) throw error;
  }

  async delete(key: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_portal_settings')
      .delete()
      .eq('key', key)
      .eq('org_id', getAdminOrgId());
    if (error) throw error;
  }

  async bulkSet(pairs: Record<string, string>): Promise<void> {
    const rows = Object.entries(pairs).map(([key, value]) => ({
      key,
      value,
      org_id: getAdminOrgId(),
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('advisor_portal_settings')
      .upsert(rows, { onConflict: 'key' });
    if (error) throw error;
  }
}

export const portalSettingsAdminService = new PortalSettingsAdminService();
