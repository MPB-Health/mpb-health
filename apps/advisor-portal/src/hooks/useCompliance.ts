// ============================================================================
// Compliance & AI Hooks
// ============================================================================

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  complianceService,
  aiService,
  type AuditLogDetailed,
  MessageAssistRequest,
  MessageAssistResponse,
} from '@mpbhealth/champion-core';
import { useOrganization } from './useOrganization';
import { useAdvisorQueryReady } from './useAdvisorQueryReady';

// ============================================================================
// COMPLIANCE DOCUMENTS
// ============================================================================

export function useComplianceDocuments(options: { category?: string; activeOnly?: boolean } = {}) {
  const { organization } = useOrganization();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = organization?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['complianceDocuments', orgId, options.category, options.activeOnly] as const,
    queryFn: () => complianceService.getDocuments(orgId!, options),
    enabled: Boolean(advisorReady && orgId),
  });

  const refresh = useCallback(() => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: ['complianceDocuments', orgId] });
  }, [queryClient, orgId]);

  return {
    documents: query.data ?? [],
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}

export function useComplianceDocument(documentId: string | undefined) {
  const query = useQuery({
    queryKey: ['complianceDocument', documentId] as const,
    queryFn: () => complianceService.getDocument(documentId!),
    enabled: Boolean(documentId),
  });

  return {
    document: query.data ?? null,
    loading: query.isPending,
    error: query.error ?? null,
  };
}

// ============================================================================
// USER ACKNOWLEDGMENTS
// ============================================================================

export function useUserAcknowledgments(userId: string | undefined, options: { status?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['userAcknowledgments', userId, options.status] as const,
    queryFn: () =>
      complianceService.getUserAcknowledgments(userId!, {
        ...options,
        includeDocument: true,
      }),
    enabled: Boolean(userId),
  });

  const refresh = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: ['userAcknowledgments', userId] });
  }, [queryClient, userId]);

  return {
    acknowledgments: query.data ?? [],
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}

export function usePendingAcknowledgments(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pendingAcknowledgments', userId] as const,
    queryFn: () => complianceService.getPendingAcknowledgments(userId!),
    enabled: Boolean(userId),
  });

  const refresh = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: ['pendingAcknowledgments', userId] });
  }, [queryClient, userId]);

  return {
    pending: query.data ?? [],
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}

// ============================================================================
// COMPLIANCE STATUS
// ============================================================================

export function useUserComplianceStatus(userId: string | undefined) {
  const { organization } = useOrganization();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = organization?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['userComplianceStatus', orgId, userId] as const,
    queryFn: () => complianceService.getUserComplianceStatus(orgId!, userId!),
    enabled: Boolean(advisorReady && orgId && userId),
  });

  const refresh = useCallback(() => {
    if (!orgId || !userId) return;
    void queryClient.invalidateQueries({
      queryKey: ['userComplianceStatus', orgId, userId],
    });
  }, [queryClient, orgId, userId]);

  return {
    status: query.data ?? null,
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}

export function useOrgComplianceSummary() {
  const { organization } = useOrganization();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = organization?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['orgComplianceSummary', orgId] as const,
    queryFn: () => complianceService.getOrgComplianceSummary(orgId!),
    enabled: Boolean(advisorReady && orgId),
  });

  const refresh = useCallback(() => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: ['orgComplianceSummary', orgId] });
  }, [queryClient, orgId]);

  return {
    summary: query.data ?? null,
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}

// ============================================================================
// VIOLATIONS
// ============================================================================

export function useViolations(options: {
  status?: string;
  severity?: string;
  userId?: string;
  limit?: number;
} = {}) {
  const { organization } = useOrganization();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = organization?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [
      'complianceViolations',
      orgId,
      options.status,
      options.severity,
      options.userId,
      options.limit,
    ] as const,
    queryFn: () => complianceService.getViolations(orgId!, options),
    enabled: Boolean(advisorReady && orgId),
  });

  const refresh = useCallback(() => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: ['complianceViolations', orgId] });
  }, [queryClient, orgId]);

  return {
    violations: query.data ?? [],
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export function useAuditLogs(options: {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
} = {}) {
  const { organization } = useOrganization();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = organization?.id;
  const queryClient = useQueryClient();

  const startKey = options.startDate?.toISOString() ?? '';
  const endKey = options.endDate?.toISOString() ?? '';

  const query = useQuery({
    queryKey: [
      'auditLogs',
      orgId,
      options.userId,
      options.action,
      options.resourceType,
      options.limit,
      options.offset,
      startKey,
      endKey,
    ] as const,
    queryFn: async () => {
      const data = await complianceService.getAuditLogs(orgId!, options);
      return {
        logs: data.logs as unknown as AuditLogDetailed[],
        total: data.total,
      };
    },
    enabled: Boolean(advisorReady && orgId),
    placeholderData: (prev) => prev,
  });

  const refresh = useCallback(() => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: ['auditLogs', orgId] });
  }, [queryClient, orgId]);

  return {
    logs: query.data?.logs ?? [],
    total: query.data?.total ?? 0,
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}

