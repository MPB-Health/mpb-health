// ============================================================================
// Settings Hooks — React hooks for settings management
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  settingsService,
  integrationService,
  OrganizationSettings,
  UserPreferences,
  NotificationSettings,
  IntegrationConfig,
  ApiKey,
  OrgMember,
  OrganizationInvitation,
  UpdateOrgSettingsInput,
  UpdateUserPreferencesInput,
  UpdateNotificationSettingsInput,
  CreateApiKeyInput,
  CreateInvitationInput,
  CreateIntegrationInput,
  UpdateIntegrationInput,
  AVAILABLE_INTEGRATIONS,
} from '@mpbhealth/champion-core';
import { useAdvisor } from '../contexts/AdvisorContext';

// =============================================================================
// Organization Settings Hook
// =============================================================================

export function useOrgSettings() {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;

  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      const data = await settingsService.getOrgSettings(orgId);
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('[useOrgSettings] Failed to fetch:', err);
      setError('Failed to load organization settings');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    async (input: UpdateOrgSettingsInput) => {
      if (!orgId) return;

      try {
        setSaving(true);
        const updated = await settingsService.updateOrgSettings(orgId, input);
        setSettings(updated);
        return updated;
      } catch (err) {
        console.error('[useOrgSettings] Failed to update:', err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [orgId]
  );

  return {
    settings,
    loading,
    error,
    saving,
    updateSettings,
    refresh: fetchSettings,
  };
}

// =============================================================================
// User Preferences Hook
// =============================================================================

export function useUserPreferences() {
  const { profile } = useAdvisor();
  const userId = profile?.user_id;
  const orgId = profile?.org_id;

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!userId || !orgId) return;

    try {
      setLoading(true);
      const data = await settingsService.getUserPreferences(userId, orgId);
      setPreferences(data);
      setError(null);
    } catch (err) {
      console.error('[useUserPreferences] Failed to fetch:', err);
      setError('Failed to load user preferences');
    } finally {
      setLoading(false);
    }
  }, [userId, orgId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = useCallback(
    async (input: UpdateUserPreferencesInput) => {
      if (!userId || !orgId) return;

      try {
        setSaving(true);
        const updated = await settingsService.updateUserPreferences(userId, orgId, input);
        setPreferences(updated);
        return updated;
      } catch (err) {
        console.error('[useUserPreferences] Failed to update:', err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, orgId]
  );

  return {
    preferences,
    loading,
    error,
    saving,
    updatePreferences,
    refresh: fetchPreferences,
  };
}

// =============================================================================
// Notification Settings Hook
// =============================================================================

export function useNotificationSettings() {
  const { profile, profileLoading } = useAdvisor();
  const userId = profile?.user_id;
  const orgId = profile?.org_id;

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      // Profile not loaded yet or no user — stop loading once profile settles
      if (!profileLoading) setLoading(false);
      return;
    }

    // If org_id is missing, still fetch with a fallback empty string.
    // The RPC will auto-create a row for the user regardless.
    const effectiveOrgId = orgId || '';

    try {
      setLoading(true);
      const data = await settingsService.getNotificationSettings(userId, effectiveOrgId);
      setSettings(data);
      setError(null);
    } catch (err) {
      console.error('[useNotificationSettings] Failed to fetch:', err);
      setError('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, [userId, orgId, profileLoading]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    async (input: UpdateNotificationSettingsInput) => {
      if (!userId) throw new Error('User not loaded');
      const effectiveOrgId = orgId || '';

      try {
        setSaving(true);
        const updated = await settingsService.updateNotificationSettings(userId, effectiveOrgId, input);
        setSettings(updated);
        return updated;
      } catch (err) {
        console.error('[useNotificationSettings] Failed to update:', err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, orgId]
  );

  return {
    settings,
    loading,
    error,
    saving,
    updateSettings,
    refresh: fetchSettings,
  };
}

// =============================================================================
// Team Management Hook
// =============================================================================

export function useTeamManagement() {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const queryClient = useQueryClient();

  const { data: teamData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['advisorTeam', orgId],
    queryFn: async () => {
      const [membersData, invitationsData] = await Promise.all([
        settingsService.getOrgMembers(orgId!),
        settingsService.getInvitations(orgId!),
      ]);
      return { members: membersData, invitations: invitationsData };
    },
    enabled: !!orgId,
    staleTime: 60 * 1000,
  });

  const members = teamData?.members ?? [];
  const invitations = teamData?.invitations ?? [];
  const error = queryError ? 'Failed to load team data' : null;

  const invalidateTeam = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['advisorTeam', orgId] }),
    [queryClient, orgId]
  );

  const updateMemberRole = useCallback(
    async (memberId: string, role: string) => {
      if (!orgId) return;
      await settingsService.updateMemberRole(orgId, memberId, role);
      await invalidateTeam();
    },
    [orgId, invalidateTeam]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      if (!orgId) return;
      await settingsService.removeMember(orgId, memberId);
      await invalidateTeam();
    },
    [orgId, invalidateTeam]
  );

  const inviteMember = useCallback(
    async (input: CreateInvitationInput) => {
      if (!orgId || !userId) return;
      const invitation = await settingsService.createInvitation(orgId, userId, input);
      await invalidateTeam();
      return invitation;
    },
    [orgId, userId, invalidateTeam]
  );

  const revokeInvitation = useCallback(
    async (invitationId: string) => {
      await settingsService.revokeInvitation(invitationId);
      await invalidateTeam();
    },
    [invalidateTeam]
  );

  const resendInvitation = useCallback(
    async (invitationId: string) => {
      if (!userId) return;
      await settingsService.resendInvitation(invitationId, userId);
      await invalidateTeam();
    },
    [userId, invalidateTeam]
  );

  return {
    members,
    invitations,
    loading,
    error,
    updateMemberRole,
    removeMember,
    inviteMember,
    revokeInvitation,
    resendInvitation,
    refresh: invalidateTeam,
  };
}

