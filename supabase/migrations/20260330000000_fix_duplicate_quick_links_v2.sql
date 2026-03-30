-- ============================================================================
-- Fix duplicate quick links in advisor_quick_links table
-- Problem: no unique constraint on (label, category) allowed duplicate rows
-- ============================================================================

-- Step 1: Delete duplicate rows, keeping only the one with the lowest order_index
--         (or the oldest created_at if order_index matches)
DELETE FROM public.advisor_quick_links
WHERE id NOT IN (
  SELECT DISTINCT ON (label, category) id
  FROM public.advisor_quick_links
  ORDER BY label, category, order_index ASC, created_at ASC
);

-- Step 2: Add a unique constraint on (label, category) to prevent future duplicates
ALTER TABLE public.advisor_quick_links
  DROP CONSTRAINT IF EXISTS advisor_quick_links_label_category_unique;

ALTER TABLE public.advisor_quick_links
  ADD CONSTRAINT advisor_quick_links_label_category_unique
  UNIQUE (label, category);
