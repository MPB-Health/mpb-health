-- ==========================================================================
-- Migration: CRM Intelligence (Phase 4)
-- ==========================================================================
-- 1. Deal Win Probability (predictions + RPC)
-- 2. Sequence Auto-Enrollment Triggers
-- 3. Server-Side Stage Change Trigger (lead_submissions)
-- 4. @Mentions Support
-- 5. Live Presence Enhancement
-- 6. Deal Rooms + Messages
-- ==========================================================================

BEGIN;

-- ==========================================================================
-- SECTION 1: Deal Win Probability
-- ==========================================================================

CREATE TABLE IF NOT EXISTS crm_deal_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  win_probability numeric NOT NULL DEFAULT 0.5,
  confidence text NOT NULL DEFAULT 'medium',
  factors jsonb NOT NULL DEFAULT '[]',
  risk_signals jsonb NOT NULL DEFAULT '[]',
  recommended_actions jsonb NOT NULL DEFAULT '[]',
  predicted_close_date date,
  deal_health_score int NOT NULL DEFAULT 50,
  model_version text NOT NULL DEFAULT 'v1',
  calculated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deal_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_deal_predictions_deal_id
  ON crm_deal_predictions(deal_id);

CREATE INDEX IF NOT EXISTS idx_crm_deal_predictions_org_probability
  ON crm_deal_predictions(org_id, win_probability DESC);

ALTER TABLE crm_deal_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_deal_predictions_select"
  ON crm_deal_predictions
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY "crm_deal_predictions_service_role"
  ON crm_deal_predictions
  FOR ALL
  TO service_role
  USING (true);