// =============================================================================
// API Keys Hook
// =============================================================================

export function useApiKeys() {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      const data = await settingsService.getApiKeys(orgId);
      setApiKeys(data);
      setError(null);
    } catch (err) {
      console.error('[useApiKeys] Failed to fetch:', err);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const createApiKey = useCallback(
    async (input: CreateApiKeyInput) => {
      if (!orgId || !userId) return null;
      const result = await settingsService.createApiKey(orgId, userId, input);
      await fetchApiKeys();
      return result; // Contains { key, secret }
    },
    [orgId, userId, fetchApiKeys]
  );

  const revokeApiKey = useCallback(
    async (keyId: string) => {
      await settingsService.revokeApiKey(keyId);
      await fetchApiKeys();
    },
    [fetchApiKeys]
  );

  const deleteApiKey = useCallback(
    async (keyId: string) => {
      await settingsService.deleteApiKey(keyId);
      await fetchApiKeys();
    },
    [fetchApiKeys]
  );

  return {
    apiKeys,
    loading,
    error,
    createApiKey,
    revokeApiKey,
    deleteApiKey,
    refresh: fetchApiKeys,
  };
}

// =============================================================================
// Integrations Hook
// =============================================================================

export function useIntegrations() {
  const { profile } = useAdvisor();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (!orgId) return;

    try {
      setLoading(true);
      const data = await integrationService.getIntegrations(orgId);
      setIntegrations(data);
      setError(null);
    } catch (err) {
      console.error('[useIntegrations] Failed to fetch:', err);
      setError('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const createIntegration = useCallback(
    async (input: CreateIntegrationInput) => {
      if (!orgId || !userId) return null;
      const integration = await integrationService.createIntegration(orgId, userId, input);
      await fetchIntegrations();
      return integration;
    },
    [orgId, userId, fetchIntegrations]
  );

  const updateIntegration = useCallback(
    async (integrationId: string, input: UpdateIntegrationInput) => {
      const updated = await integrationService.updateIntegration(integrationId, input);
      await fetchIntegrations();
      return updated;
    },
    [fetchIntegrations]
  );

  const deleteIntegration = useCallback(
    async (integrationId: string) => {
      await integrationService.deleteIntegration(integrationId);
      await fetchIntegrations();
    },
    [fetchIntegrations]
  );

  const toggleIntegration = useCallback(
    async (integrationId: string, enabled: boolean) => {
      await integrationService.toggleIntegration(integrationId, enabled);
      await fetchIntegrations();
    },
    [fetchIntegrations]
  );

  // Get catalog of available integrations
  const availableIntegrations = AVAILABLE_INTEGRATIONS;

  // Check which integrations are configured
  const configuredProviders = new Set(integrations.map((i) => i.provider));

  return {
    integrations,
    availableIntegrations,
    configuredProviders,
    loading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration,
    refresh: fetchIntegrations,
  };
}
