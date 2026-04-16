// ============================================================================
// Integration Service — Manages third-party integrations
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type { IntegrationConfig, IntegrationType, SyncDirection } from './types';

export interface CreateIntegrationInput {
  integration_type: IntegrationType;
  provider: string;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  webhook_url?: string;
  sync_enabled?: boolean;
  sync_frequency_minutes?: number;
  sync_direction?: SyncDirection;
}

export interface UpdateIntegrationInput {
  name?: string;
  description?: string;
  is_enabled?: boolean;
  config?: Record<string, unknown>;
  webhook_url?: string;
  sync_enabled?: boolean;
  sync_frequency_minutes?: number;
  sync_direction?: SyncDirection;
}

// Available integrations catalog
export const AVAILABLE_INTEGRATIONS = [
  {
    type: 'crm' as IntegrationType,
    provider: 'salesforce',
    name: 'Salesforce',
    description: 'Sync leads and contacts with Salesforce CRM',
    icon: 'salesforce',
    features: ['lead_sync', 'contact_sync', 'activity_sync'],
  },
  {
    type: 'crm' as IntegrationType,
    provider: 'hubspot',
    name: 'HubSpot',
    description: 'Connect with HubSpot CRM for contact management',
    icon: 'hubspot',
    features: ['lead_sync', 'contact_sync', 'deal_sync'],
  },
  {
    type: 'email' as IntegrationType,
    provider: 'sendgrid',
    name: 'SendGrid',
    description: 'Send transactional and marketing emails via SendGrid',
    icon: 'sendgrid',
    features: ['email_send', 'templates', 'analytics'],
  },
  {
    type: 'email' as IntegrationType,
    provider: 'mailgun',
    name: 'Mailgun',
    description: 'Email delivery and tracking with Mailgun',
    icon: 'mailgun',
    features: ['email_send', 'tracking', 'validation'],
  },
  {
    type: 'sms' as IntegrationType,
    provider: 'twilio',
    name: 'Twilio',
    description: 'Send SMS messages through Twilio',
    icon: 'twilio',
    features: ['sms_send', 'mms', 'phone_numbers'],
  },
  {
    type: 'calendar' as IntegrationType,
    provider: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync meetings and appointments with Google Calendar',
    icon: 'google',
    features: ['event_sync', 'availability', 'reminders'],
  },
  {
    type: 'calendar' as IntegrationType,
    provider: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Sync with Outlook calendar and email',
    icon: 'microsoft',
    features: ['event_sync', 'email_sync', 'contacts'],
  },
  {
    type: 'storage' as IntegrationType,
    provider: 'aws_s3',
    name: 'Amazon S3',
    description: 'Store files and documents in AWS S3',
    icon: 'aws',
    features: ['file_storage', 'cdn', 'backup'],
  },
  {
    type: 'webhook' as IntegrationType,
    provider: 'zapier',
    name: 'Zapier',
    description: 'Connect to 5000+ apps through Zapier',
    icon: 'zapier',
    features: ['automation', 'triggers', 'actions'],
  },
];

export class IntegrationService {
  // =========================================================================
  // INTEGRATION MANAGEMENT
  // =========================================================================

