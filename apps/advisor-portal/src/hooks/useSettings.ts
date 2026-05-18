// ============================================================================
// Settings Hooks — React hooks for settings management
// ============================================================================

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  settingsService,
  integrationService,
  type OrganizationSettings,
  type UserPreferences,
  type NotificationSettings,
  type IntegrationConfig,
  type ApiKey,
  type UpdateOrgSettingsInput,
  type UpdateUserPreferencesInput,
  type UpdateNotificationSettingsInput,
  type CreateApiKeyInput,
  type CreateInvitationInput,
  type CreateIntegrationInput,
  type UpdateIntegrationInput,
  AVAILABLE_INTEGRATIONS,
} from '@mpbhealth/champion-core';
import { useAdvisor } from '../contexts/AdvisorContext';
import { useAdvisorQueryReady } from './useAdvisorQueryReady';

// =============================================================================
// Organization Settings Hook
// =============================================================================

export function useOrgSettings() {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = profile?.org_id;
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const query = useQuery({
    queryKey: ['advisorOrgSettings', orgId] as const,
    queryFn: () => settingsService.getOrgSettings(orgId!),
    enabled: Boolean(advisorReady && orgId),
    placeholderData: (prev) => prev,
  });

  const refresh = useCallback(() => {
    if (!orgId) return Promise.resolve();
    return queryClient.invalidateQueries({ queryKey: ['advisorOrgSettings', orgId] });
  }, [queryClient, orgId]);

  const updateSettings = useCallback(
    async (input: UpdateOrgSettingsInput) => {
      if (!orgId) return;

      try {
        setSaving(true);
        const updated = await settingsService.updateOrgSettings(orgId, input);
        queryClient.setQueryData<OrganizationSettings>(['advisorOrgSettings', orgId], updated);
        return updated;
      } catch (err) {
        console.error('[useOrgSettings] Failed to update:', err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [orgId, queryClient],
  );

  const errorMsg = query.isError ? 'Failed to load organization settings' : null;

  return {
    settings: query.data ?? null,
    loading: query.isPending,
    error: errorMsg,
    saving,
    updateSettings,
    refresh,
  };
}

// =============================================================================
// User Preferences Hook
// =============================================================================

export function useUserPreferences() {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const userId = profile?.user_id;
  const orgId = profile?.org_id;
  const effectiveOrgId = orgId ?? '';
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const query = useQuery({
    queryKey: ['advisorUserPreferences', userId, effectiveOrgId] as const,
    queryFn: () => settingsService.getUserPreferences(userId!, effectiveOrgId),
    enabled: Boolean(advisorReady && userId),
    placeholderData: (prev) => prev,
  });

  const refresh = useCallback(() => {
    if (!userId) return Promise.resolve();
    return queryClient.invalidateQueries({
      queryKey: ['advisorUserPreferences', userId],
    });
  }, [queryClient, userId]);

  const updatePreferences = useCallback(
    async (input: UpdateUserPreferencesInput) => {
      if (!userId) return;

      try {
        setSaving(true);
        const updated = await settingsService.updateUserPreferences(userId, effectiveOrgId, input);
        queryClient.setQueryData<UserPreferences>(
          ['advisorUserPreferences', userId, effectiveOrgId],
          updated,
        );
        return updated;
      } catch (err) {
        console.error('[useUserPreferences] Failed to update:', err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, effectiveOrgId, queryClient],
  );

  const errorMsg = query.isError ? 'Failed to load user preferences' : null;

  return {
    preferences: query.data ?? null,
    loading: query.isPending,
    error: errorMsg,
    saving,
    updatePreferences,
    refresh,
  };
}

// =============================================================================
// Notification Settings Hook
// =============================================================================

export function useNotificationSettings() {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const userId = profile?.user_id;
  const orgId = profile?.org_id;
  const effectiveOrgId = orgId ?? '';
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const query = useQuery({
    queryKey: ['advisorNotificationSettings', userId, effectiveOrgId] as const,
    queryFn: () => settingsService.getNotificationSettings(userId!, effectiveOrgId),
    enabled: Boolean(advisorReady && userId),
    placeholderData: (prev) => prev,
  });

  const refresh = useCallback(() => {
    if (!userId) return Promise.resolve();
    return queryClient.invalidateQueries({
      queryKey: ['advisorNotificationSettings', userId],
    });
  }, [queryClient, userId]);

  const updateSettings = useCallback(
    async (input: UpdateNotificationSettingsInput) => {
      if (!userId) throw new Error('User not loaded');

      try {
        setSaving(true);
        const updated = await settingsService.updateNotificationSettings(
          userId,
          effectiveOrgId,
          input,
        );
        queryClient.setQueryData<NotificationSettings>(
          ['advisorNotificationSettings', userId, effectiveOrgId],
          updated,
        );
        return updated;
      } catch (err) {
        console.error('[useNotificationSettings] Failed to update:', err);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, effectiveOrgId, queryClient],
  );

  const errorMsg = query.isError ? 'Failed to load notification settings' : null;

  return {
    settings: query.data ?? null,
    loading: query.isPending,
    error: errorMsg,
    saving,
    updateSettings,
    refresh,
  };
}

// =============================================================================
// Team Management Hook
// =============================================================================

export function useTeamManagement() {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const queryClient = useQueryClient();

  const { data: teamData, isPending: loading, error: queryError } = useQuery({
    queryKey: ['advisorTeam', orgId] as const,
    queryFn: async () => {
      const [membersData, invitationsData] = await Promise.all([
        settingsService.getOrgMembers(orgId!),
        settingsService.getInvitations(orgId!),
      ]);
      return { members: membersData, invitations: invitationsData };
    },
    enabled: Boolean(advisorReady && orgId),
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  });

  const members = teamData?.members ?? [];
  const invitations = teamData?.invitations ?? [];
  const error = queryError ? 'Failed to load team data' : null;

  const invalidateTeam = useCallback(() => {
    return queryClient.invalidateQueries({ queryKey: ['advisorTeam', orgId] });
  }, [queryClient, orgId]);

  const updateMemberRole = useCallback(
    async (memberId: string, role: string) => {
      if (!orgId) return;
      await settingsService.updateMemberRole(orgId, memberId, role);
      await invalidateTeam();
    },
    [orgId, invalidateTeam],
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      if (!orgId) return;
      await settingsService.removeMember(orgId, memberId);
      await invalidateTeam();
    },
    [orgId, invalidateTeam],
  );

  const inviteMember = useCallback(
    async (input: CreateInvitationInput) => {
      if (!orgId || !userId) return;
      const invitation = await settingsService.createInvitation(orgId, userId, input);
      await invalidateTeam();
      return invitation;
    },
    [orgId, userId, invalidateTeam],
  );

  const revokeInvitation = useCallback(
    async (invitationId: string) => {
      await settingsService.revokeInvitation(invitationId);
      await invalidateTeam();
    },
    [invalidateTeam],
  );

  const resendInvitation = useCallback(
    async (invitationId: string) => {
      if (!userId) return;
      await settingsService.resendInvitation(invitationId, userId);
      await invalidateTeam();
    },
    [userId, invalidateTeam],
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
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['advisorApiKeys', orgId] as const,
    queryFn: () => settingsService.getApiKeys(orgId!),
    enabled: Boolean(advisorReady && orgId),
    placeholderData: (prev) => prev,
  });

  const invalidate = useCallback(() => {
    if (!orgId) return Promise.resolve();
    return queryClient.invalidateQueries({ queryKey: ['advisorApiKeys', orgId] });
  }, [queryClient, orgId]);

  const refresh = invalidate;

  const createApiKey = useCallback(
    async (input: CreateApiKeyInput) => {
      if (!orgId || !userId) return null;
      const result = await settingsService.createApiKey(orgId, userId, input);
      await invalidate();
      return result;
    },
    [orgId, userId, invalidate],
  );

  const revokeApiKey = useCallback(
    async (keyId: string) => {
      await settingsService.revokeApiKey(keyId);
      await invalidate();
    },
    [invalidate],
  );

  const deleteApiKey = useCallback(
    async (keyId: string) => {
      await settingsService.deleteApiKey(keyId);
      await invalidate();
    },
    [invalidate],
  );

  const errorMsg = query.isError ? 'Failed to load API keys' : null;

  return {
    apiKeys: query.data ?? [],
    loading: query.isPending,
    error: errorMsg,
    createApiKey,
    revokeApiKey,
    deleteApiKey,
    refresh,
  };
}

// =============================================================================
// Integrations Hook
// =============================================================================

export function useIntegrations() {
  const { profile } = useAdvisor();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = profile?.org_id;
  const userId = profile?.user_id;

  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['advisorIntegrations', orgId] as const,
    queryFn: () => integrationService.getIntegrations(orgId!),
    enabled: Boolean(advisorReady && orgId),
    placeholderData: (prev) => prev,
  });

  const invalidate = useCallback(() => {
    if (!orgId) return Promise.resolve();
    return queryClient.invalidateQueries({ queryKey: ['advisorIntegrations', orgId] });
  }, [queryClient, orgId]);

  const refresh = invalidate;

  const createIntegration = useCallback(
    async (input: CreateIntegrationInput) => {
      if (!orgId || !userId) return null;
      const integration = await integrationService.createIntegration(orgId, userId, input);
      await invalidate();
      return integration;
    },
    [orgId, userId, invalidate],
  );

  const updateIntegration = useCallback(
    async (integrationId: string, input: UpdateIntegrationInput) => {
      const updated = await integrationService.updateIntegration(integrationId, input);
      await invalidate();
      return updated;
    },
    [invalidate],
  );

  const deleteIntegration = useCallback(
    async (integrationId: string) => {
      await integrationService.deleteIntegration(integrationId);
      await invalidate();
    },
    [invalidate],
  );

  const toggleIntegration = useCallback(
    async (integrationId: string, enabled: boolean) => {
      await integrationService.toggleIntegration(integrationId, enabled);
      await invalidate();
    },
    [invalidate],
  );

  const availableIntegrations = AVAILABLE_INTEGRATIONS;

  const integrations = query.data ?? [];
  const configuredProviders = useMemo(
    () => new Set(integrations.map((i) => i.provider)),
    [integrations],
  );

  const errorMsg = query.isError ? 'Failed to load integrations' : null;

  return {
    integrations,
    availableIntegrations,
    configuredProviders,
    loading: query.isPending,
    error: errorMsg,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegration,
    refresh,
  };
}
