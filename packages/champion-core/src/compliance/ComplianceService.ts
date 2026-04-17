// ============================================================================
// Compliance Service — Manages compliance documents, acknowledgments, violations
// ============================================================================

import { supabase } from '@mpbhealth/database';
import type {
  ComplianceDocument,
  ComplianceAcknowledgmentWithDocument,
  ComplianceViolation,
  UserComplianceStatus,
  OrgComplianceSummary,
  CreateDocumentInput,
  CompleteAcknowledgmentInput,
  CreateViolationInput,
} from './types';

export class ComplianceService {
  // =========================================================================
  // DOCUMENTS
  // =========================================================================

  /**
   * Get all compliance documents for an org
   */
  async getDocuments(
    orgId: string,
    options: { category?: string; activeOnly?: boolean } = {}
  ): Promise<ComplianceDocument[]> {
    let query = supabase
      .from('compliance_documents')
      .select('id, org_id, title, description, document_type, content, file_url, version, is_required, is_active, due_date, created_at, updated_at')
      .eq('org_id', orgId)
      .order('category')
      .order('title');

    if (options.category) {
      query = query.eq('category', options.category);
    }

    if (options.activeOnly !== false) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ComplianceService] Failed to get documents:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Get a single document by ID
   */
  async getDocument(documentId: string): Promise<ComplianceDocument | null> {
    const { data, error } = await supabase
      .from('compliance_documents')
      .select('id, org_id, title, description, document_type, content, file_url, version, is_required, is_active, due_date, created_at, updated_at')
      .eq('id', documentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[ComplianceService] Failed to get document:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Create a compliance document
   */
  async createDocument(orgId: string, input: CreateDocumentInput): Promise<ComplianceDocument> {
    const { data, error } = await supabase
      .from('compliance_documents')
      .insert({
        org_id: orgId,
        title: input.title,
        description: input.description,
        document_type: input.document_type || 'acknowledgment',
        content: input.content_html || null,
        file_url: input.content_url || null,
        is_required: input.is_required ?? true,
        due_date: input.due_within_days ? new Date(Date.now() + input.due_within_days * 86400000).toISOString() : null,
      })
      .select('id, org_id, title, description, document_type, content, file_url, version, is_required, is_active, due_date, created_at, updated_at')
      .single();

    if (error) {
      console.error('[ComplianceService] Failed to create document:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Update a compliance document
   */
  async updateDocument(
    documentId: string,
    input: Partial<CreateDocumentInput>
  ): Promise<ComplianceDocument> {
    const { data, error } = await supabase
      .from('compliance_documents')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select('id, org_id, title, description, document_type, content, file_url, version, is_required, is_active, due_date, created_at, updated_at')
      .single();

    if (error) {
      console.error('[ComplianceService] Failed to update document:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Delete a compliance document
   */
  async deleteDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('compliance_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('[ComplianceService] Failed to delete document:', error);
      throw error;
    }
  }

  // =========================================================================
  // ACKNOWLEDGMENTS
  // =========================================================================

  /**
   * Get user's acknowledgments
   */
  async getUserAcknowledgments(
    userId: string,
    options: { status?: string; includeDocument?: boolean } = {}
  ): Promise<ComplianceAcknowledgmentWithDocument[]> {
    let query = supabase
      .from('compliance_acknowledgments')
      .select(options.includeDocument !== false
        ? 'id, user_id, document_id, status, acknowledged_at, due_date, ip_address, user_agent, created_at, updated_at, document:compliance_documents(id, org_id, title, description, document_type, content, file_url, version, is_required, is_active, due_date, created_at, updated_at)'
        : 'id, user_id, document_id, status, acknowledged_at, due_date, ip_address, user_agent, created_at, updated_at')
      .eq('user_id', userId)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ComplianceService] Failed to get acknowledgments:', error);
      throw error;
    }

    return (data || []) as unknown as ComplianceAcknowledgmentWithDocument[];
  }

  /**
   * Get pending acknowledgments for a user
   */
  async getPendingAcknowledgments(userId: string): Promise<ComplianceAcknowledgmentWithDocument[]> {
    return this.getUserAcknowledgments(userId, { status: 'pending', includeDocument: true });
  }

  /**
   * Get a single acknowledgment
   */
  async getAcknowledgment(acknowledgmentId: string): Promise<ComplianceAcknowledgmentWithDocument | null> {
    const { data, error } = await supabase
      .from('compliance_acknowledgments')
      .select('id, user_id, document_id, status, acknowledged_at, due_date, ip_address, user_agent, created_at, updated_at, document:compliance_documents(id, org_id, title, description, document_type, content, file_url, version, is_required, is_active, due_date, created_at, updated_at)')
      .eq('id', acknowledgmentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[ComplianceService] Failed to get acknowledgment:', error);
      throw error;
    }

    return data as unknown as ComplianceAcknowledgmentWithDocument | null;
  }

  /**
   * Complete an acknowledgment
   */
  async completeAcknowledgment(input: CompleteAcknowledgmentInput): Promise<boolean> {
    const { data, error } = await supabase.rpc('complete_compliance_acknowledgment', {
      p_acknowledgment_id: input.acknowledgment_id,
      p_signature_data: input.signature_data || null,
      p_signed_name: input.signed_name || null,
      p_quiz_score: input.quiz_score || null,
      p_quiz_answers: input.quiz_answers || null,
    });

    if (error) {
      console.error('[ComplianceService] Failed to complete acknowledgment:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Create acknowledgments for a new user
   */
  async createUserRequirements(orgId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('create_user_compliance_requirements', {
      p_org_id: orgId,
      p_user_id: userId,
    });

    if (error) {
      console.error('[ComplianceService] Failed to create requirements:', error);
      throw error;
    }
  }

  /**
   * Get user compliance status
   */
  async getUserComplianceStatus(orgId: string, userId: string): Promise<UserComplianceStatus> {
    const { data, error } = await supabase.rpc('get_user_compliance_status', {
      p_org_id: orgId,
      p_user_id: userId,
    });

    if (error) {
      console.error('[ComplianceService] Failed to get compliance status:', error);
      throw error;
    }

    return data[0] || {
      total_required: 0,
      total_completed: 0,
      total_pending: 0,
      total_overdue: 0,
      compliance_score: 100,
    };
  }

  /**
   * Get org compliance summary
   */
  async getOrgComplianceSummary(orgId: string): Promise<OrgComplianceSummary> {
    const { data, error } = await supabase.rpc('get_org_compliance_summary', {
      p_org_id: orgId,
    });

    if (error) {
      console.error('[ComplianceService] Failed to get org summary:', error);
      throw error;
    }

    return data[0] || {
      total_users: 0,
      fully_compliant: 0,
      partially_compliant: 0,
      non_compliant: 0,
      open_violations: 0,
      avg_compliance_score: 0,
    };
  }

  // =========================================================================
  // VIOLATIONS
  // =========================================================================

  /**
   * Get violations for an org
   */
  async getViolations(
    orgId: string,
    options: { status?: string; severity?: string; userId?: string; limit?: number } = {}
  ): Promise<ComplianceViolation[]> {
    let query = supabase
      .from('compliance_violations')
      .select('id, org_id, user_id, lead_id, conversation_id, message_id, violation_type, severity, description, evidence, detected_by, detection_rule, status, resolution_notes, resolved_by, resolved_at, created_at, updated_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.severity) {
      query = query.eq('severity', options.severity);
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ComplianceService] Failed to get violations:', error);
      throw error;
    }

    return (data || []) as any;
  }

  /**
   * Create a violation
   */
  async createViolation(orgId: string, input: CreateViolationInput): Promise<ComplianceViolation> {
    const { data, error } = await supabase
      .from('compliance_violations')
      .insert({
        org_id: orgId,
        user_id: input.user_id,
        lead_id: input.lead_id,
        conversation_id: input.conversation_id,
        message_id: input.message_id,
        violation_type: input.violation_type,
        severity: input.severity,
        description: input.description,
        evidence: input.evidence || {},
        detected_by: input.detected_by || 'manual',
        detection_rule: input.detection_rule,
      })
      .select('id, org_id, user_id, lead_id, conversation_id, message_id, violation_type, severity, description, evidence, detected_by, detection_rule, status, resolution_notes, resolved_by, resolved_at, created_at, updated_at')
      .single();

    if (error) {
      console.error('[ComplianceService] Failed to create violation:', error);
      throw error;
    }

    return data as any;
  }

  /**
   * Update violation status
   */
  async updateViolationStatus(
    violationId: string,
    status: 'investigating' | 'resolved' | 'dismissed',
    notes?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.resolution_notes = notes;
    }

    if (status === 'resolved' || status === 'dismissed') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('compliance_violations')
      .update(updateData)
      .eq('id', violationId);

    if (error) {
      console.error('[ComplianceService] Failed to update violation:', error);
      throw error;
    }
  }

  // =========================================================================
  // AUDIT LOGS
  // =========================================================================

  /**
   * Get audit logs
   */
  async getAuditLogs(
    orgId: string,
    options: {
      userId?: string;
      action?: string;
      resourceType?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ logs: Record<string, unknown>[]; total: number }> {
    let query = supabase
      .from('audit_logs_detailed')
      .select('id, org_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at, user_name, user_email', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.action) {
      query = query.ilike('action', `%${options.action}%`);
    }

    if (options.resourceType) {
      query = query.eq('resource_type', options.resourceType);
    }

    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[ComplianceService] Failed to get audit logs:', error);
      throw error;
    }

    return { logs: data || [], total: count || 0 };
  }

  /**
   * Get document categories
   */
  async getDocumentCategories(orgId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('compliance_documents')
      .select('document_type')
      .eq('org_id', orgId)
      .eq('is_active', true);

    if (error) {
      console.error('[ComplianceService] Failed to get categories:', error);
      return [];
    }

    const categories = new Set((data || []).map((d) => d.category).filter(Boolean));
    return Array.from(categories).sort();
  }
}

export const complianceService = new ComplianceService();