// ============================================================================
// AI SUGGESTIONS
// ============================================================================

export function useAISuggestions(
  userId: string | undefined,
  options: { type?: string; status?: string; leadId?: string; limit?: number } = {},
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['aiSuggestions', userId, options.type, options.status, options.leadId, options.limit] as const,
    queryFn: () =>
      aiService.getSuggestions(userId!, {
        type: options.type as never,
        status: options.status,
        leadId: options.leadId,
        limit: options.limit,
      }),
    enabled: Boolean(userId),
  });

  const refresh = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: ['aiSuggestions', userId] });
  }, [queryClient, userId]);

  return {
    suggestions: query.data ?? [],
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}

export function usePendingAISuggestions(
  userId: string | undefined,
  context: { leadId?: string; conversationId?: string } = {},
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pendingAISuggestions', userId, context.leadId, context.conversationId] as const,
    queryFn: () => aiService.getPendingSuggestions(userId!, context),
    enabled: Boolean(userId),
  });

  const refresh = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: ['pendingAISuggestions', userId] });
  }, [queryClient, userId]);

  return {
    suggestions: query.data ?? [],
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}

// ============================================================================
// AI SCORING FACTORS
// ============================================================================

export function useLeadScoringFactors(leadId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['leadScoringFactors', leadId] as const,
    queryFn: () => aiService.getLeadScoringFactors(leadId!),
    enabled: Boolean(leadId),
  });

  const refresh = useCallback(() => {
    if (!leadId) return;
    void queryClient.invalidateQueries({ queryKey: ['leadScoringFactors', leadId] });
  }, [queryClient, leadId]);

  return {
    factors: query.data ?? [],
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}

// ============================================================================
// AI MESSAGE ASSIST
// ============================================================================

export function useMessageAssist() {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const assist = useCallback(async (
    userId: string,
    request: MessageAssistRequest
  ): Promise<MessageAssistResponse | null> => {
    if (!organization?.id) return null;

    setLoading(true);
    setError(null);
    try {
      const response = await aiService.getMessageAssist(organization.id, userId, request);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get AI assistance'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  return { assist, loading, error };
}

// ============================================================================
// COMPLIANCE ACTIONS
// ============================================================================

export function useComplianceActions() {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const completeAcknowledgment = useCallback(async (input: {
    acknowledgment_id: string;
    signature_data?: string;
    signed_name?: string;
    quiz_score?: number;
    quiz_answers?: Record<string, number>;
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const result = await complianceService.completeAcknowledgment(input);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to complete acknowledgment'));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const createViolation = useCallback(async (input: {
    user_id?: string;
    lead_id?: string;
    conversation_id?: string;
    message_id?: string;
    violation_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    evidence?: Record<string, unknown>;
    detected_by?: 'manual' | 'ai' | 'system';
    detection_rule?: string;
  }) => {
    if (!organization?.id) return null;

    setLoading(true);
    setError(null);
    try {
      const result = await complianceService.createViolation(organization.id, input);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create violation'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  const updateViolationStatus = useCallback(async (
    violationId: string,
    status: 'investigating' | 'resolved' | 'dismissed',
    notes?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      await complianceService.updateViolationStatus(violationId, status, notes);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update violation'));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const recordSuggestionFeedback = useCallback(async (
    suggestionId: string,
    status: 'accepted' | 'rejected' | 'modified' | 'ignored',
    feedback?: string,
    modifiedContent?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      await aiService.recordSuggestionFeedback(suggestionId, status, feedback, modifiedContent);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to record feedback'));
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    completeAcknowledgment,
    createViolation,
    updateViolationStatus,
    recordSuggestionFeedback,
    loading,
    error,
  };
}

// ============================================================================
// AI SUGGESTION STATS
// ============================================================================

export function useAISuggestionStats(options: { userId?: string; days?: number } = {}) {
  const { organization } = useOrganization();
  const { advisorReady } = useAdvisorQueryReady();
  const orgId = organization?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['aiSuggestionStats', orgId, options.userId, options.days] as const,
    queryFn: () => aiService.getSuggestionStats(orgId!, options),
    enabled: Boolean(advisorReady && orgId),
  });

  const refresh = useCallback(() => {
    if (!orgId) return;
    void queryClient.invalidateQueries({ queryKey: ['aiSuggestionStats', orgId] });
  }, [queryClient, orgId]);

  return {
    stats: query.data ?? null,
    loading: query.isPending,
    error: query.error ?? null,
    refresh,
  };
}