-- --------------------------------------------------------------------------
-- RPC: crm_calculate_deal_win_probability
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.crm_calculate_deal_win_probability(p_deal_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deal          record;
  v_stage         record;
  v_stage_count   int;
  v_avg_velocity  numeric;
  v_deal_velocity numeric;
  v_act_7d        int;
  v_act_14d       int;
  v_act_30d       int;
  v_last_activity timestamptz;
  v_avg_amount    numeric;
  v_probability   numeric := 50;
  v_factors       jsonb := '[]'::jsonb;
  v_risks         jsonb := '[]'::jsonb;
  v_actions       jsonb := '[]'::jsonb;
  v_health        int := 50;
  v_confidence    text := 'medium';
  v_days_past     int;
  v_predicted_close date;
  v_result        jsonb;
BEGIN
  -- Load deal
  SELECT d.*, ds.name AS stage_name, ds.probability AS stage_prob,
         ds.sort_order, ds.is_won_stage, ds.is_lost_stage
  INTO v_deal
  FROM crm_deals d
  JOIN crm_deal_stages ds ON ds.id = d.stage_id
  WHERE d.id = p_deal_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Deal not found');
  END IF;

  v_stage := ROW(v_deal.stage_name, v_deal.stage_prob, v_deal.sort_order,
                 v_deal.is_won_stage, v_deal.is_lost_stage);

  -- Stage position probability
  IF v_deal.is_won_stage THEN
    v_probability := 95;
  ELSIF v_deal.is_lost_stage THEN
    v_probability := 5;
  ELSE
    v_probability := COALESCE(v_deal.stage_prob, 50);
  END IF;
  v_factors := v_factors || jsonb_build_object(
    'factor', 'Stage: ' || v_deal.stage_name,
    'impact', v_probability,
    'direction', 'baseline'
  );

  -- Stage transition count & velocity
  SELECT COUNT(*), 
         EXTRACT(EPOCH FROM (MAX(changed_at) - MIN(changed_at))) / NULLIF(COUNT(*) - 1, 0) / 86400
  INTO v_stage_count, v_deal_velocity
  FROM crm_deal_stage_history
  WHERE deal_id = p_deal_id;

  -- Average velocity across org deals
  SELECT AVG(deal_vel) INTO v_avg_velocity
  FROM (
    SELECT EXTRACT(EPOCH FROM (MAX(h.changed_at) - MIN(h.changed_at))) / NULLIF(COUNT(*) - 1, 0) / 86400 AS deal_vel
    FROM crm_deal_stage_history h
    JOIN crm_deals d ON d.id = h.deal_id
    WHERE d.org_id = v_deal.org_id
    GROUP BY h.deal_id
    HAVING COUNT(*) > 1
  ) sub;

  IF v_deal_velocity IS NOT NULL AND v_avg_velocity IS NOT NULL AND v_avg_velocity > 0 THEN
    IF v_deal_velocity < v_avg_velocity THEN
      v_probability := v_probability + 15;
      v_factors := v_factors || jsonb_build_object(
        'factor', 'Faster than average stage velocity',
        'impact', 15,
        'direction', 'positive'
      );
    ELSE
      v_probability := v_probability - 10;
      v_factors := v_factors || jsonb_build_object(
        'factor', 'Slower than average stage velocity',
        'impact', -10,
        'direction', 'negative'
      );
      v_risks := v_risks || to_jsonb('Deal progressing slower than average'::text);
      v_actions := v_actions || to_jsonb('Review blockers and schedule next steps'::text);
    END IF;
  END IF;

  -- Activity counts (recent)
  SELECT
    COUNT(*) FILTER (WHERE created_at > now() - interval '7 days'),
    COUNT(*) FILTER (WHERE created_at > now() - interval '14 days'),
    COUNT(*) FILTER (WHERE created_at > now() - interval '30 days'),
    MAX(created_at)
  INTO v_act_7d, v_act_14d, v_act_30d, v_last_activity
  FROM crm_activities
  WHERE deal_id = p_deal_id;

  -- Activity recency signal
  IF v_last_activity IS NULL OR v_last_activity < now() - interval '14 days' THEN
    v_probability := v_probability - 20;
    v_factors := v_factors || jsonb_build_object(
      'factor', 'No recent activity (>14 days)',
      'impact', -20,
      'direction', 'negative'
    );
    v_risks := v_risks || to_jsonb('Deal has gone cold — no activity in 14+ days'::text);
    v_actions := v_actions || to_jsonb('Reach out to re-engage the prospect immediately'::text);
  ELSIF v_last_activity > now() - interval '3 days' THEN
    v_probability := v_probability + 10;
    v_factors := v_factors || jsonb_build_object(
      'factor', 'Recent activity (<3 days)',
      'impact', 10,
      'direction', 'positive'
    );
  END IF;

  -- Engagement volume (30-day)
  IF v_act_30d < 5 THEN
    v_probability := v_probability - 10;
    v_factors := v_factors || jsonb_build_object(
      'factor', 'Low engagement (<5 activities in 30d)',
      'impact', -10,
      'direction', 'negative'
    );
    v_risks := v_risks || to_jsonb('Low engagement volume'::text);
    v_actions := v_actions || to_jsonb('Increase touchpoint frequency'::text);
  ELSIF v_act_30d >= 10 THEN
    v_probability := v_probability + 10;
    v_factors := v_factors || jsonb_build_object(
      'factor', 'High engagement (10+ activities in 30d)',
      'impact', 10,
      'direction', 'positive'
    );
  END IF;

  -- Deal amount vs org average
  SELECT AVG(amount) INTO v_avg_amount
  FROM crm_deals
  WHERE org_id = v_deal.org_id
    AND amount IS NOT NULL
    AND amount > 0;

  IF v_deal.amount IS NOT NULL AND v_avg_amount IS NOT NULL AND v_avg_amount > 0
     AND v_deal.amount > 2 * v_avg_amount THEN
    v_probability := v_probability - 5;
    v_factors := v_factors || jsonb_build_object(
      'factor', 'Deal amount >2x org average',
      'impact', -5,
      'direction', 'negative'
    );
    v_risks := v_risks || to_jsonb('Larger-than-average deal — typically harder to close'::text);
    v_actions := v_actions || to_jsonb('Ensure executive sponsorship is secured'::text);
  END IF;

  -- Days past expected close
  IF v_deal.expected_close_date IS NOT NULL AND v_deal.expected_close_date < CURRENT_DATE THEN
    v_days_past := CURRENT_DATE - v_deal.expected_close_date;
    v_probability := v_probability - LEAST(v_days_past * 2, 30);
    v_factors := v_factors || jsonb_build_object(
      'factor', format('Past expected close by %s days', v_days_past),
      'impact', -LEAST(v_days_past * 2, 30),
      'direction', 'negative'
    );
    v_risks := v_risks || to_jsonb(format('Deal is %s days past expected close date', v_days_past)::text);
    v_actions := v_actions || to_jsonb('Update expected close date and confirm buyer timeline'::text);
  END IF;

  -- Clamp probability
  v_probability := GREATEST(1, LEAST(99, v_probability));

  -- Health score (0-100) based on combined signals
  v_health := GREATEST(0, LEAST(100, v_probability::int));

  -- Confidence
  IF v_stage_count >= 3 AND v_act_30d >= 5 THEN
    v_confidence := 'high';
  ELSIF v_stage_count <= 1 AND v_act_30d < 3 THEN
    v_confidence := 'low';
  ELSE
    v_confidence := 'medium';
  END IF;

  -- Predicted close date
  IF v_deal.expected_close_date IS NOT NULL AND v_deal.expected_close_date >= CURRENT_DATE THEN
    v_predicted_close := v_deal.expected_close_date;
  ELSIF v_avg_velocity IS NOT NULL AND v_avg_velocity > 0 THEN
    v_predicted_close := CURRENT_DATE + (v_avg_velocity * 2)::int;
  ELSE
    v_predicted_close := CURRENT_DATE + 30;
  END IF;

  -- Upsert prediction
  INSERT INTO crm_deal_predictions (
    deal_id, org_id, win_probability, confidence, factors,
    risk_signals, recommended_actions, predicted_close_date,
    deal_health_score, model_version, calculated_at
  ) VALUES (
    p_deal_id, v_deal.org_id, ROUND(v_probability, 2), v_confidence, v_factors,
    v_risks, v_actions, v_predicted_close,
    v_health, 'v1', now()
  )
  ON CONFLICT (deal_id) DO UPDATE SET
    org_id              = EXCLUDED.org_id,
    win_probability     = EXCLUDED.win_probability,
    confidence          = EXCLUDED.confidence,
    factors             = EXCLUDED.factors,
    risk_signals        = EXCLUDED.risk_signals,
    recommended_actions = EXCLUDED.recommended_actions,
    predicted_close_date= EXCLUDED.predicted_close_date,
    deal_health_score   = EXCLUDED.deal_health_score,
    model_version       = EXCLUDED.model_version,
    calculated_at       = EXCLUDED.calculated_at;

  v_result := jsonb_build_object(
    'deal_id',            p_deal_id,
    'win_probability',    ROUND(v_probability, 2),
    'confidence',         v_confidence,
    'factors',            v_factors,
    'risk_signals',       v_risks,
    'recommended_actions',v_actions,
    'predicted_close_date', v_predicted_close,
    'deal_health_score',  v_health,
    'model_version',      'v1',
    'calculated_at',      now()
  );

  RETURN v_result;
END;
$$;

-- ==========================================================================
-- SECTION 2: Sequence Auto-Enrollment Triggers
-- ==========================================================================

CREATE TABLE IF NOT EXISTS crm_sequence_triggers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sequence_id uuid NOT NULL REFERENCES crm_email_sequences(id) ON DELETE CASCADE,
  trigger_type text NOT NULL,
  trigger_conditions jsonb NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  enrollment_count int NOT NULL DEFAULT 0,
  last_triggered_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_sequence_triggers_type_check
    CHECK (trigger_type IN ('stage_change', 'lead_created', 'score_threshold', 'tag_added'))
);