  /**
   * Get all integrations for an organization
   */
  async getIntegrations(orgId: string): Promise<IntegrationConfig[]> {
    const { data, error } = await supabase
      .from('integration_configs')
      .select('id, org_id, integration_type, provider, name, description, is_enabled, is_connected, last_sync_at, last_error, config, webhook_url, webhook_secret, sync_enabled, sync_frequency_minutes, sync_direction, created_by, created_at, updated_at')
      .eq('org_id', orgId)
      .order('integration_type')
      .order('name');

    if (error) {
      console.error('[IntegrationService] Failed to get integrations:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get integrations by type
   */
  async getIntegrationsByType(orgId: string, type: IntegrationType): Promise<IntegrationConfig[]> {
    const { data, error } = await supabase
      .from('integration_configs')
      .select('id, org_id, integration_type, provider, name, description, is_enabled, is_connected, last_sync_at, last_error, config, webhook_url, webhook_secret, sync_enabled, sync_frequency_minutes, sync_direction, created_by, created_at, updated_at')
      .eq('org_id', orgId)
      .eq('integration_type', type);

    if (error) {
      console.error('[IntegrationService] Failed to get integrations by type:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get a single integration
   */
  async getIntegration(integrationId: string): Promise<IntegrationConfig | null> {
    const { data, error } = await supabase
      .from('integration_configs')
      .select('id, org_id, integration_type, provider, name, description, is_enabled, is_connected, last_sync_at, last_error, config, webhook_url, webhook_secret, sync_enabled, sync_frequency_minutes, sync_direction, created_by, created_at, updated_at')
      .eq('id', integrationId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[IntegrationService] Failed to get integration:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Get integration by provider
   */
  async getIntegrationByProvider(orgId: string, provider: string): Promise<IntegrationConfig | null> {
    const { data, error } = await supabase
      .from('integration_configs')
      .select('id, org_id, integration_type, provider, name, description, is_enabled, is_connected, last_sync_at, last_error, config, webhook_url, webhook_secret, sync_enabled, sync_frequency_minutes, sync_direction, created_by, created_at, updated_at')
      .eq('org_id', orgId)
      .eq('provider', provider)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[IntegrationService] Failed to get integration by provider:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Create an integration
   */
  async createIntegration(
    orgId: string,
    createdBy: string,
    input: CreateIntegrationInput
  ): Promise<IntegrationConfig> {
    const { data, error } = await supabase
      .from('integration_configs')
      .insert({
        org_id: orgId,
        created_by: createdBy,
        integration_type: input.integration_type,
        provider: input.provider,
        name: input.name,
        description: input.description,
        config: input.config || {},
        webhook_url: input.webhook_url,
        sync_enabled: input.sync_enabled ?? true,
        sync_frequency_minutes: input.sync_frequency_minutes ?? 60,
        sync_direction: input.sync_direction ?? 'both',
        is_enabled: true,
        is_connected: false,
      })
      .select('id, org_id, integration_type, provider, name, description, is_enabled, is_connected, last_sync_at, last_error, config, webhook_url, webhook_secret, sync_enabled, sync_frequency_minutes, sync_direction, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('[IntegrationService] Failed to create integration:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Update an integration
   */
  async updateIntegration(
    integrationId: string,
    input: UpdateIntegrationInput
  ): Promise<IntegrationConfig> {
    const { data, error } = await supabase
      .from('integration_configs')
      .update(input)
      .eq('id', integrationId)
      .select('id, org_id, integration_type, provider, name, description, is_enabled, is_connected, last_sync_at, last_error, config, webhook_url, webhook_secret, sync_enabled, sync_frequency_minutes, sync_direction, created_by, created_at, updated_at')
      .single();

    if (error) {
      console.error('[IntegrationService] Failed to update integration:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Delete an integration
   */
  async deleteIntegration(integrationId: string): Promise<void> {
    const { error } = await supabase
      .from('integration_configs')
      .delete()
      .eq('id', integrationId);

    if (error) {
      console.error('[IntegrationService] Failed to delete integration:', error);
      throw error;
    }
  }

  /**
   * Toggle integration enabled state
   */
  async toggleIntegration(integrationId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase
      .from('integration_configs')
      .update({ is_enabled: enabled })
      .eq('id', integrationId);

    if (error) {
      console.error('[IntegrationService] Failed to toggle integration:', error);
      throw error;
    }
  }

  // =========================================================================
  // CONNECTION MANAGEMENT
  // =========================================================================

  /**
   * Mark integration as connected
   */
  async markConnected(
    integrationId: string,
    tokens?: { access_token: string; refresh_token?: string; expires_at?: Date }
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      is_connected: true,
      last_error: null,
    };

    if (tokens) {
      updateData.access_token = tokens.access_token;
      updateData.refresh_token = tokens.refresh_token;
      updateData.token_expires_at = tokens.expires_at?.toISOString();
    }

    const { error } = await supabase
      .from('integration_configs')
      .update(updateData)
      .eq('id', integrationId);

    if (error) {
      console.error('[IntegrationService] Failed to mark connected:', error);
      throw error;
    }
  }

  /**
   * Mark integration as disconnected
   */
  async markDisconnected(integrationId: string): Promise<void> {
    const { error } = await supabase
      .from('integration_configs')
      .update({
        is_connected: false,
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
      })
      .eq('id', integrationId);

    if (error) {
      console.error('[IntegrationService] Failed to mark disconnected:', error);
      throw error;
    }
  }

  /**
   * Record sync completion
   */
  async recordSync(integrationId: string, success: boolean, error?: string): Promise<void> {
    const updateData: Record<string, unknown> = {
      last_sync_at: new Date().toISOString(),
    };

    if (!success && error) {
      updateData.last_error = error;
    } else {
      updateData.last_error = null;
    }

    const { error: dbError } = await supabase
      .from('integration_configs')
      .update(updateData)
      .eq('id', integrationId);

    if (dbError) {
      console.error('[IntegrationService] Failed to record sync:', dbError);
    }
  }

  // =========================================================================
  // CATALOG
  // =========================================================================

  /**
   * Get available integrations catalog
   */
  getAvailableIntegrations() {
    return AVAILABLE_INTEGRATIONS;
  }

  /**
   * Get available integrations by type
   */
  getAvailableIntegrationsByType(type: IntegrationType) {
    return AVAILABLE_INTEGRATIONS.filter(i => i.type === type);
  }

  /**
   * Get integration info from catalog
   */
  getIntegrationInfo(provider: string) {
    return AVAILABLE_INTEGRATIONS.find(i => i.provider === provider);
  }
}

export const integrationService = new IntegrationService();
