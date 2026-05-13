-- ============================================================================
-- Champion Phase 3: Compliance & AI
-- Compliance tracking, audit log enhancements, and AI-assisted features
-- ============================================================================

-- ============================================================================
-- COMPLIANCE DOCUMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Document info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- policy, procedure, training, disclosure, etc.
  document_type TEXT NOT NULL DEFAULT 'acknowledgment', -- acknowledgment, signature, quiz, training

  -- Content
  content_url TEXT, -- Link to document/PDF
  content_html TEXT, -- Inline HTML content
  version TEXT NOT NULL DEFAULT '1.0',

  -- Requirements
  is_required BOOLEAN NOT NULL DEFAULT true,
  required_for_roles TEXT[] DEFAULT ARRAY['advisor'], -- which roles must complete
  due_within_days INTEGER, -- days after hire/assignment to complete
  renewal_period_days INTEGER, -- how often to renew (null = one-time)

  -- Quiz settings (if document_type = 'quiz')
  quiz_questions JSONB DEFAULT '[]',
  passing_score INTEGER DEFAULT 80,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_date DATE,
  expiration_date DATE,

  -- Tracking
  total_required INTEGER NOT NULL DEFAULT 0,
  total_completed INTEGER NOT NULL DEFAULT 0,

  -- Ownership
  created_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes
CREATE INDEX idx_compliance_documents_org_id ON compliance_documents(org_id);
CREATE INDEX idx_compliance_documents_category ON compliance_documents(org_id, category);
CREATE INDEX idx_compliance_documents_active ON compliance_documents(org_id, is_active) WHERE is_active = true;
-- RLS
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view compliance documents in their org"
  ON compliance_documents FOR SELECT
  USING (user_has_org_access(org_id));
CREATE POLICY "Admins can manage compliance documents"
  ON compliance_documents FOR ALL
  USING (user_is_org_owner_or_admin(org_id));
-- ============================================================================
-- COMPLIANCE ACKNOWLEDGMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES compliance_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Acknowledgment details
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'failed')),

  -- Completion info
  completed_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,

  -- For signed documents
  signature_data TEXT, -- base64 signature image
  signed_name TEXT,

  -- For quizzes
  quiz_score INTEGER,
  quiz_answers JSONB,
  quiz_attempts INTEGER NOT NULL DEFAULT 0,

  -- Expiration
  due_date DATE,
  expires_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(document_id, user_id)
);
-- Indexes
CREATE INDEX idx_compliance_acks_user_id ON compliance_acknowledgments(user_id);
CREATE INDEX idx_compliance_acks_document_id ON compliance_acknowledgments(document_id);
CREATE INDEX idx_compliance_acks_status ON compliance_acknowledgments(status) WHERE status IN ('pending', 'expired');
CREATE INDEX idx_compliance_acks_due ON compliance_acknowledgments(due_date) WHERE status = 'pending';
-- RLS
ALTER TABLE compliance_acknowledgments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own acknowledgments"
  ON compliance_acknowledgments FOR SELECT
  USING (user_id = auth.uid() OR user_is_org_manager_or_above(org_id));
CREATE POLICY "Users can complete their own acknowledgments"
  ON compliance_acknowledgments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all acknowledgments"
  ON compliance_acknowledgments FOR ALL
  USING (user_is_org_owner_or_admin(org_id));
-- ============================================================================
-- COMPLIANCE VIOLATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Who/what
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES zoho_lead_submissions(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Violation details
  violation_type TEXT NOT NULL, -- missed_disclosure, unauthorized_claim, privacy_breach, etc.
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',

  -- Detection
  detected_by TEXT NOT NULL DEFAULT 'manual', -- manual, ai, system
  detection_rule TEXT,

  -- Resolution
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'dismissed')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes
CREATE INDEX idx_compliance_violations_org_id ON compliance_violations(org_id);
CREATE INDEX idx_compliance_violations_user_id ON compliance_violations(user_id);
CREATE INDEX idx_compliance_violations_status ON compliance_violations(status) WHERE status IN ('open', 'investigating');
CREATE INDEX idx_compliance_violations_severity ON compliance_violations(severity) WHERE status = 'open';
-- RLS
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers can view violations in their org"
  ON compliance_violations FOR SELECT
  USING (user_is_org_manager_or_above(org_id));