CREATE INDEX IF NOT EXISTS idx_crm_sequence_triggers_org
  ON crm_sequence_triggers(org_id);

CREATE INDEX IF NOT EXISTS idx_crm_sequence_triggers_sequence
  ON crm_sequence_triggers(sequence_id);

CREATE INDEX IF NOT EXISTS idx_crm_sequence_triggers_active
  ON crm_sequence_triggers(org_id, is_active) WHERE is_active = true;

ALTER TABLE crm_sequence_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_sequence_triggers_select"
  ON crm_sequence_triggers
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(org_id));

CREATE POLICY "crm_sequence_triggers_insert"
  ON crm_sequence_triggers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_admin(org_id));

CREATE POLICY "crm_sequence_triggers_update"
  ON crm_sequence_triggers
  FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(org_id))
  WITH CHECK (public.is_org_admin(org_id));

CREATE POLICY "crm_sequence_triggers_delete"
  ON crm_sequence_triggers
  FOR DELETE
  TO authenticated
  USING (public.is_org_admin(org_id));

CREATE POLICY "crm_sequence_triggers_service_role"
  ON crm_sequence_triggers
  FOR ALL
  TO service_role
  USING (true);

-- ==========================================================================
-- SECTION 3: Server-Side Stage Change Trigger (lead_submissions)
-- ==========================================================================

