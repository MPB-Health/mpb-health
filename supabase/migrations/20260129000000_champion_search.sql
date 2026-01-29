-- ============================================================================
-- Champion Advisor OS — Phase 8: Search & Command Palette
-- ============================================================================

-- Recent searches per user
CREATE TABLE IF NOT EXISTS recent_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  entity_type TEXT, -- 'lead', 'message', 'task', 'meeting', 'document', etc.
  result_count INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT recent_searches_query_length CHECK (char_length(query) >= 1)
);

-- Saved searches (bookmarked queries)
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  entity_types TEXT[] DEFAULT '{}', -- Filter to specific types
  filters JSONB DEFAULT '{}', -- Additional filters
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,

  CONSTRAINT saved_searches_name_length CHECK (char_length(name) >= 1)
);

-- Search analytics (for improving search)
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  entity_type TEXT,
  result_count INTEGER DEFAULT 0,
  clicked_result_id UUID, -- Which result was clicked
  clicked_result_type TEXT,
  search_duration_ms INTEGER,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_recent_searches_user ON recent_searches(user_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_recent_searches_org ON recent_searches(org_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_org ON saved_searches(org_id);
CREATE INDEX IF NOT EXISTS idx_search_analytics_org ON search_analytics(org_id, searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(org_id, query);

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE recent_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Recent searches: users can only see their own
CREATE POLICY recent_searches_select ON recent_searches
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY recent_searches_insert ON recent_searches
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY recent_searches_delete ON recent_searches
  FOR DELETE USING (user_id = auth.uid());

-- Saved searches: users can only manage their own
CREATE POLICY saved_searches_select ON saved_searches
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY saved_searches_all ON saved_searches
  FOR ALL USING (user_id = auth.uid());

-- Search analytics: org members can insert, admins can view
CREATE POLICY search_analytics_insert ON search_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = search_analytics.org_id
      AND organization_members.user_id = auth.uid()
    )
  );

CREATE POLICY search_analytics_select ON search_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = search_analytics.org_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- Functions
-- ============================================================================

-- Global search function that searches across multiple tables
CREATE OR REPLACE FUNCTION global_search(
  p_org_id UUID,
  p_query TEXT,
  p_entity_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  subtitle TEXT,
  icon TEXT,
  url TEXT,
  relevance REAL,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  search_query TEXT;
BEGIN
  -- Prepare search query for pattern matching
  search_query := '%' || lower(p_query) || '%';

  RETURN QUERY
  WITH search_results AS (
    -- Search Leads
    SELECT
      'lead'::TEXT as entity_type,
      l.id as entity_id,
      COALESCE(l.first_name || ' ' || l.last_name, l.email) as title,
      COALESCE(l.phone, l.email) as subtitle,
      'users'::TEXT as icon,
      '/leads/' || l.id::TEXT as url,
      CASE
        WHEN lower(l.first_name || ' ' || l.last_name) LIKE search_query THEN 1.0
        WHEN lower(l.email) LIKE search_query THEN 0.9
        WHEN lower(l.phone) LIKE search_query THEN 0.8
        ELSE 0.5
      END as relevance,
      jsonb_build_object('status', l.status, 'source', l.source) as metadata
    FROM leads l
    WHERE l.org_id = p_org_id
    AND (p_entity_types IS NULL OR 'lead' = ANY(p_entity_types))
    AND (
      lower(l.first_name || ' ' || l.last_name) LIKE search_query
      OR lower(l.email) LIKE search_query
      OR lower(COALESCE(l.phone, '')) LIKE search_query
    )

    UNION ALL

    -- Search Messages (conversations)
    SELECT
      'message'::TEXT as entity_type,
      m.id as entity_id,
      COALESCE(m.subject, LEFT(m.body, 50)) as title,
      m.channel || ' - ' || to_char(m.created_at, 'Mon DD, YYYY') as subtitle,
      'message-square'::TEXT as icon,
      '/inbox/' || m.conversation_id::TEXT as url,
      CASE
        WHEN lower(COALESCE(m.subject, '')) LIKE search_query THEN 1.0
        WHEN lower(m.body) LIKE search_query THEN 0.7
        ELSE 0.5
      END as relevance,
      jsonb_build_object('channel', m.channel, 'direction', m.direction) as metadata
    FROM messages m
    WHERE m.org_id = p_org_id
    AND (p_entity_types IS NULL OR 'message' = ANY(p_entity_types))
    AND (
      lower(COALESCE(m.subject, '')) LIKE search_query
      OR lower(m.body) LIKE search_query
    )

    UNION ALL

    -- Search Tasks
    SELECT
      'task'::TEXT as entity_type,
      t.id as entity_id,
      t.title as title,
      COALESCE(t.description, 'No description') as subtitle,
      'check-circle'::TEXT as icon,
      '/leads/' || t.lead_id::TEXT as url,
      CASE
        WHEN lower(t.title) LIKE search_query THEN 1.0
        WHEN lower(COALESCE(t.description, '')) LIKE search_query THEN 0.7
        ELSE 0.5
      END as relevance,
      jsonb_build_object('status', t.status, 'priority', t.priority, 'due_date', t.due_date) as metadata
    FROM tasks t
    WHERE t.org_id = p_org_id
    AND (p_entity_types IS NULL OR 'task' = ANY(p_entity_types))
    AND (
      lower(t.title) LIKE search_query
      OR lower(COALESCE(t.description, '')) LIKE search_query
    )

    UNION ALL

    -- Search Meetings
    SELECT
      'meeting'::TEXT as entity_type,
      mt.id as entity_id,
      mt.title as title,
      to_char(mt.scheduled_at, 'Mon DD, YYYY HH:MI AM') as subtitle,
      'video'::TEXT as icon,
      '/meetings/' || mt.id::TEXT as url,
      CASE
        WHEN lower(mt.title) LIKE search_query THEN 1.0
        WHEN lower(COALESCE(mt.description, '')) LIKE search_query THEN 0.7
        ELSE 0.5
      END as relevance,
      jsonb_build_object('status', mt.status, 'scheduled_at', mt.scheduled_at) as metadata
    FROM meetings mt
    WHERE mt.org_id = p_org_id
    AND (p_entity_types IS NULL OR 'meeting' = ANY(p_entity_types))
    AND (
      lower(mt.title) LIKE search_query
      OR lower(COALESCE(mt.description, '')) LIKE search_query
    )

    UNION ALL

    -- Search SOPs/Documents
    SELECT
      'document'::TEXT as entity_type,
      d.id as entity_id,
      d.title as title,
      d.category || ' - ' || d.version as subtitle,
      'book-open'::TEXT as icon,
      '/sops/' || d.id::TEXT as url,
      CASE
        WHEN lower(d.title) LIKE search_query THEN 1.0
        WHEN lower(COALESCE(d.content, '')) LIKE search_query THEN 0.6
        ELSE 0.5
      END as relevance,
      jsonb_build_object('category', d.category, 'status', d.status) as metadata
    FROM sop_documents d
    WHERE d.org_id = p_org_id
    AND (p_entity_types IS NULL OR 'document' = ANY(p_entity_types))
    AND (
      lower(d.title) LIKE search_query
      OR lower(COALESCE(d.content, '')) LIKE search_query
    )

    UNION ALL

    -- Search Training Modules
    SELECT
      'training'::TEXT as entity_type,
      tm.id as entity_id,
      tm.title as title,
      tm.category || ' - ' || tm.duration_minutes || ' min' as subtitle,
      'graduation-cap'::TEXT as icon,
      '/training/' || tm.id::TEXT as url,
      CASE
        WHEN lower(tm.title) LIKE search_query THEN 1.0
        WHEN lower(COALESCE(tm.description, '')) LIKE search_query THEN 0.7
        ELSE 0.5
      END as relevance,
      jsonb_build_object('category', tm.category, 'difficulty', tm.difficulty_level) as metadata
    FROM training_modules tm
    WHERE tm.org_id = p_org_id
    AND (p_entity_types IS NULL OR 'training' = ANY(p_entity_types))
    AND tm.is_published = true
    AND (
      lower(tm.title) LIKE search_query
      OR lower(COALESCE(tm.description, '')) LIKE search_query
    )

    UNION ALL

    -- Search Sequences
    SELECT
      'sequence'::TEXT as entity_type,
      s.id as entity_id,
      s.name as title,
      s.status || ' - ' || COALESCE(array_length(s.steps, 1), 0)::TEXT || ' steps' as subtitle,
      'workflow'::TEXT as icon,
      '/sequences/' || s.id::TEXT as url,
      CASE
        WHEN lower(s.name) LIKE search_query THEN 1.0
        WHEN lower(COALESCE(s.description, '')) LIKE search_query THEN 0.7
        ELSE 0.5
      END as relevance,
      jsonb_build_object('status', s.status, 'trigger_type', s.trigger_type) as metadata
    FROM sequences s
    WHERE s.org_id = p_org_id
    AND (p_entity_types IS NULL OR 'sequence' = ANY(p_entity_types))
    AND (
      lower(s.name) LIKE search_query
      OR lower(COALESCE(s.description, '')) LIKE search_query
    )
  )
  SELECT * FROM search_results
  ORDER BY relevance DESC, title ASC
  LIMIT p_limit;
END;
$$;

-- Record a search (for recent searches)
CREATE OR REPLACE FUNCTION record_search(
  p_user_id UUID,
  p_org_id UUID,
  p_query TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_result_count INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_search_id UUID;
BEGIN
  -- Insert the search
  INSERT INTO recent_searches (user_id, org_id, query, entity_type, result_count)
  VALUES (p_user_id, p_org_id, p_query, p_entity_type, p_result_count)
  RETURNING id INTO v_search_id;

  -- Keep only the last 50 recent searches per user
  DELETE FROM recent_searches
  WHERE user_id = p_user_id
  AND id NOT IN (
    SELECT id FROM recent_searches
    WHERE user_id = p_user_id
    ORDER BY searched_at DESC
    LIMIT 50
  );

  RETURN v_search_id;
END;
$$;

-- Get recent searches for a user
CREATE OR REPLACE FUNCTION get_recent_searches(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  query TEXT,
  entity_type TEXT,
  result_count INTEGER,
  searched_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (rs.query)
    rs.id,
    rs.query,
    rs.entity_type,
    rs.result_count,
    rs.searched_at
  FROM recent_searches rs
  WHERE rs.user_id = p_user_id
  ORDER BY rs.query, rs.searched_at DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- Quick Actions Table (for command palette)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL for global actions
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'navigate', 'create', 'toggle', 'custom'
  action_data JSONB NOT NULL, -- { url: '/path', entity: 'lead', etc. }
  shortcut TEXT, -- 'ctrl+n', 'ctrl+shift+l', etc.
  category TEXT NOT NULL, -- 'navigation', 'create', 'settings', 'help'
  is_enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quick_actions_org ON quick_actions(org_id);
CREATE INDEX IF NOT EXISTS idx_quick_actions_category ON quick_actions(category);

ALTER TABLE quick_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY quick_actions_select ON quick_actions
  FOR SELECT USING (
    org_id IS NULL -- Global actions visible to all
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.org_id = quick_actions.org_id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Insert default quick actions
INSERT INTO quick_actions (name, description, icon, action_type, action_data, shortcut, category, display_order) VALUES
  -- Navigation
  ('Go to Dashboard', 'View your dashboard', 'layout-dashboard', 'navigate', '{"url": "/"}', 'g d', 'navigation', 1),
  ('Go to Power List', 'View your power list', 'zap', 'navigate', '{"url": "/power-list"}', 'g p', 'navigation', 2),
  ('Go to Inbox', 'View your inbox', 'inbox', 'navigate', '{"url": "/inbox"}', 'g i', 'navigation', 3),
  ('Go to Leads', 'View all leads', 'users', 'navigate', '{"url": "/leads"}', 'g l', 'navigation', 4),
  ('Go to Analytics', 'View analytics', 'bar-chart-3', 'navigate', '{"url": "/analytics"}', 'g a', 'navigation', 5),
  ('Go to Settings', 'Open settings', 'settings', 'navigate', '{"url": "/settings"}', 'g s', 'navigation', 6),

  -- Create actions
  ('New Lead', 'Create a new lead', 'user-plus', 'create', '{"entity": "lead"}', 'c l', 'create', 10),
  ('New Message', 'Compose a new message', 'message-square-plus', 'create', '{"entity": "message"}', 'c m', 'create', 11),
  ('New Task', 'Create a new task', 'plus-circle', 'create', '{"entity": "task"}', 'c t', 'create', 12),
  ('Schedule Meeting', 'Schedule a new meeting', 'calendar-plus', 'create', '{"entity": "meeting"}', 'c e', 'create', 13),
  ('New Sequence', 'Create a new sequence', 'workflow', 'create', '{"entity": "sequence"}', 'c s', 'create', 14),

  -- Help
  ('Keyboard Shortcuts', 'View all keyboard shortcuts', 'keyboard', 'toggle', '{"modal": "shortcuts"}', '?', 'help', 20),
  ('Help Center', 'Open help documentation', 'help-circle', 'navigate', '{"url": "/help"}', NULL, 'help', 21),
  ('Contact Support', 'Get help from support', 'message-circle', 'custom', '{"action": "support"}', NULL, 'help', 22)
ON CONFLICT DO NOTHING;