CREATE POLICY "Admins can manage violations"
  ON compliance_violations FOR ALL
  USING (user_is_org_owner_or_admin(org_id));
-- ============================================================================
-- AI SUGGESTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Context
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES zoho_lead_submissions(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,

  -- Suggestion details
  suggestion_type TEXT NOT NULL, -- message_draft, reply_suggestion, score_adjustment, lane_move, next_action
  context_type TEXT NOT NULL, -- compose, reply, priority, engagement

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reasoning TEXT, -- Why AI suggested this
  confidence DECIMAL(3,2), -- 0.00 to 1.00

  -- For message suggestions
  original_message TEXT,
  suggested_message TEXT,
  tone TEXT, -- professional, friendly, urgent, etc.

  -- For scoring suggestions
  suggested_score_delta INTEGER,
  suggested_lane_id UUID,

  -- User feedback
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'modified', 'ignored')),
  user_feedback TEXT,
  modified_content TEXT,

  -- Timestamps
  shown_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes
CREATE INDEX idx_ai_suggestions_user_id ON ai_suggestions(user_id);
CREATE INDEX idx_ai_suggestions_lead_id ON ai_suggestions(lead_id);
CREATE INDEX idx_ai_suggestions_type ON ai_suggestions(suggestion_type);
CREATE INDEX idx_ai_suggestions_status ON ai_suggestions(status) WHERE status = 'pending';
-- RLS
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own suggestions"
  ON ai_suggestions FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "System can create suggestions"
  ON ai_suggestions FOR INSERT
  WITH CHECK (user_has_org_access(org_id));
CREATE POLICY "Users can update their own suggestions"
  ON ai_suggestions FOR UPDATE
  USING (user_id = auth.uid());
-- ============================================================================
-- AI SCORING FACTORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_scoring_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- What this factor applies to
  lead_id UUID REFERENCES zoho_lead_submissions(id) ON DELETE CASCADE,
  priority_item_id UUID REFERENCES priority_items(id) ON DELETE CASCADE,

  -- Factor details
  factor_type TEXT NOT NULL, -- engagement, response_time, sentiment, behavior, decay
  factor_name TEXT NOT NULL,
  score_impact INTEGER NOT NULL, -- positive or negative impact

  -- Analysis
  analysis_data JSONB DEFAULT '{}',
  reasoning TEXT,

  -- Validity
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Indexes
CREATE INDEX idx_ai_scoring_factors_lead ON ai_scoring_factors(lead_id) WHERE is_active = true;
CREATE INDEX idx_ai_scoring_factors_item ON ai_scoring_factors(priority_item_id) WHERE is_active = true;
-- RLS
ALTER TABLE ai_scoring_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view scoring factors in their org"
  ON ai_scoring_factors FOR SELECT
  USING (user_has_org_access(org_id));