-- NOTE: stage_changed_at and converted_at are already handled by the existing
-- BEFORE UPDATE trigger (trigger_lead_stage_changed -> update_lead_stage_changed_at).
-- This AFTER trigger adds activity logging and real-time notification on top.

CREATE OR REPLACE FUNCTION public.fn_lead_stage_change_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pipeline_stage IS DISTINCT FROM OLD.pipeline_stage THEN
    -- Log stage change activity
    INSERT INTO lead_activities (
      lead_id,
      activity_type,
      title,
      description,
      metadata,
      created_by,
      org_id
    ) VALUES (
      NEW.id,
      'status_change',
      format('Stage changed from %s to %s', COALESCE(OLD.pipeline_stage, 'none'), NEW.pipeline_stage),
      format('Pipeline stage updated from "%s" to "%s"', COALESCE(OLD.pipeline_stage, 'none'), NEW.pipeline_stage),
      jsonb_build_object(
        'from_stage', OLD.pipeline_stage,
        'to_stage', NEW.pipeline_stage,
        'changed_at', now()
      ),
      auth.uid(),
      NEW.org_id
    );

    -- Real-time notification for listeners
    PERFORM pg_notify(
      'lead_stage_changed',
      json_build_object(
        'lead_id',    NEW.id,
        'org_id',     NEW.org_id,
        'from_stage', OLD.pipeline_stage,
        'to_stage',   NEW.pipeline_stage
      )::text
    );
  END IF;

  RETURN NULL; -- AFTER trigger return value is ignored
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_stage_change ON zoho_lead_submissions;
CREATE TRIGGER trg_lead_stage_change
  AFTER UPDATE OF pipeline_stage ON zoho_lead_submissions
  FOR EACH ROW
  EXECUTE FUNCTION fn_lead_stage_change_notify();

-- ==========================================================================
-- SECTION 4: @Mentions Support
-- ==========================================================================

ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS mentions jsonb NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS crm_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentioned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  lead_id uuid,
  deal_id uuid,
  read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_mentions_entity_type_check
    CHECK (entity_type IN ('activity', 'note', 'deal_activity'))
);

