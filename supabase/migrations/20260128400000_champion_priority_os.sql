/*
  # Champion Phase 1: Priority OS (Today's Power List)

  ## Purpose
  Create the Priority OS system that helps advisors focus on the right
  leads/contacts at the right time through smart prioritization.

  ## Tables
  - priority_lanes: Configurable lanes (Hot, Warm, Follow-up, etc.)
  - priority_items: Items assigned to lanes with scoring
  - scoring_rules: Rules for automatic scoring and lane assignment

  ## Features
  - Drag-and-drop lane management
  - Automatic scoring based on rules
  - Snooze functionality
  - Daily power list generation
*/

-- ============================================
-- PRIORITY LANES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS priority_lanes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Lane info
  name text NOT NULL,
  description text,
  color text DEFAULT '#6B7280',
  icon text DEFAULT 'flag',

  -- Display
  order_index integer DEFAULT 0,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,

  -- Auto-assignment rules (JSON array of conditions)
  auto_rules jsonb DEFAULT '[]'::jsonb,

  -- Limits
  max_items integer DEFAULT NULL, -- null = unlimited

  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_org_lane_name UNIQUE (org_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_priority_lanes_org_id ON priority_lanes(org_id);
CREATE INDEX IF NOT EXISTS idx_priority_lanes_order ON priority_lanes(org_id, order_index);
CREATE INDEX IF NOT EXISTS idx_priority_lanes_active ON priority_lanes(org_id, is_active);

-- Updated_at trigger
CREATE TRIGGER update_priority_lanes_updated_at
  BEFORE UPDATE ON priority_lanes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PRIORITY ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS priority_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lane_id uuid NOT NULL REFERENCES priority_lanes(id) ON DELETE CASCADE,

  -- What this item is about (one of these should be set)
  lead_id uuid REFERENCES zoho_lead_submissions(id) ON DELETE CASCADE,
  contact_id uuid, -- References crm_contacts if exists

  -- Priority info
  reason text, -- Why is this person in this lane?
  score integer DEFAULT 0,
  rank integer, -- Position within lane

  -- Assignment
  owner_user_id uuid REFERENCES auth.users(id),

  -- Snooze
  snoozed_until timestamptz,
  snooze_reason text,

  -- Completion
  completed_at timestamptz,
  completed_reason text,

  -- Source tracking
  source text DEFAULT 'manual', -- manual, auto, ai
  source_rule_id uuid,

  -- Timestamps
  last_action_at timestamptz,
  next_action_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Constraints
  CONSTRAINT priority_item_has_subject CHECK (
    lead_id IS NOT NULL OR contact_id IS NOT NULL
  ),
  CONSTRAINT unique_lead_in_lane UNIQUE (org_id, lane_id, lead_id),
  CONSTRAINT unique_contact_in_lane UNIQUE (org_id, lane_id, contact_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_priority_items_org_id ON priority_items(org_id);
CREATE INDEX IF NOT EXISTS idx_priority_items_lane_id ON priority_items(lane_id);
CREATE INDEX IF NOT EXISTS idx_priority_items_lead_id ON priority_items(lead_id);
CREATE INDEX IF NOT EXISTS idx_priority_items_contact_id ON priority_items(contact_id);
CREATE INDEX IF NOT EXISTS idx_priority_items_owner ON priority_items(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_priority_items_score ON priority_items(org_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_priority_items_rank ON priority_items(lane_id, rank);
CREATE INDEX IF NOT EXISTS idx_priority_items_snoozed ON priority_items(snoozed_until) WHERE snoozed_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_priority_items_active ON priority_items(org_id, completed_at) WHERE completed_at IS NULL;

-- Updated_at trigger
CREATE TRIGGER update_priority_items_updated_at
  BEFORE UPDATE ON priority_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SCORING RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scoring_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Rule info
  name text NOT NULL,
  description text,

  -- When to trigger
  trigger_type text NOT NULL CHECK (trigger_type IN (
    'lead_created',
    'lead_updated',
    'lead_stage_change',
    'no_contact_days',
    'renewal_window',
    'meeting_scheduled',
    'meeting_missed',
    'form_submitted',
    'email_opened',
    'email_clicked',
    'manual'
  )),

  -- Conditions (JSON object with field comparisons)
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Actions
  score_delta integer DEFAULT 0, -- Add/subtract from score
  lane_assignment uuid REFERENCES priority_lanes(id), -- Move to this lane
  priority_boost boolean DEFAULT false, -- Temporarily boost priority

  -- Notification
  notify_owner boolean DEFAULT false,
  notification_message text,

  -- Status
  is_active boolean DEFAULT true,
  execution_order integer DEFAULT 0,

  -- Stats
  times_triggered integer DEFAULT 0,
  last_triggered_at timestamptz,

  -- Metadata
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scoring_rules_org_id ON scoring_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_trigger ON scoring_rules(org_id, trigger_type);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_active ON scoring_rules(org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_order ON scoring_rules(org_id, execution_order);

-- Updated_at trigger
CREATE TRIGGER update_scoring_rules_updated_at
  BEFORE UPDATE ON scoring_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE priority_lanes ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: PRIORITY LANES
-- ============================================

-- Users can view lanes in their org
CREATE POLICY "Users can view lanes in their org"
  ON priority_lanes FOR SELECT
  TO authenticated
  USING (user_has_org_access(org_id));

-- Managers+ can create lanes
CREATE POLICY "Managers can create lanes"
  ON priority_lanes FOR INSERT
  TO authenticated
  WITH CHECK (user_is_org_manager_or_above(org_id));

-- Managers+ can update lanes
CREATE POLICY "Managers can update lanes"
  ON priority_lanes FOR UPDATE
  TO authenticated
  USING (user_is_org_manager_or_above(org_id))
  WITH CHECK (user_is_org_manager_or_above(org_id));

-- Admins can delete lanes
CREATE POLICY "Admins can delete lanes"
  ON priority_lanes FOR DELETE
  TO authenticated
  USING (user_is_org_owner_or_admin(org_id));

-- ============================================
-- RLS POLICIES: PRIORITY ITEMS
-- ============================================

-- Users can view items in their org (advisors see only their own)
CREATE POLICY "Users can view priority items"
  ON priority_items FOR SELECT
  TO authenticated
  USING (
    user_has_org_access(org_id)
    AND (
      -- Managers+ see all
      user_is_org_manager_or_above(org_id)
      -- Or user owns the item
      OR owner_user_id = auth.uid()
      -- Or item is unassigned
      OR owner_user_id IS NULL
    )
  );

-- Users can create items in their org
CREATE POLICY "Users can create priority items"
  ON priority_items FOR INSERT
  TO authenticated
  WITH CHECK (user_has_org_access(org_id));

-- Users can update their own items, managers can update any
CREATE POLICY "Users can update priority items"
  ON priority_items FOR UPDATE
  TO authenticated
  USING (
    user_has_org_access(org_id)
    AND (
      user_is_org_manager_or_above(org_id)
      OR owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_has_org_access(org_id)
    AND (
      user_is_org_manager_or_above(org_id)
      OR owner_user_id = auth.uid()
    )
  );

-- Users can delete their own items, managers can delete any
CREATE POLICY "Users can delete priority items"
  ON priority_items FOR DELETE
  TO authenticated
  USING (
    user_has_org_access(org_id)
    AND (
      user_is_org_manager_or_above(org_id)
      OR owner_user_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES: SCORING RULES
-- ============================================

-- Users can view rules in their org
CREATE POLICY "Users can view scoring rules"
  ON scoring_rules FOR SELECT
  TO authenticated
  USING (user_has_org_access(org_id));

-- Admins can manage rules
CREATE POLICY "Admins can manage scoring rules"
  ON scoring_rules FOR ALL
  TO authenticated
  USING (user_is_org_owner_or_admin(org_id))
  WITH CHECK (user_is_org_owner_or_admin(org_id));

-- ============================================
-- SEED DEFAULT LANES FOR MPB ORG
-- ============================================
INSERT INTO priority_lanes (org_id, name, description, color, icon, order_index, is_default)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Hot', 'Ready to close - immediate action needed', '#EF4444', 'flame', 0, true),
  ('a0000000-0000-0000-0000-000000000001', 'Warm', 'Engaged and interested - follow up soon', '#F59E0B', 'sun', 1, false),
  ('a0000000-0000-0000-0000-000000000001', 'Nurture', 'Building relationship - stay in touch', '#3B82F6', 'heart', 2, false),
  ('a0000000-0000-0000-0000-000000000001', 'At Risk', 'No recent contact - re-engage', '#DC2626', 'alert-triangle', 3, false),
  ('a0000000-0000-0000-0000-000000000001', 'Snoozed', 'Temporarily paused', '#6B7280', 'clock', 4, false)
ON CONFLICT (org_id, name) DO NOTHING;

-- ============================================
-- SEED DEFAULT SCORING RULES
-- ============================================
INSERT INTO scoring_rules (org_id, name, trigger_type, conditions, score_delta, is_active, execution_order)
VALUES
  (
    'a0000000-0000-0000-0000-000000000001',
    'New lead bonus',
    'lead_created',
    '{}',
    50,
    true,
    1
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'No contact 7+ days',
    'no_contact_days',
    '{"days": 7}',
    -20,
    true,
    2
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'No contact 14+ days - At Risk',
    'no_contact_days',
    '{"days": 14}',
    -30,
    true,
    3
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'Meeting scheduled boost',
    'meeting_scheduled',
    '{}',
    30,
    true,
    4
  ),
  (
    'a0000000-0000-0000-0000-000000000001',
    'Form submitted boost',
    'form_submitted',
    '{}',
    20,
    true,
    5
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user's power list (top priority items)
CREATE OR REPLACE FUNCTION get_power_list(
  p_org_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  item_id uuid,
  lane_id uuid,
  lane_name text,
  lane_color text,
  lead_id uuid,
  contact_id uuid,
  person_name text,
  person_email text,
  reason text,
  score integer,
  rank integer,
  last_action_at timestamptz,
  next_action_at timestamptz,
  snoozed_until timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pi.id AS item_id,
    pi.lane_id,
    pl.name AS lane_name,
    pl.color AS lane_color,
    pi.lead_id,
    pi.contact_id,
    COALESCE(
      CONCAT(l.first_name, ' ', l.last_name),
      'Unknown'
    ) AS person_name,
    l.email AS person_email,
    pi.reason,
    pi.score,
    pi.rank,
    pi.last_action_at,
    pi.next_action_at,
    pi.snoozed_until
  FROM priority_items pi
  JOIN priority_lanes pl ON pl.id = pi.lane_id
  LEFT JOIN zoho_lead_submissions l ON l.id = pi.lead_id
  WHERE pi.org_id = p_org_id
    AND pi.completed_at IS NULL
    AND (pi.snoozed_until IS NULL OR pi.snoozed_until < now())
    AND (p_user_id IS NULL OR pi.owner_user_id = p_user_id OR pi.owner_user_id IS NULL)
  ORDER BY
    pl.order_index ASC,
    pi.score DESC,
    pi.rank ASC NULLS LAST
  LIMIT p_limit;
$$;

-- Function to add lead to priority lane
CREATE OR REPLACE FUNCTION add_to_priority_lane(
  p_org_id uuid,
  p_lane_id uuid,
  p_lead_id uuid,
  p_reason text DEFAULT NULL,
  p_owner_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id uuid;
  v_existing_id uuid;
BEGIN
  -- Check if already in this lane
  SELECT id INTO v_existing_id
  FROM priority_items
  WHERE org_id = p_org_id
    AND lane_id = p_lane_id
    AND lead_id = p_lead_id
    AND completed_at IS NULL;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing item
    UPDATE priority_items
    SET
      reason = COALESCE(p_reason, reason),
      owner_user_id = COALESCE(p_owner_user_id, owner_user_id),
      updated_at = now()
    WHERE id = v_existing_id;
    RETURN v_existing_id;
  END IF;

  -- Create new item
  INSERT INTO priority_items (
    org_id,
    lane_id,
    lead_id,
    reason,
    owner_user_id,
    score,
    source
  )
  VALUES (
    p_org_id,
    p_lane_id,
    p_lead_id,
    p_reason,
    COALESCE(p_owner_user_id, auth.uid()),
    50, -- Default score
    'manual'
  )
  RETURNING id INTO v_item_id;

  RETURN v_item_id;
END;
$$;

-- Function to move item between lanes
CREATE OR REPLACE FUNCTION move_priority_item(
  p_item_id uuid,
  p_new_lane_id uuid,
  p_new_rank integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE priority_items
  SET
    lane_id = p_new_lane_id,
    rank = p_new_rank,
    updated_at = now()
  WHERE id = p_item_id;

  RETURN FOUND;
END;
$$;

-- Function to snooze an item
CREATE OR REPLACE FUNCTION snooze_priority_item(
  p_item_id uuid,
  p_until timestamptz,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE priority_items
  SET
    snoozed_until = p_until,
    snooze_reason = p_reason,
    updated_at = now()
  WHERE id = p_item_id;

  RETURN FOUND;
END;
$$;

-- Function to complete/dismiss an item
CREATE OR REPLACE FUNCTION complete_priority_item(
  p_item_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE priority_items
  SET
    completed_at = now(),
    completed_reason = p_reason,
    updated_at = now()
  WHERE id = p_item_id;

  RETURN FOUND;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_power_list(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION add_to_priority_lane(uuid, uuid, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION move_priority_item(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION snooze_priority_item(uuid, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_priority_item(uuid, text) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE priority_lanes IS 'Configurable priority lanes for organizing leads/contacts (Hot, Warm, etc.)';
COMMENT ON TABLE priority_items IS 'Leads/contacts assigned to priority lanes with scores and rankings';
COMMENT ON TABLE scoring_rules IS 'Rules for automatic scoring and lane assignment';
COMMENT ON FUNCTION get_power_list IS 'Get prioritized list of items for a user to action today';