-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get compliance status for a user
CREATE OR REPLACE FUNCTION get_user_compliance_status(
  p_org_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  total_required BIGINT,
  total_completed BIGINT,
  total_pending BIGINT,
  total_overdue BIGINT,
  compliance_score DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_required BIGINT;
  v_completed BIGINT;
  v_pending BIGINT;
  v_overdue BIGINT;
BEGIN
  -- Count required documents for user's role
  SELECT COUNT(*) INTO v_required
  FROM compliance_documents
  WHERE org_id = p_org_id AND is_active = true;

  -- Count completed
  SELECT COUNT(*) INTO v_completed
  FROM compliance_acknowledgments
  WHERE user_id = p_user_id AND status = 'completed';

  -- Count pending
  SELECT COUNT(*) INTO v_pending
  FROM compliance_acknowledgments
  WHERE user_id = p_user_id AND status = 'pending'
    AND (due_date IS NULL OR due_date >= CURRENT_DATE);

  -- Count overdue
  SELECT COUNT(*) INTO v_overdue
  FROM compliance_acknowledgments
  WHERE user_id = p_user_id
    AND (status = 'pending' AND due_date < CURRENT_DATE)
    OR status = 'expired';

  RETURN QUERY SELECT
    v_required,
    v_completed,
    v_pending,
    v_overdue,
    CASE WHEN v_required > 0 THEN (v_completed::DECIMAL / v_required * 100) ELSE 100 END;
END;
$$;
-- Create acknowledgments for a user when they join
CREATE OR REPLACE FUNCTION create_user_compliance_requirements(
  p_org_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO compliance_acknowledgments (org_id, document_id, user_id, status, due_date)
  SELECT
    p_org_id,
    id,
    p_user_id,
    'pending',
    CASE WHEN due_within_days IS NOT NULL
      THEN CURRENT_DATE + due_within_days
      ELSE NULL
    END
  FROM compliance_documents
  WHERE org_id = p_org_id AND is_active = true
  ON CONFLICT (document_id, user_id) DO NOTHING;
END;
$$;
-- Complete a compliance acknowledgment
CREATE OR REPLACE FUNCTION complete_compliance_acknowledgment(
  p_acknowledgment_id UUID,
  p_signature_data TEXT DEFAULT NULL,
  p_signed_name TEXT DEFAULT NULL,
  p_quiz_score INTEGER DEFAULT NULL,
  p_quiz_answers JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ack RECORD;
  v_doc RECORD;
  v_passed BOOLEAN := true;
BEGIN
  -- Get acknowledgment
  SELECT * INTO v_ack FROM compliance_acknowledgments WHERE id = p_acknowledgment_id;
  IF v_ack IS NULL THEN
    RETURN false;
  END IF;

  -- Get document
  SELECT * INTO v_doc FROM compliance_documents WHERE id = v_ack.document_id;

  -- Check quiz passing if applicable
  IF v_doc.document_type = 'quiz' AND p_quiz_score IS NOT NULL THEN
    v_passed := p_quiz_score >= v_doc.passing_score;
  END IF;

  -- Update acknowledgment
  UPDATE compliance_acknowledgments SET
    status = CASE WHEN v_passed THEN 'completed' ELSE 'failed' END,
    completed_at = CASE WHEN v_passed THEN now() ELSE NULL END,
    signature_data = p_signature_data,
    signed_name = p_signed_name,
    quiz_score = p_quiz_score,
    quiz_answers = p_quiz_answers,
    quiz_attempts = quiz_attempts + 1,
    expires_at = CASE
      WHEN v_passed AND v_doc.renewal_period_days IS NOT NULL
      THEN now() + (v_doc.renewal_period_days || ' days')::interval
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_acknowledgment_id;

  -- Update document stats
  IF v_passed THEN
    UPDATE compliance_documents SET
      total_completed = total_completed + 1
    WHERE id = v_ack.document_id;
  END IF;

  -- Log audit event
  INSERT INTO audit_logs (org_id, user_id, action, resource_type, resource_id, details)
  VALUES (
    v_ack.org_id,
    auth.uid(),
    CASE WHEN v_passed THEN 'compliance.completed' ELSE 'compliance.failed' END,
    'compliance_document',
    v_ack.document_id,
    jsonb_build_object(
      'document_title', v_doc.title,
      'quiz_score', p_quiz_score,
      'passed', v_passed
    )
  );

  RETURN v_passed;
END;
$$;
-- Log AI suggestion feedback
CREATE OR REPLACE FUNCTION record_ai_suggestion_feedback(
  p_suggestion_id UUID,
  p_status TEXT,
  p_feedback TEXT DEFAULT NULL,
  p_modified_content TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ai_suggestions SET
    status = p_status,
    user_feedback = p_feedback,
    modified_content = p_modified_content,
    acted_at = now()
  WHERE id = p_suggestion_id AND user_id = auth.uid();
END;
$$;
-- Calculate AI-based lead score adjustments
CREATE OR REPLACE FUNCTION calculate_ai_score_adjustment(
  p_lead_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_adjustment INTEGER := 0;
  v_factor RECORD;
BEGIN
  -- Sum all active scoring factors
  FOR v_factor IN
    SELECT * FROM ai_scoring_factors
    WHERE lead_id = p_lead_id AND is_active = true
      AND (valid_until IS NULL OR valid_until > now())
  LOOP
    v_adjustment := v_adjustment + v_factor.score_impact;
  END LOOP;

  RETURN v_adjustment;
END;
$$;
-- Get org compliance summary
CREATE OR REPLACE FUNCTION get_org_compliance_summary(
  p_org_id UUID
)
RETURNS TABLE (
  total_users BIGINT,
  fully_compliant BIGINT,
  partially_compliant BIGINT,
  non_compliant BIGINT,
  open_violations BIGINT,
  avg_compliance_score DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_scores AS (
    SELECT
      om.user_id,
      COALESCE(
        (SELECT compliance_score FROM get_user_compliance_status(p_org_id, om.user_id)),
        0
      ) as score
    FROM org_memberships om
    WHERE om.org_id = p_org_id AND om.status = 'active'
  )
  SELECT
    COUNT(*)::BIGINT as total_users,
    COUNT(*) FILTER (WHERE score = 100)::BIGINT as fully_compliant,
    COUNT(*) FILTER (WHERE score >= 50 AND score < 100)::BIGINT as partially_compliant,
    COUNT(*) FILTER (WHERE score < 50)::BIGINT as non_compliant,
    (SELECT COUNT(*) FROM compliance_violations WHERE org_id = p_org_id AND status IN ('open', 'investigating'))::BIGINT,
    COALESCE(AVG(score), 0)::DECIMAL
  FROM user_scores;
END;
$$;
-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Sample compliance documents for default org
INSERT INTO compliance_documents (org_id, title, description, category, document_type, content_html, is_required, required_for_roles, due_within_days)
SELECT
  'a0000000-0000-0000-0000-000000000001'::UUID,
  title, description, category, document_type, content_html, is_required, required_for_roles, due_within_days
FROM (VALUES
  (
    'Medicare Compliance Training',
    'Annual required training on Medicare marketing guidelines and compliance requirements.',
    'training',
    'acknowledgment',
    '<h2>Medicare Marketing Guidelines</h2><p>As a Medicare advisor, you must follow CMS marketing guidelines...</p>',
    true,
    ARRAY['advisor'],
    30
  ),
  (
    'HIPAA Privacy Policy',
    'Acknowledgment of HIPAA privacy requirements and PHI handling procedures.',
    'policy',
    'signature',
    '<h2>HIPAA Privacy Policy</h2><p>This policy outlines our commitment to protecting patient health information...</p>',
    true,
    ARRAY['advisor', 'manager', 'admin'],
    7
  ),
  (
    'Code of Conduct',
    'Company code of conduct and ethical guidelines for all employees.',
    'policy',
    'acknowledgment',
    '<h2>Code of Conduct</h2><p>Our company is committed to the highest ethical standards...</p>',
    true,
    ARRAY['advisor', 'manager', 'admin', 'owner'],
    7
  ),
  (
    'Anti-Fraud Training',
    'Training on identifying and preventing Medicare fraud.',
    'training',
    'quiz',
    '<h2>Anti-Fraud Training</h2><p>Medicare fraud costs billions annually. Learn to identify and report suspicious activity...</p>',
    true,
    ARRAY['advisor'],
    14
  )
) AS t(title, description, category, document_type, content_html, is_required, required_for_roles, due_within_days)
ON CONFLICT DO NOTHING;
-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_compliance_documents_updated_at
  BEFORE UPDATE ON compliance_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_acknowledgments_updated_at
  BEFORE UPDATE ON compliance_acknowledgments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compliance_violations_updated_at
  BEFORE UPDATE ON compliance_violations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for audit log with user details (enhancing existing audit_logs)
CREATE OR REPLACE VIEW audit_logs_detailed AS
SELECT
  al.*,
  ap.first_name || ' ' || ap.last_name as user_name,
  ap.email as user_email
FROM audit_logs al
LEFT JOIN advisor_profiles ap ON al.user_id = ap.user_id;