CREATE INDEX IF NOT EXISTS idx_crm_mentions_user_unread
  ON crm_mentions(mentioned_user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crm_mentions_entity
  ON crm_mentions(entity_id);

CREATE INDEX IF NOT EXISTS idx_crm_mentions_org
  ON crm_mentions(org_id);

ALTER TABLE crm_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_mentions_select"
  ON crm_mentions
  FOR SELECT
  TO authenticated
  USING (mentioned_user_id = auth.uid());

CREATE POLICY "crm_mentions_insert"
  ON crm_mentions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "crm_mentions_update"
  ON crm_mentions
  FOR UPDATE
  TO authenticated
  USING (mentioned_user_id = auth.uid())
  WITH CHECK (mentioned_user_id = auth.uid());

CREATE POLICY "crm_mentions_service_role"
  ON crm_mentions
  FOR ALL
  TO service_role
  USING (true);

-- ==========================================================================
-- SECTION 5: Live Presence Enhancement
-- ==========================================================================

ALTER TABLE user_presence ADD COLUMN IF NOT EXISTS viewing_entity_type text;
ALTER TABLE user_presence ADD COLUMN IF NOT EXISTS viewing_entity_id uuid;

CREATE INDEX IF NOT EXISTS idx_user_presence_entity
  ON user_presence(viewing_entity_type, viewing_entity_id)
  WHERE viewing_entity_type IS NOT NULL;

CREATE OR REPLACE FUNCTION public.crm_get_entity_viewers(
  p_entity_type text,
  p_entity_id uuid
)
RETURNS TABLE(user_id uuid, full_name text, avatar_url text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    COALESCE(ap.first_name || ' ' || ap.last_name, u.email) AS full_name,
    COALESCE(ap.metadata->>'avatar_url', NULL)::text AS avatar_url,
    up.status::text
  FROM user_presence up
  LEFT JOIN advisor_profiles ap ON ap.id = up.user_id OR ap.user_id = up.user_id
  LEFT JOIN auth.users u ON u.id = up.user_id
  WHERE up.viewing_entity_type = p_entity_type
    AND up.viewing_entity_id = p_entity_id
    AND up.last_activity_at > now() - interval '5 minutes';
END;
$$;

-- ==========================================================================
-- SECTION 6: Deal Rooms
-- ==========================================================================

CREATE TABLE IF NOT EXISTS crm_deal_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  participants jsonb NOT NULL DEFAULT '[]',
  pinned_items jsonb NOT NULL DEFAULT '[]',
  settings jsonb NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(deal_id),
  CONSTRAINT crm_deal_rooms_status_check CHECK (status IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS crm_deal_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES crm_deal_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  message_type text NOT NULL DEFAULT 'text',
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  mentions jsonb NOT NULL DEFAULT '[]',
  reactions jsonb NOT NULL DEFAULT '{}',
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_deal_room_messages_type_check
    CHECK (message_type IN ('text', 'file', 'system', 'action'))
);

CREATE INDEX IF NOT EXISTS idx_crm_deal_rooms_deal
  ON crm_deal_rooms(deal_id);

CREATE INDEX IF NOT EXISTS idx_crm_deal_rooms_org
  ON crm_deal_rooms(org_id);

CREATE INDEX IF NOT EXISTS idx_crm_deal_room_messages_room_created
  ON crm_deal_room_messages(room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_crm_deal_room_messages_org
  ON crm_deal_room_messages(org_id);

ALTER TABLE crm_deal_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deal_room_messages ENABLE ROW LEVEL SECURITY;

-- Participants-based access: user_id present in the participants jsonb array
CREATE POLICY "crm_deal_rooms_select"
  ON crm_deal_rooms
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(org_id)
    AND (
      participants @> to_jsonb(auth.uid()::text)
      OR created_by = auth.uid()
      OR public.is_org_admin(org_id)
    )
  );

CREATE POLICY "crm_deal_rooms_insert"
  ON crm_deal_rooms
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "crm_deal_rooms_update"
  ON crm_deal_rooms
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_member(org_id)
    AND (
      participants @> to_jsonb(auth.uid()::text)
      OR created_by = auth.uid()
      OR public.is_org_admin(org_id)
    )
  )
  WITH CHECK (
    public.is_org_member(org_id)
  );

CREATE POLICY "crm_deal_rooms_delete"
  ON crm_deal_rooms
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_org_admin(org_id)
  );

CREATE POLICY "crm_deal_rooms_service_role"
  ON crm_deal_rooms
  FOR ALL
  TO service_role
  USING (true);

-- Messages: accessible to room participants
CREATE POLICY "crm_deal_room_messages_select"
  ON crm_deal_room_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM crm_deal_rooms r
      WHERE r.id = room_id
        AND public.is_org_member(r.org_id)
        AND (
          r.participants @> to_jsonb(auth.uid()::text)
          OR r.created_by = auth.uid()
          OR public.is_org_admin(r.org_id)
        )
    )
  );

CREATE POLICY "crm_deal_room_messages_insert"
  ON crm_deal_room_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crm_deal_rooms r
      WHERE r.id = room_id
        AND public.is_org_member(r.org_id)
        AND (
          r.participants @> to_jsonb(auth.uid()::text)
          OR r.created_by = auth.uid()
          OR public.is_org_admin(r.org_id)
        )
    )
  );

CREATE POLICY "crm_deal_room_messages_update"
  ON crm_deal_room_messages
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "crm_deal_room_messages_delete"
  ON crm_deal_room_messages
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM crm_deal_rooms r
      WHERE r.id = room_id AND public.is_org_admin(r.org_id)
    )
  );

CREATE POLICY "crm_deal_room_messages_service_role"
  ON crm_deal_room_messages
  FOR ALL
  TO service_role
  USING (true);

-- Updated_at trigger for deal rooms
CREATE OR REPLACE FUNCTION public.handle_crm_deal_rooms_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_crm_deal_rooms_updated ON crm_deal_rooms;
CREATE TRIGGER trg_crm_deal_rooms_updated
  BEFORE UPDATE ON crm_deal_rooms
  FOR EACH ROW
  EXECUTE FUNCTION handle_crm_deal_rooms_updated_at();

COMMIT;
