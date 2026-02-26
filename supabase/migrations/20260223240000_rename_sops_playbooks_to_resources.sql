-- ============================================================================
-- Migration: Rename SOPs & Playbooks to Resources in nav menu
-- Description: Updates the left menu bar label from "SOPs & Playbooks" to "Resources"
-- ============================================================================

UPDATE public.advisor_nav_menu
SET label = 'Resources'
WHERE url = '/sops' AND label = 'SOPs & Playbooks';
