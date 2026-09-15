-- ============================================================================
-- Migration: Fix Missing RPC Functions
-- Description: Add RPC functions required by champion-core for usage tracking
-- ============================================================================

-- Increment message_templates.times_used and set last_used_at
CREATE OR REPLACE FUNCTION public.increment_message_template_times_used(template_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE message_templates
  SET times_used = COALESCE(times_used, 0) + 1,
      last_used_at = NOW(),
      updated_at = NOW()
  WHERE id = template_id;
END;
$$;
-- Increment saved_searches.use_count and set last_used_at
CREATE OR REPLACE FUNCTION public.increment_saved_search_use_count(search_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE saved_searches
  SET use_count = COALESCE(use_count, 0) + 1,
      last_used_at = NOW()
  WHERE id = search_id;
END;
$$;
-- Legacy aliases for backward compatibility (if any code calls these)
CREATE OR REPLACE FUNCTION public.increment_times_used(p_table TEXT, p_id_col TEXT, p_record_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_table = 'message_templates' AND p_id_col = 'id' THEN
    PERFORM increment_message_template_times_used(p_record_id);
  ELSE
    EXECUTE format(
      'UPDATE %I SET times_used = COALESCE(times_used, 0) + 1 WHERE %I = $1',
      p_table, p_id_col
    ) USING p_record_id;
  END IF;
END;
$$;
CREATE OR REPLACE FUNCTION public.increment_use_count(p_table TEXT, p_id_col TEXT, p_record_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_table = 'saved_searches' AND p_id_col = 'id' THEN
    PERFORM increment_saved_search_use_count(p_record_id);
  ELSE
    EXECUTE format(
      'UPDATE %I SET use_count = COALESCE(use_count, 0) + 1 WHERE %I = $1',
      p_table, p_id_col
    ) USING p_record_id;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_message_template_times_used(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_saved_search_use_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_times_used(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_use_count(TEXT, TEXT, UUID) TO authenticated;
