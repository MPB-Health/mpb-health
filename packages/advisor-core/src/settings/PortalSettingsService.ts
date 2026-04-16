import { supabase } from '@mpbhealth/database';

export interface PortalSetting {
  id: string;
  key: string;
  value: string;
  label: string;
  description?: string | null;
  category: string;
  updated_at: string;
  updated_by?: string | null;
}

export class PortalSettingsService {
  private cache: Map<string, string> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getAllSettings(): Promise<PortalSetting[]> {
    const { data, error } = await supabase
      .from('advisor_portal_settings')
      .select('id, key, value, label, description, category, updated_at, updated_by')
      .order('category', { ascending: true });
    if (error) throw error;
    const settings = (data || []) as unknown as PortalSetting[];
    // Update cache
    this.cache.clear();
    settings.forEach(s => this.cache.set(s.key, s.value));
    this.cacheTimestamp = Date.now();
    return settings;
  }

  async getSetting(key: string): Promise<string> {
    // Check cache first
    if (this.cache.has(key) && Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      return this.cache.get(key)!;
    }
    const { data, error } = await supabase
      .from('advisor_portal_settings')
      .select('value')
      .eq('key', key)
      .single();
    if (error) return '';
    const value = (data as { value: string }).value;
    this.cache.set(key, value);
    this.cacheTimestamp = Date.now();
    return value;
  }

  async getSettingsByCategory(category: string): Promise<PortalSetting[]> {
    const { data, error } = await supabase
      .from('advisor_portal_settings')
      .select('id, key, value, label, description, category, updated_at, updated_by')
      .eq('category', category)
      .order('key', { ascending: true });
    if (error) throw error;
    return (data || []) as unknown as PortalSetting[];
  }

  async updateSetting(key: string, value: string): Promise<void> {
    const { error } = await supabase
      .from('advisor_portal_settings')
      .update({ value, updated_by: (await supabase.auth.getUser()).data.user?.id })
      .eq('key', key);
    if (error) throw error;
    this.cache.set(key, value);
  }

  async getMultipleSettings(keys: string[]): Promise<Record<string, string>> {
    // Check cache first
    if (Date.now() - this.cacheTimestamp < this.CACHE_DURATION) {
      const allCached = keys.every(k => this.cache.has(k));
      if (allCached) {
        return Object.fromEntries(keys.map(k => [k, this.cache.get(k)!]));
      }
    }
    const { data, error } = await supabase
      .from('advisor_portal_settings')
      .select('key, value')
      .in('key', keys);
    if (error) throw error;
    const result: Record<string, string> = {};
    (data || []).forEach((row: { key: string; value: string }) => {
      result[row.key] = row.value;
      this.cache.set(row.key, row.value);
    });
    this.cacheTimestamp = Date.now();
    return result;
  }

  subscribeToSettingChanges(callback: () => void) {
    return supabase
      .channel('portal-settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'advisor_portal_settings' }, () => {
        this.cache.clear();
        this.cacheTimestamp = 0;
        callback();
      })
      .subscribe();
  }
}

export const portalSettingsService = new PortalSettingsService();
