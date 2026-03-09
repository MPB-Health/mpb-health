// ============================================================================
// Compliance & AI Hooks
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  complianceService,
  aiService,
  ComplianceDocument,
  ComplianceAcknowledgmentWithDocument,
  ComplianceViolation,
  UserComplianceStatus,
  OrgComplianceSummary,
  AISuggestion,
  AIScoringFactor,
  AuditLogDetailed,
  MessageAssistRequest,
  MessageAssistResponse,
} from '@mpbhealth/champion-core';
import { useOrganization } from './useOrganization';

// ============================================================================
// COMPLIANCE DOCUMENTS
// ============================================================================

export function useComplianceDocuments(options: { category?: string; activeOnly?: boolean } = {}) {
  const { organization } = useOrganization();
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const data = await complianceService.getDocuments(organization.id, options);
      setDocuments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load documents'));
    } finally {
      setLoading(false);
    }
  }, [organization?.id, options.category, options.activeOnly]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { documents, loading, error, refresh };
}

export function useComplianceDocument(documentId: string | undefined) {
  const [document, setDocument] = useState<ComplianceDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setDocument(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        const data = await complianceService.getDocument(documentId);
        setDocument(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load document'));
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [documentId]);

  return { document, loading, error };
}

// ============================================================================
// USER ACKNOWLEDGMENTS
// ============================================================================

export function useUserAcknowledgments(userId: string | undefined, options: { status?: string } = {}) {
  const [acknowledgments, setAcknowledgments] = useState<ComplianceAcknowledgmentWithDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await complianceService.getUserAcknowledgments(userId, {
        ...options,
        includeDocument: true,
      });
      setAcknowledgments(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load acknowledgments'));
    } finally {
      setLoading(false);
    }
  }, [userId, options.status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { acknowledgments, loading, error, refresh };
}

export function usePendingAcknowledgments(userId: string | undefined) {
  const [pending, setPending] = useState<ComplianceAcknowledgmentWithDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await complianceService.getPendingAcknowledgments(userId);
      setPending(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load pending acknowledgments'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { pending, loading, error, refresh };
}

// ============================================================================
// COMPLIANCE STATUS
// ============================================================================

export function useUserComplianceStatus(userId: string | undefined) {
  const { organization } = useOrganization();
  const [status, setStatus] = useState<UserComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id || !userId) return;

    setLoading(true);
    try {
      const data = await complianceService.getUserComplianceStatus(organization.id, userId);
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load compliance status'));
    } finally {
      setLoading(false);
    }
  }, [organization?.id, userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
}

export function useOrgComplianceSummary() {
  const { organization } = useOrganization();
  const [summary, setSummary] = useState<OrgComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const data = await complianceService.getOrgComplianceSummary(organization.id);
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load org summary'));
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { summary, loading, error, refresh };
}

// ============================================================================
// VIOLATIONS
// ============================================================================

export function useViolations(options: { status?: string; severity?: string; userId?: string; limit?: number } = {}) {
  const { organization } = useOrganization();
  const [violations, setViolations] = useState<ComplianceViolation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const data = await complianceService.getViolations(organization.id, options);
      setViolations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load violations'));
    } finally {
      setLoading(false);
    }
  }, [organization?.id, options.status, options.severity, options.userId, options.limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { violations, loading, error, refresh };
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
  const [logs, setLogs] = useState<AuditLogDetailed[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const data = await complianceService.getAuditLogs(organization.id, options);
      setLogs(data.logs as unknown as AuditLogDetailed[]);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load audit logs'));
    } finally {
      setLoading(false);
    }
  }, [organization?.id, JSON.stringify(options)]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { logs, total, loading, error, refresh };
}

// ============================================================================
// AI SUGGESTIONS
// ============================================================================

export function useAISuggestions(userId: string | undefined, options: { type?: string; status?: string; leadId?: string; limit?: number } = {}) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await aiService.getSuggestions(userId, {
        type: options.type as never,
        status: options.status,
        leadId: options.leadId,
        limit: options.limit,
      });
      setSuggestions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load suggestions'));
    } finally {
      setLoading(false);
    }
  }, [userId, options.type, options.status, options.leadId, options.limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { suggestions, loading, error, refresh };
}

export function usePendingAISuggestions(userId: string | undefined, context: { leadId?: string; conversationId?: string } = {}) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const data = await aiService.getPendingSuggestions(userId, context);
      setSuggestions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load pending suggestions'));
    } finally {
      setLoading(false);
    }
  }, [userId, context.leadId, context.conversationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { suggestions, loading, error, refresh };
}

// ============================================================================
// AI SCORING FACTORS
// ============================================================================

export function useLeadScoringFactors(leadId: string | undefined) {
  const [factors, setFactors] = useState<AIScoringFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!leadId) return;

    setLoading(true);
    try {
      const data = await aiService.getLeadScoringFactors(leadId);
      setFactors(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load scoring factors'));
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { factors, loading, error, refresh };
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
  const [stats, setStats] = useState<{
    total: number;
    accepted: number;
    rejected: number;
    modified: number;
    ignored: number;
    acceptanceRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;

    setLoading(true);
    try {
      const data = await aiService.getSuggestionStats(organization.id, options);
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load stats'));
    } finally {
      setLoading(false);
    }
  }, [organization?.id, options.userId, options.days]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stats, loading, error, refresh };
}
