// ============================================================================
// Settings Service — Manages org settings, user preferences, notifications
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  OrganizationSettings,
  UserPreferences,
  NotificationSettings,
  OrgMember,
  OrganizationInvitation,
  ApiKey,
  UpdateOrgSettingsInput,
  UpdateUserPreferencesInput,
  UpdateNotificationSettingsInput,
  CreateInvitationInput,
  CreateApiKeyInput,
} from './types';

export class SettingsService {
  // =========================================================================
  // ORGANIZATION SETTINGS
  // =========================================================================

  /**
   * Get organization settings
   */
  async getOrgSettings(orgId: string): Promise<OrganizationSettings> {
    const { data, error } = await supabase.rpc('get_or_create_org_settings', {
      p_org_id: orgId,
    });

    if (error) {
      console.error('[SettingsService] Failed to get org settings:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update organization settings
   */
  async updateOrgSettings(orgId: string, input: UpdateOrgSettingsInput): Promise<OrganizationSettings> {
    const { data, error } = await supabase
      .from('organization_settings')
      .update(input)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('[SettingsService] Failed to update org settings:', error);
      throw error;
    }

    return data;
  }

  // =========================================================================
  // USER PREFERENCES
  // =========================================================================

  /**
   * Get user preferences
   */
  async getUserPreferences(userId: string, orgId: string): Promise<UserPreferences> {
    const { data, error } = await supabase.rpc('get_or_create_user_preferences', {
      p_user_id: userId,
      p_org_id: orgId,
    });

    if (error) {
      console.error('[SettingsService] Failed to get user preferences:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    userId: string,
    orgId: string,
    input: UpdateUserPreferencesInput
  ): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .update(input)
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('[SettingsService] Failed to update user preferences:', error);
      throw error;
    }

    return data;
  }

  // =========================================================================
  // NOTIFICATION SETTINGS
  // =========================================================================

  /**
   * Get notification settings
   */
  async getNotificationSettings(userId: string, orgId: string): Promise<NotificationSettings> {
    const { data, error } = await supabase.rpc('get_or_create_notification_settings', {
      p_user_id: userId,
      p_org_id: orgId,
    });

    if (error) {
      console.error('[SettingsService] Failed to get notification settings:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    userId: string,
    orgId: string,
    input: UpdateNotificationSettingsInput
  ): Promise<NotificationSettings> {
    const { data, error } = await supabase
      .from('notification_settings')
      .update(input)
      .eq('user_id', userId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      console.error('[SettingsService] Failed to update notification settings:', error);
      throw error;
    }

    return data;
  }

  // =========================================================================
  // TEAM MANAGEMENT
  // =========================================================================

  /**
   * Get organization members
   */
  async getOrgMembers(orgId: string): Promise<OrgMember[]> {
    const { data, error } = await supabase.rpc('get_org_members', {
      p_org_id: orgId,
    });

    if (error) {
      console.error('[SettingsService] Failed to get org members:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Update member role
   */
  async updateMemberRole(orgId: string, userId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from('user_organization_roles')
      .update({ role })
      .eq('org_id', orgId)
      .eq('user_id', userId);

    if (error) {
      console.error('[SettingsService] Failed to update member role:', error);
      throw error;
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(orgId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_organization_roles')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', userId);

    if (error) {
      console.error('[SettingsService] Failed to remove member:', error);
      throw error;
    }
  }

  // =========================================================================
  // INVITATIONS
  // =========================================================================

  /**
   * Get pending invitations
   */
  async getInvitations(orgId: string, status?: string): Promise<OrganizationInvitation[]> {
    let query = supabase
      .from('organization_invitations')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[SettingsService] Failed to get invitations:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create invitation
   */
  async createInvitation(
    orgId: string,
    invitedBy: string,
    input: CreateInvitationInput
  ): Promise<OrganizationInvitation> {
    const { data, error } = await supabase.rpc('create_org_invitation', {
      p_org_id: orgId,
      p_email: input.email,
      p_role: input.role,
      p_message: input.message || null,
      p_invited_by: invitedBy,
    });

    if (error) {
      console.error('[SettingsService] Failed to create invitation:', error);
      throw error;
    }

    return data;
  }

  /**
   * Revoke invitation
   */
  async revokeInvitation(invitationId: string): Promise<void> {
    const { error } = await supabase
      .from('organization_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId);

    if (error) {
      console.error('[SettingsService] Failed to revoke invitation:', error);
      throw error;
    }
  }

  /**
   * Resend invitation (regenerate token)
   */
  async resendInvitation(invitationId: string, invitedBy: string): Promise<OrganizationInvitation> {
    // Get current invitation
    const { data: current, error: fetchError } = await supabase
      .from('organization_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (fetchError) throw fetchError;

    // Create new invitation with same details
    return this.createInvitation(current.org_id, invitedBy, {
      email: current.email,
      role: current.role,
      message: current.message,
    });
  }

  // =========================================================================
  // API KEYS
  // =========================================================================

  /**
   * Get API keys for organization
   */
  async getApiKeys(orgId: string): Promise<ApiKey[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[SettingsService] Failed to get API keys:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Create API key
   */
  async createApiKey(
    orgId: string,
    createdBy: string,
    input: CreateApiKeyInput
  ): Promise<{ key: ApiKey; secret: string }> {
    const { data, error } = await supabase.rpc('generate_api_key', {
      p_org_id: orgId,
      p_name: input.name,
      p_description: input.description || null,
      p_scopes: input.scopes,
      p_created_by: createdBy,
      p_expires_in_days: input.expires_in_days || null,
    });

    if (error) {
      console.error('[SettingsService] Failed to create API key:', error);
      throw error;
    }

    // Fetch the created key
    const { data: key, error: fetchError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', data[0].key_id)
      .single();

    if (fetchError) throw fetchError;

    return {
      key,
      secret: data[0].api_key, // Only returned once!
    };
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(keyId: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId);

    if (error) {
      console.error('[SettingsService] Failed to revoke API key:', error);
      throw error;
    }
  }

  /**
   * Delete API key
   */
  async deleteApiKey(keyId: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId);

    if (error) {
      console.error('[SettingsService] Failed to delete API key:', error);
      throw error;
    }
  }
}

export const settingsService = new SettingsService();
