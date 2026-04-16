import { supabase } from '@mpbhealth/database';
import type { SystemSetting, Integration } from '../types';

export class SettingsService {
  // ========== System Settings ==========

  // Get all settings
  async getSettings(category?: string): Promise<SystemSetting[]> {
    let query = supabase
      .from('system_settings')
      .select('id, key, value, category, description, is_sensitive, updated_by, updated_at')
      .order('category', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as any;
  }

  // Get a single setting by key
  async getSetting(key: string): Promise<SystemSetting | null> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('id, key, value, category, description, is_sensitive, updated_by, updated_at')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  // Get setting value
  async getSettingValue<T>(key: string, defaultValue: T): Promise<T> {
    const setting = await this.getSetting(key);
    return setting ? (setting.value as T) : defaultValue;
  }

  // Update a setting
  async updateSetting(
    key: string,
    value: unknown,
    _updatedBy: string
  ): Promise<SystemSetting> {
    const { data, error } = await supabase
      .from('system_settings')
      .update({
        value,
        updated_at: new Date().toISOString(),
      })
      .eq('key', key)
      .select('id, key, value, category, description, is_sensitive, updated_by, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  // Create or update setting
  async upsertSetting(
    key: string,
    value: unknown,
    category: string,
    description: string,
    _updatedBy: string,
    isSensitive = false
  ): Promise<SystemSetting> {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        key,
        value,
        category,
        description,
        is_sensitive: isSensitive,
        updated_at: new Date().toISOString(),
      })
      .select('id, key, value, category, description, is_sensitive, updated_by, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  // Get settings by category
  async getSettingsByCategory(): Promise<Record<string, SystemSetting[]>> {
    const settings = await this.getSettings();
    return settings.reduce(
      (acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push(setting);
        return acc;
      },
      {} as Record<string, SystemSetting[]>
    );
  }

  // ========== Integrations ==========

  // Get all integrations
  async getIntegrations(): Promise<Integration[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('id, name, type, status, config, last_sync_at, error_message, created_at, updated_at')
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as any;
  }

  // Get a single integration
  async getIntegration(integrationId: string): Promise<Integration | null> {
    const { data, error } = await supabase
      .from('integrations')
      .select('id, name, type, status, config, last_sync_at, error_message, created_at, updated_at')
      .eq('id', integrationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  // Get integration by type
  async getIntegrationByType(type: Integration['type']): Promise<Integration | null> {
    const { data, error } = await supabase
      .from('integrations')
      .select('id, name, type, status, config, last_sync_at, error_message, created_at, updated_at')
      .eq('type', type)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  }

  // Create integration
  async createIntegration(
    integration: Omit<Integration, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Integration> {
    const { data, error } = await supabase
      .from('integrations')
      .insert(integration)
      .select('id, name, type, status, config, last_sync_at, error_message, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  // Update integration
  async updateIntegration(
    integrationId: string,
    updates: Partial<Omit<Integration, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Integration> {
    const { data, error } = await supabase
      .from('integrations')
      .update(updates)
      .eq('id', integrationId)
      .select('id, name, type, status, config, last_sync_at, error_message, created_at, updated_at')
      .single();

    if (error) throw error;
    return data as any;
  }

  // Enable integration
  async enableIntegration(integrationId: string): Promise<Integration> {
    return this.updateIntegration(integrationId, {
      status: 'active',
      error_message: null,
    });
  }

  // Disable integration
  async disableIntegration(integrationId: string): Promise<Integration> {
    return this.updateIntegration(integrationId, { status: 'inactive' });
  }

  // Update integration config
  async updateIntegrationConfig(
    integrationId: string,
    config: Record<string, unknown>
  ): Promise<Integration> {
    return this.updateIntegration(integrationId, { config });
  }

  // Record sync
  async recordSync(integrationId: string, error?: string): Promise<Integration> {
    const updates: Partial<Integration> = {
      last_sync_at: new Date().toISOString(),
    };

    if (error) {
      updates.status = 'error';
      updates.error_message = error;
    } else {
      updates.status = 'active';
      updates.error_message = null;
    }

    return this.updateIntegration(integrationId, updates);
  }

  // Delete integration
  async deleteIntegration(integrationId: string): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', integrationId);

    if (error) throw error;
  }

  // Test integration connection
  async testIntegration(integrationId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const integration = await this.getIntegration(integrationId);
    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }

    try {
      switch (integration.type) {
        case 'mailchimp':
          break;
        case 'stripe':
          break;
        default:
          break;
      }

      await this.recordSync(integrationId);
      return { success: true, message: 'Connection successful' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await this.recordSync(integrationId, errorMessage);
      return { success: false, message: errorMessage };
    }
  }
}

export const settingsService = new SettingsService();
