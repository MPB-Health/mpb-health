// ============================================================================
// Compliance & AI Types
// ============================================================================

export interface ComplianceDocument {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  category: string;
  document_type: 'acknowledgment' | 'signature' | 'quiz' | 'training';
  content_url: string | null;
  content_html: string | null;
  version: string;
  is_required: boolean;
  required_for_roles: string[];
  due_within_days: number | null;
  renewal_period_days: number | null;
  quiz_questions: QuizQuestion[];
  passing_score: number;
  is_active: boolean;
  effective_date: string | null;
  expiration_date: string | null;
  total_required: number;
  total_completed: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface ComplianceAcknowledgment {
  id: string;
  org_id: string;
  document_id: string;
  user_id: string;
  status: 'pending' | 'completed' | 'expired' | 'failed';
  completed_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
  signature_data: string | null;
  signed_name: string | null;
  quiz_score: number | null;
  quiz_answers: Record<string, number> | null;
  quiz_attempts: number;
  due_date: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplianceAcknowledgmentWithDocument extends ComplianceAcknowledgment {
  document: ComplianceDocument;
}

export interface ComplianceViolation {
  id: string;
  org_id: string;
  user_id: string | null;
  lead_id: string | null;
  conversation_id: string | null;
  message_id: string | null;
  violation_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: Record<string, unknown>;
  detected_by: 'manual' | 'ai' | 'system';
  detection_rule: string | null;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserComplianceStatus {
  total_required: number;
  total_completed: number;
  total_pending: number;
  total_overdue: number;
  compliance_score: number;
}

export interface OrgComplianceSummary {
  total_users: number;
  fully_compliant: number;
  partially_compliant: number;
  non_compliant: number;
  open_violations: number;
  avg_compliance_score: number;
}

export interface AISuggestion {
  id: string;
  org_id: string;
  user_id: string;
  lead_id: string | null;
  conversation_id: string | null;
  suggestion_type: SuggestionType;
  context_type: string;
  title: string;
  content: string;
  reasoning: string | null;
  confidence: number | null;
  original_message: string | null;
  suggested_message: string | null;
  tone: string | null;
  suggested_score_delta: number | null;
  suggested_lane_id: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'modified' | 'ignored';
  user_feedback: string | null;
  modified_content: string | null;
  shown_at: string | null;
  acted_at: string | null;
  created_at: string;
}

export type SuggestionType =
  | 'message_draft'
  | 'reply_suggestion'
  | 'score_adjustment'
  | 'lane_move'
  | 'next_action';

export interface AIScoringFactor {
  id: string;
  org_id: string;
  lead_id: string | null;
  priority_item_id: string | null;
  factor_type: string;
  factor_name: string;
  score_impact: number;
  analysis_data: Record<string, unknown>;
  reasoning: string | null;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  org_id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogDetailed extends AuditLog {
  user_name: string | null;
  user_email: string | null;
}

// Input types
export interface CreateDocumentInput {
  title: string;
  description?: string;
  category?: string;
  document_type?: 'acknowledgment' | 'signature' | 'quiz' | 'training';
  content_url?: string;
  content_html?: string;
  is_required?: boolean;
  required_for_roles?: string[];
  due_within_days?: number;
  renewal_period_days?: number;
  quiz_questions?: QuizQuestion[];
  passing_score?: number;
}

export interface CompleteAcknowledgmentInput {
  acknowledgment_id: string;
  signature_data?: string;
  signed_name?: string;
  quiz_score?: number;
  quiz_answers?: Record<string, number>;
}

export interface CreateViolationInput {
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
}

export interface MessageAssistRequest {
  original_message?: string;
  context?: string;
  lead_name?: string;
  tone?: 'professional' | 'friendly' | 'urgent' | 'empathetic';
  action?: 'improve' | 'shorten' | 'expand' | 'check_compliance';
}

export interface MessageAssistResponse {
  suggestion_id: string;
  suggested_message: string;
  reasoning: string;
  compliance_issues?: string[];
  confidence: number;
}
